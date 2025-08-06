import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

import {
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  Chivo_Mono,
} from 'next/font/google'
import '../globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Providers } from './providers'
import NavigationBar from '@/components/NavigationBar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta-sans',
  subsets: ['latin'],
})

const chivoMono = Chivo_Mono({
  variable: '--font-chivo-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ZK Escrow Transfer System',
  description:
    'Secure cross-chain transfers using Zero-Knowledge proofs. Convert traditional bank transfers into blockchain tokens through automated escrow mechanisms.',
  themeColor: '#ff007a',
  icons: {
    icon: [
      { url: '/favicon-pink.svg', sizes: 'any' },
      { url: '/favicon-pink-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-pink-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/pink-icons-180x180.png', sizes: '180x180' }],
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakartaSans.variable} ${chivoMono.variable} antialiased`}>
        <Providers>
          <NextIntlClientProvider>
            <NavigationBar />
            <main className="min-h-screen pb-20">{children}</main>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  )
}
