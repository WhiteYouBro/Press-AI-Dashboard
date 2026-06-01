from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Article, PipelineRun, RawNews, TelegramEditor

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')
        read_only_fields = fields


class RawNewsSerializer(serializers.ModelSerializer):
    rubric = serializers.CharField(required=False, allow_blank=True, max_length=100)

    class Meta:
        model = RawNews
        fields = (
            'id',
            'title',
            'body',
            'source_url',
            'source_name',
            'rubric',
            'views_count',
            'ctr',
            'likes_count',
            'comments_count',
            'shares_count',
            'trending_score',
            'published_at',
            'fetched_at',
            'is_processed',
        )
        read_only_fields = ('id', 'fetched_at')

    def create(self, validated_data):
        from . import services

        preferred_rubric = validated_data.get('rubric', '')
        rubric_result = services.classify_rubric(
            validated_data.get('title', ''),
            validated_data.get('body', ''),
            validated_data.get('source_name', ''),
            validated_data.get('source_url', ''),
            preferred_rubric,
        )
        validated_data['rubric'] = rubric_result['rubric']
        return super().create(validated_data)


class TelegramEditorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramEditor
        fields = (
            'id',
            'chat_id',
            'username',
            'first_name',
            'last_name',
            'is_authorized',
            'authorized_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


class TelegramAuthSerializer(serializers.Serializer):
    chat_id = serializers.IntegerField()
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    access_token = serializers.CharField(required=False, allow_blank=True)
    django_username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True)


class TelegramRawNewsImportSerializer(serializers.Serializer):
    chat_id = serializers.IntegerField()
    text = serializers.CharField(min_length=3)
    source_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    source_url = serializers.URLField(required=False, allow_blank=True)
    rubric = serializers.CharField(required=False, allow_blank=True, max_length=100)
    views_count = serializers.IntegerField(required=False, min_value=0, default=0)
    likes_count = serializers.IntegerField(required=False, min_value=0, default=0)
    comments_count = serializers.IntegerField(required=False, min_value=0, default=0)
    shares_count = serializers.IntegerField(required=False, min_value=0, default=0)


class TelegramManualPostSerializer(serializers.Serializer):
    chat_id = serializers.IntegerField()
    raw_text = serializers.CharField(min_length=10)


class ArticleListSerializer(serializers.ModelSerializer):
    raw_news_views_count = serializers.IntegerField(source='raw_news.views_count', read_only=True)
    raw_news_ctr = serializers.FloatField(source='raw_news.ctr', read_only=True)
    source_url = serializers.CharField(source='raw_news.source_url', read_only=True)

    class Meta:
        model = Article
        fields = (
            'id',
            'title',
            'lead',
            'rubric',
            'ai_score',
            'status',
            'source_type',
            'created_at',
            'raw_news_views_count',
            'raw_news_ctr',
            'source_url',
        )


class ArticleDetailSerializer(serializers.ModelSerializer):
    raw_news = RawNewsSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = Article
        fields = (
            'id',
            'raw_news',
            'source_type',
            'title',
            'seo_title',
            'seo_description',
            'lead',
            'body',
            'rubric',
            'tags',
            'editor_hints',
            'title_variants',
            'ai_score',
            'ai_score_reason',
            'status',
            'reviewed_by',
            'review_note',
            'created_at',
            'updated_at',
            'approved_at',
        )
        read_only_fields = ('id', 'raw_news', 'source_type', 'reviewed_by', 'created_at', 'updated_at', 'approved_at')


class ArticleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = (
            'title',
            'seo_title',
            'seo_description',
            'lead',
            'body',
            'rubric',
            'tags',
            'editor_hints',
            'title_variants',
            'ai_score',
            'ai_score_reason',
            'status',
        )


class ManualInputSerializer(serializers.Serializer):
    raw_text = serializers.CharField(min_length=100)
    rubric = serializers.CharField(max_length=100)
    source_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)


class PipelineRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineRun
        fields = (
            'id',
            'started_at',
            'finished_at',
            'news_analyzed',
            'news_selected',
            'articles_created',
            'status',
            'error_message',
            'log_entries',
            'next_run_at',
        )


class AnalyticsOverviewSerializer(serializers.Serializer):
    pending_count = serializers.IntegerField()
    approved_today = serializers.IntegerField()
    avg_ctr = serializers.FloatField()
    avg_ai_score = serializers.FloatField()
    total_published = serializers.IntegerField()
    rejection_rate = serializers.FloatField()
    avg_time_to_publish_hours = serializers.FloatField()
    recent_pipeline_run = PipelineRunSerializer(allow_null=True)
