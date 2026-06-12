import type { Metadata } from 'next'
import { Space_Grotesk, Manrope, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ToastProvider } from '@/components/Toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'TrustFlow: Payments that build credit',
  description:
    'Create milestone payment agreements on QIE Blockchain. Every completed payment builds your on-chain Trust Score.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable} ${jetbrainsMono.variable} min-h-screen bg-trust-base text-trust-text`}
      >
        <Providers>
          <ToastProvider>
            <div className="accent-line" />
            <Header />
            <main>{children}</main>
            <Footer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
