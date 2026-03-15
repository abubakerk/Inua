import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', weight: ['400','500','600'] })

export const metadata: Metadata = {
  title: 'Kazi EA — East Africa Jobs',
  description: 'Find your next role across Kenya, Uganda, Tanzania, Rwanda & Ethiopia. Thousands of jobs powered by AI.',
  keywords: 'jobs, east africa, kenya, uganda, tanzania, rwanda, ethiopia, careers, employment',
  openGraph: {
    title: 'Kazi EA — East Africa Jobs',
    description: 'AI-powered job marketplace for East Africa',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
