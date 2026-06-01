'use client'

import { useMemo, useState, type ComponentType } from 'react'
import Link from 'next/link'
import {
  Activity,
  Archive,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Circle,
  Clock,
  Database,
  Filter,
  Hash,
  Newspaper,
  PenLine,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wand2,
  X,
} from 'lucide-react'
import { NewsImproverDemo } from '@/components/landing/news-improver-demo'

const topics = ['Все', 'Пайплайн', 'Редактор', 'Очередь', 'Аналитика'] as const

type Topic = (typeof topics)[number]

type EditorialItem = {
  id: string
  number: string
  title: string
  excerpt: string
  topic: Exclude<Topic, 'Все'>
  href: string
  author: string
  metric: string
}

const editorialItems: EditorialItem[] = [
  {
    id: 'pipeline',
    number: '№ 001',
    title: 'ИИ сам отбирает свежие новости и готовит черновики',
    excerpt: 'Пайплайн берёт необработанные новости из базы, ранжирует их по CTR, просмотрам и тренду, затем создаёт материалы для ревью.',
    topic: 'Пайплайн',
    href: '/dashboard',
    author: 'Автоматизация',
    metric: '24ч',
  },
  {
    id: 'manual',
    number: '№ 002',
    title: 'Ручной режим для журналиста, которому нужен контроль',
    excerpt: 'Вставьте заметку, пресс-релиз или набор фактов. ИИ предложит структуру, лид, заголовки и редакторские подсказки.',
    topic: 'Редактор',
    href: '/manual',
    author: 'Журналист',
    metric: 'rich text',
  },
  {
    id: 'queue',
    number: '№ 003',
    title: 'Очередь публикаций оставляет последнее слово редактору',
    excerpt: 'Готовые материалы не публикуются автоматически: редактор проверяет, правит, утверждает или отклоняет каждую статью.',
    topic: 'Очередь',
    href: '/queue',
    author: 'Редактор',
    metric: 'review',
  },
  {
    id: 'database',
    number: '№ 004',
    title: 'База новостей показывает, что именно попало в обработку',
    excerpt: 'Сырьё, источники, рубрики, просмотры и CTR остаются прозрачными. Можно проверить, почему одна тема поднялась выше другой.',
    topic: 'Аналитика',
    href: '/database',
    author: 'Данные',
    metric: 'CTR',
  },
]

const features = [
  { icon: ShieldCheck, title: 'Контроль качества', text: 'AI создаёт черновик, но финальное решение остаётся у редактора.' },
  { icon: Database, title: 'Прозрачная база', text: 'Каждая статья связана с исходной новостью, метриками и источником.' },
  { icon: Wand2, title: 'Редактура текста', text: 'Лиды, SEO, заголовки и подсказки собираются в один рабочий материал.' },
  { icon: BarChart3, title: 'Метрики выпуска', text: 'CTR, просмотры, тренды и оценки помогают выбирать сильные темы.' },
]

export default function LandingPage() {
  const [topic, setTopic] = useState<Topic>('Все')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return editorialItems.filter((item) => {
      const byTopic = topic === 'Все' || item.topic === topic
      const byQuery = !q || item.title.toLowerCase().includes(q) || item.excerpt.toLowerCase().includes(q)
      return byTopic && byQuery
    })
  }, [topic, query])

  const [lead, second, third, ...rest] = filtered
  const today = new Date().toLocaleDateString('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <EditorialHeader today={today} />

      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="flex flex-col items-start gap-8 lg:col-span-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider">
                <Sparkles className="size-3 text-blood" />
                Журналистика × ИИ · дипломный проект
              </span>

              <h1 className="max-w-5xl text-balance font-serif text-[clamp(2.75rem,7vw,6.7rem)] leading-[0.93] tracking-tight">
                Редакция, где машина готовит черновик, а человек принимает решение.
              </h1>

              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-text">
                Redactor.ai превращает поток новостей и ручные заметки в материалы для проверки: с заголовками, лидами, SEO, оценкой качества и подсказками редактору.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/manual"
                  className="group inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-blood"
                >
                  Написать материал
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-5 py-3 text-sm font-medium text-foreground/85 transition-colors hover:border-foreground/30 hover:bg-surface-2"
                >
                  Открыть дашборд
                  <ArrowUpRight className="size-4" />
                </Link>
                <span className="inline-flex items-center gap-2 font-mono text-xs text-muted-text">
                  <span className="size-1.5 rounded-full bg-blood pulse-blood" />
                  рабочий AI-пайплайн подключён к проекту
                </span>
              </div>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-4">
              <IssueSummary />
              <QuotePanel />
              <FocusPanel />
            </aside>
          </div>
        </div>
      </section>

      <section className="sticky top-[73px] z-20 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 py-3 md:flex-row md:items-center">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 md:pb-0">
            <span className="mr-1 hidden shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-text md:inline-flex">
              <Filter className="size-3" />
              Раздел
            </span>
            {topics.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTopic(item)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  topic === item
                    ? 'bg-foreground text-background'
                    : 'bg-surface-2 text-foreground/80 hover:bg-surface-3'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="relative md:ml-auto md:min-w-[320px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-text" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по функциям проекта…"
              className="w-full rounded-md border border-line bg-surface py-2 pl-9 pr-9 text-sm placeholder:text-muted-text/70 focus:border-blood focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-text hover:bg-surface-2 hover:text-foreground"
                aria-label="Очистить"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-12" id="features">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-text">Ничего не найдено</p>
            <p className="mt-3 font-serif text-3xl italic">Попробуйте другой запрос или откройте рабочий дашборд.</p>
            <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-blood">
              Перейти в редакцию
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {lead && (
              <div className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <EditorialCard item={lead} layout="lead" />
                </div>
                <div className="flex flex-col gap-5">
                  {second && <EditorialCard item={second} layout="side" />}
                  {third && <EditorialCard item={third} layout="side" />}
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div>
                <div className="mb-5 flex items-baseline justify-between">
                  <h2 className="font-serif text-3xl italic">Дальше по системе</h2>
                  <span className="font-mono text-xs text-muted-text">{rest.length} разделов</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {rest.map((item) => (
                    <EditorialCard key={item.id} item={item} layout="wide" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section id="demo" className="border-y border-line bg-surface/45">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-wider text-blood">живое демо</p>
              <h2 className="mt-3 font-serif text-4xl leading-none tracking-tight md:text-6xl">Черновик превращается в материал</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-text">
              Этот блок остаётся интерактивным, но получил общий редакционный контекст нового дизайна.
            </p>
          </div>
          <NewsImproverDemo />
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="mb-8 max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-blood">рабочий процесс</p>
          <h2 className="mt-3 font-serif text-4xl leading-none tracking-tight md:text-6xl">Не лендинг ради лендинга, а карта работающей системы</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-8 px-6 py-12">
          <div className="col-span-12 md:col-span-6">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-md bg-foreground font-mono text-sm font-bold text-background">R</span>
              <span className="text-[15px] font-semibold tracking-tight">Redactor<span className="text-blood">.</span>ai</span>
            </div>
            <p className="max-w-md font-serif text-lg leading-relaxed text-muted-text">
              Интерфейс для дипломного проекта: новости входят как данные, статьи выходят как редакционные задачи.
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-text">Разделы</p>
            <ul className="space-y-1.5 text-sm">
              <FooterLink href="/manual">Ручной режим</FooterLink>
              <FooterLink href="/queue">Очередь</FooterLink>
              <FooterLink href="/database">База новостей</FooterLink>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-3 md:text-right">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-text">Система</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-blood">
              Открыть dashboard
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function EditorialHeader({ today }: { today: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="border-b border-line/70">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-2 font-mono text-[11px] tracking-wide text-muted-text">
          <span className="flex items-center gap-2">
            <Circle className="size-1.5 fill-blood text-blood pulse-blood" />
            <span className="uppercase">В эфире</span>
            <span className="ml-2 text-foreground/70">{today}</span>
          </span>
          <span className="hidden md:inline">pipeline · groq · newsroom</span>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="На главную">
            <span className="grid size-8 place-items-center rounded-md bg-foreground font-mono text-sm font-bold text-background" aria-hidden>
              R
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">Redactor<span className="text-blood">.</span>ai</span>
              <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-text">редакция · 2026</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="#features" icon={Newspaper}>Система</NavLink>
            <NavLink href="#demo" icon={Sparkles}>Демо</NavLink>
            <NavLink href="/queue" icon={Archive}>Очередь</NavLink>
          </nav>
          <Link href="/manual" className="group inline-flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 text-sm font-medium text-background transition-colors hover:bg-blood">
            <PenLine className="size-4" />
            <span className="hidden sm:inline">Написать</span>
            <ArrowUpRight className="-mr-0.5 size-4 opacity-70 group-hover:opacity-100" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, icon: Icon, children }: { href: string; icon: ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-2 hover:text-foreground">
      <Icon className="size-4" />
      {children}
    </Link>
  )
}

function IssueSummary() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">Сводка системы</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-blood">
          <Activity className="size-3" />
          live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SummaryMetric label="маршрутов" value="8" />
        <SummaryMetric label="режима" value="2" />
        <SummaryMetric label="ревью" value="human" />
        <SummaryMetric label="AI" value="on" accent />
      </div>
    </div>
  )
}

function SummaryMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className={`font-serif text-4xl leading-none ${accent ? 'text-blood' : ''}`}>{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-text">{label}</div>
    </div>
  )
}

function QuotePanel() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-foreground p-5 text-background">
      <Quote className="absolute -right-2 -top-2 size-20 text-background/5" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-background/50">Принцип проекта</span>
      <p className="mt-3 text-balance font-serif text-xl italic leading-snug">
        «ИИ не заменяет редактора. Он убирает пустую работу до момента, где нужно человеческое решение.»
      </p>
    </div>
  )
}

function FocusPanel() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-text">
          <TrendingUp className="size-3" />
          В фокусе
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">24ч</span>
      </div>
      <ul className="space-y-2.5">
        {editorialItems.map((item, index) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-xs text-foreground/80">{item.topic}</span>
              <span className="font-mono text-[10px] text-muted-text tabular-nums">{item.metric}</span>
            </div>
            <div className="h-px overflow-hidden bg-surface-3">
              <div className="h-full bg-blood" style={{ width: `${100 - index * 18}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-wider text-muted-text">
        <Clock className="size-3" />
        обновлено из рабочей системы
      </div>
    </div>
  )
}

function EditorialCard({ item, layout }: { item: EditorialItem; layout: 'lead' | 'wide' | 'side' }) {
  if (layout === 'lead') {
    return (
      <Link href={item.href} className="group relative block rounded-2xl border border-line bg-surface p-8 transition-colors hover:border-foreground/40 md:p-10">
        <div className="mb-6 flex items-center gap-2">
          <TopicChip topic={item.topic} accent />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-text">{item.number}</span>
        </div>
        <h2 className="text-balance font-serif text-[clamp(2rem,4.5vw,4rem)] leading-[1.02] tracking-tight transition-colors group-hover:text-blood">{item.title}</h2>
        <p className="mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted-text">{item.excerpt}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-text">
          <span>{item.author}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{item.metric}</span>
        </div>
        <ArrowUpRight className="absolute right-6 top-6 size-5 text-muted-text/60 transition-all group-hover:rotate-12 group-hover:text-blood" />
      </Link>
    )
  }

  if (layout === 'wide') {
    return (
      <Link href={item.href} className="group flex flex-col gap-6 rounded-xl border border-line bg-surface p-6 transition-colors hover:border-foreground/40 md:flex-row md:gap-10">
        <div className="flex flex-shrink-0 gap-3 md:w-48 md:flex-col md:gap-2">
          <TopicChip topic={item.topic} />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-text">{item.number}</span>
          <span className="text-xs text-muted-text md:mt-auto">{item.metric}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-balance font-serif text-2xl leading-tight tracking-tight transition-colors group-hover:text-blood md:text-3xl">{item.title}</h3>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-text">{item.excerpt}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link href={item.href} className="group block rounded-xl border border-line bg-surface p-5 transition-colors hover:border-foreground/40">
      <div className="mb-3 flex items-center gap-2">
        <TopicChip topic={item.topic} small />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">{item.number}</span>
      </div>
      <h3 className="text-balance font-serif text-xl leading-snug tracking-tight transition-colors group-hover:text-blood">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-text">{item.excerpt}</p>
    </Link>
  )
}

function TopicChip({ topic, accent = false, small = false }: { topic: EditorialItem['topic']; accent?: boolean; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${accent ? 'border-blood/30 bg-blood/10 text-blood' : 'border-line bg-surface-2 text-foreground/80'} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'} font-mono uppercase tracking-wider`}>
      <Hash className={small ? 'size-2.5' : 'size-3'} />
      {topic}
    </span>
  )
}

function FeatureCard({ icon: Icon, title, text }: { icon: ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-foreground/30">
      <div className="mb-8 grid size-10 place-items-center rounded-md bg-foreground text-background">
        <Icon className="size-4" />
      </div>
      <h3 className="font-serif text-2xl leading-none tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-text">{text}</p>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-foreground/80 transition-colors hover:text-blood">
        {children}
      </Link>
    </li>
  )
}
