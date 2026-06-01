import re

from celery.result import AsyncResult
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.db.models import Avg, Count, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Article, PipelineRun, RawNews, TelegramEditor
from .serializers import (
    AnalyticsOverviewSerializer,
    ArticleDetailSerializer,
    ArticleListSerializer,
    ArticleUpdateSerializer,
    ManualInputSerializer,
    PipelineRunSerializer,
    RawNewsSerializer,
    TelegramAuthSerializer,
    TelegramEditorSerializer,
    TelegramManualPostSerializer,
    TelegramRawNewsImportSerializer,
    UserSerializer,
)
from . import services
from .tasks import process_manual_article, run_ai_pipeline


def require_telegram_internal_token(request):
    expected = settings.TELEGRAM_BOT_INTERNAL_TOKEN
    received = request.headers.get('X-Telegram-Bot-Token', '')
    return bool(expected and received and received == expected)


def get_authorized_telegram_editor(chat_id):
    return TelegramEditor.objects.filter(chat_id=chat_id, is_authorized=True).first()


def extract_title_from_text(text):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return 'Telegram news'
    return lines[0][:500]


def clean_telegram_import_text(text):
    ad_markers = (
        'резервном канале',
        'подписывайтесь',
        'подпишись',
        'реклама',
        'наш канал',
        't.me/',
        'telegram.me/',
    )
    cleaned_lines = []
    for line in text.splitlines():
        stripped = line.strip()
        lowered = stripped.lower()
        if not stripped:
            cleaned_lines.append('')
            continue
        if any(marker in lowered for marker in ad_markers):
            continue
        if re.search(r'https?://|@\w+', stripped):
            continue
        meaningful = re.sub(r'[\W_]+', '', stripped, flags=re.UNICODE)
        if len(meaningful) <= 1 and len(stripped) >= 2:
            continue
        cleaned_lines.append(stripped)

    cleaned = '\n'.join(cleaned_lines)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
    return cleaned or text.strip()


class RawNewsViewSet(viewsets.ModelViewSet):
    queryset = RawNews.objects.all()
    serializer_class = RawNewsSerializer
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        rubric = self.request.query_params.get('rubric')
        is_processed = self.request.query_params.get('is_processed')
        ordering = self.request.query_params.get('ordering')

        if rubric:
            queryset = queryset.filter(rubric=rubric)
        if is_processed is not None:
            queryset = queryset.filter(is_processed=str(is_processed).lower() in {'1', 'true', 'yes'})
        if ordering in {'published_at', '-published_at', 'fetched_at', '-fetched_at', 'ctr', '-ctr', 'views_count', '-views_count', 'likes_count', '-likes_count', 'comments_count', '-comments_count', 'trending_score', '-trending_score'}:
            queryset = queryset.order_by(ordering)
        return queryset

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_bulk_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_bulk_create(self, serializer):
        serializer.save()

class ArticleQueueViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.select_related('raw_news', 'reviewed_by').all()
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in {'retrieve'}:
            return ArticleDetailSerializer
        if self.action in {'update', 'partial_update'}:
            return ArticleUpdateSerializer
        return ArticleListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        rubric = self.request.query_params.get('rubric')
        source_type = self.request.query_params.get('source_type')
        ordering = self.request.query_params.get('ordering')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if rubric:
            queryset = queryset.filter(rubric=rubric)
        if source_type:
            queryset = queryset.filter(source_type=source_type)
        if ordering in {'created_at', '-created_at', 'ai_score', '-ai_score', 'updated_at', '-updated_at'}:
            queryset = queryset.order_by(ordering)
        return queryset


class PipelineRunView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        task = run_ai_pipeline.delay()
        return Response({'task_id': task.id, 'status': 'pending'}, status=status.HTTP_202_ACCEPTED)


class PipelineStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        pipeline_run = PipelineRun.objects.order_by('-started_at').first()
        if not pipeline_run:
            return Response({'status': 'idle', 'pipeline_run': None})
        return Response(PipelineRunSerializer(pipeline_run).data)


class PipelineHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = PipelineRun.objects.order_by('-started_at')[:50]
        return Response(PipelineRunSerializer(queryset, many=True).data)


class TelegramAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not require_telegram_internal_token(request):
            return Response({'detail': 'Invalid Telegram service token'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TelegramAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        access_token = data.get('access_token', '').strip()
        django_username = data.get('django_username', '').strip()
        password = data.get('password', '')
        user = None

        if access_token:
            if not settings.TELEGRAM_EDITOR_ACCESS_TOKEN or access_token != settings.TELEGRAM_EDITOR_ACCESS_TOKEN:
                return Response({'detail': 'Invalid access token'}, status=status.HTTP_403_FORBIDDEN)
        else:
            user = authenticate(request, username=django_username, password=password)
            if not user or not user.is_staff:
                return Response({'detail': 'Invalid editor credentials'}, status=status.HTTP_403_FORBIDDEN)

        editor, _ = TelegramEditor.objects.update_or_create(
            chat_id=data['chat_id'],
            defaults={
                'username': data.get('username', ''),
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'django_user': user,
                'is_authorized': True,
                'authorized_at': timezone.now(),
            },
        )
        return Response({'editor': TelegramEditorSerializer(editor).data})


class TelegramImportRawNewsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not require_telegram_internal_token(request):
            return Response({'detail': 'Invalid Telegram service token'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TelegramRawNewsImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        editor = get_authorized_telegram_editor(data['chat_id'])
        if not editor:
            return Response({'detail': 'Telegram editor is not authorized'}, status=status.HTTP_403_FORBIDDEN)

        text = clean_telegram_import_text(data['text'])
        title = extract_title_from_text(text)
        source_name = data.get('source_name', '') or 'Telegram Bot'
        source_url = data.get('source_url', '')
        rubric_result = services.classify_rubric(
            title,
            text,
            source_name,
            source_url,
            data.get('rubric', ''),
        )
        raw_news = RawNews.objects.create(
            title=title,
            body=text,
            source_url=source_url,
            source_name=source_name,
            rubric=rubric_result['rubric'],
            views_count=data.get('views_count', 0),
            ctr=0,
            likes_count=data.get('likes_count', 0),
            comments_count=data.get('comments_count', 0),
            shares_count=data.get('shares_count', 0),
            trending_score=0,
            published_at=timezone.now(),
            is_processed=False,
        )
        return Response({'raw_news': RawNewsSerializer(raw_news).data}, status=status.HTTP_201_CREATED)


class TelegramManualPostView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not require_telegram_internal_token(request):
            return Response({'detail': 'Invalid Telegram service token'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TelegramManualPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        editor = get_authorized_telegram_editor(data['chat_id'])
        if not editor:
            return Response({'detail': 'Telegram editor is not authorized'}, status=status.HTTP_403_FORBIDDEN)

        return Response(services.generate_telegram_post(data['raw_text']))


class ApproveArticleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        article = get_object_or_404(Article.objects.select_related('raw_news', 'reviewed_by'), pk=pk)
        article.status = 'approved'
        article.reviewed_by = request.user
        article.approved_at = timezone.now()
        article.review_note = ''
        article.save(update_fields=['status', 'reviewed_by', 'approved_at', 'review_note', 'updated_at'])
        return Response(ArticleDetailSerializer(article).data)


class RejectArticleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        article = get_object_or_404(Article.objects.select_related('raw_news', 'reviewed_by'), pk=pk)
        article.status = 'rejected'
        article.reviewed_by = request.user
        article.review_note = request.data.get('reason', '')
        article.save(update_fields=['status', 'reviewed_by', 'review_note', 'updated_at'])
        return Response(ArticleDetailSerializer(article).data)


class ManualProcessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ManualInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = process_manual_article.delay(
            serializer.validated_data['raw_text'],
            serializer.validated_data['rubric'],
            serializer.validated_data.get('source_url'),
        )
        return Response({'task_id': task.id, 'status': 'pending'}, status=status.HTTP_202_ACCEPTED)


class ManualStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        result = AsyncResult(task_id)
        if result.state in {'PENDING', 'RECEIVED'}:
            return Response({'task_id': task_id, 'status': 'pending'})
        if result.state in {'STARTED', 'RETRY'}:
            return Response({'task_id': task_id, 'status': 'processing'})
        if result.state == 'FAILURE':
            return Response({'task_id': task_id, 'status': 'failed', 'error': str(result.result)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        article = get_object_or_404(Article.objects.select_related('raw_news', 'reviewed_by'), pk=result.result)
        return Response({'task_id': task_id, 'status': 'done', 'article': ArticleDetailSerializer(article).data})


class AnalyticsOverviewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()
        articles_count = Article.objects.count()
        rejected_count = Article.objects.filter(status='rejected').count()
        approved_articles = Article.objects.filter(approved_at__isnull=False)
        durations = []
        for article in approved_articles.only('created_at', 'approved_at'):
            durations.append((article.approved_at - article.created_at).total_seconds() / 3600)

        data = {
            'pending_count': Article.objects.filter(status='pending').count(),
            'approved_today': Article.objects.filter(status='approved', approved_at__date=today).count(),
            'avg_ctr': round(RawNews.objects.aggregate(value=Avg('ctr'))['value'] or 0, 4),
            'avg_ai_score': round(Article.objects.aggregate(value=Avg('ai_score'))['value'] or 0, 2),
            'total_published': Article.objects.filter(status='published').count(),
            'rejection_rate': round(rejected_count / articles_count, 4) if articles_count else 0,
            'avg_time_to_publish_hours': round(sum(durations) / len(durations), 2) if durations else 0,
            'recent_pipeline_run': PipelineRun.objects.order_by('-started_at').first(),
        }
        return Response(AnalyticsOverviewSerializer(data).data)


class AnalyticsCTRView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        by_rubric = RawNews.objects.values('rubric').annotate(avg_ctr=Avg('ctr'), total_views=Count('id')).order_by('rubric')
        return Response({'rubrics': list(by_rubric)})


class AnalyticsAccuracyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Article.objects.filter(raw_news__isnull=False).annotate(source_ctr=F('raw_news__ctr'))
        rows = [
            {'article_id': item.id, 'title': item.title, 'ai_score': item.ai_score, 'source_ctr': item.source_ctr}
            for item in queryset[:100]
        ]
        approval_rate = Article.objects.filter(status='approved').count() / Article.objects.count() if Article.objects.exists() else 0
        return Response({'approval_rate': round(approval_rate, 4), 'items': rows})


class PipelineSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'openai_model': settings.OPENAI_MODEL,
            'pipeline_interval_minutes': settings.AI_PIPELINE_INTERVAL_MINUTES,
            'top_news_count': settings.AI_TOP_NEWS_COUNT,
            'ranking_weights': settings.AI_RANKING_WEIGHTS,
        })

    def put(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_403_FORBIDDEN)
        return Response({
            'detail': 'Runtime settings are read from environment variables. Update backend/.env and restart services.',
            'current': {
                'openai_model': settings.OPENAI_MODEL,
                'pipeline_interval_minutes': settings.AI_PIPELINE_INTERVAL_MINUTES,
                'top_news_count': settings.AI_TOP_NEWS_COUNT,
                'ranking_weights': settings.AI_RANKING_WEIGHTS,
            },
        })


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response({'detail': 'Logged out'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
