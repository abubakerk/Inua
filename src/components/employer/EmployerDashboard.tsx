// src/components/employer/EmployerDashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Job, Application } from '@/types'
import { Loader2, Users, Briefcase, TrendingUp, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-stone-100 text-stone-600',
  reviewing:   'bg-amber-100 text-amber-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected:    'bg-red-100 text-red-600',
  hired:       'bg-emerald-100 text-emerald-700',
}

export default function EmployerDashboard({ userId }: { userId: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: employer } = await supabase
        .from('employer_profiles').select('id').eq('user_id', userId).single()

      if (!employer) { setLoading(false); return }

      const [{ data: jobsData }, { data: appsData }] = await Promise.all([
        supabase.from('jobs').select('*, _count:applications(count)').eq('employer_id', employer.id)
          .eq('status', 'active').order('created_at', { ascending: false }).limit(5),
        supabase.from('applications').select(`
          *, job:jobs(title),
          seeker:seeker_profiles(profile:profiles(full_name, email))
        `).in('job_id',
          (await supabase.from('jobs').select('id').eq('employer_id', employer.id)).data?.map(j => j.id) || []
        ).order('created_at', { ascending: false }).limit(8),
      ])

      setJobs(jobsData || [])
      setApplications(appsData || [])
      setLoading(false)
    }
    load()
  }, [userId])

  const updateStatus = async (appId: string, status: string) => {
    await supabase.from('applications').update({ status }).eq('id', appId)
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>

  const totalApps = applications.length
  const hired = applications.filter(a => a.status === 'hired').length
  const pending = applications.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Briefcase, label: 'Active listings', value: jobs.length },
          { icon: Users, label: 'Total applicants', value: totalApps },
          { icon: TrendingUp, label: 'Pending review', value: pending },
          { icon: CheckCircle, label: 'Hired', value: hired },
        ].map(s => (
          <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-4">
            <s.icon size={16} className="text-stone-400 mb-2" />
            <div className="text-2xl font-bold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Active Listings */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800">Active listings</h3>
            <Link href="/post-job" className="btn-primary !py-1.5 !px-3 text-xs">+ Post job</Link>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-stone-400 mb-3">No active listings</p>
              <Link href="/post-job" className="btn-primary text-xs">Post your first job</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{job.title}</p>
                    <p className="text-xs text-stone-400">{job.country} · {job.type}</p>
                  </div>
                  <span className="text-xs text-stone-500">
                    {(job as any)._count?.count || 0} applicants
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applicants */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-semibold text-stone-800 mb-4">Recent applicants</h3>
          {applications.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No applications yet</p>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 6).map(app => (
                <div key={app.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
                      {app.seeker?.profile?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-800">
                        {app.seeker?.profile?.full_name || 'Applicant'}
                      </p>
                      <p className="text-xs text-stone-400">{app.job?.title}</p>
                    </div>
                  </div>
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer outline-none ${STATUS_STYLES[app.status]}`}
                  >
                    {['pending','reviewing','shortlisted','rejected','hired'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
