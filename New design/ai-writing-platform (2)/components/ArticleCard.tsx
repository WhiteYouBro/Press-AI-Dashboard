import Link from 'next/link'
import { ArrowUpRight, Clock, User, Hash } from 'lucide-react'
import type { Article } from '@/lib/mock-articles'
import { formatDate, readingTime } from '@/lib/formatDate'

type ArticleCardProps = {
  article: Article
  layout?: 'lead' | 'wide' | 'side' | 'compact'
}

export function ArticleCard({ article, layout = 'compact' }: ArticleCardProps) {
  const reading = readingTime(article.content)

  if (layout === 'lead') {
    return (
      <Link
        href={`/article/${article.id}`}
        className="group relative block rounded-2xl border border-line bg-surface p-8 md:p-10 hover:border-foreground/40 transition-colors"
      >
        <div className="flex items-center gap-2 mb-6">
          <TopicChip topic={article.topic} accent />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-text">
            {article.number}
          </span>
        </div>
        <h2 className="font-serif text-[clamp(2rem,4.5vw,4rem)] leading-[1.02] tracking-tight text-balance group-hover:text-blood transition-colors">
          {article.title}
        </h2>
        <p className="mt-6 max-w-2xl font-sans text-[17px] leading-relaxed text-muted-text text-pretty">
          {article.excerpt}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Byline article={article} />
          <span className="flex items-center gap-1.5 font-sans text-sm text-muted-text">
            <Clock className="size-3.5" />
            {reading}
          </span>
          <span className="flex items-center gap-1.5 font-sans text-sm text-muted-text">
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <ArrowUpRight className="absolute right-6 top-6 size-5 text-muted-text/60 group-hover:text-blood group-hover:rotate-12 transition-all" />
      </Link>
    )
  }

  if (layout === 'wide') {
    return (
      <Link
        href={`/article/${article.id}`}
        className="group flex flex-col md:flex-row gap-6 md:gap-10 rounded-xl border border-line bg-surface p-6 hover:border-foreground/40 transition-colors"
      >
        <div className="md:w-48 flex-shrink-0 flex md:flex-col gap-3 md:gap-2">
          <TopicChip topic={article.topic} />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-text">
            {article.number}
          </span>
          <span className="font-sans text-xs text-muted-text md:mt-auto">
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-2xl md:text-3xl leading-tight tracking-tight text-balance group-hover:text-blood transition-colors">
            {article.title}
          </h3>
          <p className="mt-3 max-w-2xl font-sans text-[15px] leading-relaxed text-muted-text">
            {article.excerpt}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Byline article={article} small />
            <span className="flex items-center gap-1.5 font-sans text-xs text-muted-text">
              <Clock className="size-3" />
              {reading}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  if (layout === 'side') {
    return (
      <Link
        href={`/article/${article.id}`}
        className="group block rounded-xl border border-line bg-surface p-5 hover:border-foreground/40 transition-colors"
      >
        <div className="flex items-center gap-2 mb-3">
          <TopicChip topic={article.topic} small />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">
            {article.number}
          </span>
        </div>
        <h3 className="font-serif text-xl leading-snug tracking-tight text-balance group-hover:text-blood transition-colors">
          {article.title}
        </h3>
        <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted-text line-clamp-3">
          {article.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Byline article={article} small />
          <span className="flex items-center gap-1 font-sans text-xs text-muted-text">
            <Clock className="size-3" />
            {reading}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/article/${article.id}`}
      className="group block rounded-lg border border-line bg-surface p-5 hover:border-foreground/40 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <TopicChip topic={article.topic} small />
      </div>
      <h3 className="font-serif text-lg md:text-xl leading-snug tracking-tight text-balance group-hover:text-blood transition-colors">
        {article.title}
      </h3>
      <Byline article={article} small className="mt-3" />
    </Link>
  )
}

export function TopicChip({
  topic,
  accent = false,
  small = false,
}: {
  topic: Article['topic']
  accent?: boolean
  small?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${
        accent
          ? 'border-blood/30 bg-blood/8 text-blood'
          : 'border-line bg-surface-2 text-foreground/80'
      } ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'} font-mono uppercase tracking-wider`}
    >
      <Hash className={small ? 'size-2.5' : 'size-3'} />
      {topic}
    </span>
  )
}

function Byline({
  article,
  small = false,
  className = '',
}: {
  article: Article
  small?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-muted-text ${
        small ? 'text-xs' : 'text-sm'
      } ${className}`}
    >
      <User className={small ? 'size-3' : 'size-3.5'} />
      <span className="text-foreground/90">{article.author}</span>
      <span className="text-muted-text/50">·</span>
      <span>{article.authorRole}</span>
    </span>
  )
}
