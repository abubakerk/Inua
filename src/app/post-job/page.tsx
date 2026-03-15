'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Country, JobType, JobCategory } from '@/types'
import { COUNTRIES, CATEGORIES, JOB_TYPES } from '@/lib/utils'

export default function PostJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', responsibilities: '',
    country: 'Kenya' as Country, city: '',
    type: 'full-time' as JobType, category: 'tech' as JobCategory,
    salary_min: '', salary_max: '', experience_years_min: '0',
    application_deadline: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description) { toast.error('Title and description are required'); return }
    setLoading(true)

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        experience_years_min: parseInt(form.experience_years_min),
      }),
    })

    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Failed to post job'); setLoading(false); return }

    toast.success('Job posted successfully!')
    router.push('/dashboard')
  }

  const Field = ({ label, required, children }: any) => (
    <div>
      <label className="text-xs font-medium text-stone-600 block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-stone-900">Post a new job</h1>
          <p className="text-stone-500 text-sm mt-1">Reach thousands of qualified candidates across East Africa</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
          <Field label="Job title" required>
            <input className="input-base" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Senior Software Engineer" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Country" required>
              <select className="input-base" value={form.country} onChange={e => set('country', e.target.value)}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input className="input-base" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="e.g. Nairobi" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Job type" required>
              <select className="input-base" value={form.type} onChange={e => set('type', e.target.value)}>
                {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Category" required>
              <select className="input-base" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Min salary (USD/mo)">
              <input type="number" className="input-base" value={form.salary_min}
                onChange={e => set('salary_min', e.target.value)} placeholder="e.g. 1500" />
            </Field>
            <Field label="Max salary (USD/mo)">
              <input type="number" className="input-base" value={form.salary_max}
                onChange={e => set('salary_max', e.target.value)} placeholder="e.g. 2500" />
            </Field>
            <Field label="Min experience (yrs)">
              <input type="number" className="input-base" value={form.experience_years_min}
                onChange={e => set('experience_years_min', e.target.value)} min="0" max="20" />
            </Field>
          </div>

          <Field label="Description" required>
            <textarea className="input-base min-h-[120px] resize-none" value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and what success looks like..." />
          </Field>

          <Field label="Requirements">
            <textarea className="input-base min-h-[100px] resize-none" value={form.requirements}
              onChange={e => set('requirements', e.target.value)}
              placeholder="List required qualifications, skills, and experience..." />
          </Field>

          <Field label="Application deadline">
            <input type="date" className="input-base" value={form.application_deadline}
              onChange={e => set('application_deadline', e.target.value)} />
          </Field>

          <div className="flex gap-3 pt-2 border-t border-stone-100">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Posting...</> : 'Post job listing'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </main>
    </div>
  )
}
