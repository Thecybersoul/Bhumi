import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bhūmī — Bengaluru Land Exchange',
  description: 'Premium marketplace for large land parcels in and around Bengaluru.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
