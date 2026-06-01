# Press AI Dashboard: описание и инструкция по запуску

> Актуальная PostgreSQL-инструкция находится в `POSTGRES_RUN_INSTRUCTIONS.md`.
> Проект переключён на PostgreSQL через `backend/.env`: пользователь `postgres`, пароль `admin1235`, внешний порт `5433`, база `press_ai_dashboard`.

## 1. Текущий статус интеграции с Postgres

Проект переключён на полноценную PostgreSQL-интеграцию через `backend/.env`.

Актуальная конфигурация:

```env
DB_ENGINE=postgres
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
DB_HOST=postgres
DB_PORT=5432
POSTGRES_DB=press_ai_dashboard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin1235
POSTGRES_HOST_PORT=5433
```

### Итог

- **Postgres-сервис описан в Docker Compose:** да.
- **Django работает через PostgreSQL:** да.
- **Backend и Celery используют одну PostgreSQL-базу:** да.
- **Внешний порт подключения к PostgreSQL:** `5433`.
- **Подробная актуальная инструкция:** `POSTGRES_RUN_INSTRUCTIONS.md`.

---

## 2. Что представляет собой проект

`press-ai-dashboard` — дипломный проект AI-редакции для новостного отдела.

Система позволяет:

- хранить сырые новости из источников;
- ранжировать новости по метрикам;
- генерировать AI-версии статей;
- отправлять статьи на редакторскую проверку;
- одобрять или отклонять статьи;
- вручную отправлять текст на AI-обработку;
- смотреть аналитику по CTR, AI score и публикациям;
- настраивать параметры AI-пайплайна.

---

## 3. Технологии

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- Lucide icons

Frontend находится в корне проекта:

```text
app/
components/
lib/
```

### Backend

- Python
- Django 4.2
- Django REST Framework
- DRF TokenAuthentication
- Celery
- Redis
- PostgreSQL или SQLite
- OpenAI API

Backend находится в папке:

```text
backend/
```

---

## 4. Что сейчас работает

### Frontend routes

Работают страницы:

```text
/
/login
/dashboard
/queue
/article/[id]/review
/manual
/database
/analytics
/settings
```

### Backend API

Базовый URL:

```text
http://127.0.0.1:8000/api/v1/
```

Работают:

- новости;
- очередь статей;
- детали статьи;
- аналитика;
- настройки пайплайна;
- логин;
- logout;
- approve/reject;
- ручная AI-обработка;
- Celery pipeline.

### Авторизация

Используется DRF TokenAuthentication:

```http
Authorization: Token <token>
```

Frontend хранит токен в `localStorage`:

```text
access_token
```

### Демо-пользователи

После запуска seed-команды доступны:

```text
admin / admin123
editor1 / editor123
editor2 / editor123
```

---

## 5. Важные файлы

```text
package.json
```

Frontend-зависимости и команды.

```text
backend/requirements.txt
```

Python-зависимости.

```text
backend/.env
```

Настройки backend, базы данных, Redis, OpenAI.

```text
docker-compose.yml
```

Docker-инфраструктура: Postgres, Redis, backend, Celery, frontend.

```text
lib/api.ts
```

Frontend API-клиент.

```text
backend/core/settings.py
```

Django settings.

```text
backend/articles/services.py
```

AI-логика.

```text
backend/articles/tasks.py
```

Celery-задачи.

```text
backend/articles/management/commands/seed_data.py
```

Создание тестовых пользователей и демо-данных.

---

# 6. Локальный запуск

Этот вариант подходит для разработки без полного Docker Compose.

## 6.1. Требования

Нужно установить:

- Node.js 22+
- Python 3.8+
- Git
- npm или pnpm `10.24.0`

Проверка:

```powershell
node -v
npm -v
python --version
```

## 6.2. Установить frontend-зависимости

Из корня проекта:

```powershell
cd d:\Work\Diploma\press-ai-dashboard
npm install
```

Или если используете pnpm:

```powershell
corepack enable
corepack use pnpm@10.24.0
pnpm install
```

## 6.3. Настроить `backend/.env` для PostgreSQL

Файл:

```text
backend/.env
```

Конфигурация для локального backend с PostgreSQL на `localhost:5433`:

```env
SECRET_KEY=dev-secret-key-change-before-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

DB_ENGINE=postgres
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
DB_HOST=localhost
DB_PORT=5433
POSTGRES_DB=press_ai_dashboard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin1235
POSTGRES_HOST_PORT=5433

REDIS_URL=redis://localhost:6379/0

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

AI_PIPELINE_INTERVAL=30
AI_TOP_NEWS_COUNT=5

FRONTEND_URL=http://localhost:3000
```

Если backend запускается внутри Docker Compose, используйте внутренние адреса:

```env
DB_HOST=postgres
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
```

## 6.4. Создать Python virtual environment

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
python -m venv .venv
```

Активировать:

```powershell
.\.venv\Scripts\Activate.ps1
```

Если PowerShell запрещает запуск скриптов:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 6.5. Установить backend-зависимости

```powershell
pip install -r requirements.txt
```

## 6.6. Выполнить миграции

```powershell
python manage.py migrate
```

## 6.7. Создать демо-данные

```powershell
python manage.py seed_data
```

Команда создаст:

- пользователей `admin`, `editor1`, `editor2`;
- 50 сырых новостей;
- 5 AI-статей в очереди.

## 6.8. Запустить backend

```powershell
python manage.py runserver
```

Backend будет доступен:

```text
http://127.0.0.1:8000
```

API:

```text
http://127.0.0.1:8000/api/v1/
```

## 6.9. Запустить frontend

Откройте второй терминал:

```powershell
cd d:\Work\Diploma\press-ai-dashboard
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 7. Запуск с Postgres через Docker Compose

Этот вариант нужен, если вы хотите использовать именно Postgres.

## 7.1. Важно

Для Docker Compose в `backend/.env` должно быть:

```env
DB_ENGINE=postgres
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
DB_HOST=postgres
DB_PORT=5432
POSTGRES_DB=press_ai_dashboard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin1235
POSTGRES_HOST_PORT=5433
REDIS_URL=redis://redis:6379/0
```

Полный пример `backend/.env` для Docker/Postgres:

```env
SECRET_KEY=dev-secret-key-change-before-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

DB_ENGINE=postgres
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
DB_HOST=postgres
DB_PORT=5432
POSTGRES_DB=press_ai_dashboard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin1235
POSTGRES_HOST_PORT=5433

REDIS_URL=redis://redis:6379/0

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

AI_PIPELINE_INTERVAL=30
AI_TOP_NEWS_COUNT=5

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@newsroom.local
DJANGO_SUPERUSER_PASSWORD=admin123

FRONTEND_URL=http://localhost:3000
```

## 7.2. Запустить Docker Compose

Из корня проекта:

```powershell
cd d:\Work\Diploma\press-ai-dashboard
docker compose --env-file ./backend/.env up --build
```

Поднимутся сервисы:

- `postgres` внутри Docker на порту `5432`, с хоста на порту `5433`;
- `redis` на порту `6379`;
- `backend` на порту `8000`;
- `celery_worker`;
- `celery_beat`;
- `frontend` на порту `3000`.

## 7.3. Выполнить миграции в Postgres

В новом терминале:

```powershell
cd d:\Work\Diploma\press-ai-dashboard
docker compose exec backend python manage.py migrate
```

## 7.4. Создать демо-данные в Postgres

```powershell
docker compose exec backend python manage.py seed_data
```

## 7.5. Открыть приложение

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:8000/api/v1/
```

Логин:

```text
admin / admin123
```

---

# 8. Как проверить, что backend действительно использует Postgres

## 8.1. Проверить настройки Django внутри контейнера

```powershell
docker compose exec backend python manage.py shell
```

В shell выполнить:

```python
from django.conf import settings
settings.DATABASES['default']['ENGINE']
settings.DATABASES['default']['HOST']
settings.DATABASES['default']['NAME']
```

Для Postgres должно быть примерно:

```text
django.db.backends.postgresql
postgres
press_ai_dashboard
```

Если видите:

```text
django.db.backends.sqlite3
```

значит backend всё ещё работает на SQLite.

## 8.2. Проверить Postgres контейнер

```powershell
docker compose ps
```

Postgres должен быть в статусе `running` или `healthy`.

## 8.3. Проверить таблицы в Postgres

```powershell
docker compose exec postgres psql -U postgres -d press_ai_dashboard
```

Внутри psql:

```sql
\dt
```

Должны быть таблицы Django и приложения `articles`.

Пример таблиц:

```text
articles_article
articles_rawnews
articles_pipelinerun
auth_user
```

Выйти из psql:

```sql
\q
```

---

# 9. Локальный запуск с Postgres без Docker backend

Можно использовать Docker только для Postgres и Redis, а Django запускать локально.

## 9.1. Запустить Postgres и Redis контейнерами

```powershell
docker run --name press-ai-postgres -e POSTGRES_DB=press_ai_dashboard -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin1235 -p 5433:5432 -d postgres:15-alpine
```

```powershell
docker run --name press-ai-redis -p 6379:6379 -d redis:7-alpine
```

Если контейнеры уже существуют:

```powershell
docker start press-ai-postgres
docker start press-ai-redis
```

## 9.2. Настроить `backend/.env` для локального Postgres

```env
DB_ENGINE=postgres
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
DB_HOST=localhost
DB_PORT=5433
REDIS_URL=redis://localhost:6379/0
```

## 9.3. Запустить миграции

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py seed_data
```

## 9.4. Запустить Django

```powershell
python manage.py runserver
```

---

# 10. Celery и ручная AI-обработка

Ручной режим `/manual` требует:

- авторизации;
- Redis;
- Celery worker;
- желательно OpenAI API key.

## Локально

Терминал 1:

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

Терминал 2:

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
.\.venv\Scripts\Activate.ps1
celery -A core worker -l info -Q default -c 4
```

Терминал 3:

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
.\.venv\Scripts\Activate.ps1
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## В Docker

`celery_worker` и `celery_beat` уже описаны в `docker-compose.yml`.

Запуск:

```powershell
docker compose --env-file ./backend/.env up --build
```

Логи worker:

```powershell
docker compose logs -f celery_worker
```

---

# 11. Проверки проекта

## TypeScript

Из корня проекта:

```powershell
npx --no-install tsc --noEmit
```

## Production build

```powershell
npm run build
```

## Frontend dev server

```powershell
npm run dev
```

## Backend health через API

Открыть в браузере:

```text
http://127.0.0.1:8000/api/v1/news/
```

или для Docker:

```text
http://localhost:8000/api/v1/news/
```

---

# 12. Частые проблемы

## Backend всё ещё использует SQLite вместо Postgres

Проверьте `backend/.env`:

```env
DB_ENGINE=postgres
```

Для Docker также должно быть:

```env
DB_HOST=postgres
REDIS_URL=redis://redis:6379/0
```

После изменения `.env` перезапустите контейнеры:

```powershell
docker compose down
docker compose --env-file ./backend/.env up --build
```

## Postgres запущен, но таблиц нет

Нужно выполнить миграции:

```powershell
docker compose exec backend python manage.py migrate
```

## В dashboard нет данных

Нужно создать seed:

```powershell
docker compose exec backend python manage.py seed_data
```

или локально:

```powershell
python manage.py seed_data
```

## Manual mode не получает результат

Проверьте:

- Redis запущен;
- Celery worker запущен;
- пользователь авторизован;
- `OPENAI_API_KEY` заполнен, если нужна реальная AI-обработка.

## Ошибка OpenAI key

В `backend/.env` сейчас может стоять placeholder:

```env
OPENAI_API_KEY=sk-change-me
```

Для реального AI нужно заменить на настоящий ключ или оставить пустым, если AI-вызовы не используются.

---

# 13. Рекомендуемый сценарий для демонстрации с Postgres

1. В `backend/.env` поставить:

```env
DB_ENGINE=postgres
DB_HOST=postgres
REDIS_URL=redis://redis:6379/0
```

2. Запустить Docker:

```powershell
docker compose --env-file ./backend/.env up --build
```

3. В новом терминале выполнить:

```powershell
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

4. Открыть:

```text
http://localhost:3000
```

5. Войти:

```text
admin / admin123
```

6. Проверить страницы:

```text
/dashboard
/queue
/database
/analytics
/settings
/manual
```

---

# 14. Короткий вывод

Сейчас проект настроен на PostgreSQL.

Актуальные параметры:

```env
DB_ENGINE=postgres
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
POSTGRES_HOST_PORT=5433
```

Используйте правильный `DB_HOST`:

- `localhost` и `DB_PORT=5433` для локального Django;
- `postgres` и `DB_PORT=5432` для Docker Compose.
