'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  X,
  Quote,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { ArticleCard } from '@/components/ArticleCard'
import { ArticleSkeleton } from '@/components/Loader'
import { ARTICLES, TOPICS, type Article } from '@/lib/mock-articles'

export default function HomePage() {
  const [topic, setTopic] = useState<Article['topic'] | 'Все'>('Все')
  const [query, setQuery] = useState('')
  const [loading] = useState(false)

  const filtered = useMemo(() => {
    return ARTICLES.filter((a) => {
      const byTopic = topic === 'Все' ? true : a.topic === topic
      const q = query.trim().toLowerCase()
      const byQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
      return byTopic && byQuery
    })
  }, [topic, query])

  const [lead, second, third, ...rest] = filtered

  return (
    <main className="min-h-screen">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Левая колонка — заголовок */}
            <div className="lg:col-span-8 flex flex-col items-start gap-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider">
                <Sparkles className="size-3 text-blood" />
                Журналистика × ИИ · Выпуск 042
              </span>

              <h1 className="font-serif text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.95] tracking-tight text-balance">
                Слова всё ещё значат{' '}
                <span className="relative whitespace-nowrap">
                  <span className="italic text-blood">больше</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-blood/30" />
                </span>
                ,
                <br />
                чем кажется.
              </h1>

              <p className="max-w-2xl font-sans text-lg leading-relaxed text-muted-text text-pretty">
                Платформа для журналистов: пишите длинные тексты в соавторстве
                с машиной, которая уже неплохо понимает, что такое хороший абзац.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/create"
                  className="group inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 font-sans text-sm font-medium text-background hover:bg-blood transition-colors"
                >
                  Написать статью
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="inline-flex items-center gap-2 font-mono text-xs text-muted-text">
                  <span className="size-1 rounded-full bg-blood pulse-blood" />
                  {ARTICLES.length} материалов в номере
                </span>
              </div>
            </div>

            {/* Правая колонка — редакционная сводка */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
              {/* Сводка номера */}
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">
                    Сводка номера
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-blood">
                    <Activity className="size-3" />
                    live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-serif text-4xl leading-none">{ARTICLES.length}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-text">
                      материалов
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-4xl leading-none">
                      {new Set(ARTICLES.map((a) => a.author)).size}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-text">
                      авторов
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-4xl leading-none">
                      {ARTICLES.reduce((acc, a) => acc + a.readingMinutes, 0)}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-text">
                      минут чтения
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-4xl leading-none text-blood">
                      042
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-text">
                      выпуск
                    </div>
                  </div>
                </div>
              </div>

              {/* Цитата дня */}
              <div className="rounded-2xl border border-line bg-foreground text-background p-5 relative overflow-hidden">
                <Quote className="absolute -top-2 -right-2 size-20 text-background/5" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-background/50">
                  Цитата дня
                </span>
                <p className="mt-3 font-serif text-xl italic leading-snug text-balance">
                  «Хороший текст — это&nbsp;разговор, который продолжается даже&nbsp;после&nbsp;последней&nbsp;точки.»
                </p>
                <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-background/60">
                  <span className="h-px w-6 bg-background/30" />
                  Сьюзен Зонтаг
                </div>
              </div>

              {/* Тикер тем */}
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-text">
                    <TrendingUp className="size-3" />
                    В фокусе номера
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">
                    24ч
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {TOPICS.slice(0, 4).map((t, i) => {
                    const count = ARTICLES.filter((a) => a.topic === t).length
                    const max = Math.max(
                      ...TOPICS.map(
                        (x) => ARTICLES.filter((a) => a.topic === x).length,
                      ),
                      1,
                    )
                    const pct = (count / max) * 100
                    return (
                      <li key={t} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="font-sans text-xs text-foreground/80">
                            {t}
                          </span>
                          <span className="font-mono text-[10px] text-muted-text tabular-nums">
                            {count}
                          </span>
                        </div>
                        <div className="h-px bg-surface-3 overflow-hidden">
                          <div
                            className="h-full bg-blood transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-4 pt-4 border-t border-line flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-text">
                  <Clock className="size-3" />
                  обновлено только что
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ФИЛЬТРЫ */}
      <section className="sticky top-[73px] z-20 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-6 py-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 md:pb-0">
            <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-text mr-1 shrink-0">
              <Filter className="size-3" />
              Раздел
            </span>
            {(['Все', ...TOPICS] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`shrink-0 rounded-full px-3 py-1.5 font-sans text-xs font-medium transition-colors ${
                  topic === t
                    ? 'bg-foreground text-background'
                    : 'bg-surface-2 text-foreground/80 hover:bg-surface-3'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="md:ml-auto relative md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-text" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по заголовку, автору, теме…"
              className="w-full rounded-md border border-line bg-surface pl-9 pr-9 py-2 font-sans text-sm focus:outline-none focus:border-blood placeholder:text-muted-text/70"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded text-muted-text hover:bg-surface-2 hover:text-foreground"
                aria-label="Очистить"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ЛЕНТА */}
      <section className="mx-auto max-w-[1400px] px-6 py-12">
        {loading ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-text">
              Ничего не найдено
            </p>
            <p className="mt-3 font-serif italic text-3xl">
              Похоже, эта тема ещё ждёт своего автора.
            </p>
            <Link
              href="/create"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 font-sans text-sm font-medium text-background hover:bg-blood transition-colors"
            >
              Написать первым
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Главный + сайдбар */}
            {lead && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
                <div className="lg:col-span-2">
                  <ArticleCard article={lead} layout="lead" />
                </div>
                <div className="flex flex-col gap-5">
                  {second && <ArticleCard article={second} layout="side" />}
                  {third && <ArticleCard article={third} layout="side" />}
                </div>
              </div>
            )}

            {/* Остальные */}
            {rest.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="font-serif text-3xl italic">Дальше по номеру</h2>
                  <span className="font-mono text-xs text-muted-text">
                    {rest.length} материалов
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {rest.map((a) => (
                    <ArticleCard key={a.id} article={a} layout="wide" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-12 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="grid size-8 place-items-center rounded-md bg-foreground text-background font-mono text-sm font-bold">
                0/1
              </span>
              <span className="font-sans text-[15px] font-semibold tracking-tight">
                НОЛЬ<span className="text-blood">/</span>ОДИН
              </span>
            </div>
            <p className="font-serif text-lg leading-relaxed text-muted-text max-w-md">
              Платформа для тех, кто пишет длинно, медленно и без иллюзий —
              в соавторстве с машиной.
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-text mb-3">
              Разделы
            </p>
            <ul className="space-y-1.5 font-sans text-sm">
              {TOPICS.slice(0, 4).map((t) => (
                <li key={t} className="text-foreground/80 hover:text-blood cursor-pointer">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-6 md:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-text mb-3">
              Редакция
            </p>
            <ul className="space-y-1.5 font-sans text-sm">
              <li className="text-foreground/80 hover:text-blood cursor-pointer">Манифест</li>
              <li className="text-foreground/80 hover:text-blood cursor-pointer">Авторам</li>
              <li className="text-foreground/80 hover:text-blood cursor-pointer">Контакты</li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-2 md:text-right font-mono text-[10px] uppercase tracking-wider text-muted-text self-end">
            © 2026 · v.0.1
          </div>
        </div>
      </footer>
    </main>
  )
}
