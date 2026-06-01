import html

import httpx
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Article, TelegramEditor


@receiver(post_save, sender=Article)
def notify_high_score_pending_article(sender, instance, created, **kwargs):
    if not created:
        return
    if instance.status != 'pending' or instance.ai_score < 8.5:
        return
    if not settings.TELEGRAM_BOT_TOKEN:
        return

    chat_ids = list(
        TelegramEditor.objects.filter(is_authorized=True)
        .values_list('chat_id', flat=True)
    )
    if not chat_ids:
        return

    review_url = settings.TELEGRAM_REVIEW_URL_TEMPLATE.format(id=instance.id)
    text = (
        '🔥 <b>Срочная новость с высоким AI Score!</b>\n\n'
        f'<b>{html.escape(instance.title)}</b>\n'
        f'Оценка: <b>{instance.ai_score:.1f}</b>\n'
        f'Причина: {html.escape(instance.ai_score_reason or "Не указана")} '
    )
    payload = {
        'text': text,
        'parse_mode': 'HTML',
        'reply_markup': {
            'inline_keyboard': [[
                {'text': 'Открыть ревью', 'url': review_url},
            ]],
        },
        'disable_web_page_preview': True,
    }

    api_url = f'https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage'
    with httpx.Client(timeout=6) as client:
        for chat_id in chat_ids:
            try:
                client.post(api_url, json={**payload, 'chat_id': chat_id})
            except httpx.HTTPError:
                continue
