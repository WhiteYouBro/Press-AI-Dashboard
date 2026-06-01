import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AIScoreBadge } from '@/components/app/ai-score-badge'
import { EditorHint } from '@/components/app/editor-hint'
import { ArticleActions } from '@/components/app/article-actions'
import { DiffViewer } from '@/components/app/diff-viewer'
import { ApiError, getArticleDetail } from '@/lib/api'
import { ExternalLink, TrendingUp } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function ArticleReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const article = await getArticleDetail(id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  })

  if (!article) {
    notFound()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fadeIn">
      {/* Article Preview - 60% */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="p-8 bg-[--bg-surface] border-[--border]">
          <Badge variant="outline" className="mb-4">
            {article.rubric}
          </Badge>
          
          <h1 className="text-3xl font-bold text-[--text-primary] mb-4 leading-tight">
            {article.title}
          </h1>
          
          <p className="text-lg text-[--text-secondary] italic mb-6 leading-relaxed">
            {article.lead}
          </p>

          <DiffViewer
            originalText={article.originalSource.text}
            aiGeneratedText={article.fullText}
          />

          <div className="mt-6 space-y-3">
            {article.fullText.split('\n\n').filter(Boolean).map((_, index) => (
              article.hints[index] ? (
                <EditorHint
                  key={article.hints[index].id}
                  type={article.hints[index].type}
                  message={article.hints[index].message}
                  priority={article.hints[index].priority}
                />
              ) : null
            ))}
          </div>
        </Card>
      </div>

      {/* Editor Panel - 40% */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-6 bg-[--bg-surface] border-[--border] sticky top-6">
          <div className="space-y-6">
            {/* AI Score */}
            <div>
              <h3 className="text-sm font-semibold text-[--text-primary] mb-3">
                AI-анализ
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-[--text-secondary]">Score:</span>
                <AIScoreBadge score={article.aiScore} size="lg" />
              </div>
              <p className="text-xs text-[--text-secondary] leading-relaxed">
                CTR оригинала {article.sourceCtr}% · {article.aiScoreReason || 'AI оценил качество и потенциал материала'}
              </p>
            </div>

            {/* Original Source */}
            <div className="pt-4 border-t border-[--border]">
              <h3 className="text-sm font-semibold text-[--text-primary] mb-2">
                Исходный источник
              </h3>
              <a 
                href={article.originalSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[--accent] hover:underline mb-2"
              >
                <ExternalLink size={12} />
                Перейти к оригиналу
              </a>
              {article.originalSource.text ? (
                <p className="text-xs text-[--text-secondary] italic">
                  {article.originalSource.text}
                </p>
              ) : (
                <p className="text-xs text-[--text-secondary]">Исходный текст недоступен.</p>
              )}
            </div>

            {/* Metrics */}
            <div className="pt-4 border-t border-[--border]">
              <h3 className="text-sm font-semibold text-[--text-primary] mb-3">
                Метрики оригинала
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[--text-tertiary]">Просмотры</p>
                  <p className="text-lg font-bold text-[--text-primary] tabular-nums">
                    {(article.sourceViews / 1000).toFixed(0)}k
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[--text-tertiary]">CTR</p>
                  <p className="text-lg font-bold text-[--text-primary] tabular-nums flex items-center gap-1">
                    {article.sourceCtr}%
                    <TrendingUp size={14} className="text-[--text-secondary]" />
                  </p>
                </div>
              </div>
            </div>

            {/* Editor Notes */}
            <div className="pt-4 border-t border-[--border]">
              <h3 className="text-sm font-semibold text-[--text-primary] mb-2">
                Редакторские заметки
              </h3>
              <Textarea 
                placeholder="Ваши заметки к статье..."
                className="min-h-[80px] text-sm"
              />
            </div>

            {/* Hints Summary */}
            <div className="pt-4 border-t border-[--border]">
              <h3 className="text-sm font-semibold text-[--text-primary] mb-2">
                Подсказки AI ({article.hints.length})
              </h3>
              <ul className="space-y-2">
                {article.hints.map((hint) => (
                  <li key={hint.id} className="text-xs text-[--text-secondary] flex items-start gap-2">
                    <span className="text-[--text-primary]">•</span>
                    <span>{hint.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ArticleActions articleId={article.id} />
          </div>
        </Card>
      </div>
    </div>
  )
}
