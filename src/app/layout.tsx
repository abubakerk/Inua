import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Inua — East Africa Jobs',
  description: 'Find your next role across Kenya, Uganda, Tanzania, Rwanda and Ethiopia. AI-powered job search for East Africa.',
  keywords: 'jobs Kenya Uganda Tanzania Rwanda Ethiopia East Africa careers Inua',
  openGraph: {
    title: 'Inua — East Africa Jobs',
    description: 'AI-powered job board for East Africa. Lift your career.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="bg-stone-50 text-stone-900 antialiased">
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  )
}
