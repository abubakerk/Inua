// src/components/jobs/JobSearch.tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Sparkles } from 'lucide-react'
import type { Country } from '@/types'

const COUNTRIES: Country[] = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia']

export default function JobSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [country, setCountry] = useState<Country | ''>(searchParams.get('country') as Country || '')
  const [insight, setInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (country) params.set('country', country)
    router.push(`/?${params.toString()}`)

    // Fetch AI insight
    if (query) {
      setLoadingInsight(true)
      setInsight('')
      try {
        const res = await fetch('/api/ai/search-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, country }),
        })
        const data = await res.json()
        setInsight(data.insight || '')
      } catch {}
      setLoadingInsight(false)
    }
  }, [query, country, router])

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Job title, skill, or company..."
            className="input-base pl-9"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <select
            value={country}
            onChange={e => setCountry(e.target.value as Country | '')}
            className="input-base pl-9 appearance-none"
          >
            <option value="">All countries</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Sparkles size={15} />
          Search
        </button>
      </form>

      {/* AI Insight */}
      {(loadingInsight || insight) && (
        <div className="mt-3 bg-white/80 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-stone-600">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={13} className="text-orange-500" />
            <span className="text-xs font-medium text-orange-600">AI Market Insight</span>
          </div>
          {loadingInsight ? (
            <div className="h-4 bg-stone-200 rounded animate-pulse w-3/4" />
          ) : (
            <p className="leading-relaxed">{insight}</p>
          )}
        </div>
      )}
    </div>
  )
}
