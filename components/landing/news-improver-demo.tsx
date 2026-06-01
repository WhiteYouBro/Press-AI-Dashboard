'use client'

import { useState } from 'react'
import { Sparkles, RotateCcw, Loader2, Check } from 'lucide-react'

const DRAFT = `вчера в центре города прошел митинг против повышения тарифов жкх. собрались около 500 человек, были пенсионеры и молодежь. люди держали плакаты типа "хватит грабить" и тд. полиция была но не вмешивалась. организатор сказал что они будут продолжать пока власти не услышат их. некоторые жители говорят что не могут платить такие деньги за коммуналку.`

const IMPROVED = `В центре Екатеринбурга 14 мая прошёл митинг против повышения тарифов на ЖКХ. По оценкам организаторов, акция собрала около 500 человек.

Среди участников были как пенсионеры, так и молодёжь. Демонстранты вышли с плакатами «Хватит грабить» и требованиями пересмотреть тарифную политику. Сотрудники полиции наблюдали за акцией, но не вмешивались в её ход.

«Мы будем продолжать акции до тех пор, пока власти не услышат жителей», заявил организатор митинга Андрей Соколов.

По словам участников, ежемесячные счета за коммунальные услуги в последние месяцы стали непосильными для семей с низкими доходами.`

export function NewsImproverDemo() {
  const [text, setText] = useState(DRAFT)
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'streaming' | 'done'>('idle')
  const [streamed, setStreamed] = useState('')
  const isBusy = phase === 'analyzing' || phase === 'streaming'
  const canImprove = text.trim().length > 0 && !isBusy

  async function improve() {
    if (!canImprove) return
    setPhase('analyzing')
    setStreamed('')
    await new Promise((r) => setTimeout(r, 900))
    setPhase('streaming')
    const words = IMPROVED.split(' ')
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 35))
      setStreamed((prev) => (prev ? prev + ' ' + words[i] : words[i]))
    }
    setPhase('done')
  }

  function reset() {
    setText(DRAFT)
    setStreamed('')
    setPhase('idle')
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[--border] bg-[--bg-surface] shadow-[0_1px_2px_oklch(0.2_0.006_255_/_0.04),0_34px_90px_oklch(0.2_0.006_255_/_0.11)]">
      {/* Editor header */}
      <div className="flex items-center justify-between border-b border-[--border] bg-[--bg-elevated] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[--border-strong]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[--text-tertiary]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[--text-primary]" />
          </div>
          <span className="ml-2 text-xs font-medium text-[--text-secondary]">
            draft-митинг-екб.md
          </span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-[--text-tertiary]">
          Черновик
        </span>
      </div>

      <div className="grid md:grid-cols-2 md:divide-x md:divide-[--border]">
        {/* Left: draft */}
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">
              Ваш текст
            </span>
            <span className="text-[11px] text-[--text-tertiary] tabular-nums">
              {text.length} символов
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-64 w-full resize-none rounded-[1.25rem] border border-[--border] bg-[--bg-base] p-4 text-sm leading-relaxed text-[--text-primary] shadow-inner shadow-[oklch(0.2_0.006_255_/_0.03)] transition-[border-color,box-shadow,background-color] placeholder:text-[--text-tertiary] focus:border-[--action] focus:outline-none focus:ring-4 focus:ring-[--action]/10"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={improve}
              disabled={!canImprove}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-[--action] px-4 py-2.5 text-sm font-semibold text-[--primary-foreground] shadow-[0_1px_0_oklch(1_0_0_/_0.1)_inset,0_14px_30px_oklch(0.2_0.006_255_/_0.18)] transition-[background-color,box-shadow,transform,opacity] hover:-translate-y-0.5 hover:bg-[--action-hover] hover:shadow-[0_1px_0_oklch(1_0_0_/_0.12)_inset,0_18px_36px_oklch(0.2_0.006_255_/_0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[--action]/15 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:bg-[--action]"
            >
              {phase === 'analyzing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Анализ стиля…
                </>
              ) : phase === 'streaming' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Редактирую…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Улучшить с помощью AI
                </>
              )}
            </button>
            {!text.trim() && (
              <span className="text-xs text-[--text-tertiary]">Добавьте текст, чтобы запустить демо</span>
            )}
            {phase === 'done' && (
              <button
                onClick={reset}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[--border] bg-[--bg-surface] px-3 py-2.5 text-sm font-semibold text-[--text-secondary] transition-[background-color,border-color,color] hover:border-[--border-strong] hover:bg-[--accent] hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[--action]/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Сбросить
              </button>
            )}
          </div>
        </div>

        {/* Right: improved */}
        <div className="bg-[linear-gradient(180deg,var(--accent-subtle),transparent_62%)] p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[--ai-accent]">
              <Sparkles className="h-3 w-3" />
              Версия AI
            </span>
            {phase === 'done' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[--border] bg-[--bg-subtle] px-2 py-0.5 text-[11px] font-medium text-[--text-primary]">
                <Check className="h-3 w-3" />
                Готово
              </span>
            )}
          </div>

          <div className="h-64 overflow-y-auto rounded-[1.25rem] border border-[--border] bg-[--bg-surface] p-4 text-sm leading-relaxed text-[--text-primary] shadow-inner shadow-[oklch(0.2_0.006_255_/_0.025)]">
            {phase === 'idle' && (
              <p className="text-[--text-tertiary] italic">
                Нажмите «Улучшить с помощью AI», чтобы превратить черновик в готовую новость по стандартам редакции.
              </p>
            )}
            {phase === 'analyzing' && (
              <div className="space-y-2 animate-fadeIn">
                <PipelineStep label="Проверка фактов" />
                <PipelineStep label="Определение инфоповода" />
                <PipelineStep label="Подбор стиля редакции" />
              </div>
            )}
            {(phase === 'streaming' || phase === 'done') && (
              <p className="whitespace-pre-wrap">
                {streamed}
                {phase === 'streaming' && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[--action] align-middle" />
                )}
              </p>
            )}
          </div>

          {phase === 'done' && (
            <div className="mt-4 grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
              <Metric label="Читабельность" value="92" />
              <Metric label="Соответствие стилю" value="88" />
              <Metric label="Фактчек" value="OK" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PipelineStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[--text-secondary]">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-[--action]" />
      {label}…
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--bg-surface] px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[--text-tertiary]">{label}</div>
      <div className="text-sm font-semibold tabular-nums text-[--text-primary]">{value}</div>
    </div>
  )
}
