type LoaderProps = {
  label?: string
}

export function Loader({ label = 'Подготавливаем материал' }: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 font-mono text-xs text-muted-text"
    >
      <span className="relative inline-flex h-1 w-10 overflow-hidden rounded-full bg-surface-3">
        <span className="absolute inset-y-0 left-0 w-1/3 bg-blood animate-[ticker_1.2s_linear_infinite]" />
      </span>
      <span className="text-foreground/80">
        {label}
        <span className="caret-blink" />
      </span>
    </div>
  )
}

export function ArticleSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-20 rounded-full bg-surface-2" />
        <div className="h-4 w-12 rounded bg-surface-2" />
      </div>
      <div className="space-y-3">
        <div className="h-7 w-5/6 rounded bg-surface-2" />
        <div className="h-7 w-2/3 rounded bg-surface-2" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-surface-2/70" />
        <div className="h-3 w-4/5 rounded bg-surface-2/70" />
      </div>
    </div>
  )
}
