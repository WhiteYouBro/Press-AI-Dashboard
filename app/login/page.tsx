'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(username, password)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[--bg-base] p-6">
      <Card className="w-full max-w-md border-[--border] bg-[--bg-surface] p-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[--text-tertiary]">
            AI newsroom
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[--text-primary]">Вход редактора</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Войдите, чтобы запускать ручную обработку и управлять статьями.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-md border border-[--border-strong] bg-[--bg-subtle] p-3 text-sm text-[--text-primary]">
              {error}
            </p>
          )}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Входим...' : 'Войти'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
