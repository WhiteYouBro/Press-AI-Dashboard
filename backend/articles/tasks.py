from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone
from django_celery_beat.models import IntervalSchedule, PeriodicTask

from . import services
from .models import Article, PipelineRun, PromptHistory, RawNews


def _log(pipeline_run: PipelineRun, icon: str, text: str):
    entries = pipeline_run.log_entries or []
    entries.append({'time': timezone.localtime().strftime('%H:%M'), 'icon': icon, 'text': text})
    pipeline_run.log_entries = entries
    pipeline_run.save(update_fields=['log_entries'])


@shared_task(bind=True, name='articles.run_ai_pipeline')
def run_ai_pipeline(self):
    pipeline_run = PipelineRun.objects.create(
        status='running',
        next_run_at=timezone.now() + timedelta(minutes=settings.AI_PIPELINE_INTERVAL_MINUTES),
    )

    try:
        since = timezone.now() - timedelta(hours=24)
        news_qs = RawNews.objects.filter(is_processed=False, published_at__gte=since)
        news_list = list(news_qs)
        pipeline_run.news_analyzed = len(news_list)
        pipeline_run.save(update_fields=['news_analyzed'])
        _log(pipeline_run, 'sparkle', f'Проанализировано {len(news_list)} новостей за последние 24 часа')

        ranked = services.rank_news(news_list)
        selected = [item for item, _ in ranked[: settings.AI_TOP_NEWS_COUNT]]
        pipeline_run.news_selected = len(selected)
        pipeline_run.save(update_fields=['news_selected'])
        _log(pipeline_run, 'chart', f'Отобрано {len(selected)} новостей по CTR, просмотрам и трендам')

        created = 0
        for raw_news in selected:
            try:
                article = services.rewrite_news(raw_news)
                raw_news.is_processed = True
                raw_news.save(update_fields=['is_processed'])
                created += 1
                _log(pipeline_run, 'file-text', f'Создана статья #{article.id}: {article.title}')
            except Exception as exc:
                _log(pipeline_run, 'alert-triangle', f'Ошибка обработки новости #{raw_news.id}: {exc}')

        pipeline_run.articles_created = created
        pipeline_run.status = 'done'
        pipeline_run.finished_at = timezone.now()
        pipeline_run.save(update_fields=['articles_created', 'status', 'finished_at'])
        _log(pipeline_run, 'check', f'Пайплайн завершён: создано {created} статей')
        return {'pipeline_run_id': pipeline_run.id, 'articles_created': created}
    except Exception as exc:
        pipeline_run.status = 'failed'
        pipeline_run.error_message = str(exc)
        pipeline_run.finished_at = timezone.now()
        pipeline_run.save(update_fields=['status', 'error_message', 'finished_at'])
        _log(pipeline_run, 'x', f'Пайплайн завершился ошибкой: {exc}')
        raise


@shared_task(bind=True, name='articles.process_manual_article')
def process_manual_article(self, raw_text: str, rubric: str, source_url: str = None):
    data = services.process_manual(raw_text, rubric)
    prompt_history = data.pop('_prompt_history', None)
    article = Article.objects.create(
        source_type='manual',
        title=data['title'],
        seo_title=data.get('seo_title', '')[:70],
        seo_description=data.get('seo_description', '')[:160],
        lead=data['lead'],
        body=data['body'],
        rubric=rubric,
        tags=data.get('tags', []),
        editor_hints=data.get('editor_hints', []),
        title_variants=data.get('title_variants', []),
        ai_score=float(data.get('ai_score') or 0),
        ai_score_reason=data.get('ai_score_reason', ''),
        status='pending',
    )
    if prompt_history:
        PromptHistory.objects.create(article=article, **prompt_history)
    return article.id


@shared_task(name='articles.schedule_pipeline')
def schedule_pipeline():
    schedule, _ = IntervalSchedule.objects.get_or_create(
        every=settings.AI_PIPELINE_INTERVAL_MINUTES,
        period=IntervalSchedule.MINUTES,
    )
    task, _ = PeriodicTask.objects.update_or_create(
        name='AI newsroom pipeline',
        defaults={
            'interval': schedule,
            'task': 'articles.run_ai_pipeline',
            'enabled': True,
        },
    )
    return {'periodic_task_id': task.id, 'interval_minutes': settings.AI_PIPELINE_INTERVAL_MINUTES}
