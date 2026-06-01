import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getPipelineSettings } from '@/lib/api'

export default async function SettingsPage() {
  const settings = await getPipelineSettings()

  return (
    <div className="max-w-4xl space-y-7 animate-fadeIn">
      <div className="border-b border-[--border] pb-5">
        <h1 className="text-3xl font-semibold tracking-[-0.055em] text-[--text-primary] mb-1">
          Настройки
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[--text-secondary]">
          Управление AI-пайплайном и параметрами обработки
        </p>
      </div>

      <Card className="p-6 bg-[--bg-surface] border-[--border]">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[--text-secondary] mb-4">
          AI-пайплайн
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-pipeline">Автоматический прогон</Label>
              <p className="text-xs text-[--text-secondary] mt-1">
                Запускать анализ новостей по расписанию
              </p>
            </div>
            <Switch id="auto-pipeline" defaultChecked />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[--border]">
            <div>
              <Label htmlFor="pipeline-interval">Интервал прогона (минуты)</Label>
              <p className="text-xs text-[--text-secondary] mt-1">
                Как часто запускать автоматическую обработку
              </p>
            </div>
            <Input
              id="pipeline-interval"
              type="number"
              defaultValue={settings.pipeline_interval_minutes}
              className="w-20"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[--border]">
            <div>
              <Label htmlFor="min-score">Количество новостей для отбора</Label>
              <p className="text-xs text-[--text-secondary] mt-1">
                Сколько лучших новостей отправлять в AI-пайплайн
              </p>
            </div>
            <Input
              id="min-score"
              type="number"
              step="0.1"
              defaultValue={settings.top_news_count}
              className="w-20"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-[--bg-surface] border-[--border]">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[--text-secondary] mb-4">
          Модель и веса ранжирования
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="model">OpenAI model</Label>
            <Input id="model" defaultValue={settings.openai_model} className="mt-2" readOnly />
          </div>

          <div className="pt-4 border-t border-[--border]">
            <Label>Веса отбора новостей</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {Object.entries(settings.ranking_weights).map(([key, value]) => (
                <div key={key} className="rounded-md border border-[--border] bg-[--bg-subtle] p-3">
                  <p className="text-xs uppercase tracking-wider text-[--text-tertiary]">{key}</p>
                  <p className="text-xl font-semibold tracking-[-0.04em] text-[--text-primary]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-[--bg-surface] border-[--border]">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[--text-secondary] mb-4">
          Источники новостей
        </h3>
        <div className="space-y-3">
          {['ТАСС', 'РИА Новости', 'Интерфакс', 'Коммерсантъ', 'Ведомости', 'RBC'].map(
            (source) => (
              <div
                key={source}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-[--text-primary]">{source}</span>
                <Switch defaultChecked />
              </div>
            )
          )}
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Отменить</Button>
        <Button>
          Сохранить изменения
        </Button>
      </div>
    </div>
  )
}
