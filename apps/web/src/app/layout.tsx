import type { Metadata } from 'next'
import { Bebas_Neue, IBM_Plex_Mono } from 'next/font/google'
import { SanityLive } from '@/sanity/lib/live'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Command Center',
  description: 'Automated campaign deployment powered by Gemini + Sanity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${ibmPlexMono.variable}`}>
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
