'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/ui/Navbar'
import { Loader2, ChevronLeft, FileText, MapPin, GraduationCap, Briefcase, Mail, Phone, ExternalLink, Download } from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/utils'

const STATUS_OPTIONS = ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired']
const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-stone-100 text-stone-600',
  reviewing:   'bg-amber-100 text-amber-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected:    'bg-red-100 text-red-600',
  hired:       'bg-emerald-100 text-emerald-700',
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [filter, setFilter] = useState('all')
  const [openingCv, setOpeningCv] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: employer } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!employer) { router.push('/dashboard'); return }

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('employer_id', employer.id)

      if (!jobs?.length) { setLoading(false); return }

      const jobIds = jobs.map((j: any) => j.id)

      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(id, title, country, city),
          seeker:seeker_profiles(
            id, headline, cv_url, cv_filename, skills,
            phone, address, town, zip_code, country,
            degree, school, grad_year, experience_summary,
            linkedin_url, portfolio_url,
            profile:profiles(full_name, email, avatar_url)
          )
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })

      setApplications(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (appId: string, status: string) => {
    setUpdatingStatus(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId)

    if (error) { toast.error('Failed to update status'); setUpdatingStatus(false); return }
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    if (selected?.id === appId) setSelected((prev: any) => ({ ...prev, status }))
    toast.success(`Status updated to ${status}`)
    setUpdatingStatus(false)
  }

  const openCV = async (cvUrl: string) => {
    setOpeningCv(true)
    try {
      const supabase = createClient()
      // Extract path after /cvs/
      const parts = cvUrl.split('/cvs/')
      if (parts.length < 2) { window.open(cvUrl, '_blank'); setOpeningCv(false); return }
      const path = decodeURIComponent(parts[1])
      const { data, error } = await supabase.storage
        .from('cvs')
        .createSignedUrl(path, 60 * 60) // 1 hour
      if (error || !data) { toast.error('Could not open CV — ' + (error?.message || '')); setOpeningCv(false); return }
      window.open(data.signedUrl, '_blank')
    } catch (e) {
      toast.error('Could not open CV')
    }
    setOpeningCv(false)
  }

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter)

  if (loading) return (
    <div className="min-h-screen bg-stone-50"><Navbar />
      <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Applications</h1>
            <p className="text-stone-500 text-sm mt-0.5">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-stone-800 text-white'
                  : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                {s === 'all' ? applications.length : applications.filter(a => a.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-2">No applications yet</p>
            <p className="text-sm">When candidates apply to your jobs they'll appear here</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-4">
            {/* List */}
            <div className="md:col-span-2 space-y-2">
              {filtered.map(app => (
                <div
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                    selected?.id === app.id
                      ? 'border-emerald-400 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold flex-shrink-0">
                        {(app.seeker?.profile?.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {app.seeker?.profile?.full_name || 'Applicant'}
                        </p>
                        <p className="text-xs text-stone-400 truncate">{app.job?.title}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[app.status]}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-2">{timeAgo(app.created_at)}</p>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            <div className="md:col-span-3">
              {selected ? (
                <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-stone-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-semibold">
                          {(selected.seeker?.profile?.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-stone-900">
                            {selected.seeker?.profile?.full_name || 'Applicant'}
                          </h2>
                          {selected.seeker?.headline && (
                            <p className="text-stone-500 text-sm mt-0.5">{selected.seeker.headline}</p>
                          )}
                          <p className="text-xs text-stone-400 mt-1">
                            Applied for <span className="font-medium text-stone-600">{selected.job?.title}</span> · {timeAgo(selected.created_at)}
                          </p>
                        </div>
                      </div>
                      <select
                        value={selected.status}
                        onChange={e => updateStatus(selected.id, e.target.value)}
                        disabled={updatingStatus}
                        className={`text-sm px-3 py-1.5 rounded-full font-medium border-0 outline-none cursor-pointer ${STATUS_STYLES[selected.status]}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">

                    {/* Contact */}
                    <Section title="Contact">
                      <Row icon={Mail} label="Email" value={selected.seeker?.profile?.email} />
                      <Row icon={Phone} label="Phone" value={selected.seeker?.phone} />
                      {(selected.seeker?.town || selected.seeker?.country) && (
                        <Row icon={MapPin} label="Location" value={[selected.seeker?.address, selected.seeker?.town, selected.seeker?.zip_code, selected.seeker?.country].filter(Boolean).join(', ')} />
                      )}
                      {selected.seeker?.linkedin_url && (
                        <div className="flex items-center gap-2">
                          <ExternalLink size={14} className="text-stone-400 flex-shrink-0" />
                          <a href={selected.seeker.linkedin_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-emerald-600 hover:underline truncate">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      {selected.seeker?.portfolio_url && (
                        <div className="flex items-center gap-2">
                          <ExternalLink size={14} className="text-stone-400 flex-shrink-0" />
                          <a href={selected.seeker.portfolio_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-emerald-600 hover:underline truncate">
                            Portfolio / Website
                          </a>
                        </div>
                      )}
                    </Section>

                    {/* Education */}
                    {(selected.seeker?.degree || selected.seeker?.school) && (
                      <Section title="Education">
                        <Row icon={GraduationCap} label="Degree" value={selected.seeker?.degree} />
                        <Row icon={GraduationCap} label="School" value={selected.seeker?.school} />
                        {selected.seeker?.grad_year && (
                          <Row icon={GraduationCap} label="Graduated" value={selected.seeker.grad_year} />
                        )}
                      </Section>
                    )}

                    {/* Experience */}
                    {selected.seeker?.experience_summary && (
                      <Section title="Experience">
                        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                          {selected.seeker.experience_summary}
                        </p>
                      </Section>
                    )}

                    {/* Skills */}
                    {selected.seeker?.skills?.length > 0 && (
                      <Section title="Skills">
                        <div className="flex flex-wrap gap-2">
                          {selected.seeker.skills.map((skill: string) => (
                            <span key={skill} className="bg-stone-100 text-stone-700 text-xs px-3 py-1 rounded-full font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Cover letter */}
                    {selected.cover_letter && (
                      <Section title="Cover letter">
                        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                          {selected.cover_letter}
                        </p>
                      </Section>
                    )}

                    {/* CV */}
                    <Section title="CV / Resume">
                      {selected.seeker?.cv_url ? (
                        <button
                          onClick={() => openCV(selected.seeker.cv_url)}
                          disabled={openingCv}
                          className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 hover:bg-emerald-100 transition-colors w-full text-left"
                        >
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                            CV
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-800">
                              {selected.seeker.cv_filename || 'View CV / Resume'}
                            </p>
                            <p className="text-xs text-emerald-600">
                              {openingCv ? 'Opening...' : 'Click to open or download'}
                            </p>
                          </div>
                          {openingCv
                            ? <Loader2 size={16} className="text-emerald-600 animate-spin" />
                            : <Download size={16} className="text-emerald-600" />
                          }
                        </button>
                      ) : (
                        <p className="text-sm text-stone-400 italic">No CV attached to this application</p>
                      )}
                    </Section>

                  </div>
                </div>
              ) : (
                <div className="bg-white border border-stone-200 rounded-2xl flex items-center justify-center h-64">
                  <div className="text-center text-stone-400">
                    <FileText size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Select an application to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-stone-400 mt-0.5 flex-shrink-0" />
      <div>
        <span className="text-xs text-stone-400">{label}: </span>
        <span className="text-sm text-stone-700">{value}</span>
      </div>
    </div>
  )
}
