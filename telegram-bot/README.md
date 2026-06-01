# Press AI Telegram Bot

Telegram-бот для импорта новостей в `RawNews` и подготовки коротких Telegram-постов в ручном режиме.

## Настройка

В `backend/.env` укажите токен Telegram-бота от BotFather:

```env
TELEGRAM_BOT_TOKEN=123456:telegram-token-from-botfather
TELEGRAM_BOT_INTERNAL_TOKEN=press-ai-telegram-internal-dev-token
TELEGRAM_EDITOR_ACCESS_TOKEN=press-ai-editor-dev-token
TELEGRAM_REVIEW_URL_TEMPLATE=http://localhost:3000/article/{id}/review
```

`TELEGRAM_BOT_INTERNAL_TOKEN` используется только для связи Node-бота с Django backend. `TELEGRAM_EDITOR_ACCESS_TOKEN` можно отправить боту для авторизации редактора без ввода Django-логина и пароля.

## Запуск

```bash
docker compose up telegram_bot
```

Если backend уже запущен, можно поднять только сервис бота.

## Команды

- `/start` — авторизация редактора.
- `/menu` — показать кнопочное меню.
- `/auth` — перейти в режим авторизации.
- `/help` — краткая справка.
- `/manual сырой текст` — подготовить короткий Telegram-пост с одним эмодзи.
- Любой обычный текст, пересланное сообщение или ссылка после авторизации — импортируется в `RawNews` со статусом `is_processed=False`.

## Меню

Бот показывает клавиатуру с кнопками:

- `📰 Импорт новости`
- `✍️ Manual post`
- `🔑 Авторизация`
- `ℹ️ Помощь`

## Очистка текста

При импорте бот и backend удаляют из тела новости рекламные хвосты:

- строки с `t.me`, `telegram.me`, URL и `@username`;
- строки с маркерами вроде `реклама`, `подписывайтесь`, `резервном канале`;
- строки, состоящие почти только из эмодзи или ссылочных символов.

Если Telegram присылает `text_link` или `url` entity, такой фрагмент удаляется из тела новости.

## Просмотры и реакции

Bot API обычно не отдаёт просмотры и реакции оригинального пересланного поста. Если эти поля всё же приходят в update, бот передаёт их в backend:

- `views_count` — просмотры;
- `likes_count` — сумма реакций;
- `comments_count` — комментарии, если доступны;
- `shares_count` — репосты, если доступны.

## Авторизация

После `/start` можно отправить один из вариантов:

```text
press-ai-editor-dev-token
```

или Django-логин и пароль редактора:

```text
admin admin123
```

## Уведомления

Django-сигнал отправляет авторизованным редакторам уведомление, если создана статья:

- `status = pending`
- `ai_score >= 8.5`

Сообщение содержит заголовок, AI Score, причину оценки и кнопку ревью.
