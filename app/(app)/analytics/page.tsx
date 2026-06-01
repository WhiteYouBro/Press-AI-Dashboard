import { Card } from '@/components/ui/card'
import { StatsCard } from '@/components/app/stats-card'
import { TrendingUp, FileText, Clock } from 'lucide-react'
import { getAnalyticsAccuracy, getAnalyticsCtr, getAnalyticsOverview, getRawNews } from '@/lib/api'

export default async function AnalyticsPage() {
  const [overview, ctr, accuracy, news] = await Promise.all([
    getAnalyticsOverview(),
    getAnalyticsCtr(),
    getAnalyticsAccuracy(),
    getRawNews(),
  ])
  const topNews = [...news.results]
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 10)

  return (
    <div className="space-y-7 animate-fadeIn">
      <div className="border-b border-[--border] pb-5">
        <h1 className="text-3xl font-semibold tracking-[-0.055em] text-[--text-primary] mb-1">
          Аналитика
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[--text-secondary]">
          Метрики и статистика работы AI-редакции
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Средний CTR"
          value={`${overview.avg_ctr}%`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Всего опубликовано"
          value={overview.total_published}
          icon={FileText}
        />
        <StatsCard
          title="Среднее время публикации"
          value={`${overview.avg_time_to_publish_hours} ч`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-[--bg-surface] border-[--border]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[--text-secondary] mb-4">
            CTR по рубрикам
          </h3>
          <div className="space-y-3">
            {ctr.rubrics.map((item, index) => (
              <div key={item.rubric} className="flex items-center gap-3">
                <span className="text-sm text-[--text-primary] w-24">
                  {item.rubric}
                </span>
                <div className="flex-1 h-6 bg-[--bg-subtle] rounded-md overflow-hidden border border-[--border]">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min((item.avg_ctr / 6) * 100, 100)}%`,
                      backgroundColor: `var(${['--text-primary', '--text-secondary', '--border-strong', '--accent-hover', '--text-tertiary'][index % 5]})`
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-[--text-primary] w-12 text-right tabular-nums">
                  {Number(item.avg_ctr || 0).toFixed(1)}%
                </span>
              </div>
            ))}
            {!ctr.rubrics.length && (
              <p className="text-sm text-[--text-secondary]">Нет данных по рубрикам.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[--bg-surface] border-[--border]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[--text-secondary] mb-4">
            Точность AI (Score vs реальный CTR)
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[--text-secondary]">Средний AI Score</span>
              <span className="font-bold text-[--text-primary]">{overview.avg_ai_score}/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[--text-secondary]">Процент одобрения</span>
              <span className="font-bold text-[--text-primary]">{(accuracy.approval_rate * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[--text-secondary]">Доля отклонений</span>
              <span className="font-bold text-[--text-primary]">{(overview.rejection_rate * 100).toFixed(0)}%</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-[--bg-surface] border-[--border]">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[--text-secondary] mb-4">
          Топ-10 статей за месяц
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full stripe-table text-sm">
            <thead>
              <tr className="border-b border-[--border]">
                <th className="text-left py-3 px-2">#</th>
                <th className="text-left py-3 px-2">Заголовок</th>
                <th className="text-left py-3 px-2">Рубрика</th>
                <th className="text-right py-3 px-2">Просмотры</th>
                <th className="text-right py-3 px-2">CTR</th>
              </tr>
            </thead>
            <tbody>
              {topNews.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 px-2 text-[--text-tertiary]">{i + 1}</td>
                  <td className="py-3 px-2 text-[--text-primary]">{item.title}</td>
                  <td className="py-3 px-2 text-[--text-secondary]">{item.rubric}</td>
                  <td className="py-3 px-2 text-right font-bold tabular-nums">{(item.views_count / 1000).toFixed(0)}k</td>
                  <td className="py-3 px-2 text-right font-bold tabular-nums text-[--text-primary]">{item.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!topNews.length && (
            <p className="py-6 text-sm text-[--text-secondary]">Нет данных для рейтинга статей.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
