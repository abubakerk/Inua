'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Country, JobType, JobCategory } from '@/types'
import { COUNTRIES, CATEGORIES, JOB_TYPES } from '@/lib/utils'

const CITIES: Record<Country, string[]> = {
  Kenya:    ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Nyeri'],
  Uganda:   ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara', 'Mukono', 'Kasese', 'Masaka', 'Hoima', 'Lira'],
  Tanzania: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Zanzibar', 'Mwanza', 'Tanga', 'Morogoro', 'Mbeya', 'Kigoma', 'Tabora'],
  Rwanda:   ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Byumba', 'Cyangugu', 'Kibungo', 'Kibuye', 'Rwamagana'],
  Ethiopia: ['Addis Ababa', 'Dire Dawa', 'Bahir Dar', 'Gondar', 'Mekelle', 'Hawassa', 'Jimma', 'Adama', 'Harar', 'Dessie'],
}

interface FieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-600 block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function PostJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [country, setCountry] = useState<Country>('Kenya')
  const [city, setCity] = useState('Nairobi')
  const [type, setType] = useState<JobType>('full-time')
  const [category, setCategory] = useState<JobCategory>('tech')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [expYears, setExpYears] = useState('0')
  const [deadline, setDeadline] = useState('')

  const handleCountryChange = (c: Country) => {
    setCountry(c)
    setCity(CITIES[c][0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description) { toast.error('Title and description are required'); return }
    setLoading(true)

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, requirements,
        country, city, type, category,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        experience_years_min: parseInt(expYears),
        application_deadline: deadline || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Failed to post job'); setLoading(false); return }

    toast.success('Job posted successfully!')
    router.push('/dashboard')
  }

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
            <input
              className="input-base"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Country" required>
              <select
                className="input-base"
                value={country}
                onChange={e => handleCountryChange(e.target.value as Country)}
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="City">
              <select
                className="input-base"
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                {CITIES[country].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Job type" required>
              <select
                className="input-base"
                value={type}
                onChange={e => setType(e.target.value as JobType)}
              >
                {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Category" required>
              <select
                className="input-base"
                value={category}
                onChange={e => setCategory(e.target.value as JobCategory)}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Min salary (USD/mo)">
              <input
                type="number"
                className="input-base"
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value)}
                placeholder="e.g. 1500"
              />
            </Field>
            <Field label="Max salary (USD/mo)">
              <input
                type="number"
                className="input-base"
                value={salaryMax}
                onChange={e => setSalaryMax(e.target.value)}
                placeholder="e.g. 2500"
              />
            </Field>
            <Field label="Min experience (yrs)">
              <input
                type="number"
                className="input-base"
                value={expYears}
                onChange={e => setExpYears(e.target.value)}
                min="0" max="20"
              />
            </Field>
          </div>

          <Field label="Description" required>
            <textarea
              className="input-base min-h-[120px] resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and what success looks like..."
            />
          </Field>

          <Field label="Requirements">
            <textarea
              className="input-base min-h-[100px] resize-none"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              placeholder="List required qualifications, skills, and experience..."
            />
          </Field>

          <Field label="Application deadline">
            <input
              type="date"
              className="input-base"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
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
