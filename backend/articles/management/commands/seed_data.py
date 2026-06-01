import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from articles.models import Article, RawNews


class Command(BaseCommand):
    help = 'Seed demo users, raw news and processed AI articles.'

    def handle(self, *args, **options):
        User = get_user_model()
        users = [
            ('admin', 'admin@newsroom.local', 'admin123', True),
            ('editor1', 'editor1@newsroom.local', 'editor123', False),
            ('editor2', 'editor2@newsroom.local', 'editor123', False),
        ]
        for username, email, password, is_staff in users:
            user, created = User.objects.get_or_create(username=username, defaults={'email': email, 'is_staff': is_staff, 'is_superuser': is_staff})
            if created:
                user.set_password(password)
                user.save()

        rubrics = ['Политика', 'Экономика', 'Наука', 'Культура', 'Спорт', 'Технологии']
        samples = [
            'Правительство представило новую программу поддержки регионов и малого бизнеса.',
            'Центральный банк сообщил о решениях по ключевой ставке и инфляционным ожиданиям.',
            'Учёные объявили о результатах исследования в области медицины и биотехнологий.',
            'В городе открылся международный культурный форум с участием зарубежных делегаций.',
            'Крупный турнир завершился победой национальной команды после напряжённого финала.',
            'Технологическая компания представила сервис на базе искусственного интеллекта.',
        ]

        created_news = []
        for index in range(50):
            rubric = random.choice(rubrics)
            title = f'{rubric}: важное событие дня #{index + 1}'
            raw_news, _ = RawNews.objects.get_or_create(
                title=title,
                defaults={
                    'body': random.choice(samples) + ' Подробности сообщили представители профильных организаций. Ожидаются дополнительные комментарии экспертов.',
                    'source_url': f'https://example.com/news/{index + 1}',
                    'source_name': random.choice(['РИА Новости', 'ТАСС', 'Интерфакс', 'Коммерсантъ']),
                    'rubric': rubric,
                    'views_count': random.randint(1000, 500000),
                    'ctr': round(random.uniform(0.01, 0.08), 4),
                    'shares_count': random.randint(10, 8000),
                    'trending_score': round(random.uniform(0.1, 1.0), 2),
                    'published_at': timezone.now() - timedelta(hours=random.randint(1, 48)),
                },
            )
            created_news.append(raw_news)

        pending_sources = created_news[:5]
        for source in pending_sources:
            Article.objects.get_or_create(
                raw_news=source,
                source_type='ai_pipeline',
                title=f'AI: {source.title}',
                defaults={
                    'seo_title': source.title[:60],
                    'seo_description': 'Краткое описание новости для поисковых систем и социальных сетей.',
                    'lead': 'AI подготовил лид с ключевыми фактами и нейтральной подачей.',
                    'body': '<p>Это демонстрационная статья, подготовленная AI для проверки редактором.</p><p>Текст структурирован, очищен от разговорных оборотов и дополнен контекстом.</p>',
                    'rubric': source.rubric,
                    'tags': [source.rubric.lower(), 'ai', 'новости'],
                    'editor_hints': [
                        {'position': 1, 'type': 'photo', 'icon': 'image', 'text': 'Добавьте иллюстрацию 1200×630px.'},
                        {'position': 2, 'type': 'quote', 'icon': 'quote', 'text': 'Проверьте наличие официального комментария.'},
                    ],
                    'title_variants': [f'{source.rubric}: обновлённый заголовок', 'Главные детали события', 'Что известно к этому часу'],
                    'ai_score': round(random.uniform(7.2, 9.6), 1),
                    'ai_score_reason': 'Высокие исходные метрики и достаточная фактология.',
                    'status': 'pending',
                },
            )
            source.is_processed = True
            source.save(update_fields=['is_processed'])

        self.stdout.write(self.style.SUCCESS('Seed data created: users, 50 raw news, 5 pending articles.'))
