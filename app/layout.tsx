import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Klirr',
  description: 'Håll koll på veckopengarna',
  manifest: '/manifest.json',
  themeColor: '#10b981',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Klirr',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <head>
        <link rel="apple-touch-icon" sizes="512x512" href="/apple-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
