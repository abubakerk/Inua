'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Trash2, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
  onUpdate: (url: string, filename: string) => void
}

export default function CVUpload({ profile, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [tips, setTips] = useState('')
  const supabase = createClient()

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in'); setUploading(false); return }

    const path = `${user.id}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true })

    if (error) { toast.error('Upload failed'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(path)

    await supabase.from('profiles').update({ cv_url: publicUrl, cv_filename: file.name }).eq('id', user.id)
    onUpdate(publicUrl, file.name)
    toast.success('CV uploaded!')
    setUploading(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  })

  const analyzeCV = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/ai/cv-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })
      const data = await res.json()
      setTips(data.tips)
    } catch {
      toast.error('Analysis failed')
    }
    setAnalyzing(false)
  }

  const removeCV = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ cv_url: null, cv_filename: null }).eq('id', user.id)
    onUpdate('', '')
    setTips('')
    toast.success('CV removed')
  }

  return (
    <div className="space-y-4">
      {profile?.cv_url ? (
        <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.cv_filename}</p>
            <p className="text-xs text-gray-500">CV uploaded</p>
          </div>
          <div className="flex gap-2">
            <button onClick={analyzeCV} disabled={analyzing} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
              {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {analyzing ? 'Analyzing...' : 'AI Tips'}
            </button>
            <button onClick={removeCV} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}>
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-brand-400 animate-spin" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload size={24} className="text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isDragActive ? 'Drop your CV here' : 'Upload your CV'}
              </p>
              <p className="text-xs text-gray-400">PDF or DOCX, up to 5MB</p>
            </>
          )}
        </div>
      )}

      {tips && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-brand-500" />
            <p className="text-xs font-medium text-brand-700">AI Career Tips for East Africa</p>
          </div>
          <p className="text-sm text-brand-800 whitespace-pre-line leading-relaxed">{tips}</p>
        </div>
      )}
    </div>
  )
}
