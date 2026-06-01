'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Send, CheckCircle2, FileText, Type, Clock } from 'lucide-react'
import { Header } from '@/components/Header'
import { AiSidebar } from '@/components/AiSidebar'

export default function CreatePage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [published, setPublished] = useState(false)

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length
  const readMin = Math.max(1, Math.round(wordCount / 180))

  const handleInsert = (text: string) => {
    setBody((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  const handleDraft = () => {
    setSavedAt(
      new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  const handlePublish = () => {
    if (!title.trim() || !body.trim()) return
    setPublished(true)
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header variant="compact" />

      {/* Подзаголовок страницы */}
      <div className="border-b border-line bg-surface/60">
        <div className="mx-auto max-w-[1500px] px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="grid size-9 place-items-center rounded-md border border-line bg-surface hover:bg-surface-2"
              aria-label="Назад"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-blood">
                Редактор · Новый материал
              </p>
              <h1 className="mt-0.5 font-sans text-xl font-semibold tracking-tight">
                Пишите. Машина рядом — не вместо.
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-5 font-sans text-xs text-muted-text">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" /> {wordCount} слов
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" /> ~{readMin} мин
            </span>
            <span
              className={`inline-flex items-center gap-1.5 ${
                savedAt ? 'text-foreground/80' : 'text-muted-text'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  savedAt ? 'bg-emerald-600' : 'bg-muted-text/60'
                }`}
              />
              {savedAt ? `Сохранено в ${savedAt}` : 'Не сохранено'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-[1500px] w-full px-6 py-8 grid grid-cols-12 gap-6">
        {/* Редактор */}
        <section className="col-span-12 lg:col-span-8 flex flex-col">
          <div className="rounded-2xl border border-line bg-surface p-6 md:p-10 flex flex-col flex-1">
            <label className="flex items-center gap-2 font-sans text-xs font-medium text-muted-text mb-2">
              <Type className="size-3.5" />
              Заголовок
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок, который не стыдно поставить на полосу"
              className="w-full bg-transparent font-serif text-[clamp(1.75rem,3.8vw,3rem)] leading-[1.05] tracking-tight border-b border-line pb-4 focus:outline-none focus:border-blood placeholder:text-muted-text/40"
            />

            <label className="mt-8 flex items-center gap-2 font-sans text-xs font-medium text-muted-text mb-2">
              <FileText className="size-3.5" />
              Текст статьи
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Начните с лида. Одна мысль — один абзац. Не объясняйте — показывайте."
              className="flex-1 min-h-[55vh] w-full resize-none bg-transparent font-serif text-lg md:text-xl leading-relaxed focus:outline-none placeholder:text-muted-text/40"
            />
          </div>

          <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
            <button
              type="button"
              onClick={handleDraft}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface px-5 py-2.5 font-sans text-sm font-medium hover:bg-surface-2"
            >
              <Save className="size-4" />
              Сохранить черновик
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!title.trim() || !body.trim() || published}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-5 py-2.5 font-sans text-sm font-medium text-background hover:bg-blood transition-colors disabled:opacity-40 disabled:hover:bg-foreground"
            >
              {published ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Опубликовано
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Опубликовать
                </>
              )}
            </button>
            <Link
              href="/"
              className="md:ml-auto inline-flex items-center gap-1.5 font-sans text-sm text-muted-text hover:text-blood"
            >
              <ArrowLeft className="size-4" />
              Вернуться в ленту
            </Link>
          </div>
        </section>

        {/* ИИ-боковик */}
        <section className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start">
          <AiSidebar onInsert={handleInsert} />
        </section>
      </div>
    </main>
  )
}
