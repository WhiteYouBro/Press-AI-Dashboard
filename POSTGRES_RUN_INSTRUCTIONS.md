# Press AI Dashboard: PostgreSQL-интеграция и запуск

## 1. Текущий статус PostgreSQL

Проект настроен на полноценную работу с **PostgreSQL**.

Главный файл переменных окружения:

```text
backend/.env
```

Текущие параметры PostgreSQL:

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

Что это значит:

- внутри Docker backend подключается к PostgreSQL по адресу `postgres:5432`;
- с компьютера PostgreSQL доступен как `localhost:5433`;
- пользователь PostgreSQL: `postgres`;
- пароль PostgreSQL: `admin1235`;
- база данных: `press_ai_dashboard`.

---

## 2. Как AI берёт данные из PostgreSQL

AI-логика находится в backend:

```text
backend/articles/services.py
backend/articles/tasks.py
```

Она работает через Django ORM. Поэтому после переключения `DB_ENGINE=postgres` все данные для AI берутся из PostgreSQL:

- сырые новости;
- просмотры;
- CTR;
- shares;
- trending score;
- статьи в очереди;
- история запусков pipeline;
- настройки AI-пайплайна.

Celery worker и Celery beat используют те же Django settings, поэтому они тоже работают с PostgreSQL.

---

## 3. Что изменено для PostgreSQL

### `backend/.env`

Backend переключён с SQLite на PostgreSQL:

```env
DB_ENGINE=postgres
```

Заданы пользователь, пароль, база и порт:

```env
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
DB_HOST=postgres
DB_PORT=5432
POSTGRES_HOST_PORT=5433
```

### `docker-compose.yml`

Сервис `postgres` теперь получает переменные из `backend/.env`:

```yaml
postgres:
  image: postgres:15-alpine
  env_file: ./backend/.env
```

Порт PostgreSQL наружу проброшен на `5433`:

```yaml
ports:
  - "${POSTGRES_HOST_PORT:-5433}:5432"
```

Healthcheck проверяет именно базу и пользователя из env:

```yaml
pg_isready -U "$${POSTGRES_USER}" -d "$${POSTGRES_DB}"
```

### `backend/core/settings.py`

Django использует PostgreSQL-переменные:

```python
'ENGINE': 'django.db.backends.postgresql'
'NAME': env('DB_NAME', env('POSTGRES_DB'))
'USER': env('DB_USER', env('POSTGRES_USER'))
'PASSWORD': env('DB_PASSWORD', env('POSTGRES_PASSWORD'))
'HOST': env('DB_HOST', 'postgres')
'PORT': env('DB_PORT', '5432')
```

---

## 4. Рекомендуемый запуск через Docker Compose

Это основной способ запуска проекта.

Он поднимает:

- PostgreSQL;
- Redis;
- Django backend;
- Celery worker;
- Celery beat;
- Next.js frontend.

Frontend в Docker использует:

```text
node:22-alpine
pnpm@10.24.0
```

### 4.1. Запуск

Из корня проекта:

```powershell
cd d:\Work\Diploma\press-ai-dashboard
docker compose --env-file ./backend/.env up --build
```

Почему используется `--env-file ./backend/.env`:

- backend и postgres получают env через `env_file`;
- но переменная `POSTGRES_HOST_PORT` для проброса порта читается Docker Compose на этапе сборки config;
- поэтому для изменения внешнего порта через `.env` лучше всегда запускать с `--env-file ./backend/.env`.

### 4.2. Адреса после запуска

```text
Frontend:   http://localhost:3000
Backend:    http://localhost:8000
API:        http://localhost:8000/api/v1/
PostgreSQL: localhost:5433
Redis:      localhost:6379
```

---

## 5. Миграции и демо-данные

Backend entrypoint автоматически запускает миграции при старте backend-контейнера.

Celery worker и Celery beat миграции не запускают, чтобы не было конкурентного создания таблиц в PostgreSQL.

Но вручную можно выполнить так:

```powershell
docker compose exec backend python manage.py migrate
```

Создать демо-данные:

```powershell
docker compose exec backend python manage.py seed_data
```

Будут созданы пользователи:

```text
admin / admin123
editor1 / editor123
editor2 / editor123
```

И данные:

- 50 сырых новостей;
- 5 AI-статей в очереди.

---

## 6. Подключение к PostgreSQL вручную

С хост-машины:

```text
Host: localhost
Port: 5433
Database: press_ai_dashboard
User: postgres
Password: admin1235
```

Через `psql`:

```powershell
psql -h localhost -p 5433 -U postgres -d press_ai_dashboard
```

Через Docker:

```powershell
docker compose exec postgres psql -U postgres -d press_ai_dashboard
```

Проверить таблицы:

```sql
\dt
```

Ожидаемые таблицы:

```text
articles_article
articles_rawnews
articles_pipelinerun
auth_user
django_celery_results_taskresult
django_celery_beat_periodictask
```

---

## 7. Проверка, что Django реально использует PostgreSQL

Открыть Django shell:

```powershell
docker compose exec backend python manage.py shell
```

Выполнить:

```python
from django.conf import settings
settings.DATABASES['default']
```

Должно быть:

```python
{
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'press_ai_dashboard',
    'USER': 'postgres',
    'HOST': 'postgres',
    'PORT': '5432',
}
```

Если вместо этого видно:

```text
django.db.backends.sqlite3
```

значит в `backend/.env` снова установлен SQLite.

---

## 8. Локальный backend + PostgreSQL из Docker

Если нужно запускать Django локально на Windows, а PostgreSQL оставить в Docker, измените в `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5433
REDIS_URL=redis://localhost:6379/0
```

Остальные значения оставить:

```env
DB_ENGINE=postgres
DB_NAME=press_ai_dashboard
DB_USER=postgres
DB_PASSWORD=admin1235
```

Запустить только PostgreSQL и Redis:

```powershell
cd d:\Work\Diploma\press-ai-dashboard
docker compose --env-file ./backend/.env up postgres redis
```

Запустить backend локально:

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

Backend будет доступен:

```text
http://127.0.0.1:8000
```

---

## 9. Frontend локально

Из корня проекта:

```powershell
cd d:\Work\Diploma\press-ai-dashboard
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## 10. Celery

В Docker Celery запускается автоматически сервисами:

```text
celery_worker
celery_beat
```

Проверить логи:

```powershell
docker compose logs -f celery_worker
docker compose logs -f celery_beat
```

Если backend запускается локально, Celery тоже нужно запускать локально.

Worker:

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
.\.venv\Scripts\Activate.ps1
celery -A core worker -l info -Q default -c 4
```

Beat:

```powershell
cd d:\Work\Diploma\press-ai-dashboard\backend
.\.venv\Scripts\Activate.ps1
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## 11. Проверки

Проверить Docker Compose config:

```powershell
docker compose --env-file ./backend/.env config
```

Проверить backend:

```powershell
docker compose exec backend python manage.py check
```

Проверить API:

```text
http://localhost:8000/api/v1/news/
```

Проверить frontend TypeScript:

```powershell
npx --no-install tsc --noEmit
```

Собрать frontend:

```powershell
npm run build
```

---

## 12. Частые проблемы

### Порт 5433 занят

Измените в `backend/.env`:

```env
POSTGRES_HOST_PORT=5434
```

Запускайте так:

```powershell
docker compose --env-file ./backend/.env up --build
```

### Django из Docker не подключается к PostgreSQL

Для Docker должно быть:

```env
DB_HOST=postgres
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
```

### Django локально не подключается к PostgreSQL

Для локального Django должно быть:

```env
DB_HOST=localhost
DB_PORT=5433
REDIS_URL=redis://localhost:6379/0
```

### Нет данных в dashboard

Выполните:

```powershell
docker compose exec backend python manage.py seed_data
```

### Manual AI mode не работает

Проверьте:

- пользователь авторизован;
- Redis запущен;
- Celery worker запущен;
- `OPENAI_API_KEY` настоящий, а не `sk-change-me`.

---

## 13. Короткий сценарий запуска для демонстрации

```powershell
cd d:\Work\Diploma\press-ai-dashboard
docker compose --env-file ./backend/.env up --build
```

В новом терминале:

```powershell
docker compose exec backend python manage.py seed_data
```

Открыть:

```text
http://localhost:3000
```

Войти:

```text
admin / admin123
```

Проверить страницы:

```text
/dashboard
/queue
/database
/analytics
/settings
/manual
```
