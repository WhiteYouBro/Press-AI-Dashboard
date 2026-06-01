const PRESS_AI_BUTTON_ID = 'press-ai-floating-send-button'
const PRESS_AI_COPY_BUTTON_ID = 'press-ai-floating-copy-button'
const PRESS_AI_TOAST_ID = 'press-ai-floating-toast'

const DEFAULT_RUBRIC = 'Общество'

mountPressAiButton()

function mountPressAiButton() {
  if (document.getElementById(PRESS_AI_BUTTON_ID)) {
    return
  }

  if (!looksLikeNewsPage()) {
    return
  }

  const button = document.createElement('button')
  button.id = PRESS_AI_BUTTON_ID
  button.type = 'button'
  button.textContent = 'Отправить в базу новостей'
  button.addEventListener('click', handleSendClick)
  document.documentElement.appendChild(button)

  const copyButton = document.createElement('button')
  copyButton.id = PRESS_AI_COPY_BUTTON_ID
  copyButton.type = 'button'
  copyButton.textContent = 'Скопировать статью'
  copyButton.addEventListener('click', handleCopyClick)
  document.documentElement.appendChild(copyButton)
}

async function handleSendClick() {
  const button = document.getElementById(PRESS_AI_BUTTON_ID)
  if (!button) {
    return
  }

  try {
    button.disabled = true
    button.textContent = 'Отправляю...'

    const article = extractArticleData()
    if (!article.title || article.title.length < 4) {
      throw new Error('Не удалось определить заголовок новости.')
    }
    if (!article.body || article.body.length < 80) {
      throw new Error('Не удалось собрать полный текст статьи.')
    }

    const response = await chrome.runtime.sendMessage({
      type: 'PRESS_AI_SEND_RAW_NEWS',
      payload: article,
    })

    if (!response?.ok) {
      throw new Error(response?.error || 'Backend отклонил запрос.')
    }

    button.textContent = 'Отправлено'
    showToast(`Новость #${response.data?.id || 'создана'} добавлена в RawNews.`, 'success')
  } catch (error) {
    button.textContent = 'Ошибка отправки'
    showToast(error?.message || 'Не удалось отправить новость.', 'error')
  } finally {
    setTimeout(() => {
      button.disabled = false
      button.textContent = 'Отправить в базу новостей'
    }, 2400)
  }
}

async function handleCopyClick() {
  const button = document.getElementById(PRESS_AI_COPY_BUTTON_ID)
  if (!button) {
    return
  }

  try {
    button.disabled = true
    button.textContent = 'Копирую...'

    const article = extractArticleData()
    if (!article.title || article.title.length < 4) {
      throw new Error('Не удалось определить заголовок новости.')
    }
    if (!article.body || article.body.length < 20) {
      throw new Error('Не удалось собрать текст статьи.')
    }

    await copyTextToClipboard(`${article.title}\n\n${article.body}`)
    button.textContent = 'Скопировано'
    showToast('Заголовок и текст статьи скопированы.', 'success')
  } catch (error) {
    button.textContent = 'Ошибка копирования'
    showToast(error?.message || 'Не удалось скопировать статью.', 'error')
  } finally {
    setTimeout(() => {
      button.disabled = false
      button.textContent = 'Скопировать статью'
    }, 2200)
  }
}

function extractArticleData() {
  const title = pickText([
    '.head-single',
    'article h1',
    'h1[itemprop="headline"]',
    'h1',
  ]) || pickMeta(['og:title', 'twitter:title']) || document.title

  const body = extractArticleText()
  const sourceUrl = pickMeta(['og:url', 'twitter:url', 'vk:url']) || window.location.href
  const sourceName = pickMetaName('author') || getHost(sourceUrl)
  const publishedAt = pickMetaName('article:published_time') || pickMetaProperty('article:published_time') || new Date().toISOString()

  return {
    title: cleanText(title).slice(0, 500),
    body,
    source_url: sourceUrl,
    source_name: cleanText(sourceName).slice(0, 200) || 'Chrome Extension',
    rubric: inferRubric(),
    views_count: extractViewsCount(),
    ctr: 0,
    likes_count: extractLikesCount(),
    comments_count: extractCommentsCount(),
    shares_count: extractSharesCount(),
    trending_score: 0,
    published_at: normalizeDate(publishedAt),
    is_processed: false,
  }
}

function extractArticleText() {
  const blocks = []
  const lead = document.querySelector('.content_main_desc')
  const body = findArticleBodyRoot()

  collectReadableText(lead, blocks)
  collectReadableText(body, blocks)

  if (blocks.length === 0) {
    const metaDescription = pickMeta(['og:description', 'twitter:description']) || pickMetaName('description')
    if (metaDescription) {
      blocks.push(metaDescription)
    }
  }

  return dedupeLines(blocks)
    .map(cleanText)
    .filter((line) => line.length > 0 && !isRejectedArticleLine(line))
    .join('\n\n')
}

function findArticleBodyRoot() {
  if (getHost(window.location.href).includes('tengrinews.kz')) {
    return document.querySelector('.content_main_text[itemprop="articleBody"], .content_main_text')
  }

  return document.querySelector('.content_main_text[itemprop="articleBody"], [itemprop="articleBody"], article, .article-content, .article__body')
}

function collectReadableText(root, blocks) {
  if (!root) {
    return
  }

  const clone = root.cloneNode(true)
  clone.querySelectorAll([
    'script',
    'style',
    'noscript',
    'iframe',
    '.tn-inpage',
    '.tn-discussed-now-block',
    '.tn-recommendations',
    '.tn-related-news',
    '.content_main_text_tags',
    '.content_main_share',
    '.content_main_comments',
    '.content_main_readalso',
    '.content_item',
    '.content_items',
    '.comments',
    '.comment',
    '[class*="comment"]',
    '[class*="auth"]',
    '[class*="login"]',
    '[data-share-root]',
    '[data-nosnippet]',
    '[data-comments]',
    '[data-link]',
    '[hidden]',
    'form',
    'input',
    'button',
  ].join(',')).forEach((node) => node.remove())

  const textNodes = getReadableNodes(clone)
  if (textNodes.length > 0) {
    textNodes.forEach((node) => {
      const text = cleanText(node.textContent || '')
      if (text.length >= 20 && !isRejectedArticleLine(text)) {
        blocks.push(text)
      }
    })
    return
  }

  const text = cleanText(clone.textContent || '')
  if (text.length >= 20) {
    blocks.push(text)
  }
}

function getReadableNodes(root) {
  const host = getHost(window.location.href)
  if (host.includes('tengrinews.kz') && root.matches?.('.content_main_text')) {
    return Array.from(root.querySelectorAll(':scope > p, :scope > blockquote, :scope > ul > li, :scope > ol > li'))
  }

  return Array.from(root.querySelectorAll('p, blockquote, li'))
}

function isRejectedArticleLine(value) {
  const text = cleanText(value).toLowerCase()
  if (!text) {
    return true
  }

  const rejectedPhrases = [
    'авторов комментариев',
    'на указанный вами телефон',
    'будет отправлен код доступа',
    'введите его',
    'tengri id',
    'единый вход для сервисов',
    'нажимая кнопку входа',
    'пользовательского соглашения',
    'политику конфиденциальности',
    'пароль должен быть',
    'введите код активации',
    'неприемлемый контент',
    'показать комментарии',
    'комментарии к материалу',
    'оставить комментарий',
    'войдите',
    'зарегистрируйтесь',
    'читайте также',
    'похожие новости',
    'другие новости',
    'самое читаемое',
    'самое обсуждаемое',
    'обсуждаемое сейчас',
    'материал подготовлен в автоматическом режиме',
  ]

  return rejectedPhrases.some((phrase) => text.includes(phrase))
}

function inferRubric() {
  const section = pickMetaName('article:section') || pickMetaProperty('article:section')
  const tags = getArticleTags()
  const urlPath = window.location.pathname.toLowerCase()
  const haystack = [
    section,
    ...tags,
    document.title,
    pickMeta(['og:title', 'twitter:title']),
    pickMetaName('description'),
  ].join(' ').toLowerCase()

  const scores = {
    'Политика': 0,
    'Экономика': 0,
    'Наука': 0,
    'Культура': 0,
    'Спорт': 0,
    'Технологии': 0,
    'Общество': 0,
    'Мир': 0,
  }

  if (urlPath.includes('/kazakhstan_news/')) scores['Общество'] += 2
  if (urlPath.includes('/world_news/') || urlPath.includes('/sng/')) scores['Мир'] += 3
  if (urlPath.includes('/politics/')) scores['Политика'] += 4
  if (urlPath.includes('/markets/') || urlPath.includes('/money/') || urlPath.includes('/business/')) scores['Экономика'] += 4
  if (urlPath.includes('/science/')) scores['Наука'] += 4
  if (urlPath.includes('/culture/')) scores['Культура'] += 4
  if (urlPath.includes('/sport/')) scores['Спорт'] += 4
  if (urlPath.includes('/tech/') || urlPath.includes('/internet/')) scores['Технологии'] += 4

  addScore(scores, haystack, 'Политика', [
    'полит', 'президент', 'токаев', 'путин', 'зеленск', 'правительств', 'парламент', 'сенат', 'мажилис',
    'депутат', 'министр', 'минобороны', 'аким', 'акимат', 'госвизит', 'государственный визит', 'еаэс',
    'дипломат', 'выбор', 'закон', 'сго', 'вооруженные силы', 'вооружённые силы', 'безопасность',
  ], 5)
  addScore(scores, haystack, 'Экономика', [
    'эконом', 'бизнес', 'банк', 'курс', 'тенге', 'доллар', 'нефть', 'газ', 'налог', 'бюджет', 'рынок',
    'инфляц', 'кредит', 'ипотек', 'зарплат', 'пенси', 'тариф', 'цена', 'цены',
  ], 5)
  addScore(scores, haystack, 'Наука', [
    'наук', 'исследован', 'учен', 'космос', 'медицин', 'образован', 'университет', 'открытие',
  ], 5)
  addScore(scores, haystack, 'Культура', [
    'культур', 'кино', 'театр', 'музык', 'концерт', 'артист', 'фильм', 'книга', 'искусств', 'выставк',
  ], 5)
  addScore(scores, haystack, 'Спорт', [
    'спорт', 'футбол', 'хоккей', 'бокс', 'теннис', 'олимпи', 'матч', 'чемпион', 'турнир',
  ], 5)
  addScore(scores, haystack, 'Технологии', [
    'технолог', 'интернет', 'it', 'искусственный интеллект', 'ии', 'гаджет', 'смартфон', 'цифров',
    'кибер', 'стартап',
  ], 5)
  addScore(scores, haystack, 'Мир', [
    'world', 'мир', 'сша', 'европа', 'китай', 'украина', 'израиль', 'германия', 'франция', 'оон', 'нато',
  ], 4)
  addScore(scores, haystack, 'Общество', [
    'общество', 'новости казахстана', 'астана', 'алматы', 'транспорт', 'дорог', 'улиц', 'полици',
    'происшеств', 'пожар', 'суд', 'жители', 'город', 'столица',
  ], 2)

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  return ranked[0][1] > 0 ? ranked[0][0] : DEFAULT_RUBRIC
}

function extractViewsCount() {
  const articleId = extractArticleId()
  if (articleId) {
    const value = pickNumberFromSelectors([
      `[data-views="true"][data-id="${articleId}"]`,
      `[data-view-inc="true"][data-id="${articleId}"]`,
      `.content_main_meta [data-id="${articleId}"][data-views="true"]`,
    ])
    if (value > 0) {
      return value
    }
  }

  const value = pickNumberFromSelectors([
    '[data-views="true"][data-type="news"]',
    '[data-view-inc="true"][data-type="news"]',
    '.content_main_meta_stat_view span',
    '[itemprop="interactionStatistic"] [itemprop="userInteractionCount"]',
  ])

  if (value > 0) {
    return value
  }

  return parseCount((document.querySelector('[data-views="true"]') || document.querySelector('[data-view-inc="true"]'))?.textContent || '0')
}

function extractCommentsCount() {
  const node = document.querySelector('[data-comments="true"][data-comments-count]')
  if (node) {
    return parseCount(node.getAttribute('data-comments-count') || node.textContent || '0')
  }

  return pickNumberFromSelectors([
    '[data-comments="true"]',
    '.content_main_share_com_count',
    '.content_main_meta_stat_comm span',
    '[href$="#comments"]',
    '[href$="#comm"]',
  ])
}

function extractLikesCount() {
  return pickNumberFromSelectors([
    '[data-likes="true"]',
    '[data-like-count]',
    '[data-likes-count]',
    '.content_main_meta_stat_like',
    '.like-count',
    '.likes-count',
  ])
}

function extractSharesCount() {
  return pickNumberFromSelectors([
    '[data-shares="true"]',
    '[data-share-count]',
    '[data-shares-count]',
    '.share-count',
    '.shares-count',
  ])
}

function getArticleTags() {
  const metaTags = Array.from(document.querySelectorAll('meta[name="article:tag"], meta[property="article:tag"]'))
    .map((node) => node.getAttribute('content') || '')

  const visibleTags = Array.from(document.querySelectorAll('.content_main_text_tags a, [itemprop="about"]'))
    .map((node) => node.textContent || '')

  return dedupeLines([...metaTags, ...visibleTags])
}

function addScore(scores, haystack, rubric, keywords, weight) {
  keywords.forEach((keyword) => {
    if (keywordMatches(haystack, keyword)) {
      scores[rubric] += weight
    }
  })
}

function keywordMatches(haystack, keyword) {
  const exactKeywords = new Set(['спорт', 'мир', 'it', 'ии', 'сша', 'оон', 'нато', 'сго', 'еаэс'])
  if (!exactKeywords.has(keyword)) {
    return haystack.includes(keyword)
  }

  return new RegExp(`(^|[^a-zа-яё0-9])${escapeRegExp(keyword)}([^a-zа-яё0-9]|$)`, 'i').test(haystack)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractArticleId() {
  const byDataId = document.querySelector('[data-id][data-type="news"], [data-id][data-model="news"]')?.getAttribute('data-id')
  if (byDataId) {
    return byDataId
  }

  const fromUrl = window.location.pathname.match(/-(\d+)\/?$/)
  return fromUrl ? fromUrl[1] : ''
}

function pickNumberFromSelectors(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector)
    if (!node) {
      continue
    }

    const value = parseCount(
      node.getAttribute('content') ||
      node.getAttribute('data-count') ||
      node.getAttribute('data-comments-count') ||
      node.getAttribute('data-like-count') ||
      node.getAttribute('data-likes-count') ||
      node.getAttribute('data-share-count') ||
      node.getAttribute('data-shares-count') ||
      node.getAttribute('aria-label') ||
      node.textContent ||
      '0'
    )
    if (value > 0) {
      return value
    }
  }
  return 0
}

function parseCount(value) {
  const raw = String(value || '').trim().toLowerCase().replace(/\s+/g, '')
  if (!raw) {
    return 0
  }

  const normalized = raw.replace(',', '.')
  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)([kкmм]?)/)
  if (!match) {
    return 0
  }

  const number = Number(match[1])
  const suffix = match[2]
  if (!Number.isFinite(number)) {
    return 0
  }

  if (suffix === 'k' || suffix === 'к') {
    return Math.round(number * 1000)
  }
  if (suffix === 'm' || suffix === 'м') {
    return Math.round(number * 1000000)
  }
  return Math.round(number)
}

function pickText(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector)
    const text = cleanText(node?.textContent || '')
    if (text) {
      return text
    }
  }
  return ''
}

function pickMeta(properties) {
  for (const property of properties) {
    const node = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
    const value = node?.getAttribute('content') || ''
    if (value) {
      return value
    }
  }
  return ''
}

function pickMetaName(name) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || ''
}

function pickMetaProperty(property) {
  return document.querySelector(`meta[property="${property}"]`)?.getAttribute('content') || ''
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function dedupeLines(lines) {
  const seen = new Set()
  return lines.filter((line) => {
    const key = cleanText(line).toLowerCase()
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function normalizeDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()

  if (!copied) {
    throw new Error('Браузер запретил доступ к буферу обмена.')
  }
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return window.location.hostname || 'Chrome Extension'
  }
}

function looksLikeNewsPage() {
  return Boolean(
    document.querySelector('meta[property="og:type"][content="article"], meta[property="og:type"][content="news"], [itemtype*="NewsArticle"], [itemprop="articleBody"], article') ||
    document.querySelector('.content_main_text, .head-single')
  )
}

function showToast(message, type) {
  let toast = document.getElementById(PRESS_AI_TOAST_ID)
  if (!toast) {
    toast = document.createElement('div')
    toast.id = PRESS_AI_TOAST_ID
    document.documentElement.appendChild(toast)
  }

  toast.textContent = message
  toast.dataset.type = type
  toast.classList.add('press-ai-toast-visible')
  setTimeout(() => toast.classList.remove('press-ai-toast-visible'), 4200)
}
