// src/app/page.tsx
import { Suspense } from 'react'
import Navbar from '@/components/ui/Navbar'
import JobSearch from '@/components/jobs/JobSearch'
import JobGrid from '@/components/jobs/JobGrid'
import HeroStats from '@/components/ui/HeroStats'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4 border border-orange-200">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
              AI-powered job search
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold text-emerald-900 mb-4 leading-tight">
              Find your next role<br />across East Africa
            </h1>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              Thousands of verified jobs in Kenya, Uganda, Tanzania, Rwanda &amp; Ethiopia
            </p>
          </div>

          <Suspense fallback={null}>
            <JobSearch />
          </Suspense>

          <HeroStats />
        </div>
      </section>

      {/* Job Listings */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Suspense fallback={<div className="grid gap-3 animate-pulse">{[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-stone-200 rounded-xl" />)}</div>}>
          <JobGrid />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-16 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-semibold text-emerald-700 font-serif text-lg">Kazi EA</span>
            <p className="text-xs text-stone-400 mt-1">East Africa's job platform</p>
          </div>
          <div className="flex gap-6 text-sm text-stone-400">
            <span>Kenya · Uganda · Tanzania · Rwanda · Ethiopia</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
