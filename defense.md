# Конспект для защиты диплома
## «Ноль/Один» — AI-редакция: автоматизация новостного контент-менеджмента с использованием LLM

---

## 1. Общая характеристика проекта

### 1.1. Тема
**«Разработка веб-приложения для автоматизации редакционной обработки новостного контента с применением больших языковых моделей»**

### 1.2. Актуальность (почему это важно)
- Редакции тратят до 60% времени на рутину: переписывание пресс-релизов, подбор заголовков, SEO-оптимизацию.
- LLM (GPT, Llama, Groq) достигли уровня, когда могут генерировать профессиональный журналистский текст.
- Нет готовых открытых решений, которые объединяют: **парсинг → ранжирование → генерацию → редакторский контроль → публикацию**.
- Проект закрывает именно эту нишу — end-to-end AI-редакция.

### 1.3. Цель
Создать программный комплекс, который автоматизирует сбор, отбор и редакционную обработку новостного контента с человеком в контуре управления (human-in-the-loop).

### 1.4. Задачи
1. Разработать парсер новостей из внешних источников.
2. Реализовать алгоритм ранжирования сырого контента по CTR, просмотрам, трендам.
3. Интегрировать LLM API для генерации статей (заголовки, лид, SEO, редакторские подсказки).
4. Разработать веб-интерфейс для редакторского контроля (очередь, ревью, аналитика).
5. Реализовать ручной режим подачи материалов в AI-обработку.
6. Построить систему аналитики (CTR, AI score, время публикации).

---

## 2. Технологический стек: зачем именно эти технологии

### 2.1. Frontend — Next.js 16 + React 19 + TypeScript

**Почему Next.js (App Router), а не чистый React/Vue:**
- **App Router** — современная модель маршрутизации от Next.js, встроенные layout'ы, loading-состояния, error boundaries. Это уменьшает boilerplate-код.
- **Server Components** — часть страниц (landing) рендерится на сервере, что улучшает SEO и First Contentful Paint.
- **Client Components** ('use client') используются только там, где нужен интерактив (формы, редактор, real-time статус).
- **TypeScript** — строгая типизация предотвращает runtime-ошибки на этапе компиляции. Критично для дипломного проекта, где стабильность важнее скорости разработки.

**Почему React 19:**
- Новейшая версия с улучшенным concurrent rendering, оптимизированным re-rendering'ом компонентов.
- Лучшая производительность форм и интерактивных элементов.

**Почему Tailwind CSS 4:**
- Utility-first подход: стили пишутся прямо в className, нет проблемы «где искать CSS».
- CSS-переменные (design tokens) для единообразия: `bg-surface`, `text-blood`, `border-line`.
- JIT-компилятор генерирует только используемые стили — минимальный bundle.

**Почему Radix UI:**
- Низкоуровневые доступные примитивы (Tabs, Switch, Dialog, Slider).
- Полная поддержка клавиатурной навигации и ARIA-атрибутов «из коробки».
- Мы не изобретаем велосипед, а стилизуем проверенные компоненты.

**Почему Lucide icons:**
- Единый набор иконок, tree-shakeable (в bundle попадают только используемые).
- Консистентный визуальный язык для всего интерфейса.

### 2.2. Backend — Python + Django + Django REST Framework

**Почему Django, а не FastAPI/Express:**
- **ORM из коробки** — модели, миграции, связи, индексы без ручного SQL.
- **Admin-панель** — для отладки и демонстрации на защите можно показать данные в `/admin`.
- **Аутентификация** — готовая система пользователей, сессий, токенов (DRF TokenAuthentication).
- **Celery-интеграция** — Django + Celery — де-факто стандарт для фоновых задач в Python.

**Почему Django REST Framework (DRF):**
- `ModelViewSet` — CRUD API за 5 строк кода.
- Сериализаторы — валидация и преобразование данных (model → JSON → model).
- Permissions (`IsAuthenticated`, `AllowAny`) — гибкое управление доступом к эндпоинтам.
- Роутер — автоматическая генерация URL-маршрутов.

### 2.3. Очередь задач — Celery + django-celery-beat

**Зачем Celery:**
- AI-пайплайн — длительная операция (5–30 секунд на статью, сотни новостей).
- Нельзя блокировать HTTP-запрос на это время — иначе клиент получит timeout.
- Celery запускает задачи в отдельных worker-процессах асинхронно.

**Зачем django-celery-beat:**
- Периодические задачи без cron: «запускай пайплайн каждые N минут».
- Настройки хранятся в БД, а не в системных файлах — удобнее для демонстрации.

### 2.4. База данных — PostgreSQL

**Почему PostgreSQL:**
- Надёжная реляционная БД с поддержкой JSON-полей (`JSONTextField` для tags, hints).
- Django ORM оптимизирован именно под PostgreSQL.
- Индексы на часто используемые поля (`status`, `ctr`, `created_at`) — критично для скорости очереди и аналитики.

### 2.5. LLM-интеграция — OpenAI API + Groq

**Почему OpenAI / Groq:**
- OpenAI — наиболее качественные модели (GPT-4o) для генерации русскоязычного текста.
- Groq — быстрый и дешёвый inference (до 1000 токенов/сек) для демонстраций и тестов.
- Реализован fallback: если нет Groq-ключа → OpenAI → ошибка с понятным сообщением.
- Используется `response_format={'type': 'json_object'}` — модель гарантированно возвращает JSON, который парсится в структурированные данные.

---

## 3. Архитектура системы

```
┌─────────────┐     HTTP      ┌─────────────────────────────────────────┐
│  Пользователь│ ────────────→ │  Next.js 16 (Frontend)                │
│  (Редактор) │               │  app/ + components/ + lib/api.ts       │
└─────────────┘               └──────────────────┬──────────────────────┘
                                                │ fetch/axios
                                                ↓
                              ┌─────────────────────────────────────────┐
                              │  Django + DRF (Backend)               │
                              │  /api/v1/ — REST API                  │
                              │  Views: RawNews, Article, Pipeline,     │
                              │  Analytics, Manual, Auth                │
                              └──────────────────┬──────────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ↓                           ↓                           ↓
              ┌─────────┐              ┌─────────────────┐          ┌──────────────┐
              │PostgreSQL│              │  Celery Workers │          │ OpenAI / Groq│
              │(данные)  │              │  (фоновые задачи)│          │  (LLM API)   │
              └─────────┘              └─────────────────┘          └──────────────┘
                    │                           │                           ↑
                    │                           │                           │
                    └───────────────────────────┴───────────────────────────┘
                                                │
                              ┌─────────────────┘
                              ↓
                        ┌─────────────┐
                        │ RSS / HTTP  │
                        │ (источники) │
                        └─────────────┘
```

### 3.1. Трёхуровневая архитектура
1. **Presentation Layer** — Next.js отвечает за UI, маршрутизацию, SSR/CSR, дизайн.
2. **Business Logic Layer** — Django Views/DRF обрабатывают бизнес-логику: ранжирование, вызов LLM, статусы, аналитику.
3. **Data Access Layer** — Django ORM + PostgreSQL. Celery работает как отдельный сервис- слой для асинхронных операций.

---

## 4. База данных (модели)

### 4.1. RawNews (сырые новости от парсера)
| Поле | Тип | Зачем |
|------|-----|-------|
| title | CharField(500) | Заголовок источника |
| body | TextField | Полный текст новости |
| source_url | URLField | Ссылка на оригинал |
| source_name | CharField(200) | Название источника |
| rubric | CharField(choices) | Рубрика (Политика, Экономика...) |
| views_count | IntegerField | Просмотры — фактор ранжирования |
| ctr | FloatField | Click-Through Rate — главный фактор |
| shares_count | IntegerField | Репосты — вирусность |
| trending_score | FloatField | Трендовость темы |
| published_at | DateTimeField | Дата публикации в источнике |
| fetched_at | DateTimeField(auto_now_add) | Когда спарсили |
| is_processed | BooleanField | Обработана ли AI-пайплайном |

**Индексы:**
- `(is_processed, -ctr)` — быстрый отбор необработанных топовых новостей.
- `(rubric, -views_count)` — фильтрация по рубрике.

### 4.2. Article (готовая статья после AI)
| Поле | Тип | Зачем |
|------|-----|-------|
| raw_news | FK → RawNews (nullable) | Связь с исходником (если была) |
| source_type | CharField(choices) | «ai_pipeline» или «manual» |
| title | CharField(500) | Главный заголовок |
| seo_title | CharField(70) | SEO-заголовок для `<title>` |
| seo_description | CharField(160) | Meta-description |
| lead | TextField | Лид — первый абзац |
| body | TextField | Полный текст с HTML-разметкой |
| rubric | CharField | Рубрика статьи |
| tags | JSONField | Теги (список строк) |
| editor_hints | JSONField | Подсказки редактору (фото, цитата, данные) |
| title_variants | JSONField | Альтернативные заголовки |
| ai_score | FloatField | Оценка 0–10 (CTR + просмотры + тренд) |
| ai_score_reason | TextField | Обоснование оценки |
| status | CharField(choices) | pending → approved → published / rejected |
| reviewed_by | FK → User | Кто проверил |
| review_note | TextField | Причина отклонения |
| created_at / updated_at / approved_at | DateTimeField | Аудит времени |

**Индексы:**
- `(status, -created_at)` — быстрая загрузка очереди.
- `(source_type, status)` — аналитика по источникам.

### 4.3. PipelineRun (запуск AI-пайплайна)
| Поле | Зачем |
|------|-------|
| started_at / finished_at | Время работы |
| news_analyzed / news_selected / articles_created | Метрики запуска |
| status | running / done / failed |
| error_message | Лог ошибки |
| log_entries | JSON-массив шагов (иконка + текст + время) |
| next_run_at | Когда следующий запуск |

### 4.4. PromptHistory (аудит LLM-вызовов)
| Поле | Зачем |
|------|-------|
| article | FK — к какой статье |
| prompt_type | Тип промпта (rewrite, manual) |
| prompt_text / response_text | Что отправили и что получили |
| tokens_used / duration_ms | Стоимость и производительность |

**Зачем это нужно:**
- Аудит: можно воспроизвести, почему статья получилась именно такой.
- Оптимизация: анализируем токены и время для выбора модели/провайдера.
- Отладка на защите: показываем реальный промпт и ответ LLM.

---

## 5. Backend: детальное описание

### 5.1. API Endpoints (urls.py)

| Endpoint | Метод | Зачем |
|----------|-------|-------|
| `/api/v1/news/` | GET, POST | CRUD сырых новостей (парсер пишет сюда) |
| `/api/v1/queue/` | GET | Список статей в очереди |
| `/api/v1/queue/<id>/` | GET | Детальная карточка статьи для ревью |
| `/api/v1/queue/<id>/approve/` | POST | Одобрить статью |
| `/api/v1/queue/<id>/reject/` | POST | Отклонить с причиной |
| `/api/v1/ai/pipeline/run/` | POST | Запустить AI-пайплайн (Celery task) |
| `/api/v1/ai/pipeline/status/` | GET | Статус последнего запуска |
| `/api/v1/ai/pipeline/history/` | GET | История запусков |
| `/api/v1/ai/manual/` | POST | Ручная отправка текста в AI |
| `/api/v1/ai/manual/<task_id>/` | GET | Статус обработки ручного ввода |
| `/api/v1/analytics/overview/` | GET | Общая сводка (CTR, score, published) |
| `/api/v1/analytics/ctr/` | GET | CTR по рубрикам |
| `/api/v1/analytics/ai_accuracy/` | GET | Корреляция AI score и CTR |
| `/api/v1/settings/` | GET, PUT | Настройки пайплайна |
| `/api/v1/auth/login/` | POST | Получить токен |
| `/api/v1/auth/logout/` | POST | Удалить токен |
| `/api/v1/auth/me/` | GET | Текущий пользователь |

### 5.2. Права доступа
- `AllowAny` — landing-статистика, статус пайплайна (можно показать без входа).
- `IsAuthenticated` — одобрение, отклонение, ручной запуск, настройки.
- DRF TokenAuthentication: клиент передаёт `Authorization: Token <key>` в заголовке.

### 5.3. AI Pipeline (tasks.py) — самое важное!

**Алгоритм `run_ai_pipeline` (шаг за шагом):**

1. **Создаёт PipelineRun** со статусом `running`.
2. **Собирает новости** за последние 24 часа: `RawNews.objects.filter(is_processed=False)`.
3. **Ранжирует** через `services.rank_news()`:
   ```
   score = CTR * w_ctr + normalize(views) * w_views + normalize(shares) * w_shares + trending * w_trending
   ```
   Это взвешенная сумма. Зачем? CTR — лучший предиктор интереса аудитории, но нужно учитывать масштаб (просмотры) и актуальность (тренд).
4. **Отбирает топ-N** (`AI_TOP_NEWS_COUNT`, по умолчанию 5–10).
5. **Для каждой новости:**
   - Формирует промпт (`_rewrite_prompt`) — системный + пользовательский.
   - Зовёт LLM (`_call_llm_with_meta`) с `response_format='json_object'`.
   - Парсит JSON (`parse_llm_json`) — валидация обязательных полей.
   - Создаёт `Article` с `status='pending'`.
   - Помечает `RawNews.is_processed = True`.
   - Логирует шаг в `PipelineRun.log_entries`.
6. **Завершает PipelineRun**: статус `done`, время finish, счётчики.

**Зачем `response_format='json_object'`:**
- Гарантирует, что LLM вернёт валидный JSON, а не markdown с текстом.
- Упрощает парсинг — не нужны сложные regex для извлечения данных.

**Зачем `parse_llm_json` с fallback:**
- LLM иногда оборачивает JSON в markdown-фенс (```json ... ```).
- Функция чистит фенсы, ищет первый `{}`, валидирует обязательные поля.
- Если полей не хватает — выбрасывает `ParseError`, пайплайн логирует ошибку и идёт дальше.

### 5.4. Ручной режим (ManualProcessView)

**Сценарий:** редактор вставляет свой текст (пресс-релиз, черновик, набор фактов).

1. Валидация через `ManualInputSerializer` (raw_text + rubric + optional URL).
2. Создание Celery-задачи `process_manual_article.delay(...)`.
3. Возврат `task_id` — клиент начинает polling на `/ai/manual/<task_id>/`.
4. Worker вызывает `services.process_manual()` → LLM → создание Article.
5. Клиент получает `status: 'done'` и данные статьи.

**Зачем Celery здесь:**
- LLM-вызов занимает 5–15 секунд. Без Celery HTTP-запрос зависнет и прервётся по таймауту.
- Polling-паттерн (`pending` → `processing` → `done`) — стандарт для long-running операций в вебе.

### 5.5. Промпт-инжиниринг (services.py)

**Системный промпт (SYSTEM_PROMPT):**
```
Ты — опытный редактор... Не выдумывай факты... Всегда отвечай только валидным JSON-объектом...
```

**Зачем такой длинный системный промпт:**
- Устанавливает роль (role-prompting): «ты редактор» повышает качество текста.
- Запрет на галлюцинации: критично для новостей, где факты важнее стиля.
- Жёсткий формат вывода — без markdown, только JSON.

**Пользовательский промпт (`_rewrite_prompt`):**
- Содержит рубрику, заголовок источника, исходный текст.
- Включает JSON-схему с примерами — это few-shot prompting, улучшает структуру ответа.
- Поля: title, title_variants, seo_title, seo_description, lead, body, tags, ai_score, ai_score_reason, editor_hints.

**Зачем `editor_hints`:**
- AI не только пишет текст, но и «думает» как редактор: где нужна фотография, где — цитата, где — инфографика.
- Это human-in-the-loop: редактор видит подсказки и принимает решения.

### 5.6. Ранжирование (`rank_news`)

```python
def rank_news(news_list):
    max_views = max(item.views_count for item in news)
    max_shares = max(item.shares_count for item in news)
    for item in news:
        score = (
            item.ctr * weights['ctr'] +
            normalize(item.views_count, max_views) * weights['views'] +
            normalize(item.shares_count, max_shares) * weights['shares'] +
            item.trending_score * weights['trending']
        )
    return sorted(ranked, reverse=True)
```

**Зачем normalize:**
- Views и shares имеют разный масштаб (тысячи vs десятки). Нормализация приводит к диапазону [0,1], чтобы веса работали корректно.
- CTR уже в [0,1] (0–100%), поэтому нормализация не нужна.

**Веса настраиваемые** (`AI_RANKING_WEIGHTS` в `.env`):
- Можно поднять вес CTR для коммерческих новостей или trending для вирусного контента.

### 5.7. AI Score (`calculate_ai_score`)

```python
def calculate_ai_score(raw_news):
    ctr_score = min(raw_news.ctr / 0.08, 1.0) * 5   # 5 баллов за CTR
    views_score = min(raw_news.views_count / 500000, 1.0) * 3  # 3 балла за охват
    trending_score = min(raw_news.trending_score, 1.0) * 2   # 2 балла за тренд
    return round(ctr_score + views_score + trending_score, 1)
```

**Зачем 0–10:**
- Интуитивно понятная шкала для редактора (как в школе).
- 8+ — топовый материал, 5–6 — средний, <4 — слабый.

**Зачем пороги (0.08, 500000):**
- 8% CTR — хороший показатель для новостей.
- 500k просмотров — верхняя граница для нормализации.

---

## 6. Frontend: детальное описание

### 6.1. Структура маршрутов (Next.js App Router)

| Путь | Назначение | Рендеринг |
|------|-----------|-----------|
| `/` | Landing page — продажа продукта | SSR |
| `/login` | Форма входа | CSR ('use client') |
| `/dashboard` | Главная панель: метрики + очередь + лог | CSR |
| `/queue` | Список статей на проверку | CSR |
| `/database` | База всех материалов (фильтры, сортировка) | CSR |
| `/analytics` | Графики CTR, AI score, эффективность | CSR |
| `/article/[id]/review` | Редакционная проверка статьи | CSR |
| `/manual` | Ручной ввод текста для AI | CSR |
| `/settings` | Настройки пайплайна | CSR |

**Зачем `(app)` group layout:**
- Все защищённые маршруты обёрнуты в единый layout с Sidebar + Topbar.
- Landing и Login — отдельные layout'ы без навигации.

### 6.2. Компонентная архитектура

**Слои (сверху вниз):**

1. **App-компоненты** (`components/app/`):
   - `sidebar.tsx` — навигация по разделам, бренд «Ноль/Один», live-индикатор AI.
   - `topbar.tsx` — статус пайплайна (пульсирующий индикатор), кнопка «Написать».
   - `queue-card.tsx` — карточка статьи в очереди (заголовок, лид, AI score, CTR).
   - `stats-card.tsx` — метрика с дельтой (число + подпись + иконка).
   - `pipeline-log.tsx` — лентa событий пайплайна с иконками и временем.
   - `ai-score-badge.tsx` — цветной бейдж оценки (красный/жёлтый/зелёный).
   - `editor-hint.tsx` — карточка подсказки (фото/цитата/данные).
   - `article-actions.tsx` — кнопки «Одобрить / Редактировать / Отклонить».

2. **UI-компоненты** (`components/ui/`):
   - Базовые примитивы: `Card`, `Button`, `Input`, `Textarea`, `Badge`, `Tabs`, `Slider`.
   - Построены на Radix UI — доступность «из коробки».
   - Стилизованы Tailwind с design tokens.

3. **Landing-компоненты** (`components/landing/`):
   - `landing-header.tsx` — шапка с навигацией и CTA.
   - `landing-footer.tsx` — футер с контактами.
   - `news-improver-demo.tsx` — интерактивное демо «черновик → AI-версия».

### 6.3. Дизайн-система (Design Tokens)

**Шрифты:**
- **Syne** — заголовки, UI-текст. Геометрический гротеск, современный, читаемый.
- **Cormorant Garamond** — serif для акцентных текстов, придаёт редакционность.
- **JetBrains Mono** — метрики, код, timestamp'ы. Моноширинный для выравнивания чисел.

**Цветовая палитра (монохром + акцент крови):**
- `background` — фон страницы (около белого).
- `surface` — карточки, панели.
- `surface-2` — hover, subtle-фоны.
- `foreground` — основной текст.
- `muted-text` — вторичный текст, подписи.
- `blood` — акцент (#b91c1c). Зачем красный? Журналистика = срочность, важность, новость.
- `line` — границы, разделители.

**Зачем tokens, а не хардкод:**
- Единообразие: `text-muted-text` везде одинаковый оттенок.
- Темизация: при смене темы меняются только CSS-переменные.
- Поддержка: изменил в `globals.css` — применилось везде.

### 6.4. API-клиент (`lib/api.ts`)

**Зачем отдельный слой:**
- Централизованная обработка ошибок (401 → редирект на login).
- Единый base URL (`http://localhost:6345/api/v1/`).
- Автоматическое добавление `Authorization: Token <localStorage token>`.
- Типизация: каждая функция возвращает строго типизированный объект.

**Ключевые функции:**
- `getArticleQueue()`, `getArticleDetail(id)` — загрузка данных.
- `approveArticle(id)`, `rejectArticle(id, reason)` — редакторские действия.
- `processManualArticle()`, `getManualArticleStatus(taskId)` — polling ручного режима.
- `login()`, `logout()` — работа с токеном в localStorage.

**Зачем `browserApiFetch` vs `apiFetch`:**
- `apiFetch` — серверный fetch (для SSR, если нужен).
- `browserApiFetch` — клиентский fetch с `localStorage.getItem('access_token')`.

---

## 7. AI-конвейер: полный путь данных

### 7.1. Автоматический режим

```
[RSS / Источники] → [Парсер] → PostgreSQL (RawNews)
                                                      ↓
[Celery Beat] → [run_ai_pipeline] → Собрать новости за 24ч
                                                        ↓
                              [rank_news] → Взвешенный score
                                                        ↓
                              Отобрать TOP-N → Для каждой:
                                                        ↓
                              Сформировать промпт → Вызвать LLM
                                                        ↓
                              Парсинг JSON → Создать Article
                                                        ↓
                              PostgreSQL (Article, status='pending')
                                                        ↓
[Редактор] ← [Frontend /queue] ← [Backend /api/v1/queue]
                                                        ↓
                              [Ревью: approve / reject / edit]
                                                        ↓
                              PostgreSQL (status='approved'/'published')
```

### 7.2. Ручной режим

```
[Редактор вставляет текст] → [Frontend /manual]
                                                        ↓
                              POST /api/v1/ai/manual/ → Celery task
                                                        ↓
                              [Polling каждые 2 сек] → GET /ai/manual/<task_id>/
                                                        ↓
                              Status: pending → processing → done
                                                        ↓
                              [Frontend показывает Article] → Редактор решает
```

---

## 8. Безопасность и авторизация

### 8.1. Token Authentication (DRF)
- После логина backend выдаёт токен (`Token.objects.get_or_create`).
- Клиент хранит в `localStorage` и передаёт в заголовке `Authorization: Token <key>`.
- При logout токен удаляется из БД и localStorage.

**Зачем не JWT:**
- JWT требует настройки refresh-токенов, blacklists. Для дипломного проекта — избыточно.
- DRF Token — простой, понятный, надёжный.

### 8.2. CORS
- Django-cors-headers разрешает запросы с фронтенда (`localhost:1903`).
- В production указывается точный домен.

### 8.3. Защита от SQL-инъекций
- Django ORM использует параметризованные запросы — SQL-инъекции невозможны.

### 8.4. Защита от XSS
- React автоматически экранирует текст при рендеринге (не `dangerouslySetInnerHTML` для user input).
- LLM-ответы парсятся как JSON, а не как HTML.

---

## 9. Почему выбран именно такой UX/UI

### 9.1. Принцип «инструмент должен исчезнуть в задаче»
- Минималистичный интерфейс без лишних элементов.
- Вся навигация — в sidebar, всё остальное — пространство для контента.
- Монохромная палитра с одним акцентом — не отвлекает от текста.

### 9.2. Системные шрифты + акцентные
- Syne для UI — современный, нейтральный.
- Cormorant Garamond для заголовков — придаёт «газетный» характер.
- JetBrains Mono для чисел — табличные цифры выстраиваются в ровные колонки.

### 9.3. Информативный статус
- Пульсирующий индикатор в topbar показывает, работает ли AI.
- Pipeline log — прозрачность: редактор видит, что делает система.
- AI score + reason — не просто число, а обоснование.

### 9.4. Human-in-the-loop
- AI генерирует, но не публикует. Редактор всегда контролирует.
- Редакторские подсказки (`editor_hints`) — AI подсказывает, что улучшить.
- Варианты заголовков — редактор выбирает лучший.

---

## 10. Вопросы на защите и ответы

### Q1: Почему именно LLM, а не шаблоны / rule-based система?
**A:** Шаблоны дают однообразный текст без адаптации под контекст. LLM понимает смысл, генерирует уникальный текст, создаёт лиды, SEO-мета, подсказки. Rule-based не справится с разнообразием источников.

### Q2: Как вы боретесь с галлюцинациями LLM?
**A:** Три уровня защиты:
1. Промпт явно запрещает выдумывать факты.
2. Human-in-the-loop: редактор проверяет перед публикацией.
3. `editor_hints` указывают, где проверить цитаты/данные.

### Q3: Почему CTR — главный фактор ранжирования?
**A:** CTR (click-through rate) — прямая метрика интереса аудитории. Если заголовок набирает высокий CTR, значит тема резонансная. Мы нормализуем views/shares, чтобы маленькие источники тоже имели шанс попасть в топ.

### Q4: Как масштабируется система?
**A:** Горизонтально:
- Добавляем Celery workers — больше параллельных LLM-вызовов.
- PostgreSQL replica — чтение аналитики и очереди с реплики.
- LLM: переход на batch API или собственный inference (Llama self-hosted).

### Q5: Что будет, если LLM API недоступен?
**A:** Реализован fallback на `_generate_mock_article_data` (заглушка с базовым текстом) + понятное сообщение пользователю. Пайплайн не падает, а логирует ошибку и продолжает работу.

### Q6: Почему Next.js, а не Vue или Angular?
**A:**
- SSR из коробки — важен для SEO landing page.
- App Router — современный стандарт, меньше boilerplate.
- React — самая востребованная экосистема, легче найти компоненты (Radix, Lucide).

### Q7: Как устроена аналитика?
**A:** Три эндпоинта:
1. `overview` — сводка: pending, approved today, avg CTR, avg AI score, rejection rate, avg time to publish.
2. `ctr` — CTR по рубрикам (`GROUP BY rubric, AVG(ctr)`).
3. `ai_accuracy` — корреляция AI score и source CTR: проверяем, хорошо ли AI предсказывает успех.

### Q8: Как реализован polling статуса ручного ввода?
**A:** Frontend делает `setInterval` → GET `/ai/manual/<task_id>/` каждые 2 секунды. Backend возвращает `pending` / `processing` / `done` / `failed`. Как только `done` — показываем статью.

### Q9: Зачем JSONField для tags и hints?
**A:** Это массивы строк и объектов, структура которых не требует реляционных связей. JSONField в PostgreSQL хранит их эффективно, а Django ORM сериализует автоматически.

### Q10: Какой у вас CI/CD или деплой?
**A:** В рамках дипломного проекта деплой локальный (localhost). Для production: Docker Compose (Next.js + Django + PostgreSQL + Redis + Celery) или Kubernetes для масштабирования.

---

## 11. Что можно улучшить (для развития)

1. **Интеграция с реальными RSS-источниками** — сейчас данные подаются вручную или через `bulk_create`.
2. **Веб-сокеты** — заменить polling на WebSocket для real-time статуса пайплайна.
3. **Версионирование статей** — хранить историю редактур (diff'ы).
4. **A/B тестирование заголовков** — показывать разные title_variants разным сегментам аудитории.
5. **Собственная LLM** — fine-tune Llama на корпусе редакции для уникального стиля.
6. **Полнотекстовый поиск** — PostgreSQL `tsvector` или Elasticsearch для поиска по архиву.

---

*Файл подготовлен для устной защиты диплома. Рекомендуется:
1. Прочитать целиком 2–3 раза.
2. Открыть код параллельно и находить упомянутые файлы.
3. Потренироваться объяснять схему данных и пайплайн на листке бумаги.*
