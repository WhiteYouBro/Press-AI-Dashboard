const STORAGE_SELECTION_KEY = 'pressAiSelection'
const STORAGE_SETTINGS_KEY = 'pressAiSettings'

const DEFAULT_BACKEND_URL = 'http://localhost:6345'
const LEGACY_BACKEND_URL = 'http://localhost:8000'
const RAW_NEWS_ENDPOINT = '/api/v1/news/'

const elements = {
  form: document.getElementById('pressAiForm'),
  backendUrl: document.getElementById('backendUrl'),
  apiToken: document.getElementById('apiToken'),
  title: document.getElementById('title'),
  rubric: document.getElementById('rubric'),
  body: document.getElementById('body'),
  textCounter: document.getElementById('textCounter'),
  captureBadge: document.getElementById('captureBadge'),
  sourceBlock: document.getElementById('sourceBlock'),
  sourceUrl: document.getElementById('sourceUrl'),
  status: document.getElementById('status'),
  sendRawNews: document.getElementById('sendRawNews'),
}

let capturedSourceUrl = ''
let capturedPageTitle = ''

init().catch((error) => {
  showStatus('error', error?.message || 'Не удалось открыть расширение.')
})

async function init() {
  const stored = await chrome.storage.local.get([STORAGE_SELECTION_KEY, STORAGE_SETTINGS_KEY])
  const settings = stored[STORAGE_SETTINGS_KEY] || {}
  const selection = stored[STORAGE_SELECTION_KEY] || {}

  const savedBackendUrl = normalizeBackendUrl(settings.backendUrl)
  elements.backendUrl.value = !savedBackendUrl || savedBackendUrl === LEGACY_BACKEND_URL
    ? DEFAULT_BACKEND_URL
    : savedBackendUrl
  elements.apiToken.value = settings.apiToken || ''
  elements.rubric.value = settings.rubric || 'Общество'

  capturedSourceUrl = selection.pageUrl || ''
  capturedPageTitle = selection.pageTitle || ''

  if (selection.selectedText) {
    elements.body.value = selection.selectedText
    elements.captureBadge.textContent = 'текст готов'
    elements.captureBadge.className = 'badge badge-ready'
  }

  elements.title.value = buildInitialTitle(capturedPageTitle, selection.selectedText)

  if (capturedSourceUrl) {
    elements.sourceBlock.classList.remove('hidden')
    elements.sourceUrl.textContent = capturedSourceUrl
    elements.sourceUrl.title = capturedSourceUrl
  }

  updateCounter()
  bindEvents()
}

function bindEvents() {
  elements.backendUrl.addEventListener('input', persistSettings)
  elements.apiToken.addEventListener('input', persistSettings)
  elements.rubric.addEventListener('change', persistSettings)
  elements.body.addEventListener('input', updateCounter)
  elements.sendRawNews.addEventListener('click', () => submitRawNews().catch(handleSubmitError))
}

async function persistSettings() {
  await chrome.storage.local.set({
    [STORAGE_SETTINGS_KEY]: {
      backendUrl: normalizeBackendUrl(elements.backendUrl.value) || DEFAULT_BACKEND_URL,
      apiToken: elements.apiToken.value.trim(),
      rubric: elements.rubric.value,
    },
  })
}

async function submitRawNews() {
  const data = getFormData()
  setLoading(true)
  showStatus('info', 'Отправляю RawNews в базу...')

  const response = await apiRequest(RAW_NEWS_ENDPOINT, {
    title: data.title,
    body: data.body,
    source_url: data.sourceUrl,
    source_name: data.sourceName,
    rubric: data.rubric,
    views_count: 0,
    ctr: 0,
    shares_count: 0,
    trending_score: 0,
    published_at: new Date().toISOString(),
    is_processed: false,
  })

  showStatus('success', `Готово: RawNews #${response.id || 'создана'} отправлена в базу вместе с источником и полным текстом.`)
  await persistSettings()
  setLoading(false)
}

function getFormData() {
  const backendUrl = normalizeBackendUrl(elements.backendUrl.value)
  const apiToken = elements.apiToken.value.trim()
  const title = elements.title.value.trim()
  const rubric = elements.rubric.value
  const body = elements.body.value.trim()
  const sourceUrl = capturedSourceUrl || ''
  const sourceName = extractSourceName(sourceUrl)

  if (!backendUrl) {
    throw new Error('Укажите корректный Backend URL. Для Docker-проекта обычно нужен http://localhost:6345.')
  }

  if (!apiToken) {
    throw new Error('Введите API-токен DRF. Без токена backend отклонит POST-запрос.')
  }

  if (title.length < 4) {
    throw new Error('Введите заголовок новости.')
  }

  if (!body) {
    throw new Error('Добавьте текст статьи или выделите текст на странице.')
  }

  return { backendUrl, apiToken, title, rubric, body, sourceUrl, sourceName }
}

async function apiRequest(endpoint, payload) {
  const backendUrl = normalizeBackendUrl(elements.backendUrl.value)
  const token = elements.apiToken.value.trim()
  let response

  try {
    response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': formatAuthHeader(token),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(`Не удалось подключиться к backend по адресу ${backendUrl}. Проверьте, что Django запущен, порт указан верно, и расширение перезагружено в chrome://extensions/.`)
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    throw new Error(formatApiError(response.status, data))
  }

  return data
}

function normalizeBackendUrl(value) {
  const url = (value || '').trim().replace(/\/+$/, '')

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

function handleSubmitError(error) {
  setLoading(false)
  showStatus('error', error?.message || 'Не удалось отправить материал.')
}

function setLoading(isLoading) {
  elements.sendRawNews.disabled = isLoading

  if (!isLoading) {
    elements.sendRawNews.textContent = 'Отправить в RawNews'
    return
  }

  elements.sendRawNews.textContent = 'Отправляю...'
}

function showStatus(type, message) {
  const styles = {
    success: 'status-success',
    error: 'status-error',
    info: 'status-info',
  }

  elements.status.className = `status ${styles[type] || styles.info}`
  elements.status.textContent = message
  elements.status.classList.remove('hidden')
}

function updateCounter() {
  const length = elements.body.value.trim().length
  elements.textCounter.textContent = `${length} симв.`
}

function buildInitialTitle(pageTitle, selectedText) {
  if (pageTitle && pageTitle.trim().length >= 4) {
    return pageTitle.trim().slice(0, 500)
  }

  const firstSentence = (selectedText || '')
    .trim()
    .split(/[.!?\n]/)
    .find((part) => part.trim().length >= 10)

  return firstSentence ? firstSentence.trim().slice(0, 120) : ''
}

function extractSourceName(sourceUrl) {
  if (!sourceUrl) {
    return 'Chrome Extension'
  }

  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return 'Chrome Extension'
  }
}
