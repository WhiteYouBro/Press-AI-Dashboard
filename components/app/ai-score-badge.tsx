import { Badge } from '@/components/ui/badge'

interface AIScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function AIScoreBadge({ score, size = 'md' }: AIScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 8.5) return 'bg-[--text-primary] text-[--primary-foreground] border-[--text-primary]'
    if (score >= 6) return 'bg-[--bg-subtle] text-[--text-primary] border-[--border-strong]'
    return 'bg-[--bg-surface] text-[--text-secondary] border-[--border]'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <Badge 
      variant="outline" 
      className={`
        ${getColor(score)} 
        ${sizeClasses[size]} 
        border font-bold tabular-nums
      `}
    >
      {score.toFixed(1)}
    </Badge>
  )
}
