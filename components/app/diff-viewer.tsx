'use client'

import { FileText, GitCompareArrows, WandSparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type DiffPart = {
  value: string
  type: 'same' | 'removed' | 'added'
}

interface DiffViewerProps {
  originalText: string
  aiGeneratedText: string
}

function tokenize(value: string) {
  return value.replace(/\s+/g, ' ').trim().match(/\S+/g) ?? []
}

function buildDiff(originalText: string, aiGeneratedText: string): DiffPart[] {
  const original = tokenize(originalText)
  const generated = tokenize(aiGeneratedText)
  const rows = original.length + 1
  const cols = generated.length + 1
  const matrix = Array.from({ length: rows }, () => new Uint16Array(cols))

  for (let i = original.length - 1; i >= 0; i -= 1) {
    for (let j = generated.length - 1; j >= 0; j -= 1) {
      if (original[i] === generated[j]) {
        matrix[i][j] = matrix[i + 1][j + 1] + 1
      } else {
        matrix[i][j] = Math.max(matrix[i + 1][j], matrix[i][j + 1])
      }
    }
  }

  const parts: DiffPart[] = []
  let i = 0
  let j = 0

  while (i < original.length && j < generated.length) {
    if (original[i] === generated[j]) {
      parts.push({ value: original[i], type: 'same' })
      i += 1
      j += 1
    } else if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      parts.push({ value: original[i], type: 'removed' })
      i += 1
    } else {
      parts.push({ value: generated[j], type: 'added' })
      j += 1
    }
  }

  while (i < original.length) {
    parts.push({ value: original[i], type: 'removed' })
    i += 1
  }

  while (j < generated.length) {
    parts.push({ value: generated[j], type: 'added' })
    j += 1
  }

  return parts
}

function ProseBlock({ text, muted = false }: { text: string; muted?: boolean }) {
  const paragraphs = text.split('\n\n').map((item) => item.trim()).filter(Boolean)

  if (!paragraphs.length) {
    return (
      <div className="rounded-xl border border-dashed border-[--border] bg-[--bg-base] px-4 py-8 text-center text-sm text-[--text-tertiary]">
        Текст недоступен.
      </div>
    )
  }

  return (
    <div className={cn('space-y-4 text-sm leading-7', muted ? 'text-[--text-secondary]' : 'text-[--text-primary]')}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  )
}

function InlineDiff({ originalText, aiGeneratedText }: DiffViewerProps) {
  const parts = buildDiff(originalText, aiGeneratedText)
  const removedCount = parts.filter((part) => part.type === 'removed').length
  const addedCount = parts.filter((part) => part.type === 'added').length

  if (!parts.length) {
    return (
      <div className="rounded-xl border border-dashed border-[--border] bg-[--bg-base] px-4 py-8 text-center text-sm text-[--text-tertiary]">
        Недостаточно текста для сравнения.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700 dark:bg-red-950/40">
          Удалено: {removedCount}
        </span>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700 dark:bg-green-950/40">
          Добавлено: {addedCount}
        </span>
      </div>
      <div className="rounded-2xl border border-[--border] bg-[--bg-base] p-4 text-sm leading-8 text-[--text-primary] sm:p-5">
        {parts.map((part, index) => (
          <span
            key={`${part.type}-${index}-${part.value}`}
            className={cn(
              'mr-1 rounded px-1 py-0.5 transition-colors',
              part.type === 'removed' && 'bg-red-100 text-red-700 line-through decoration-red-700/70 dark:bg-red-950/40',
              part.type === 'added' && 'bg-green-100 text-green-700 dark:bg-green-950/40',
            )}
          >
            {part.value}
          </span>
        ))}
      </div>
    </div>
  )
}

export function DiffViewer({ originalText, aiGeneratedText }: DiffViewerProps) {
  return (
    <Tabs defaultValue="final" className="gap-5">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-2xl bg-[--bg-base] p-1 sm:grid-cols-3">
        <TabsTrigger value="final" className="h-10 gap-2 rounded-xl text-xs sm:text-sm">
          <WandSparkles size={15} />
          Финальный текст
        </TabsTrigger>
        <TabsTrigger value="diff" className="h-10 gap-2 rounded-xl text-xs sm:text-sm">
          <GitCompareArrows size={15} />
          Сравнение изменений
        </TabsTrigger>
        <TabsTrigger value="original" className="h-10 gap-2 rounded-xl text-xs sm:text-sm">
          <FileText size={15} />
          Исходный материал
        </TabsTrigger>
      </TabsList>

      <TabsContent value="final" className="mt-0 rounded-2xl border border-[--border] bg-[--bg-surface] p-5 sm:p-6">
        <ProseBlock text={aiGeneratedText} />
      </TabsContent>

      <TabsContent value="diff" className="mt-0 rounded-2xl border border-[--border] bg-[--bg-surface] p-5 sm:p-6">
        <InlineDiff originalText={originalText} aiGeneratedText={aiGeneratedText} />
      </TabsContent>

      <TabsContent value="original" className="mt-0 rounded-2xl border border-[--border] bg-[--bg-surface] p-5 sm:p-6">
        <ProseBlock text={originalText} muted />
      </TabsContent>
    </Tabs>
  )
}
