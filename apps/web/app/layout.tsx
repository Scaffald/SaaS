import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Scaffald | Build your next A-Team',
    template: '%s | Scaffald',
  },
  description:
    'Scaffald is a comprehensive talent platform designed to streamline the process of finding, hiring, and managing professionals in the trades.',
  metadataBase: new URL('https://scaffald.com'),
  openGraph: {
    siteName: 'Scaffald',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
