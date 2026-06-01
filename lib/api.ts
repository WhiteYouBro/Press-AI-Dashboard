export type ArticleStatus = 'pending' | 'approved' | 'rejected' | 'published'

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface BackendArticleListItem {
  id: number
  title: string
  lead: string
  rubric: string
  ai_score: number
  status: ArticleStatus
  source_type: string
  created_at: string
  raw_news_views_count?: number | null
  raw_news_ctr?: number | null
  source_url?: string | null
}

export interface BackendRawNews {
  id: number
  title: string
  body: string
  source_url: string
  source_name: string
  rubric: string
  views_count: number
  ctr: number
  likes_count: number
  comments_count: number
  shares_count: number
  trending_score: number
  published_at: string
  fetched_at: string
  is_processed: boolean
}

export interface BackendArticleDetail {
  id: number
  raw_news: BackendRawNews | null
  source_type: string
  title: string
  seo_title: string
  seo_description: string
  lead: string
  body: string
  rubric: string
  tags: string[]
  editor_hints: Array<string | {
    type?: string
    icon?: string
    priority?: 'high' | 'medium' | 'low'
    message?: string
    text?: string
  }>
  title_variants: string[]
  ai_score: number
  ai_score_reason: string
  status: ArticleStatus
  review_note: string
  created_at: string
  updated_at: string
  approved_at: string | null
}

export interface BackendPipelineRun {
  id: number
  started_at: string
  finished_at: string | null
  news_analyzed: number
  news_selected: number
  articles_created: number
  status: 'running' | 'done' | 'failed'
  error_message: string
  log_entries: Array<string | { text?: string; message?: string; time?: string }>
  next_run_at: string | null
}

export interface AnalyticsOverview {
  pending_count: number
  approved_today: number
  avg_ctr: number
  avg_ai_score: number
  total_published: number
  rejection_rate: number
  avg_time_to_publish_hours: number
  recent_pipeline_run: BackendPipelineRun | null
}

export interface AnalyticsCtrItem {
  rubric: string
  avg_ctr: number
  total_views: number
}

export interface AnalyticsAccuracy {
  approval_rate: number
  items: Array<{
    article_id: number
    title: string
    ai_score: number
    source_ctr: number
  }>
}

export interface PipelineSettings {
  openai_model: string
  pipeline_interval_minutes: number
  top_news_count: number
  ranking_weights: Record<string, number>
}

export interface ManualProcessResponse {
  task_id: string
  status: 'pending'
}

export interface ManualStatusResponse {
  task_id: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  error?: string
  article?: BackendArticleDetail
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
}

export interface LoginResponse {
  token: string
  user: User
}

export interface QueueArticle {
  id: string
  title: string
  lead: string
  rubric: string
  aiScore: number
  sourceUrl: string
  sourceViews: number
  sourceCtr: number
  timestamp: string
  status: ArticleStatus
}

export interface PipelineLog {
  id: string
  timestamp: string
  type: 'analysis' | 'approved' | 'refresh' | 'rejected'
  message: string
}

export interface ArticleDetail extends QueueArticle {
  fullText: string
  hints: Array<{
    id: string
    type: 'image' | 'quote' | 'data' | 'link'
    priority: 'high' | 'medium' | 'low'
    message: string
  }>
  titleVariants: string[]
  aiScoreReason: string
  originalSource: {
    text: string
    url: string
  }
}

const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1'
const SERVER_API_BASE_URL = process.env.API_INTERNAL_URL ?? PUBLIC_API_BASE_URL
export const APP_TIME_ZONE = 'Asia/Almaty'

export class ApiError extends Error {
  status: number

  constructor(status: number, statusText: string) {
    super(`API request failed: ${status} ${statusText}`)
    this.status = status
  }
}

function getApiBaseUrl() {
  return typeof window === 'undefined' ? SERVER_API_BASE_URL : PUBLIC_API_BASE_URL
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response | null = null
  let lastError: unknown = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...init?.headers,
        },
        cache: 'no-store',
      })
      break
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error('API request failed')
  }

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText)
  }

  return response.json() as Promise<T>
}

export async function browserApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') : null
  const response = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail ?? `API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`
}

export function toQueueArticle(article: BackendArticleListItem): QueueArticle {
  return {
    id: String(article.id),
    title: article.title,
    lead: article.lead,
    rubric: article.rubric,
    aiScore: article.ai_score,
    sourceUrl: article.source_url ?? '#',
    sourceViews: article.raw_news_views_count ?? 0,
    sourceCtr: article.raw_news_ctr ?? 0,
    timestamp: formatTime(article.created_at),
    status: article.status,
  }
}

function normalizeArticleBody(value: string) {
  return value
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim() || value
}

function normalizeHintType(value: string | undefined): ArticleDetail['hints'][number]['type'] {
  const normalized = value === 'photo' || value === 'chart' ? (value === 'photo' ? 'image' : 'data') : value
  if (normalized === 'image' || normalized === 'quote' || normalized === 'data' || normalized === 'link') {
    return normalized
  }
  return 'data'
}

export function toArticleDetail(article: BackendArticleDetail): ArticleDetail {
  return {
    id: String(article.id),
    title: article.title,
    lead: article.lead,
    rubric: article.rubric,
    aiScore: article.ai_score,
    sourceUrl: article.raw_news?.source_url ?? '#',
    sourceViews: article.raw_news?.views_count ?? 0,
    sourceCtr: article.raw_news?.ctr ?? 0,
    timestamp: formatTime(article.created_at),
    status: article.status,
    fullText: normalizeArticleBody(article.body),
    hints: article.editor_hints.map<ArticleDetail['hints'][number]>((hint, index) => {
      if (typeof hint === 'string') {
        return {
          id: `${article.id}-${index}`,
          type: 'data',
          priority: 'medium',
          message: hint,
        }
      }

      return {
        id: `${article.id}-${index}`,
        type: normalizeHintType(hint.type ?? hint.icon),
        priority: hint.priority ?? 'medium',
        message: hint.message ?? hint.text ?? '',
      }
    }).filter((hint) => hint.message),
    titleVariants: article.title_variants,
    aiScoreReason: article.ai_score_reason,
    originalSource: {
      text: article.raw_news?.body ?? '',
      url: article.raw_news?.source_url ?? '#',
    },
  }
}

export function toPipelineLogs(runs: BackendPipelineRun[]): PipelineLog[] {
  return runs.flatMap((run) => {
    const baseType: PipelineLog['type'] = run.status === 'failed' ? 'rejected' : run.status === 'done' ? 'approved' : 'analysis'
    const entries = run.log_entries.length ? run.log_entries : [
      `Проанализировано ${run.news_analyzed} · Отобрано ${run.news_selected} · Создано ${run.articles_created}`,
    ]

    return entries.map((message, index) => ({
      id: `${run.id}-${index}`,
      timestamp: formatTime(run.started_at),
      type: index === 0 ? baseType : 'refresh',
      message: typeof message === 'string' ? message : message.text ?? message.message ?? '',
    }))
  })
}

export async function getQueueArticles(status?: ArticleStatus) {
  const params = new URLSearchParams({ ordering: '-created_at', page_size: '50' })
  if (status) params.set('status', status)
  const data = await apiFetch<PaginatedResponse<BackendArticleListItem>>(`/queue/?${params}`)
  return data.results.map(toQueueArticle)
}

export async function getArticleDetail(id: string) {
  const data = await apiFetch<BackendArticleDetail>(`/queue/${id}/`)
  return toArticleDetail(data)
}

export async function getRawNews(ordering = '-published_at') {
  const params = new URLSearchParams({ ordering, page_size: '50' })
  return apiFetch<PaginatedResponse<BackendRawNews>>(`/news/?${params}`)
}

export async function getAnalyticsOverview() {
  return apiFetch<AnalyticsOverview>('/analytics/overview/')
}

export async function getAnalyticsCtr() {
  return apiFetch<{ rubrics: AnalyticsCtrItem[] }>('/analytics/ctr/')
}

export async function getAnalyticsAccuracy() {
  return apiFetch<AnalyticsAccuracy>('/analytics/ai_accuracy/')
}

export async function getPipelineHistory() {
  return apiFetch<BackendPipelineRun[]>('/ai/pipeline/history/')
}

export async function getPipelineStatus() {
  return apiFetch<BackendPipelineRun | { status: 'idle'; pipeline_run: null }>('/ai/pipeline/status/')
}

export async function getPipelineSettings() {
  return apiFetch<PipelineSettings>('/settings/')
}

export async function processManualArticle(rawText: string, rubric: string, sourceUrl?: string) {
  return browserApiFetch<ManualProcessResponse>('/ai/manual/', {
    method: 'POST',
    body: JSON.stringify({
      raw_text: rawText,
      rubric,
      source_url: sourceUrl || undefined,
    }),
  })
}

export async function getManualArticleStatus(taskId: string) {
  return browserApiFetch<ManualStatusResponse>(`/ai/manual/${taskId}/`)
}

export async function login(username: string, password: string) {
  const response = await browserApiFetch<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  window.localStorage.setItem('access_token', response.token)
  window.localStorage.setItem('user', JSON.stringify(response.user))
  return response
}

export async function logout() {
  await browserApiFetch<{ detail: string }>('/auth/logout/', { method: 'POST' })
  window.localStorage.removeItem('access_token')
  window.localStorage.removeItem('user')
}

export async function approveArticle(id: string) {
  const data = await browserApiFetch<BackendArticleDetail>(`/queue/${id}/approve/`, { method: 'POST' })
  return toArticleDetail(data)
}

export async function rejectArticle(id: string, reason: string) {
  const data = await browserApiFetch<BackendArticleDetail>(`/queue/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return toArticleDetail(data)
}
