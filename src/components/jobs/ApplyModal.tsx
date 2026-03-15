// src/components/jobs/ApplyModal.tsx
'use client'
import { useState } from 'react'
import { X, Loader2, CheckCircle, Sparkles, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { Job } from '@/types'

interface Props {
  job: Job
  onClose: () => void
}

export default function ApplyModal({ job, onClose }: Props) {
  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const salaryText = job.salary_min && job.salary_max
    ? `$${job.salary_min.toLocaleString()}–$${job.salary_max.toLocaleString()}/mo`
    : job.salary_min ? `From $${job.salary_min.toLocaleString()}/mo` : 'Negotiable'

  const generateCoverLetter = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id }),
      })
      if (res.status === 401) { toast.error('Sign in to generate a cover letter'); setGenerating(false); return }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let text = ''
      setCoverLetter('')
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setCoverLetter(text)
        }
      }
    } catch {
      toast.error('Failed to generate cover letter')
    }
    setGenerating(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, cover_letter: coverLetter }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Application failed')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      toast.error('Something went wrong')
    }
    setSubmitting(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-stone-100">
          <div>
            <h2 className="font-semibold text-stone-900 text-lg">{job.title}</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {job.employer?.company_name} · {job.country} · {salaryText}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-stone-900 text-xl mb-2">Application submitted!</h3>
              <p className="text-stone-500 text-sm max-w-sm mx-auto">
                We've notified <strong>{job.employer?.company_name}</strong> and sent you a confirmation email.
                You can track your application in your dashboard.
              </p>
              <button onClick={onClose} className="btn-primary mt-6">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Job summary */}
              <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 leading-relaxed">
                <p className="line-clamp-3">{job.description}</p>
              </div>

              {/* Cover letter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                    <FileText size={14} />
                    Cover letter <span className="text-stone-400 font-normal">(optional but recommended)</span>
                  </label>
                  <button
                    onClick={generateCoverLetter}
                    disabled={generating}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {generating
                      ? <><Loader2 size={12} className="animate-spin" /> Writing...</>
                      : <><Sparkles size={12} /> AI write</>
                    }
                  </button>
                </div>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Write a cover letter, or click 'AI write' to generate one tailored to this role..."
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none leading-relaxed transition-all"
                  rows={10}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="p-5 border-t border-stone-100 flex gap-3 items-center">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit application'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <p className="text-xs text-stone-400 ml-auto">
              Your CV from your profile will be shared
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
