'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Inbox,
  Edit3,
  BarChart3,
  Database,
  Settings,
  User,
  LogOut
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/lib/api'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/queue', icon: Inbox, label: 'Очередь на проверку', badge: 7 },
  { href: '/manual', icon: Edit3, label: 'Ручной ввод' },
  { href: '/analytics', icon: BarChart3, label: 'Аналитика' },
  { href: '/database', icon: Database, label: 'База новостей' },
  { href: '/settings', icon: Settings, label: 'Настройки' }
]

interface StoredUser {
  username: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }

    const handleStorage = () => {
      const s = localStorage.getItem('user')
      setUser(s ? JSON.parse(s) : null)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleLogout = async () => {
    try { await logout() } catch {}
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden h-screen w-[288px] flex-col border-r border-[--border] bg-[--bg-surface] lg:sticky lg:top-0 lg:flex">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="block rounded-xl border border-[--border] bg-[--bg-base] p-4 transition-[background-color,border-color] hover:border-[--border-strong] hover:bg-[--bg-elevated]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[--text-tertiary]">
            редакционный пульт
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[--text-primary]">Redactor.ai</h1>
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-[background-color,color,border-color] duration-200
                ${isActive
                  ? 'bg-[--text-primary] text-[--primary-foreground]'
                  : 'text-[--text-secondary] hover:bg-[--bg-subtle] hover:text-[--text-primary]'
                }
              `}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant={isActive ? 'outline' : 'secondary'} className={`text-[11px] ${isActive ? 'border-[oklch(0.978_0.004_255_/_0.22)] bg-[oklch(0.978_0.004_255_/_0.1)] text-[--primary-foreground]' : ''}`}>
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[--border] p-3">
        {user ? (
          <div className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] bg-[--bg-elevated] text-[--text-primary]">
              <User size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[--text-primary] truncate">{user.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] transition-colors hover:bg-[--bg-subtle] hover:text-[--text-primary]"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-subtle] hover:text-[--text-primary]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] bg-[--bg-elevated] text-[--text-primary]">
              <User size={15} />
            </div>
            <span className="font-medium">Войти</span>
          </Link>
        )}
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-[background-color,border-color,color] ${
              isActive
                ? 'border-[--text-primary] bg-[--text-primary] text-[--primary-foreground]'
                : 'border-[--border] bg-[--bg-base] text-[--text-secondary] hover:border-[--border-strong] hover:text-[--text-primary]'
            }`}
          >
            <Icon size={14} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
