// src/app/saved/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import JobCard from '@/components/jobs/JobCard'
import { Loader2, BookmarkX } from 'lucide-react'
import Link from 'next/link'
import type { Job } from '@/types'

export default function SavedPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/saved')
      .then(r => r.json())
      .then(d => {
        setJobs((d.data || []).map((s: any) => ({ ...s.job, is_saved: true })))
        setLoading(false)
      })
  }, [])

  const handleSaveToggle = (jobId: string, saved: boolean) => {
    if (!saved) setJobs(prev => prev.filter(j => j.id !== jobId))
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">Saved jobs</h1>
          <p className="text-stone-500 text-sm mt-1">{jobs.length} job{jobs.length !== 1 ? 's' : ''} bookmarked</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <BookmarkX size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium mb-2">No saved jobs yet</p>
            <p className="text-sm mb-5">Hit the bookmark icon on any listing to save it here</p>
            <Link href="/" className="btn-primary">Browse jobs</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onSaveToggle={handleSaveToggle} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
