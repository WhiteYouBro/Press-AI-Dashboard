'use client'

import Link from 'next/link'
import { PenLine, Newspaper, Archive, Circle, ArrowUpRight } from 'lucide-react'

type HeaderProps = {
  variant?: 'default' | 'compact'
}

export function Header({ variant = 'default' }: HeaderProps) {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-md">
      {variant === 'default' && (
        <div className="border-b border-line/70">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-2 font-mono text-[11px] tracking-wide text-muted-text">
            <span className="flex items-center gap-2">
              <Circle className="size-1.5 fill-blood text-blood pulse-blood" />
              <span className="uppercase">В эфире</span>
              <span className="ml-2 text-foreground/70">{today}</span>
            </span>
            <span className="hidden md:inline">v.0.1 · build 2026.05</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="На главную">
            <span
              className="grid size-8 place-items-center rounded-md bg-foreground text-background font-mono text-sm font-bold"
              aria-hidden
            >
              0/1
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-sans text-[15px] font-semibold tracking-tight">
                НОЛЬ<span className="text-blood">/</span>ОДИН
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-text mt-0.5">
                редакция · 2026
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" icon={<Newspaper className="size-4" />}>
              Лента
            </NavLink>
            <NavLink href="/create" icon={<PenLine className="size-4" />}>
              Редактор
            </NavLink>
            <span className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-sans text-sm text-muted-text/70 cursor-not-allowed">
              <Archive className="size-4" />
              Архив
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="group inline-flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 font-sans text-sm font-medium text-background hover:bg-blood transition-colors"
            >
              <PenLine className="size-4" />
              <span className="hidden sm:inline">Написать</span>
              <ArrowUpRight className="size-4 -mr-0.5 opacity-70 group-hover:opacity-100" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-sans text-sm text-foreground/80 hover:bg-surface-2 hover:text-foreground transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}
