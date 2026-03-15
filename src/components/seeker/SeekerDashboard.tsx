// src/components/seeker/SeekerDashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CVUpload from '@/components/shared/CVUpload'
import type { Application, Profile, SeekerProfile } from '@/types'
import { Loader2, FileText, Bookmark, Send } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-stone-100 text-stone-600',
  reviewing:   'bg-amber-100 text-amber-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected:    'bg-red-100 text-red-600',
  hired:       'bg-emerald-100 text-emerald-700',
}

export default function SeekerDashboard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [seeker, setSeeker] = useState<SeekerProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [{ data: prof }, { data: seek }, { data: apps }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('seeker_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('applications').select('*, job:jobs(title, country, employer:employer_profiles(company_name))').eq('seeker_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ])
      setProfile(prof)
      setSeeker(seek)
      setApplications(apps || [])
      setSavedCount(count || 0)
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>

  const stats = [
    { icon: Send, label: 'Applications', value: applications.length, href: '/dashboard/applications' },
    { icon: Bookmark, label: 'Saved jobs', value: savedCount, href: '/saved' },
    { icon: FileText, label: 'CV uploaded', value: seeker?.cv_url ? 'Yes' : 'No', href: '#cv' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white border border-stone-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
            <s.icon size={16} className="text-stone-400 mb-2" />
            <div className="text-2xl font-bold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Profile + CV */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-semibold text-stone-800 mb-4">My profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Headline</label>
              <input
                defaultValue={seeker?.headline || ''}
                onBlur={async e => {
                  await supabase.from('seeker_profiles').upsert({ user_id: userId, headline: e.target.value })
                }}
                placeholder="e.g. Senior Software Engineer"
                className="input-base text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 block mb-1">Location</label>
              <input
                defaultValue={seeker?.location || ''}
                onBlur={async e => {
                  await supabase.from('seeker_profiles').upsert({ user_id: userId, location: e.target.value })
                }}
                placeholder="e.g. Nairobi, Kenya"
                className="input-base text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 block mb-1">Skills (comma separated)</label>
              <input
                defaultValue={(seeker?.skills || []).join(', ')}
                onBlur={async e => {
                  const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  await supabase.from('seeker_profiles').upsert({ user_id: userId, skills })
                }}
                placeholder="e.g. Python, SQL, Project Management"
                className="input-base text-sm"
              />
            </div>
          </div>
        </div>

        <div id="cv" className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-semibold text-stone-800 mb-4">My CV</h3>
          <CVUpload
            profile={profile}
            onUpdate={(url, filename) => {
              setSeeker(prev => prev ? { ...prev, cv_url: url, cv_filename: filename } : prev)
            }}
          />
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">Recent applications</h3>
          <Link href="/dashboard/applications" className="text-xs text-emerald-600 hover:underline">View all</Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            No applications yet.{' '}
            <Link href="/" className="text-emerald-600 hover:underline">Browse jobs</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {applications.map(app => (
              <div key={app.id} className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-stone-800">{(app as any).job?.title}</p>
                  <p className="text-xs text-stone-400">{(app as any).job?.employer?.company_name} · {(app as any).job?.country}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[app.status]}`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
