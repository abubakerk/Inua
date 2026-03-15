// src/components/jobs/JobGrid.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import JobCard from './JobCard'
import JobFilters from './JobFilters'
import type { Job, JobFilters as Filters, PaginatedResponse } from '@/types'
import { Loader2 } from 'lucide-react'

export default function JobGrid() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    query: searchParams.get('q') || '',
    country: (searchParams.get('country') as any) || '',
    category: '',
    type: '',
  })

  const fetchJobs = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.query)    params.set('query', f.query)
    if (f.country)  params.set('country', f.country)
    if (f.category) params.set('category', f.category)
    if (f.type)     params.set('type', f.type)
    params.set('page', String(p))

    try {
      const res = await fetch(`/api/jobs?${params}`)
      const data: PaginatedResponse<Job> = await res.json()
      setJobs(data.data || [])
      setTotalPages(data.totalPages || 1)
      setCount(data.count || 0)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const newFilters = {
      query: searchParams.get('q') || '',
      country: (searchParams.get('country') as any) || '',
      category: filters.category,
      type: filters.type,
    }
    setFilters(newFilters)
    setPage(1)
    fetchJobs(newFilters, 1)
  }, [searchParams])

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    setPage(1)
    fetchJobs(updated, 1)
  }

  const handleSaveToggle = (jobId: string, saved: boolean) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_saved: saved } : j))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">
          {loading ? 'Loading...' : `${count.toLocaleString()} job${count !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <JobFilters filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg font-medium mb-2">No jobs found</p>
          <p className="text-sm">Try different keywords or clear your filters</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onSaveToggle={handleSaveToggle} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => { setPage(p => p - 1); fetchJobs(filters, page - 1) }}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-stone-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => { setPage(p => p + 1); fetchJobs(filters, page + 1) }}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
