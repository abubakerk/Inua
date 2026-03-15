'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/ui/Navbar'
import { Loader2, Save, Upload, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [cvTips, setCvTips] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [headline, setHeadline] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [town, setTown] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('')
  const [degree, setDegree] = useState('')
  const [school, setSchool] = useState('')
  const [gradYear, setGradYear] = useState('')
  const [experience, setExperience] = useState('')
  const [skills, setSkills] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [cvUrl, setCvUrl] = useState('')
  const [cvFilename, setCvFilename] = useState('')
  const [userId, setUserId] = useState('')
  const [seekerId, setSeekerId] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const [{ data: profile }, { data: seeker }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('seeker_profiles').select('*').eq('user_id', user.id).single(),
      ])
      if (profile) {
        const parts = (profile.full_name || '').split(' ')
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
        setEmail(profile.email || '')
      }
      if (seeker) {
        setSeekerId(seeker.id)
        setHeadline(seeker.headline || '')
        setPhone((seeker as any).phone || '')
        setAddress((seeker as any).address || '')
        setTown((seeker as any).town || '')
        setZipCode((seeker as any).zip_code || '')
        setCountry((seeker as any).country || '')
        setDegree((seeker as any).degree || '')
        setSchool((seeker as any).school || '')
        setGradYear((seeker as any).grad_year || '')
        setExperience((seeker as any).experience_summary || '')
        setSkills((seeker.skills || []).join(', '))
        setLinkedin(seeker.linkedin_url || '')
        setPortfolio(seeker.portfolio_url || '')
        setCvUrl(seeker.cv_url || '')
        setCvFilename(seeker.cv_filename || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleCvUpload = async (file: File) => {
    setUploadingCv(true)
    const supabase = createClient()
    const path = `${userId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); setUploadingCv(false); return }
    const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(path)
    setCvUrl(publicUrl); setCvFilename(file.name)
    toast.success('CV uploaded!')
    setUploadingCv(false)
  }

  const analyzeCV = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/ai/cv-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: `${headline}. ${experience}. Skills: ${skills}` }),
      })
      const data = await res.json()
      setCvTips(data.analysis || '')
    } catch { toast.error('Analysis failed') }
    setAnalyzing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ full_name: `${firstName} ${lastName}`.trim() }).eq('id', userId)
    const profileData: any = {
      user_id: userId, headline, phone, address, town,
      zip_code: zipCode, country, degree, school, grad_year: gradYear,
      experience_summary: experience,
      skills: skills.split(',').map((s: string) => s.trim()).filter(Boolean),
      linkedin_url: linkedin, portfolio_url: portfolio,
      cv_url: cvUrl || null, cv_filename: cvFilename || null,
    }
    if (seekerId) {
      await supabase.from('seeker_profiles').update(profileData).eq('id', seekerId)
    } else {
      const { data } = await supabase.from('seeker_profiles').insert(profileData).select('id').single()
      if (data) setSeekerId(data.id)
    }
    toast.success('Profile saved!')
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-stone-50"><Navbar />
      <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>
    </div>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )

  const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-medium text-stone-600 block mb-1.5">{label}{req && <span className="text-red-400 ml-1">*</span>}</label>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">My profile</h1>
            <p className="text-stone-500 text-sm mt-1">Your info is pre-filled when you apply for jobs</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save profile</>}
          </button>
        </div>

        <div className="space-y-5">
          <Section title="Personal information">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" req><input className="input-base" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" /></Field>
              <Field label="Last name" req><input className="input-base" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mwangi" /></Field>
            </div>
            <Field label="Email"><input className="input-base bg-stone-50 cursor-not-allowed" value={email} disabled /></Field>
            <Field label="Professional headline"><input className="input-base" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Senior Software Engineer with 5 years in fintech" /></Field>
            <Field label="Phone number"><input className="input-base" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" /></Field>
          </Section>

          <Section title="Address">
            <Field label="Street address"><input className="input-base" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Kenyatta Avenue" /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Town / City"><input className="input-base" value={town} onChange={e => setTown(e.target.value)} placeholder="Nairobi" /></Field>
              <Field label="Zip / Postal"><input className="input-base" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="00100" /></Field>
              <Field label="Country"><input className="input-base" value={country} onChange={e => setCountry(e.target.value)} placeholder="Kenya" /></Field>
            </div>
          </Section>

          <Section title="Education">
            <Field label="Highest degree"><input className="input-base" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. Bachelor of Science in Computer Science" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="School / University"><input className="input-base" value={school} onChange={e => setSchool(e.target.value)} placeholder="University of Nairobi" /></Field>
              <Field label="Graduation year"><input className="input-base" value={gradYear} onChange={e => setGradYear(e.target.value)} placeholder="2020" /></Field>
            </div>
          </Section>

          <Section title="Experience & skills">
            <Field label="Previous experience">
              <textarea className="input-base min-h-[160px] resize-y" value={experience} onChange={e => setExperience(e.target.value)} placeholder="Describe your work history, key achievements and relevant experience..." />
            </Field>
            <Field label="Skills (comma separated)"><input className="input-base" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Python, SQL, Project Management, M-Pesa" /></Field>
          </Section>

          <Section title="CV & documents">
            {cvUrl && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 text-xs font-bold">CV</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{cvFilename || 'Uploaded CV'}</p>
                  <p className="text-xs text-emerald-600">Ready to attach to applications</p>
                </div>
                <button onClick={() => { setCvUrl(''); setCvFilename('') }} className="text-stone-400 hover:text-red-500 p-1"><X size={14} /></button>
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-stone-200 rounded-xl p-5 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
              {uploadingCv ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <Upload size={18} className="text-stone-400" />}
              <div>
                <p className="text-sm font-medium text-stone-600">{uploadingCv ? 'Uploading...' : cvUrl ? 'Replace CV' : 'Upload your CV'}</p>
                <p className="text-xs text-stone-400">PDF or DOCX, up to 5MB</p>
              </div>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleCvUpload(e.target.files[0])} />
            </label>
            {cvUrl && (
              <button type="button" onClick={analyzeCV} disabled={analyzing} className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 px-4 py-2.5 rounded-xl font-medium transition-colors w-full justify-center">
                {analyzing ? <><Loader2 size={14} className="animate-spin" />Analysing...</> : <><Sparkles size={14} />Get AI tips for East Africa job market</>}
              </button>
            )}
            {cvTips && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-2">AI Career Tips</p>
                <p className="text-sm text-emerald-800 whitespace-pre-line leading-relaxed">{cvTips}</p>
              </div>
            )}
          </Section>

          <Section title="Online presence">
            <Field label="LinkedIn URL"><input className="input-base" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/your-name" /></Field>
            <Field label="Portfolio / Website"><input className="input-base" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://yourportfolio.com" /></Field>
          </Section>

          <div className="flex justify-end pb-8">
            <button onClick={handleSave} disabled={saving} className="btn-primary !py-3 !px-8 flex items-center gap-2">
              {saving ? <><Loader2 size={15} className="animate-spin" />Saving...</> : <><Save size={15} />Save all changes</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
