import TelegramBot from 'node-telegram-bot-api'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const INTERNAL_TOKEN = process.env.TELEGRAM_BOT_INTERNAL_TOKEN
const BACKEND_URL = normalizeBackendUrl(process.env.BACKEND_URL || 'http://backend:8000/api/v1')
const DEFAULT_RUBRIC = process.env.TELEGRAM_DEFAULT_RUBRIC || 'Общество'

const AUTH_LABEL = '🔑 Авторизация'
const IMPORT_LABEL = '📰 Импорт новости'
const MANUAL_LABEL = '✍️ Manual post'
const HELP_LABEL = 'ℹ️ Помощь'
const MENU_KEYBOARD = {
  keyboard: [
    [IMPORT_LABEL, MANUAL_LABEL],
    [AUTH_LABEL, HELP_LABEL],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
  input_field_placeholder: 'Перешлите новость или выберите действие',
}

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required')
}

if (!INTERNAL_TOKEN) {
  throw new Error('TELEGRAM_BOT_INTERNAL_TOKEN is required')
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const sessions = new Map()

bot.onText(/^\/start$/, async (message) => {
  sessions.set(message.chat.id, { mode: 'auth' })
  await sendWelcome(message.chat.id)
})

bot.onText(/^\/menu$/, async (message) => {
  await sendMenu(message.chat.id)
})

bot.onText(/^\/help$/, async (message) => {
  await sendHelp(message.chat.id)
})

bot.onText(/^\/auth$/, async (message) => {
  sessions.set(message.chat.id, { mode: 'auth' })
  await sendAuthPrompt(message.chat.id)
})

bot.onText(/^\/manual(?:\s+([\s\S]+))?$/, async (message, match) => {
  const chatId = message.chat.id
  const rawText = cleanTelegramText(match?.[1] || '', [])

  if (!rawText) {
    sessions.set(chatId, { mode: 'manual' })
    await bot.sendMessage(chatId, '✍️ Отправьте сырой текст следующим сообщением — я сделаю аккуратный Telegram-пост с одним эмодзи.', {
      reply_markup: MENU_KEYBOARD,
    })
    return
  }

  await handleManual(chatId, rawText)
})

bot.on('message', async (message) => {
  const chatId = message.chat.id
  const rawText = getMessageText(message)
  const cleanText = getCleanMessageText(message)

  if (!rawText || rawText.startsWith('/start') || rawText.startsWith('/menu') || rawText.startsWith('/help') || rawText.startsWith('/auth') || rawText.startsWith('/manual')) {
    return
  }

  if (rawText === AUTH_LABEL) {
    sessions.set(chatId, { mode: 'auth' })
    await sendAuthPrompt(chatId)
    return
  }

  if (rawText === IMPORT_LABEL) {
    await bot.sendMessage(chatId, '📰 Перешлите сообщение из Telegram-канала или отправьте текст новости. Я очищу рекламу и добавлю материал в RawNews.', {
      reply_markup: MENU_KEYBOARD,
      disable_web_page_preview: true,
    })
    return
  }

  if (rawText === MANUAL_LABEL) {
    sessions.set(chatId, { mode: 'manual' })
    await bot.sendMessage(chatId, '✍️ Отправьте сырой текст — подготовлю короткий пост с одним уместным эмодзи.', {
      reply_markup: MENU_KEYBOARD,
    })
    return
  }

  if (rawText === HELP_LABEL) {
    await sendHelp(chatId)
    return
  }

  const session = sessions.get(chatId)
  if (session?.mode === 'auth') {
    await handleAuth(message, rawText)
    return
  }

  if (session?.mode === 'manual') {
    sessions.delete(chatId)
    await handleManual(chatId, cleanText)
    return
  }

  await handleImport(message, cleanText)
})

async function sendWelcome(chatId) {
  await bot.sendMessage(
    chatId,
    [
      '👋 Press AI Bot готов к работе.',
      '',
      '🔑 Для начала авторизуйтесь: отправьте токен доступа или Django-логин и пароль.',
      '',
      'После авторизации можно пересылать посты из каналов, отправлять текстовые заметки или ссылки — я добавлю их в RawNews.',
    ].join('\n'),
    { reply_markup: MENU_KEYBOARD, disable_web_page_preview: true },
  )
  await sendAuthPrompt(chatId)
}

async function sendMenu(chatId) {
  await bot.sendMessage(chatId, '📌 Выберите действие:', {
    reply_markup: MENU_KEYBOARD,
    disable_web_page_preview: true,
  })
}

async function sendHelp(chatId) {
  await bot.sendMessage(
    chatId,
    [
      'ℹ️ Что я умею:',
      '',
      '📰 Импорт новости — перешлите пост или отправьте текст, я очищу рекламу и сохраню RawNews.',
      '✍️ Manual post — сделаю короткий Telegram-пост с одним эмодзи.',
      '🔑 Авторизация — токен доступа или `admin admin123`.',
      '',
      '👁 Просмотры и реакции сохраняются, если Telegram передал их в update. Обычно Bot API не отдаёт метрики оригинального пересланного поста.',
    ].join('\n'),
    { parse_mode: 'Markdown', reply_markup: MENU_KEYBOARD, disable_web_page_preview: true },
  )
}

async function sendAuthPrompt(chatId) {
  await bot.sendMessage(
    chatId,
    [
      '🔑 Авторизация редактора',
      '',
      'Отправьте токен доступа:',
      '`press-ai-editor-dev-token`',
      '',
      'или Django-логин и пароль:',
      '`admin admin123`',
    ].join('\n'),
    { parse_mode: 'Markdown', reply_markup: MENU_KEYBOARD },
  )
}

async function handleAuth(message, text) {
  const chatId = message.chat.id
  const profile = getTelegramProfile(message)
  const parts = text.split(/\s+/).filter(Boolean)
  const payload = {
    chat_id: chatId,
    username: profile.username,
    first_name: profile.firstName,
    last_name: profile.lastName,
  }

  if (parts.length >= 2) {
    payload.django_username = parts[0]
    payload.password = parts.slice(1).join(' ')
  } else {
    payload.access_token = text.trim()
  }

  try {
    const result = await apiPost('/telegram/auth/', payload)
    sessions.delete(chatId)
    await bot.sendMessage(
      chatId,
      `✅ Авторизация успешна. Чат #${result.editor.chat_id} подключён к редакции.`,
      { reply_markup: MENU_KEYBOARD },
    )
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Авторизация не прошла: ${error.message}`, {
      reply_markup: MENU_KEYBOARD,
    })
  }
}

async function handleImport(message, text) {
  const chatId = message.chat.id
  const source = getSourceInfo(message)
  const metrics = getMessageMetrics(message)
  if (!metrics.viewsCount && source.url) {
    metrics.viewsCount = await fetchTelegramPublicViews(source.url)
  }

  if (!text) {
    await bot.sendMessage(chatId, '⚠️ Не нашёл полезный текст после очистки рекламы и ссылок. Пришлите текст новости ещё раз.', {
      reply_markup: MENU_KEYBOARD,
      disable_web_page_preview: true,
    })
    return
  }

  try {
    const result = await apiPost('/telegram/import/', {
      chat_id: chatId,
      text,
      source_name: source.name,
      source_url: source.url,
      rubric: DEFAULT_RUBRIC,
      views_count: metrics.viewsCount,
      likes_count: metrics.likesCount,
      comments_count: metrics.commentsCount,
      shares_count: metrics.sharesCount,
    })
    await bot.sendMessage(
      chatId,
      [
        `✅ Новость добавлена в RawNews #${result.raw_news.id}`,
        `📰 ${result.raw_news.title}`,
        '',
        `👁 ${result.raw_news.views_count} просмотров · ❤️ ${result.raw_news.likes_count} реакций`,
      ].join('\n'),
      { reply_markup: MENU_KEYBOARD, disable_web_page_preview: true },
    )
  } catch (error) {
    if (error.status === 403) {
      sessions.set(chatId, { mode: 'auth' })
      await bot.sendMessage(chatId, '🔑 Сначала авторизуйтесь через /start или отправьте токен доступа.', {
        reply_markup: MENU_KEYBOARD,
      })
      return
    }
    await bot.sendMessage(chatId, `❌ Не удалось импортировать новость: ${error.message}`, {
      reply_markup: MENU_KEYBOARD,
    })
  }
}

async function handleManual(chatId, rawText) {
  if (!rawText) {
    await bot.sendMessage(chatId, '⚠️ После очистки не осталось текста. Пришлите материал без рекламных ссылок.', {
      reply_markup: MENU_KEYBOARD,
    })
    return
  }

  try {
    const result = await apiPost('/telegram/manual-post/', {
      chat_id: chatId,
      raw_text: rawText,
    })
    await bot.sendMessage(chatId, `${result.emoji} ${result.text}`, {
      reply_markup: MENU_KEYBOARD,
      disable_web_page_preview: true,
    })
  } catch (error) {
    if (error.status === 403) {
      sessions.set(chatId, { mode: 'auth' })
      await bot.sendMessage(chatId, '🔑 Сначала авторизуйтесь через /start или отправьте токен доступа.', {
        reply_markup: MENU_KEYBOARD,
      })
      return
    }
    await bot.sendMessage(chatId, `❌ Не удалось подготовить Telegram-пост: ${error.message}`, {
      reply_markup: MENU_KEYBOARD,
    })
  }
}

async function apiPost(path, payload) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Bot-Token': INTERNAL_TOKEN,
    },
    body: JSON.stringify(payload),
  })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(formatApiError(data))
    error.status = response.status
    throw error
  }

  return data
}

function getMessageText(message) {
  return (message.text || message.caption || '').trim()
}

function getCleanMessageText(message) {
  const text = getMessageText(message)
  const entities = message.entities || message.caption_entities || []
  return cleanTelegramText(text, entities)
}

function cleanTelegramText(text, entities = []) {
  const withoutLinkedEntities = removeLinkedEntities(text, entities)
  const adMarkers = [
    'резервном канале',
    'подписывайтесь',
    'подпишись',
    'реклама',
    'наш канал',
    'нашем канале',
    't.me/',
    'telegram.me/',
  ]

  const lines = withoutLinkedEntities.split(/\r?\n/)
  const cleaned = []

  for (const line of lines) {
    const stripped = line.trim()
    const lowered = stripped.toLowerCase()

    if (!stripped) {
      cleaned.push('')
      continue
    }

    if (adMarkers.some((marker) => lowered.includes(marker))) {
      continue
    }

    if (/https?:\/\/|@\w+/.test(stripped)) {
      continue
    }

    const meaningful = stripped.replace(/[^\p{L}\p{N}]+/gu, '')
    if (meaningful.length <= 1 && stripped.length >= 2) {
      continue
    }

    cleaned.push(stripped)
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function removeLinkedEntities(text, entities) {
  const removableTypes = new Set(['url', 'text_link'])
  const removable = entities
    .filter((entity) => removableTypes.has(entity.type))
    .sort((a, b) => b.offset - a.offset)

  let result = text
  for (const entity of removable) {
    result = `${result.slice(0, entity.offset)}${result.slice(entity.offset + entity.length)}`
  }
  return result
}

function getTelegramProfile(message) {
  return {
    username: message.from?.username || '',
    firstName: message.from?.first_name || '',
    lastName: message.from?.last_name || '',
  }
}

function getSourceInfo(message) {
  const origin = message.forward_origin

  if (origin?.type === 'channel' && origin.chat) {
    return getChatSource(origin.chat, origin.message_id)
  }

  if (origin?.type === 'chat' && origin.sender_chat) {
    return getChatSource(origin.sender_chat, origin.message_id)
  }

  if (origin?.type === 'user' && origin.sender_user) {
    const user = origin.sender_user
    return {
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Telegram User',
      url: user.username ? `https://t.me/${user.username}` : '',
    }
  }

  if (origin?.type === 'hidden_user') {
    return { name: origin.sender_user_name || 'Telegram User', url: '' }
  }

  if (message.forward_from_chat) {
    return getChatSource(message.forward_from_chat, message.forward_from_message_id)
  }

  if (message.forward_sender_name) {
    return { name: message.forward_sender_name, url: '' }
  }

  return { name: 'Telegram Bot', url: extractFirstUrl(getMessageText(message)) }
}

function getChatSource(chat, messageId) {
  const name = chat.title || chat.username || 'Telegram Channel'
  const url = chat.username
    ? `https://t.me/${chat.username}${messageId ? `/${messageId}` : ''}`
    : ''
  return { name, url }
}

function getMessageMetrics(message) {
  return {
    viewsCount: getNumericMetric(message.views ?? message.view_count ?? message.forward_origin?.views),
    likesCount: getReactionsCount(message.reactions ?? message.reaction ?? message.reaction_count ?? message.forward_origin?.reactions),
    commentsCount: getNumericMetric(message.comments_count ?? message.reply_count),
    sharesCount: getNumericMetric(message.shares_count ?? message.forward_count),
  }
}

async function fetchTelegramPublicViews(sourceUrl) {
  const match = String(sourceUrl).match(/^https:\/\/t\.me\/([^/?#]+)\/(\d+)/)
  if (!match) {
    return 0
  }

  const [, channel, messageId] = match
  const embedUrl = `https://t.me/${channel}/${messageId}?embed=1`

  try {
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 PressAI Telegram Bot',
      },
    })
    if (!response.ok) {
      return 0
    }

    const html = await response.text()
    const viewsMatch = html.match(/tgme_widget_message_views[^>]*>\s*([^<]+)\s*</i)
    if (!viewsMatch) {
      return 0
    }

    return parseTelegramCount(viewsMatch[1])
  } catch (error) {
    console.warn(`[telegram views fallback] ${sourceUrl}: ${error.message}`)
    return 0
  }
}

function parseTelegramCount(value) {
  const normalized = String(value || '')
    .trim()
    .replace(',', '.')
    .replace(/\s+/g, '')
    .toUpperCase()
  const match = normalized.match(/^([\d.]+)([KКMМ])?$/)
  if (!match) {
    return 0
  }

  const number = Number(match[1])
  if (!Number.isFinite(number)) {
    return 0
  }

  const suffix = match[2]
  if (suffix === 'K' || suffix === 'К') {
    return Math.round(number * 1000)
  }
  if (suffix === 'M' || suffix === 'М') {
    return Math.round(number * 1000000)
  }
  return Math.round(number)
}

function getNumericMetric(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0
}

function getReactionsCount(value) {
  if (!value) {
    return 0
  }

  if (typeof value === 'number') {
    return getNumericMetric(value)
  }

  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + getReactionsCount(item), 0)
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.reactions)) {
      return getReactionsCount(value.reactions)
    }
    if (Array.isArray(value.reaction_counts)) {
      return getReactionsCount(value.reaction_counts)
    }
    return getNumericMetric(value.total_count ?? value.count)
  }

  return 0
}

function extractFirstUrl(text) {
  const match = text.match(/https?:\/\/\S+/)
  return match ? match[0].replace(/[),.]+$/, '') : ''
}

function formatApiError(data) {
  if (typeof data === 'string') {
    return data || 'Backend error'
  }
  if (data.detail) {
    return data.detail
  }
  return JSON.stringify(data)
}

function normalizeBackendUrl(value) {
  return String(value || '').replace(/\/+$/, '')
}

bot.on('polling_error', (error) => {
  console.error('[telegram polling error]', error.message)
})

console.log(`Press AI Telegram bot started. Backend: ${BACKEND_URL}`)
