'use client'
import { useState } from 'react'
import { X, Copy, Loader2, Sparkles } from 'lucide-react'
import type { Job, Profile } from '@/types'
import { toast } from 'sonner'

interface Props {
  job: Job
  profile: Profile | null
  onClose: () => void
}

export default function CoverLetterModal({ job, profile, onClose }: Props) {
  const [letter, setLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, profile }),
      })
      const data = await res.json()
      setLetter(data.letter)
      setGenerated(true)
    } catch {
      toast.error('Failed to generate cover letter')
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(letter)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-display font-medium text-lg text-gray-900">AI Cover Letter</h2>
            <p className="text-sm text-gray-500 mt-0.5">{job.title} at {job.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {!generated ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-brand-500" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Generate a tailored cover letter</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                AI will write a professional cover letter for this role using your profile and CV details.
              </p>
              <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2 mx-auto">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate cover letter</>}
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={letter}
                onChange={e => setLetter(e.target.value)}
                className="input min-h-[320px] font-sans text-sm leading-relaxed resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">You can edit this letter before copying.</p>
            </div>
          )}
        </div>

        {generated && (
          <div className="p-5 border-t border-gray-100 flex gap-2">
            <button onClick={copy} className="btn-primary flex items-center gap-2">
              <Copy size={14} /> Copy letter
            </button>
            <button onClick={generate} disabled={loading} className="btn-secondary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Regenerate
            </button>
            <button onClick={onClose} className="btn-ghost ml-auto">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
