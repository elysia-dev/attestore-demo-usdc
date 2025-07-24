import type { Metadata } from 'next'
import {
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  Chivo_Mono,
} from 'next/font/google'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Providers } from './providers'

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
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakartaSans.variable} ${chivoMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
