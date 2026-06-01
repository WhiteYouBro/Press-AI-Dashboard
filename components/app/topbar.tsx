import { Activity, Circle } from 'lucide-react'
import { MobileNav } from '@/components/app/sidebar'
import { formatTime, getPipelineStatus } from '@/lib/api'

export async function Topbar() {
  const pipelineStatus = await getPipelineStatus().catch(() => null)
  const isRunning = pipelineStatus?.status === 'running'
  const nextRunAt = pipelineStatus && 'next_run_at' in pipelineStatus ? pipelineStatus.next_run_at : null

  return (
    <header className="app-topbar-frost sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="topbar-status-pill inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5">
              <Circle size={8} className="fill-[--text-primary] text-[--text-primary]" />
              <span className="text-xs font-semibold tracking-[-0.01em] text-[--text-primary]">
                {isRunning ? 'AI выполняется' : 'AI активен'}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-sm text-[--text-secondary]">
              <Activity size={15} className="text-[--text-tertiary]" />
              <span className="truncate">{nextRunAt ? `Следующий прогон: ${formatTime(nextRunAt)}` : 'Пайплайн готов к запуску'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 lg:hidden">
        <MobileNav />
      </div>
    </header>
  )
}
