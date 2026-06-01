import { Image, Quote, BarChart3, Link2, LucideIcon } from 'lucide-react'

interface EditorHintProps {
  type: 'image' | 'quote' | 'data' | 'link'
  message: string
  priority?: 'high' | 'medium' | 'low'
}

const iconMap: Record<string, LucideIcon> = {
  image: Image,
  quote: Quote,
  data: BarChart3,
  link: Link2
}

export function EditorHint({ type, message, priority = 'medium' }: EditorHintProps) {
  const Icon = iconMap[type]
  
  return (
    <div className="my-6 rounded-xl border border-[--border] bg-[--bg-subtle] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-[--text-primary] p-1.5 text-[--primary-foreground]">
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider mb-1">
            Подсказка редактора {priority === 'high' && '· Приоритет: высокий'}
          </p>
          <p className="text-sm text-[--text-primary]">{message}</p>
        </div>
      </div>
    </div>
  )
}
