import { Sparkles, Check, RefreshCw, AlertCircle } from 'lucide-react'
import { PipelineLog } from '@/lib/api'

const iconMap = {
  analysis: Sparkles,
  approved: Check,
  refresh: RefreshCw,
  rejected: AlertCircle
}

const colorMap = {
  analysis: 'text-[--text-primary]',
  approved: 'text-[--text-primary]',
  refresh: 'text-[--text-secondary]',
  rejected: 'text-[--text-secondary]'
}

interface PipelineLogListProps {
  logs: PipelineLog[]
}

export function PipelineLogList({ logs }: PipelineLogListProps) {
  return (
    <div className="divide-y divide-[--border]">
      {logs.map((log) => {
        const Icon = iconMap[log.type]
        const color = colorMap[log.type]

        return (
          <div 
            key={log.id} 
            className="flex items-start gap-3 py-3 text-sm transition-colors hover:bg-[--bg-subtle]"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[--border] bg-[--bg-base]">
              <Icon size={14} className={color} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mr-2 text-xs text-[--text-tertiary] tabular-nums">
                {log.timestamp}
              </span>
              <span className="text-[--text-primary]">{log.message}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
