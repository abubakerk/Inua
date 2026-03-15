'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { COUNTRIES, CATEGORIES, JOB_TYPES } from '@/lib/utils'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

export default function JobFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/jobs?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    update('q', query)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Job title, skill, keyword..."
            className="input pl-9 pr-4"
          />
        </div>
      </form>

      {/* Country */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Country</label>
        <select
          value={searchParams.get('country') || ''}
          onChange={e => update('country', e.target.value)}
          className="input">
          <option value="">All countries</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Category</label>
        <select
          value={searchParams.get('category') || ''}
          onChange={e => update('category', e.target.value)}
          className="input">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Job Type */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Job type</label>
        <div className="flex flex-col gap-1.5">
          {JOB_TYPES.map(t => (
            <label key={t.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={searchParams.get('type') === t.value}
                onChange={() => update('type', t.value)}
                className="accent-brand-400"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t.label}</span>
            </label>
          ))}
          {searchParams.get('type') && (
            <button onClick={() => update('type', '')} className="text-xs text-brand-500 hover:text-brand-700 text-left mt-1">
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Salary */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Min salary (USD/mo)</label>
        <select
          value={searchParams.get('salary_min') || ''}
          onChange={e => update('salary_min', e.target.value)}
          className="input">
          <option value="">Any</option>
          <option value="500">$500+</option>
          <option value="1000">$1,000+</option>
          <option value="2000">$2,000+</option>
          <option value="3000">$3,000+</option>
          <option value="5000">$5,000+</option>
        </select>
      </div>
    </div>
  )
}
