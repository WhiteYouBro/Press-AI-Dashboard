import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar, Hash, Share2, Link as LinkIcon, Send } from 'lucide-react'
import { Header } from '@/components/Header'
import { ArticleCard, TopicChip } from '@/components/ArticleCard'
import { ARTICLES, getArticleById } from '@/lib/mock-articles'
import { formatDate, readingTime } from '@/lib/formatDate'

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ id: a.id }))
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const article = getArticleById(id)
  if (!article) notFound()

  const reading = readingTime(article.content)
  const others = ARTICLES.filter((a) => a.id !== article.id).slice(0, 3)
  const paragraphs = article.content.split('\n\n')

  return (
    <main className="min-h-screen">
      <Header variant="compact" />

      <article className="mx-auto max-w-[1400px] px-6 pt-8 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-text hover:text-blood"
        >
          <ArrowLeft className="size-4" />
          Назад в ленту
        </Link>

        {/* ШАПКА */}
        <header className="mt-8 rounded-2xl border border-line bg-surface p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <TopicChip topic={article.topic} accent />
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-text">
              <Hash className="size-3" />
              {article.number}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-text">
              <Calendar className="size-3" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-text">
              <Clock className="size-3" />
              {reading}
            </span>
          </div>

          <h1 className="font-serif text-[clamp(2rem,6vw,5.5rem)] leading-[1] tracking-tight text-balance">
            {article.title}
          </h1>
          <p className="mt-6 font-serif text-xl md:text-2xl leading-relaxed italic text-muted-text text-pretty max-w-3xl">
            {article.excerpt}
          </p>

          <div className="mt-8 flex items-center gap-3 pt-6 border-t border-line">
            <span className="grid size-10 place-items-center rounded-full bg-foreground text-background font-sans text-sm font-semibold">
              {article.author
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div className="flex flex-col">
              <span className="font-sans text-sm font-semibold">
                {article.author}
              </span>
              <span className="font-sans text-xs text-muted-text">
                {article.authorRole}
              </span>
            </div>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-1.5 font-sans text-xs hover:bg-foreground hover:text-background transition-colors"
            >
              <Send className="size-3.5" />
              Подписаться
            </button>
          </div>
        </header>

        {/* ТЕЛО */}
        <div className="mt-10 grid grid-cols-12 gap-8">
          <aside className="hidden md:block col-span-3">
            <div className="sticky top-28 space-y-6 rounded-2xl border border-line bg-surface p-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-text mb-1">
                  Раздел
                </p>
                <p className="font-sans text-sm text-foreground/90">
                  {article.topic}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-text mb-1">
                  Дата
                </p>
                <p className="font-sans text-sm text-foreground/90">
                  {formatDate(article.publishedAt)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-text mb-1">
                  Время чтения
                </p>
                <p className="font-sans text-sm text-foreground/90">{reading}</p>
              </div>
              <div className="border-t border-line pt-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-text mb-3">
                  Поделиться
                </p>
                <div className="flex flex-col gap-1.5">
                  <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 font-sans text-sm text-foreground/80 hover:bg-surface-2 hover:text-foreground">
                    <LinkIcon className="size-3.5" />
                    Скопировать ссылку
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 font-sans text-sm text-foreground/80 hover:bg-surface-2 hover:text-foreground">
                    <Share2 className="size-3.5" />
                    Telegram
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 font-sans text-sm text-foreground/80 hover:bg-surface-2 hover:text-foreground">
                    <Send className="size-3.5" />
                    Почтой
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="col-span-12 md:col-span-9 lg:col-span-8 max-w-[68ch]">
            <div className="rounded-2xl border border-line bg-surface p-8 md:p-12">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={`font-serif text-[19px] md:text-xl leading-[1.7] text-pretty text-foreground/90 ${
                    i === 0
                      ? 'first-letter:font-serif first-letter:text-[5rem] first-letter:leading-[0.85] first-letter:float-left first-letter:pr-3 first-letter:pt-1.5 first-letter:text-blood'
                      : 'mt-6'
                  }`}
                >
                  {p}
                </p>
              ))}

              <div className="mt-12 pt-6 border-t border-line flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-text">
                <span className="size-1 rounded-full bg-blood" />
                Конец материала · {article.number}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ДРУГИЕ */}
      <section className="border-t border-line bg-surface/40">
        <div className="mx-auto max-w-[1400px] px-6 py-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-3xl italic">Из того же номера</h2>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-text hover:text-blood"
            >
              Вся лента
              <ArrowLeft className="size-4 rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {others.map((a) => (
              <ArticleCard key={a.id} article={a} layout="side" />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
