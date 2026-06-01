import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowDownAZ, RefreshCw } from 'lucide-react'
import { formatTime, getRawNews } from '@/lib/api'

const sortOptions = [
  { value: '-published_at', label: 'Сначала новые' },
  { value: 'published_at', label: 'Сначала старые' },
  { value: '-fetched_at', label: 'Сначала обновлённые' },
  { value: '-views_count', label: 'Самые читаемые' },
  { value: '-comments_count', label: 'Больше комментариев' },
  { value: '-ctr', label: 'Лучший CTR' },
  { value: '-trending_score', label: 'В тренде' },
]

interface DatabasePageProps {
  searchParams?: Promise<{ ordering?: string }> | { ordering?: string }
}

export default async function DatabasePage({ searchParams }: DatabasePageProps) {
  const resolvedSearchParams = await searchParams
  const ordering = sortOptions.some((option) => option.value === resolvedSearchParams?.ordering)
    ? resolvedSearchParams?.ordering || '-published_at'
    : '-published_at'
  const news = await getRawNews(ordering)

  return (
    <div className="space-y-7 animate-fadeIn">
      <div className="flex items-end justify-between border-b border-[--border] pb-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.055em] text-[--text-primary] mb-1">
            База новостей
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[--text-secondary]">
            Все новости из подключённых источников
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw size={14} className="mr-2" />
          Обновить
        </Button>
      </div>

      <Card className="bg-[--bg-surface] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[--text-primary]">
            <ArrowDownAZ size={16} />
            <span>Сортировка базы</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => {
              const isActive = ordering === option.value
              return (
                <Button
                  key={option.value}
                  asChild
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className={isActive ? '' : 'bg-[--bg-base]'}
                >
                  <Link href={`/database?ordering=${encodeURIComponent(option.value)}`}>
                    {option.label}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-[--bg-surface] border-[--border]">
        <div className="overflow-x-auto">
          <table className="w-full stripe-table text-sm">
            <thead>
              <tr className="border-b border-[--border]">
                <th className="text-left py-3 px-2">Время</th>
                <th className="text-left py-3 px-2">Заголовок</th>
                <th className="text-left py-3 px-2">Источник</th>
                <th className="text-left py-3 px-2">Рубрика</th>
                <th className="text-right py-3 px-2">Просмотры</th>
                <th className="text-right py-3 px-2">Комм.</th>
                <th className="text-right py-3 px-2">Лайки</th>
                <th className="text-right py-3 px-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {news.results.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-2 text-[--text-tertiary] tabular-nums">
                    {formatTime(item.published_at)}
                  </td>
                  <td className="py-3 px-2 text-[--text-primary]">
                    {item.title}
                  </td>
                  <td className="py-3 px-2 text-[--text-secondary]">
                    {item.source_name}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className="text-xs">
                      {item.rubric}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    {(item.views_count / 1000).toFixed(0)}k
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    {item.comments_count}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    {item.likes_count}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Badge
                      variant={item.is_processed ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {item.is_processed ? 'Обработана' : 'Новая'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!news.results.length && (
            <p className="py-6 text-sm text-[--text-secondary]">В базе пока нет новостей.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
