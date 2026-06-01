import { Sparkles } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="border-t border-[--border] bg-[--bg-surface]/72">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[1.5rem] border border-[--border] bg-[--bg-base] p-5 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[--action]">
              <Sparkles className="h-3.5 w-3.5 text-[--primary-foreground]" />
            </div>
            <span className="text-sm font-semibold">Redactor.ai</span>
            <span className="text-xs text-[--text-tertiary] ml-2">
              Дипломный проект, {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex gap-6 text-sm text-[--text-secondary]">
            <a href="#demo" className="hover:text-[--text-primary]">Демо</a>
            <a href="#features" className="hover:text-[--text-primary]">Возможности</a>
            <a href="#cases" className="hover:text-[--text-primary]">Примеры</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
