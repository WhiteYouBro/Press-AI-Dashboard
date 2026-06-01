from django.conf import settings
from django.db import models

from .fields import JSONTextField


RUBRIC_CHOICES = [
    ('Политика', 'Политика'),
    ('Экономика', 'Экономика'),
    ('Происшествия', 'Происшествия'),
    ('Криминал', 'Криминал'),
    ('Право', 'Право'),
    ('Общество', 'Общество'),
    ('Мир', 'Мир'),
    ('Наука', 'Наука'),
    ('Здоровье', 'Здоровье'),
    ('Образование', 'Образование'),
    ('Культура', 'Культура'),
    ('Спорт', 'Спорт'),
    ('Технологии', 'Технологии'),
    ('Транспорт', 'Транспорт'),
    ('Экология', 'Экология'),
    ('Недвижимость', 'Недвижимость'),
]

STATUS_CHOICES = [
    ('pending', 'Ожидает проверки'),
    ('approved', 'Одобрено'),
    ('rejected', 'Отклонено'),
    ('published', 'Опубликовано'),
]

SOURCE_CHOICES = [
    ('ai_pipeline', 'AI Пайплайн'),
    ('manual', 'Ручной ввод'),
]

PIPELINE_STATUS_CHOICES = [
    ('running', 'Выполняется'),
    ('done', 'Завершён'),
    ('failed', 'Ошибка'),
]


class RawNews(models.Model):
    title = models.CharField(max_length=500)
    body = models.TextField()
    source_url = models.URLField(blank=True)
    source_name = models.CharField(max_length=200, blank=True)
    rubric = models.CharField(max_length=100, choices=RUBRIC_CHOICES)
    views_count = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    trending_score = models.FloatField(default=0.0)
    published_at = models.DateTimeField()
    fetched_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['is_processed', '-ctr'], name='articles_ra_is_proc_b5734a_idx'),
            models.Index(fields=['rubric', '-views_count'], name='articles_ra_rubric_71f10e_idx'),
        ]

    def __str__(self):
        return self.title


class TelegramEditor(models.Model):
    chat_id = models.BigIntegerField(unique=True)
    username = models.CharField(max_length=150, blank=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    django_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='telegram_editors',
    )
    is_authorized = models.BooleanField(default=False)
    authorized_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['is_authorized', 'chat_id'], name='articles_te_is_auth_4bfd5d_idx'),
        ]

    def __str__(self):
        return self.username or str(self.chat_id)


class Article(models.Model):
    raw_news = models.ForeignKey(RawNews, null=True, blank=True, on_delete=models.SET_NULL)
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    title = models.CharField(max_length=500)
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    lead = models.TextField()
    body = models.TextField()
    rubric = models.CharField(max_length=100)
    tags = JSONTextField(default=list)
    editor_hints = JSONTextField(default=list)
    title_variants = JSONTextField(default=list)
    ai_score = models.FloatField(default=0.0)
    ai_score_reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_articles',
    )
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at'], name='articles_ar_status_a35265_idx'),
            models.Index(fields=['source_type', 'status'], name='articles_ar_source__741a83_idx'),
        ]

    def __str__(self):
        return self.title


class PipelineRun(models.Model):
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    news_analyzed = models.IntegerField(default=0)
    news_selected = models.IntegerField(default=0)
    articles_created = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=PIPELINE_STATUS_CHOICES, default='running')
    error_message = models.TextField(blank=True)
    log_entries = JSONTextField(default=list)
    next_run_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'PipelineRun #{self.pk} {self.status}'


class PromptHistory(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='prompts')
    prompt_type = models.CharField(max_length=50)
    prompt_text = models.TextField()
    response_text = models.TextField()
    tokens_used = models.IntegerField(default=0)
    duration_ms = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.prompt_type} for article #{self.article_id}'
