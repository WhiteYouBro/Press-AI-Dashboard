'use client'

import { type ClipboardEvent, type MouseEvent, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bold, Heading2, Italic, Link2, List, Loader2, Pilcrow, Quote, Sparkles, Type } from 'lucide-react'
import { getManualArticleStatus, processManualArticle, toArticleDetail, type ArticleDetail } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const rubrics = [
  'Политика',
  'Экономика',
  'Происшествия',
  'Криминал',
  'Право',
  'Общество',
  'Мир',
  'Наука',
  'Здоровье',
  'Образование',
  'Культура',
  'Спорт',
  'Технологии',
  'Транспорт',
  'Экология',
  'Недвижимость',
]

const fontOptions = [
  { value: 'font-sans', label: 'Обычный' },
  { value: 'font-serif', label: 'Газетный' },
  { value: 'font-mono', label: 'Черновик' },
]

const rejectedPastePhrases = [
  'авторов комментариев',
  'на указанный вами телефон',
  'будет отправлен код доступа',
  'введите его',
  'tengri id',
  'единый вход для сервисов',
  'нажимая кнопку входа',
  'пользовательского соглашения',
  'политику конфиденциальности',
  'пароль должен быть',
  'введите код активации',
  'неприемлемый контент',
  'показать комментарии',
  'комментарии к материалу',
  'оставить комментарий',
  'войдите',
  'зарегистрируйтесь',
  'читайте также',
  'похожие новости',
  'другие новости',
  'самое читаемое',
  'самое обсуждаемое',
  'обсуждаемое сейчас',
  'материал подготовлен в автоматическом режиме',
]

const stopPastePhrases = [
  'авторов комментариев',
  'на указанный вами телефон',
  'tengri id',
  'комментарии к материалу',
  'читайте также',
  'похожие новости',
  'другие новости',
  'самое читаемое',
  'самое обсуждаемое',
  'обсуждаемое сейчас',
]

type ActiveFormats = {
  bold: boolean
  italic: boolean
  h2: boolean
  blockquote: boolean
  list: boolean
  link: boolean
}

export default function ManualPage() {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [text, setText] = useState('')
  const [rubric, setRubric] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState('')
  const [editorFont, setEditorFont] = useState('font-sans')
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    h2: false,
    blockquote: false,
    list: false,
    link: false,
  })

  const updateToolbarState = () => {
    const selection = document.getSelection()
    const activeNode = selection?.anchorNode
    const activeElement = activeNode instanceof Element ? activeNode : activeNode?.parentElement
    const block = String(document.queryCommandValue('formatBlock') || '').toLowerCase()

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      h2: block === 'h2',
      blockquote: block === 'blockquote',
      list: document.queryCommandState('insertUnorderedList'),
      link: Boolean(activeElement?.closest('a')),
    })
  }

  useEffect(() => {
    document.addEventListener('selectionchange', updateToolbarState)
    return () => document.removeEventListener('selectionchange', updateToolbarState)
  }, [])

  const syncEditor = () => {
    setText(editorRef.current?.innerHTML || '')
  }

  const runEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncEditor()
    requestAnimationFrame(updateToolbarState)
  }

  const escapeHtml = (value: string) => (
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  )

  const normalizeLegacyTags = () => {
    const editor = editorRef.current
    if (!editor) return
    const currentText = editor.textContent || ''
    if (!currentText.includes('<') || !currentText.includes('>')) return
    const normalizedHtml = escapeHtml(currentText)
      .replace(/&lt;(\/?)(strong|em|h2|blockquote|p|ul|li)&gt;/g, '<$1$2>')
      .replace(/&lt;a href=&quot;([^"]*)&quot;&gt;/g, '<a href="$1">')
      .replace(/&lt;\/a&gt;/g, '</a>')
    if (normalizedHtml === currentText) return
    editor.innerHTML = normalizedHtml
    syncEditor()
  }

  const insertHtml = (html: string) => {
    runEditorCommand('insertHTML', html)
  }

  const normalizePastedText = (value: string) => (
    value
      .replace(/\r\n/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )

  const removePastedNoise = (value: string) => {
    const lines: string[] = []

    for (const line of normalizePastedText(value).split('\n')) {
      const textLine = line.trim()
      const lower = textLine.toLowerCase()
      if (!textLine) {
        lines.push('')
        continue
      }
      if (stopPastePhrases.some((phrase) => lower.includes(phrase))) {
        break
      }
      if (!rejectedPastePhrases.some((phrase) => lower.includes(phrase))) {
        lines.push(textLine)
      }
    }

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  const textToParagraphHtml = (value: string) => (
    removePastedNoise(value)
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('')
  )

  const handleEditorPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const plain = event.clipboardData.getData('text/plain') || ''
    const html = event.clipboardData.getData('text/html') || ''
    const fallback = html ? new DOMParser().parseFromString(html, 'text/html').body.textContent || '' : ''
    const pastedHtml = textToParagraphHtml(plain || fallback)

    if (pastedHtml) {
      insertHtml(pastedHtml)
    }
  }

  const createLink = () => {
    const url = window.prompt('Вставьте ссылку')
    if (url) runEditorCommand('createLink', url)
  }

  const plainText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  const keepEditorSelection = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }
  const toolbarButtonClass = (active: boolean) => (
    active
      ? 'manual-toolbar-button manual-toolbar-button-active'
      : 'manual-toolbar-button'
  )

  const pollStatus = async (taskId: string) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const result = await getManualArticleStatus(taskId)

      if (result.status === 'failed') {
        throw new Error(result.error || 'AI обработка завершилась с ошибкой')
      }

      if (result.status === 'done' && result.article) {
        setArticle(toArticleDetail(result.article))
        setStep(3)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error('AI обработка заняла слишком много времени. Попробуйте проверить статус позже.')
  }

  const handleAnalyze = async () => {
    setError('')
    setStep(2)

    try {
      const result = await processManualArticle(text, rubric, sourceUrl)
      await pollStatus(result.task_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить текст на обработку')
      setStep(1)
    }
  }

  if (step === 2) {
    return (
      <div className="mx-auto mt-24 max-w-2xl text-center">
        <div className="mb-6">
          <Loader2 className="w-12 h-12 text-[--ai-accent] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[--text-primary] mb-2">
            AI анализирует текст
          </h2>
        </div>
        
        <div className="space-y-3 rounded-2xl border border-[--border] bg-[--bg-surface] p-6 text-left">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-[--text-primary]" />
            <span className="text-[--text-primary]">Анализирую структуру текста...</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-[--text-primary]" />
            <span className="text-[--text-primary]">Определяю ключевые факты...</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-[--text-secondary] animate-pulse" />
            <span className="text-[--text-secondary]">Генерирую заголовки...</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-[--border]" />
            <span className="text-[--text-tertiary]">Формирую редакторские подсказки...</span>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <h2 className="text-lg font-semibold text-[--text-primary]">
            Что получилось
          </h2>
          
          <Card className="bg-[--bg-surface] p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[--text-tertiary] mb-2">Варианты заголовка</p>
                <div className="space-y-2">
                  {(article?.titleVariants.length ? article.titleVariants : [article?.title]).filter(Boolean).map((title, i) => (
                    <button
                      key={i}
                      className="w-full p-3 text-left text-sm border border-[--border] rounded-md hover:border-[--accent] hover:bg-[--accent-subtle] transition-colors"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-[--text-tertiary] mb-2">Готовый лид</p>
                <p className="text-sm text-[--text-primary] leading-relaxed">
                  {article?.lead}
                </p>
              </div>

              <div>
                <p className="text-xs text-[--text-tertiary] mb-2">Готовый текст</p>
                <p className="text-sm text-[--text-primary] leading-relaxed whitespace-pre-line">
                  {article?.fullText}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-24 bg-[--bg-surface] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[--text-secondary] mb-4">
              Оценка и рекомендации
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-[--text-tertiary] mb-1">Оценка исходника</p>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">AI Score: {article?.aiScore}/10</Badge>
                  <Badge variant="outline" className="text-xs">{article?.rubric}</Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-[--text-tertiary] mb-2">Что ИИ улучшил</p>
                <ul className="space-y-1 text-xs text-[--text-secondary]">
                  {(article?.hints.length ? article.hints : [{ message: article?.aiScoreReason || 'AI подготовил материал для редакционной проверки' }]).map((hint, index) => (
                    <li key={index}>- {hint.message}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[--border] space-y-2">
                <Button className="w-full" onClick={() => window.location.href = article ? `/article/${article.id}/review` : '/queue'}>
                  Отправить в очередь
                </Button>
                <Button variant="outline" className="w-full">
                  Скачать .docx
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 sm:p-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[--text-tertiary]">
          ручной запуск
        </p>
        <h1 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-[--text-primary] sm:text-4xl">
          Ручной режим
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[--text-secondary]">
          Вставьте сырой текст, черновик или набор фактов для редакционной обработки.
        </p>
      </div>

      <Card className="bg-[--bg-surface] p-5 sm:p-7">
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <label className="block text-sm font-medium text-[--text-primary]">
                  Исходный материал
                </label>
                <p className="mt-1 text-xs leading-5 text-[--text-tertiary]">
                  Выделите фрагмент и примените форматирование, или вставьте готовый редакционный блок.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Type size={15} className="text-[--text-tertiary]" />
                <Select value={editorFont} onValueChange={setEditorFont}>
                  <SelectTrigger size="sm" className="w-[150px] bg-[--bg-base]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-0 flex flex-wrap gap-2 rounded-t-2xl border border-[--border] bg-[--bg-base] p-2.5">
              <Button type="button" variant="outline" size="sm" aria-pressed={activeFormats.bold} data-active={activeFormats.bold} className={toolbarButtonClass(activeFormats.bold)} onMouseDown={keepEditorSelection} onClick={() => runEditorCommand('bold')}>
                <Bold size={14} />
                Жирный
              </Button>
              <Button type="button" variant="outline" size="sm" aria-pressed={activeFormats.italic} data-active={activeFormats.italic} className={toolbarButtonClass(activeFormats.italic)} onMouseDown={keepEditorSelection} onClick={() => runEditorCommand('italic')}>
                <Italic size={14} />
                Курсив
              </Button>
              <Button type="button" variant="outline" size="sm" aria-pressed={activeFormats.h2} data-active={activeFormats.h2} className={toolbarButtonClass(activeFormats.h2)} onMouseDown={keepEditorSelection} onClick={() => runEditorCommand('formatBlock', '<h2>')}>
                <Heading2 size={14} />
                Подзаголовок
              </Button>
              <Button type="button" variant="outline" size="sm" aria-pressed={activeFormats.blockquote} data-active={activeFormats.blockquote} className={toolbarButtonClass(activeFormats.blockquote)} onMouseDown={keepEditorSelection} onClick={() => runEditorCommand('formatBlock', '<blockquote>')}>
                <Quote size={14} />
                Цитата
              </Button>
              <Button type="button" variant="outline" size="sm" aria-pressed={activeFormats.list} data-active={activeFormats.list} className={toolbarButtonClass(activeFormats.list)} onMouseDown={keepEditorSelection} onClick={() => runEditorCommand('insertUnorderedList')}>
                <List size={14} />
                Список
              </Button>
              <Button type="button" variant="outline" size="sm" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand('formatBlock', '<p>')}>
                <Pilcrow size={14} />
                Абзац
              </Button>
              <Button type="button" variant="outline" size="sm" aria-pressed={activeFormats.link} data-active={activeFormats.link} className={toolbarButtonClass(activeFormats.link)} onMouseDown={keepEditorSelection} onClick={createLink}>
                <Link2 size={14} />
                Ссылка
              </Button>
              <Button type="button" variant="outline" size="sm" onMouseDown={keepEditorSelection} onClick={() => insertHtml('<p><strong>Факт:</strong> </p>')}>
                Факт
              </Button>
            </div>
            <div className="relative">
              {!plainText && (
                <div className="manual-editor-placeholder pointer-events-none absolute left-5 top-5 max-w-3xl whitespace-pre-line text-base leading-7">
                  Пример:
                  {'\n\n'}Сегодня в 14:00 мэр Москвы рассказал о новой программе поддержки бизнеса...
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                  syncEditor()
                  normalizeLegacyTags()
                }}
                onBlur={syncEditor}
                onFocus={updateToolbarState}
                onKeyUp={updateToolbarState}
                onMouseUp={updateToolbarState}
                onPaste={handleEditorPaste}
                className={`manual-rich-editor min-h-[52vh] w-full rounded-b-2xl border border-t-0 border-input bg-[--bg-surface] px-5 py-5 text-base leading-7 shadow-xs outline-none transition-[border-color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 ${editorFont}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[--text-primary] mb-2">
                Рубрика
              </label>
              <Select value={rubric} onValueChange={setRubric}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите рубрику" />
                </SelectTrigger>
                <SelectContent>
                  {rubrics.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[--text-primary] mb-2">
                URL источника (опционально)
              </label>
              <Input
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!plainText || !rubric}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2" size={16} />
            Анализировать и переписать
          </Button>
          {error && (
            <p className="rounded-md border border-[--border-strong] bg-[--bg-subtle] p-3 text-sm text-[--text-primary]">
              {error}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
