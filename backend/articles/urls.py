from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsAccuracyView,
    AnalyticsCTRView,
    AnalyticsOverviewView,
    ApproveArticleView,
    ArticleQueueViewSet,
    ManualProcessView,
    ManualStatusView,
    PipelineHistoryView,
    PipelineRunView,
    PipelineSettingsView,
    PipelineStatusView,
    RawNewsViewSet,
    RejectArticleView,
    TelegramAuthView,
    TelegramImportRawNewsView,
    TelegramManualPostView,
)

router = DefaultRouter()
router.register(r'news', RawNewsViewSet, basename='news')
router.register(r'queue', ArticleQueueViewSet, basename='queue')

urlpatterns = [
    path('', include(router.urls)),
    path('ai/pipeline/run/', PipelineRunView.as_view()),
    path('ai/pipeline/status/', PipelineStatusView.as_view()),
    path('ai/pipeline/history/', PipelineHistoryView.as_view()),
    path('ai/manual/', ManualProcessView.as_view()),
    path('ai/manual/<str:task_id>/', ManualStatusView.as_view()),
    path('queue/<int:pk>/approve/', ApproveArticleView.as_view()),
    path('queue/<int:pk>/reject/', RejectArticleView.as_view()),
    path('analytics/overview/', AnalyticsOverviewView.as_view()),
    path('analytics/ctr/', AnalyticsCTRView.as_view()),
    path('analytics/ai_accuracy/', AnalyticsAccuracyView.as_view()),
    path('settings/', PipelineSettingsView.as_view()),
    path('telegram/auth/', TelegramAuthView.as_view()),
    path('telegram/import/', TelegramImportRawNewsView.as_view()),
    path('telegram/manual-post/', TelegramManualPostView.as_view()),
]
