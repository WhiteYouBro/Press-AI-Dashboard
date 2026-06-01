'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Square, Send, ArrowDown, Wand2 } from 'lucide-react'

type AiSidebarProps = {
  onInsert: (text: string) => void
}

const SAMPLE_RESPONSES: Record<string, string> = {
  default: `Этот сюжет лучше всего раскрывается через конкретного героя — журналиста, который впервые отдал расшифровку нейросети и обнаружил, что освободившиеся два часа в день сначала пугают, а потом меняют профессию.

Дальше — сухие цифры: согласно исследованию Reuters Institute, 47% редакций уже используют ИИ для обработки источников. Но цифры стоит разбавить голосом редактора, который скажет вслух то, что все думают про себя.

Финал — не оптимистичный и не алармистский. Просто наблюдение: профессия меняет форму, как меняла её каждые двадцать лет последние две сотни.`,
  улучш: `Уберите три первых прилагательных из лида — они работают как амортизаторы, гасят удар. Замените «значительно повлиять» на конкретный глагол. Перенесите цитату эксперта выше: она сильнее любого вступления.

И выкиньте слово «инновационный». Оно не значит ничего.`,
  заголов: `Несколько вариантов:

1. «Машина, которая училась писать у нас»
2. «Тихий переворот в редакциях»
3. «ИИ принят на ставку младшего репортёра»

Третий — самый сильный: конкретный, чуть ироничный, оставляет вопрос.`,
}

function pickResponse(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('улучш') || p.includes('перепиш')) return SAMPLE_RESPONSES['улучш']
  if (p.includes('заголов')) return SAMPLE_RESPONSES['заголов']
  return SAMPLE_RESPONSES.default
}

const QUICK = [
  'Сгенерировать черновик',
  'Улучшить текст',
  'Заголовок',
]

export function AiSidebar({ onInsert }: AiSidebarProps) {
  const [prompt, setPrompt] = useState('')
  const [streamed, setStreamed] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleGenerate = () => {
    if (!prompt.trim() || isStreaming) return
    const full = pickResponse(prompt)
    setStreamed('')
    setIsStreaming(true)

    let i = 0
    intervalRef.current = setInterval(() => {
      i += 2
      setStreamed(full.slice(0, i))
      if (i >= full.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsStreaming(false)
      }
    }, 18)
  }

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsStreaming(false)
  }

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-line bg-surface overflow-hidden">
      {/* шапка */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-foreground text-background">
            <Sparkles className="size-3.5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-sans text-sm font-semibold">ИИ-соавтор</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">
              gpt-редактор
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            isStreaming
              ? 'bg-blood/10 text-blood'
              : 'bg-surface-2 text-muted-text'
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              isStreaming ? 'bg-blood pulse-blood' : 'bg-muted-text/60'
            }`}
          />
          {isStreaming ? 'печатает' : 'готов'}
        </span>
      </div>

      {/* поле запроса */}
      <div className="border-b border-line p-5">
        <label
          htmlFor="ai-prompt"
          className="block font-sans text-xs font-medium text-muted-text mb-2"
        >
          Запрос к ассистенту
        </label>
        <div className="relative rounded-lg border border-line bg-background focus-within:border-blood transition-colors">
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Например: «Предложи три варианта заголовка»"
            className="w-full resize-none bg-transparent px-3.5 py-3 font-sans text-[15px] leading-relaxed focus:outline-none placeholder:text-muted-text/60"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setPrompt(q)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 font-sans text-xs text-foreground/80 hover:border-foreground/30 hover:text-foreground transition-colors"
            >
              <Wand2 className="size-3" />
              {q}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isStreaming || !prompt.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 font-sans text-sm font-medium text-background hover:bg-blood transition-colors disabled:opacity-40 disabled:hover:bg-foreground"
          >
            <Send className="size-4" />
            {isStreaming ? 'Генерирую…' : 'Сгенерировать'}
          </button>
          {isStreaming && (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-blood/40 bg-blood/10 px-3 py-2.5 font-sans text-sm text-blood hover:bg-blood hover:text-blood-ink transition-colors"
            >
              <Square className="size-3.5 fill-current" />
              Стоп
            </button>
          )}
        </div>
      </div>

      {/* ответ */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-xs font-medium text-muted-text">
            Ответ ассистента
          </span>
          {streamed && !isStreaming && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-text">
              {streamed.length} зн.
            </span>
          )}
        </div>
        {streamed ? (
          <div className="font-serif text-[16px] leading-relaxed whitespace-pre-wrap text-pretty text-foreground/90">
            {streamed}
            {isStreaming && <span className="caret-blink text-blood" aria-hidden />}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-background p-5">
            <p className="font-serif italic text-muted-text text-[15px] leading-relaxed">
              «Хорошая статья начинается с правильного вопроса. Задайте его — и
              я попробую помочь».
            </p>
          </div>
        )}
      </div>

      {/* футер */}
      <div className="border-t border-line p-4">
        <button
          type="button"
          disabled={!streamed || isStreaming}
          onClick={() => onInsert(streamed)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface-2 px-4 py-2.5 font-sans text-sm font-medium text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:hover:bg-surface-2 disabled:hover:text-foreground"
        >
          <ArrowDown className="size-4" />
          Вставить в статью
        </button>
      </div>
    </aside>
  )
}
