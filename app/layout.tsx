import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Frontier Flight Search',
  description: 'Search Frontier Airlines routes with unlimited layovers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen">{children}</body>
    </html>
  )
}
