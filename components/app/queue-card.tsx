'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AIScoreBadge } from './ai-score-badge'
import { QueueArticle, rejectArticle } from '@/lib/api'

interface QueueCardProps {
  article: QueueArticle
}

export function QueueCard({ article }: QueueCardProps) {
  const router = useRouter()
  const [isRejecting, setIsRejecting] = useState(false)

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await rejectArticle(article.id, '')
      router.refresh()
    } catch {
      setIsRejecting(false)
    }
  }

  return (
    <Card className="bg-[--bg-surface] p-0 transition-colors hover:border-[--border-strong]">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-[--border] bg-[--bg-base] px-2.5 py-1 text-[--text-primary]">
              <Sparkles size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">AI</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {article.rubric}
            </Badge>
            <span className="text-xs text-[--text-tertiary] tabular-nums">
              {article.timestamp}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-[--text-tertiary]">Score</span>
            <AIScoreBadge score={article.aiScore} size="sm" />
          </div>
        </div>

        <h3 className="mb-2 text-lg font-semibold leading-snug tracking-[-0.025em] text-[--text-primary]">
          {article.title}
        </h3>

        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-[--text-secondary]">
          {article.lead}
        </p>

        <div className="flex flex-col gap-3 border-t border-[--border] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[--text-tertiary]">
            <FileText size={14} />
            <span>
              РИА Новости · {(article.sourceViews / 1000).toFixed(0)}k просмотров · CTR {article.sourceCtr}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/article/${article.id}/review`}>
                Открыть
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-[--text-secondary] hover:text-[--text-primary]"
              disabled={isRejecting}
              onClick={handleReject}
            >
              {isRejecting ? <Loader2 className="animate-spin" size={14} /> : null}
              Отклонить
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
