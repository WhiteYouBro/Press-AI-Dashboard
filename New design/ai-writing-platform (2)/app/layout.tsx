import type { Metadata } from 'next'
import { Syne, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google'
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
  title: 'НОЛЬ/ОДИН — журналистика и ИИ',
  description:
    'Минималистичная платформа для журналистов: пишите статьи в соавторстве с искусственным интеллектом.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${syne.variable} ${cormorant.variable} ${jbMono.variable} bg-background`}
    >
      <body className="font-sans antialiased text-foreground">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
