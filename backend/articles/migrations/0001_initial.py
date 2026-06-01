# Generated for initial project setup

from django.conf import settings
from django.db import migrations, models
import articles.fields
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='RawNews',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=500)),
                ('body', models.TextField()),
                ('source_url', models.URLField(blank=True)),
                ('source_name', models.CharField(blank=True, max_length=200)),
                ('rubric', models.CharField(choices=[('Политика', 'Политика'), ('Экономика', 'Экономика'), ('Наука', 'Наука'), ('Культура', 'Культура'), ('Спорт', 'Спорт'), ('Технологии', 'Технологии'), ('Общество', 'Общество'), ('Мир', 'Мир')], max_length=100)),
                ('views_count', models.IntegerField(default=0)),
                ('ctr', models.FloatField(default=0.0)),
                ('shares_count', models.IntegerField(default=0)),
                ('trending_score', models.FloatField(default=0.0)),
                ('published_at', models.DateTimeField()),
                ('fetched_at', models.DateTimeField(auto_now_add=True)),
                ('is_processed', models.BooleanField(default=False)),
            ],
            options={'ordering': ['-published_at']},
        ),
        migrations.CreateModel(
            name='PipelineRun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('news_analyzed', models.IntegerField(default=0)),
                ('news_selected', models.IntegerField(default=0)),
                ('articles_created', models.IntegerField(default=0)),
                ('status', models.CharField(choices=[('running', 'Выполняется'), ('done', 'Завершён'), ('failed', 'Ошибка')], default='running', max_length=20)),
                ('error_message', models.TextField(blank=True)),
                ('log_entries', articles.fields.JSONTextField(default=list)),
                ('next_run_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={'ordering': ['-started_at']},
        ),
        migrations.CreateModel(
            name='Article',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_type', models.CharField(choices=[('ai_pipeline', 'AI Пайплайн'), ('manual', 'Ручной ввод')], max_length=20)),
                ('title', models.CharField(max_length=500)),
                ('seo_title', models.CharField(blank=True, max_length=70)),
                ('seo_description', models.CharField(blank=True, max_length=160)),
                ('lead', models.TextField()),
                ('body', models.TextField()),
                ('rubric', models.CharField(max_length=100)),
                ('tags', articles.fields.JSONTextField(default=list)),
                ('editor_hints', articles.fields.JSONTextField(default=list)),
                ('title_variants', articles.fields.JSONTextField(default=list)),
                ('ai_score', models.FloatField(default=0.0)),
                ('ai_score_reason', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Ожидает проверки'), ('approved', 'Одобрено'), ('rejected', 'Отклонено'), ('published', 'Опубликовано')], default='pending', max_length=20)),
                ('review_note', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('raw_news', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='articles.rawnews')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_articles', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='PromptHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prompt_type', models.CharField(max_length=50)),
                ('prompt_text', models.TextField()),
                ('response_text', models.TextField()),
                ('tokens_used', models.IntegerField(default=0)),
                ('duration_ms', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prompts', to='articles.article')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='rawnews',
            index=models.Index(fields=['is_processed', '-ctr'], name='articles_ra_is_proc_b5734a_idx'),
        ),
        migrations.AddIndex(
            model_name='rawnews',
            index=models.Index(fields=['rubric', '-views_count'], name='articles_ra_rubric_71f10e_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['status', '-created_at'], name='articles_ar_status_a35265_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['source_type', 'status'], name='articles_ar_source__741a83_idx'),
        ),
    ]
