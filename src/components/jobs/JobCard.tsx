'use client'
import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Clock, Bookmark, BookmarkCheck, Building2 } from 'lucide-react'
import type { Job } from '@/types'
import { cn, timeAgo, formatSalary, CATEGORY_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  job: Job
  isSaved?: boolean
  onSaveToggle?: (jobId: string, saved: boolean) => void
}

export default function JobCard({ job, isSaved = false, onSaveToggle }: Props) {
  const [saved, setSaved] = useState(isSaved)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to save jobs'); setLoading(false); return }

    if (saved) {
      await supabase.from('saved_jobs').delete().match({ user_id: user.id, job_id: job.id })
      setSaved(false)
      toast.success('Removed from saved')
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: job.id })
      setSaved(true)
      toast.success('Job saved!')
    }
    onSaveToggle?.(job.id, !saved)
    setLoading(false)
  }

  const isNew = new Date(job.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="card p-5 hover:border-brand-200 hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt={job.company} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-medium text-sm">
                {job.company.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors leading-tight">{job.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {job.is_featured && <span className="badge bg-amber-50 text-amber-700 border-amber-200">Featured</span>}
            {isNew && <span className="badge bg-green-50 text-green-700 border-green-200">New</span>}
            <button onClick={toggleSave} disabled={loading}
              className={cn('p-1.5 rounded-lg transition-colors', saved ? 'text-brand-500 bg-brand-50' : 'text-gray-400 hover:text-brand-500 hover:bg-brand-50')}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('badge', CATEGORY_COLORS[job.category])}>
            {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
          </span>
          <span className="badge bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1">
            <MapPin size={11} /> {job.city ? `${job.city}, ` : ''}{job.country}
          </span>
          <span className="badge bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1">
            <Clock size={11} /> {job.type}
          </span>
          {(job.salary_min || job.salary_max) && (
            <span className="text-sm font-medium text-brand-600 ml-auto">
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">{timeAgo(job.created_at)}</span>
          <span className="text-xs text-gray-400">{job.application_count} applicants</span>
        </div>
      </div>
    </Link>
  )
}
