from django.contrib import admin

from .models import Article, PipelineRun, PromptHistory, RawNews, TelegramEditor


@admin.register(RawNews)
class RawNewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'rubric', 'views_count', 'likes_count', 'comments_count', 'ctr', 'is_processed', 'published_at')
    list_filter = ('rubric', 'is_processed')
    search_fields = ('title', 'body', 'source_name')


@admin.register(TelegramEditor)
class TelegramEditorAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat_id', 'username', 'django_user', 'is_authorized', 'authorized_at', 'updated_at')
    list_filter = ('is_authorized',)
    search_fields = ('chat_id', 'username', 'first_name', 'last_name', 'django_user__username')


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'rubric', 'source_type', 'ai_score', 'status', 'created_at')
    list_filter = ('status', 'source_type', 'rubric')
    search_fields = ('title', 'lead', 'body')


@admin.register(PipelineRun)
class PipelineRunAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'news_analyzed', 'news_selected', 'articles_created', 'started_at', 'finished_at')
    list_filter = ('status',)


@admin.register(PromptHistory)
class PromptHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'article', 'prompt_type', 'tokens_used', 'duration_ms', 'created_at')
    list_filter = ('prompt_type',)
