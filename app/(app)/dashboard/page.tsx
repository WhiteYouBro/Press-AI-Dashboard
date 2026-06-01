import { Inbox, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react'
import { StatsCard } from '@/components/app/stats-card'
import { QueueCard } from '@/components/app/queue-card'
import { PipelineLogList } from '@/components/app/pipeline-log'
import { Card } from '@/components/ui/card'
import { getAnalyticsOverview, getPipelineHistory, getQueueArticles, toPipelineLogs } from '@/lib/api'

export default async function DashboardPage() {
  const [overview, queueArticles, pipelineRuns] = await Promise.all([
    getAnalyticsOverview(),
    getQueueArticles('pending'),
    getPipelineHistory(),
  ])
  const topArticles = queueArticles.slice(0, 3)
  const pipelineLogs = toPipelineLogs(pipelineRuns).slice(0, 8)

  return (
    <div className="mx-auto max-w-[88rem] space-y-6">
      <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 sm:p-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[--text-tertiary]">
          смена редактора
        </p>
        <h1 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-[--text-primary] sm:text-4xl">
          Командный центр
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[--text-secondary]">
          Очередь, публикации и состояние пайплайна в одном рабочем срезе.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Ожидают проверки"
          value={overview.pending_count}
          icon={Inbox}
        />
        <StatsCard
          title="Опубликовано сегодня"
          value={overview.approved_today}
          icon={CheckCircle2}
        />
        <StatsCard
          title="Средний CTR"
          value={`${overview.avg_ctr}%`}
          icon={TrendingUp}
        />
        <StatsCard
          title="AI-качество"
          value={`${overview.avg_ai_score}/10`}
          icon={Sparkles}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Queue */}
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-[-0.025em] text-[--text-primary]">
              Очередь AI (топ-3)
            </h2>
            <a 
              href="/queue" 
              className="text-sm font-semibold text-[--text-primary] underline-offset-4 hover:underline"
            >
              Смотреть всё →
            </a>
          </div>
          {topArticles.length ? (
            topArticles.map((article) => (
              <QueueCard key={article.id} article={article} />
            ))
          ) : (
            <Card className="bg-[--bg-surface] p-6 text-sm text-[--text-secondary]">
              В очереди пока нет статей. Запустите AI-пайплайн или добавьте материал вручную.
            </Card>
          )}
        </div>

        {/* Activity Log */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold tracking-[-0.025em] text-[--text-primary]">
            Активность AI
          </h2>
          <Card className="bg-[--bg-surface] p-4">
            {pipelineLogs.length ? (
              <PipelineLogList logs={pipelineLogs} />
            ) : (
              <p className="text-sm text-[--text-secondary]">Пока нет запусков пайплайна.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
