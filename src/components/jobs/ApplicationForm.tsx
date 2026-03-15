'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, X, Sparkles, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { Job } from '@/types'

interface Props {
  job: Job
  onClose: () => void
  onSuccess: () => void
}

export default function ApplicationForm({ job, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Personal info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [town, setTown] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('')

  // Education
  const [degree, setDegree] = useState('')
  const [school, setSchool] = useState('')
  const [gradYear, setGradYear] = useState('')

  // Experience
  const [experience, setExperience] = useState('')

  // Files & cover letter
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvUrl, setCvUrl] = useState('')
  const [extraFile, setExtraFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [uploadingCv, setUploadingCv] = useState(false)

  // Load saved profile data
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingProfile(false); return }

      const [{ data: profile }, { data: seeker }] = await Promise.all([
        supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
        supabase.from('seeker_profiles').select('*').eq('user_id', user.id).single(),
      ])

      if (profile) {
        const parts = (profile.full_name || '').split(' ')
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
        setEmail(profile.email || '')
      }

      if (seeker) {
        setPhone(seeker.phone || '')
        setAddress(seeker.address || '')
        setTown(seeker.town || '')
        setZipCode(seeker.zip_code || '')
        setCountry(seeker.country || '')
        setDegree(seeker.degree || '')
        setSchool(seeker.school || '')
        setGradYear(seeker.grad_year || '')
        setExperience(seeker.experience_summary || '')
        setCvUrl(seeker.cv_url || '')
      }
      setLoadingProfile(false)
    }
    load()
  }, [])

  const handleCvUpload = async (file: File) => {
    setUploadingCv(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in'); setUploadingCv(false); return }
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); setUploadingCv(false); return }
    const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(path)
    setCvUrl(publicUrl)
    setCvFile(file)
    toast.success('CV uploaded!')
    setUploadingCv(false)
  }

  const generateCoverLetter = async () => {
    setGenerating(true)
    setCoverLetter('')
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id }),
      })
      if (!res.ok) { toast.error('Could not generate cover letter'); setGenerating(false); return }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let text = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setCoverLetter(text)
        }
      }
    } catch { toast.error('Failed to generate') }
    setGenerating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !email) { toast.error('Please fill in your name and email'); return }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in to apply'); setLoading(false); return }

    // Get or create seeker profile
    let { data: seeker } = await supabase.from('seeker_profiles').select('id').eq('user_id', user.id).single()
    if (!seeker) {
      const { data: newSeeker } = await supabase.from('seeker_profiles').insert({ user_id: user.id }).select('id').single()
      seeker = newSeeker
    }

    if (!seeker) { toast.error('Could not create profile'); setLoading(false); return }

    // Save profile info for next time
    await supabase.from('seeker_profiles').update({
      phone,
      address,
      town,
      zip_code: zipCode,
      country,
      degree,
      school,
      grad_year: gradYear,
      experience_summary: experience,
      cv_url: cvUrl || null,
    }).eq('id', seeker.id)

    // Submit application
    const { error } = await supabase.from('applications').insert({
      job_id: job.id,
      seeker_id: seeker.id,
      cover_letter: coverLetter || null,
    })

    if (error) {
      if (error.code === '23505') { toast.error('You have already applied for this job'); }
      else { toast.error(error.message) }
      setLoading(false)
      return
    }

    toast.success('Application submitted!')
    onSuccess()
    setLoading(false)
  }

  if (loadingProfile) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 size={24} className="animate-spin text-emerald-500" />
    </div>
  )

  const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <label className="text-sm font-medium text-stone-600 block mb-1.5">
      {text} {required && <span className="text-red-400">*</span>}
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h3 className="font-semibold text-stone-900">Apply for {job.title}</h3>
          <p className="text-xs text-stone-400">{job.employer?.company_name} · Your info is saved for future applications</p>
        </div>
      </div>

      {/* Personal info */}
      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Personal information</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><Label text="First name" required /><input className="input-base" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" /></div>
          <div><Label text="Last name" required /><input className="input-base" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mwangi" /></div>
        </div>
        <div className="mt-3"><Label text="Email" required /><input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" /></div>
        <div className="mt-3"><Label text="Phone number" /><input className="input-base" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" /></div>
      </div>

      {/* Address */}
      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Address</h4>
        <div><Label text="Street address" /><input className="input-base" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Kenyatta Avenue" /></div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="col-span-1"><Label text="Town / City" /><input className="input-base" value={town} onChange={e => setTown(e.target.value)} placeholder="Nairobi" /></div>
          <div><Label text="Zip / Postal" /><input className="input-base" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="00100" /></div>
          <div><Label text="Country" /><input className="input-base" value={country} onChange={e => setCountry(e.target.value)} placeholder="Kenya" /></div>
        </div>
      </div>

      {/* Education */}
      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Education</h4>
        <div><Label text="Highest degree" /><input className="input-base" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. Bachelor of Science in Computer Science" /></div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><Label text="School / University" /><input className="input-base" value={school} onChange={e => setSchool(e.target.value)} placeholder="University of Nairobi" /></div>
          <div><Label text="Graduation year" /><input className="input-base" value={gradYear} onChange={e => setGradYear(e.target.value)} placeholder="2020" /></div>
        </div>
      </div>

      {/* Experience */}
      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Previous experience</h4>
        <textarea
          className="input-base min-h-[140px] resize-y"
          value={experience}
          onChange={e => setExperience(e.target.value)}
          placeholder="Briefly describe your work history, key achievements and relevant skills..."
        />
      </div>

      {/* CV Upload */}
      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Documents</h4>
        <div>
          <Label text="CV / Resume" />
          {cvUrl && !cvFile ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 text-xs font-bold">CV</div>
              <span className="text-sm text-emerald-700 font-medium flex-1">Saved CV on file</span>
              <button type="button" onClick={() => setCvUrl('')} className="text-stone-400 hover:text-red-500"><X size={14} /></button>
            </div>
          ) : null}
          {cvFile ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 text-xs font-bold">CV</div>
              <span className="text-sm text-emerald-700 font-medium flex-1">{cvFile.name}</span>
              <button type="button" onClick={() => { setCvFile(null); setCvUrl('') }} className="text-stone-400 hover:text-red-500"><X size={14} /></button>
            </div>
          ) : null}
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-stone-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
            {uploadingCv ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : <Upload size={16} className="text-stone-400" />}
            <span className="text-sm text-stone-500">{uploadingCv ? 'Uploading...' : cvUrl ? 'Replace CV (PDF or DOCX)' : 'Upload CV (PDF or DOCX)'}</span>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleCvUpload(e.target.files[0])} />
          </label>
        </div>

        <div className="mt-3">
          <Label text="Additional file (optional)" />
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-colors">
            <Upload size={16} className="text-stone-400" />
            <span className="text-sm text-stone-500">{extraFile ? extraFile.name : 'Attach portfolio, certificates, etc.'}</span>
            <input type="file" className="hidden" onChange={e => setExtraFile(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      {/* Cover letter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label text="Cover letter (optional)" />
          <button
            type="button"
            onClick={generateCoverLetter}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {generating ? <><Loader2 size={11} className="animate-spin" /> Writing...</> : <><Sparkles size={11} /> AI write</>}
          </button>
        </div>
        <textarea
          className="input-base min-h-[160px] resize-y"
          value={coverLetter}
          onChange={e => setCoverLetter(e.target.value)}
          placeholder="Write a cover letter, or click 'AI write' to generate one tailored to this role..."
        />
      </div>

      <button type="submit" disabled={loading} className="w-full btn-primary !py-3.5 !text-base flex items-center justify-center gap-2">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit application →'}
      </button>
    </form>
  )
}
