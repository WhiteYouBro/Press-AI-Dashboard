import axios, { AxiosError } from 'axios'

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[v0] →', config.method?.toUpperCase(), config.url)
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ??
      error.message ??
      'Неизвестная ошибка сети'

    // eslint-disable-next-line no-console
    console.error('[v0] ✗ Ошибка запроса:', status, message)

    return Promise.reject({
      status: status ?? 0,
      message,
      original: error,
    })
  },
)

export default api
