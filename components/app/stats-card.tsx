import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  delta?: string
  icon?: LucideIcon
}

export function StatsCard({ title, value, delta, icon: Icon }: StatsCardProps) {
  return (
    <Card className="bg-[--bg-surface] p-0 transition-colors hover:border-[--border-strong]">
      <div className="flex min-h-[132px] flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[10rem] text-[11px] font-semibold uppercase leading-4 tracking-[0.16em] text-[--text-tertiary]">{title}</p>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[--border] bg-[--bg-base] text-[--text-secondary]">
              <Icon size={17} />
            </div>
          )}
        </div>
        <div>
          <p className="text-[2rem] leading-none font-semibold tracking-[-0.065em] text-[--text-primary] tabular-nums">{value}</p>
          {delta && (
            <p className="mt-2 text-xs font-semibold text-[--text-secondary]">{delta}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
