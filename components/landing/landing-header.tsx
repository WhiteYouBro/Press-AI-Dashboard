import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function LandingHeader() {
  return (
    <header className="sticky top-3 z-40 w-full px-3">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border border-[--border] bg-[--bg-surface] px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[--action]">
            <Sparkles className="h-4 w-4 text-[--primary-foreground]" />
          </div>
          <span className="text-base font-semibold tracking-[-0.02em]">Redactor.ai</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-[--bg-base]/80 p-1 text-sm text-[--text-secondary] md:flex">
          <a href="#demo" className="rounded-full px-3 py-1.5 transition hover:bg-[--bg-surface] hover:text-[--text-primary]">Демо</a>
          <a href="#features" className="rounded-full px-3 py-1.5 transition hover:bg-[--bg-surface] hover:text-[--text-primary]">Возможности</a>
          <a href="#how" className="rounded-full px-3 py-1.5 transition hover:bg-[--bg-surface] hover:text-[--text-primary]">Как это работает</a>
          <a href="#cases" className="rounded-full px-3 py-1.5 transition hover:bg-[--bg-surface] hover:text-[--text-primary]">Примеры</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden items-center rounded-full border border-[--border] bg-[--bg-surface] px-3.5 py-2 text-sm font-semibold text-[--text-secondary] transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-[--border-strong] hover:bg-[--accent] hover:text-[--text-primary] sm:inline-flex"
          >
            Войти в редакцию
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-[--action] px-3.5 py-2 text-sm font-semibold text-[--primary-foreground] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[--action-hover]"
          >
            Попробовать
          </Link>
        </div>
      </div>
    </header>
  )
}
