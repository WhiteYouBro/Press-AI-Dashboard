import type { Metadata } from 'next'
import { Cormorant_Garamond, JetBrains_Mono, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const jbMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jb-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Redactor.ai: ИИ-помощник для журналистов',
  description:
    'Сервис на базе ИИ, который превращает черновики и заметки в готовые новостные тексты. Дипломный проект.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${syne.variable} ${cormorant.variable} ${jbMono.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
