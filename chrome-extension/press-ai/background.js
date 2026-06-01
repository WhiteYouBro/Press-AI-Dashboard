const CONTEXT_MENU_ID = 'press-ai-send-selection'
const STORAGE_SELECTION_KEY = 'pressAiSelection'
const STORAGE_SETTINGS_KEY = 'pressAiSettings'

const DEFAULT_BACKEND_URL = 'http://localhost:6345'
const LEGACY_BACKEND_URL = 'http://localhost:8000'
const RAW_NEWS_ENDPOINT = '/api/v1/news/'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Отправить в Press AI',
    contexts: ['selection'],
  })
  migrateLegacyBackendUrl()
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    return
  }

  const selectedText = (info.selectionText || '').trim()
  if (!selectedText) {
    return
  }

  const pageUrl = tab?.url || info.pageUrl || ''
  const pageTitle = tab?.title || ''

  await chrome.storage.local.set({
    [STORAGE_SELECTION_KEY]: {
      selectedText,
      pageUrl,
      pageTitle,
      capturedAt: new Date().toISOString(),
    },
  })

  if (tab?.id) {
    await chrome.action.openPopup().catch(() => undefined)
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PRESS_AI_SEND_RAW_NEWS') {
    return false
  }

  sendRawNews(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error?.message || 'Не удалось отправить новость.' }))

  return true
})

async function sendRawNews(payload) {
  const stored = await chrome.storage.local.get(STORAGE_SETTINGS_KEY)
  const settings = stored[STORAGE_SETTINGS_KEY] || {}
  const backendUrl = resolveBackendUrl(settings.backendUrl)
  const token = String(settings.apiToken || '').trim()

  if (!token) {
    throw new Error('Сначала откройте popup расширения и укажите API-токен DRF.')
  }

  let response
  try {
    response = await fetch(`${backendUrl}${RAW_NEWS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': formatAuthHeader(token),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(`Не удалось подключиться к backend по адресу ${backendUrl}. Проверьте порт и запущен ли Django.`)
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    throw new Error(formatApiError(response.status, data))
  }

  return data
}

function resolveBackendUrl(value) {
  const backendUrl = normalizeBackendUrl(value)
  if (!backendUrl || backendUrl === LEGACY_BACKEND_URL) {
    return DEFAULT_BACKEND_URL
  }
  return backendUrl
}

async function migrateLegacyBackendUrl() {
  const stored = await chrome.storage.local.get(STORAGE_SETTINGS_KEY)
  const settings = stored[STORAGE_SETTINGS_KEY] || {}
  const backendUrl = normalizeBackendUrl(settings.backendUrl)

  if (!backendUrl || backendUrl === LEGACY_BACKEND_URL) {
    await chrome.storage.local.set({
      [STORAGE_SETTINGS_KEY]: {
        ...settings,
        backendUrl: DEFAULT_BACKEND_URL,
      },
    })
  }
}

function normalizeBackendUrl(value) {
  const url = String(value || '').trim().replace(/\/+$/, '')

  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

function formatAuthHeader(token) {
  return token.toLowerCase().startsWith('token ') ? token : `Token ${token}`
}

function formatApiError(status, data) {
  if (typeof data === 'string') {
    return `Ошибка ${status}: ${data || 'пустой ответ backend.'}`
  }

  if (data?.detail) {
    return `Ошибка ${status}: ${data.detail}`
  }

  const fieldErrors = Object.entries(data || {})
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
    .join('; ')

  return fieldErrors ? `Ошибка ${status}: ${fieldErrors}` : `Ошибка ${status}: запрос отклонён backend.`
}
