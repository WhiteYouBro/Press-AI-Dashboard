'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { approveArticle, rejectArticle } from '@/lib/api'

interface ArticleActionsProps {
  articleId: string
  defaultRejectReason?: string
}

export function ArticleActions({ articleId, defaultRejectReason = '' }: ArticleActionsProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleApprove = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      await approveArticle(articleId)
      router.refresh()
      router.push('/queue')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось одобрить статью')
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      await rejectArticle(articleId, defaultRejectReason)
      router.refresh()
      router.push('/queue')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отклонить статью')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-4 border-t border-[--border] space-y-2">
      <Button
        className="w-full"
        disabled={isSubmitting}
        onClick={handleApprove}
      >
        ✓ Одобрить и опубликовать
      </Button>
      <Button variant="outline" className="w-full" disabled={isSubmitting}>
        ✎ Редактировать
      </Button>
      <Button variant="ghost" className="w-full text-[--text-secondary] hover:text-[--text-primary]" disabled={isSubmitting} onClick={handleReject}>
        ✗ Отклонить
      </Button>
      {error && (
        <p className="rounded-md border border-[--border-strong] bg-[--bg-subtle] p-3 text-xs text-[--text-primary]">
          {error}
        </p>
      )}
    </div>
  )
}
