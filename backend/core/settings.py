import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def env(name, default=None):
    value = os.getenv(name)
    return default if value is None or value == '' else value


def env_bool(name, default=False):
    value = env(name)
    if value is None:
        return default
    return str(value).lower() in {'1', 'true', 'yes', 'on'}


SECRET_KEY = env('SECRET_KEY', 'change-me-in-production')
DEBUG = env_bool('DEBUG', False)
ALLOWED_HOSTS = [host.strip() for host in env('ALLOWED_HOSTS', 'localhost,127.0.0.1,backend').split(',') if host.strip()]

CSRF_TRUSTED_ORIGINS = list(dict.fromkeys([
    'http://localhost:3000',
    'http://localhost:1903',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:1903',
]))

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'django_celery_beat',
    'django_celery_results',
    'articles.apps.ArticlesConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', env('POSTGRES_DB')),
        'USER': env('DB_USER', env('POSTGRES_USER')),
        'PASSWORD': env('DB_PASSWORD', env('POSTGRES_PASSWORD')),
        'HOST': env('DB_HOST', 'postgres'),
        'PORT': env('DB_PORT', '5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = env('TIME_ZONE', 'Europe/Moscow')
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CELERY_BROKER_URL = env('REDIS_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_DEFAULT_QUEUE = 'default'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'articles.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
}

FRONTEND_URL = env('FRONTEND_URL', 'http://localhost:3000')
TELEGRAM_BOT_TOKEN = env('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_BOT_INTERNAL_TOKEN = env('TELEGRAM_BOT_INTERNAL_TOKEN', '')
TELEGRAM_EDITOR_ACCESS_TOKEN = env('TELEGRAM_EDITOR_ACCESS_TOKEN', '')
TELEGRAM_REVIEW_URL_TEMPLATE = env('TELEGRAM_REVIEW_URL_TEMPLATE', 'http://localhost:3000/article/{id}/review')
CORS_ALLOWED_ORIGINS = list(dict.fromkeys([
    'http://localhost:3000',
    'http://localhost:1903',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:1903',
    FRONTEND_URL,
]))
CORS_ALLOW_CREDENTIALS = True

OPENAI_API_KEY = env('OPENAI_API_KEY', '')
OPENAI_MODEL = env('OPENAI_MODEL', 'gpt-4o-mini')

GROQ_API_KEY = env('GROQ_API_KEY', '')
GROQ_MODEL = env('GROQ_MODEL', 'llama-3.3-70b-versatile')
AI_PIPELINE_INTERVAL_MINUTES = int(env('AI_PIPELINE_INTERVAL', '30'))
AI_TOP_NEWS_COUNT = int(env('AI_TOP_NEWS_COUNT', '5'))
AI_RANKING_WEIGHTS = {
    'ctr': float(env('AI_WEIGHT_CTR', '0.35')),
    'views': float(env('AI_WEIGHT_VIEWS', '0.25')),
    'shares': float(env('AI_WEIGHT_SHARES', '0.20')),
    'trending': float(env('AI_WEIGHT_TRENDING', '0.20')),
}
