export interface QueueArticle {
  id: string
  title: string
  lead: string
  rubric: string
  aiScore: number
  sourceUrl: string
  sourceViews: number
  sourceCtr: number
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface PipelineLog {
  id: string
  timestamp: string
  type: 'analysis' | 'approved' | 'refresh' | 'rejected'
  message: string
}

export const mockQueueArticles: QueueArticle[] = [
  {
    id: '1',
    title: 'Мэр Москвы объявил о новой программе поддержки малого бизнеса',
    lead: 'Сергей Собянин представил инициативу по снижению административной нагрузки на предпринимателей.',
    rubric: 'Политика',
    aiScore: 9.4,
    sourceUrl: 'https://ria.ru/example',
    sourceViews: 124000,
    sourceCtr: 5.1,
    timestamp: '14:32',
    status: 'pending'
  },
  {
    id: '2',
    title: 'Центробанк повысил ключевую ставку до 18% годовых',
    lead: 'Решение принято на фоне растущей инфляции и укрепления рубля.',
    rubric: 'Экономика',
    aiScore: 9.2,
    sourceUrl: 'https://tass.ru/example',
    sourceViews: 98000,
    sourceCtr: 4.8,
    timestamp: '14:15',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Российские учёные создали вакцину от редкого заболевания',
    lead: 'Препарат прошёл первую фазу клинических испытаний с положительными результатами.',
    rubric: 'Наука',
    aiScore: 8.8,
    sourceUrl: 'https://interfax.ru/example',
    sourceViews: 76000,
    sourceCtr: 4.2,
    timestamp: '13:58',
    status: 'pending'
  },
  {
    id: '4',
    title: 'В Петербурге открылся международный культурный форум',
    lead: 'Участие приняли делегации из 45 стран мира.',
    rubric: 'Культура',
    aiScore: 7.9,
    sourceUrl: 'https://spb.news/example',
    sourceViews: 52000,
    sourceCtr: 3.8,
    timestamp: '13:42',
    status: 'pending'
  }
]

export const mockPipelineLogs: PipelineLog[] = [
  {
    id: '1',
    timestamp: '14:32',
    type: 'analysis',
    message: 'Проанализировано 48 новостей · Отобрано 3 · Переписано 3'
  },
  {
    id: '2',
    timestamp: '14:28',
    type: 'approved',
    message: 'Статья "ЦБ повысил ставку..." одобрена редактором Ивановым'
  },
  {
    id: '3',
    timestamp: '14:15',
    type: 'refresh',
    message: 'Запущен плановый прогон · Источников: 6'
  },
  {
    id: '4',
    timestamp: '14:10',
    type: 'rejected',
    message: 'Статья отклонена · Причина: недостаточно источников'
  }
]

export interface ArticleDetail extends QueueArticle {
  fullText: string
  hints: EditorHint[]
  originalSource: {
    text: string
    url: string
  }
}

export interface EditorHint {
  id: string
  type: 'image' | 'quote' | 'data' | 'link'
  priority: 'high' | 'medium' | 'low'
  message: string
}

export const mockArticleDetail: ArticleDetail = {
  ...mockQueueArticles[0],
  fullText: `Мэр Москвы Сергей Собянин представил новую программу поддержки малого и среднего предпринимательства. Инициатива направлена на снижение административной нагрузки и упрощение процедур регистрации бизнеса.

По словам главы города, программа включает три ключевых направления: цифровизацию документооборота, субсидии на аренду помещений и бесплатные консультации для начинающих предпринимателей.

"Мы видим, что малый бизнес — это основа экономики города. Наша задача — создать максимально комфортные условия для его развития", — заявил Сергей Собянин на пресс-конференции.

Программа начнёт действовать с 1 июня и рассчитана на три года. Ожидается, что она охватит более 50 тысяч предприятий.`,
  hints: [
    {
      id: 'h1',
      type: 'image',
      priority: 'high',
      message: 'Вставьте фотографию с пресс-конференции. Рекомендуемый размер: 1200×630px.'
    },
    {
      id: 'h2',
      type: 'quote',
      priority: 'medium',
      message: 'Добавьте комментарий от представителя бизнес-сообщества для баланса.'
    },
    {
      id: 'h3',
      type: 'data',
      priority: 'medium',
      message: 'Укажите точные цифры: размер субсидий и количество мест в программе консультаций.'
    }
  ],
  originalSource: {
    text: 'Собянин сказал про бизнес что будут помогать. Запустят программу. Будут субсидии и консультации.',
    url: 'https://ria.ru/example'
  }
}
