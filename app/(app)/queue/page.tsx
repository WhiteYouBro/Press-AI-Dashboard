import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QueueCard } from '@/components/app/queue-card'
import { Card } from '@/components/ui/card'
import { getQueueArticles } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default async function QueuePage() {
  const articles = await getQueueArticles()
  const pendingArticles = articles.filter((article) => article.status === 'pending')
  const approvedArticles = articles.filter((article) => article.status === 'approved')
  const rejectedArticles = articles.filter((article) => article.status === 'rejected')

  const renderArticles = (items: typeof articles, emptyText: string) => (
    items.length ? (
      items.map((article) => (
        <QueueCard key={article.id} article={article} />
      ))
    ) : (
      <Card className="bg-[--bg-surface] p-6 text-sm text-[--text-secondary]">
        {emptyText}
      </Card>
    )
  )

  return (
    <div className="mx-auto max-w-[88rem] space-y-6">
      <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 sm:p-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[--text-tertiary]">
          выпускной стол
        </p>
        <h1 className="mb-2 text-3xl font-semibold tracking-[-0.055em] text-[--text-primary] sm:text-4xl">
          Очередь на проверку
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[--text-secondary]">
          Материалы после обработки, их статус и следующий редакторский шаг.
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="pending">Ожидают</TabsTrigger>
          <TabsTrigger value="approved">Одобрены</TabsTrigger>
          <TabsTrigger value="rejected">Отклонены</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {renderArticles(articles, 'В очереди пока нет статей.')}
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {renderArticles(pendingArticles, 'Нет статей, ожидающих проверки.')}
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-4">
          {renderArticles(approvedArticles, 'Нет одобренных статей.')}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-4">
          {renderArticles(rejectedArticles, 'Нет отклонённых статей.')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
