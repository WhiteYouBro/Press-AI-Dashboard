const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const day = d.getDate()
  const month = MONTHS_RU[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

export function formatDateShort(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${dd}.${mm}.${yy}`
}

/**
 * Считает время чтения исходя из ~180 слов в минуту (русский текст).
 */
export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 180))
  return `${minutes} ${pluralizeMinutes(minutes)} чтения`
}

function pluralizeMinutes(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'минута'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'минуты'
  return 'минут'
}
