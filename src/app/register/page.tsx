'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Briefcase, User } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('seeker')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (role === 'employer' && !companyName) { toast.error('Please enter your company name'); return }
    setLoading(true)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    if (!data.user) { toast.error('Something went wrong'); setLoading(false); return }

    // Wait for the auth trigger to create the profile row
    await new Promise(r => setTimeout(r, 2000))

    // Create role-specific profile
    if (role === 'employer') {
      const { error: empError } = await supabase
        .from('employer_profiles')
        .insert({ user_id: data.user.id, company_name: companyName })

      if (empError) {
        // Try once more after another delay
        await new Promise(r => setTimeout(r, 2000))
        await supabase
          .from('employer_profiles')
          .insert({ user_id: data.user.id, company_name: companyName })
      }
    } else {
      const { error: seekError } = await supabase
        .from('seeker_profiles')
        .insert({ user_id: data.user.id })

      if (seekError) {
        await new Promise(r => setTimeout(r, 2000))
        await supabase
          .from('seeker_profiles')
          .insert({ user_id: data.user.id })
      }
    }

    toast.success('Account created! You can now sign in.')
    router.push('/login')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-10 w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-emerald-700 font-serif">Kazi EA</Link>
          <p className="text-stone-500 text-sm mt-1">Create your free account</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {(['seeker', 'employer'] as UserRole[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                role === r
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              {r === 'seeker' ? <User size={22} /> : <Briefcase size={22} />}
              {r === 'seeker' ? 'Job seeker' : 'Employer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-600 block mb-1.5">Full name</label>
            <input
              type="text" required value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Mwangi"
              className="input-base"
            />
          </div>

          {role === 'employer' && (
            <div>
              <label className="text-sm font-medium text-stone-600 block mb-1.5">Company name</label>
              <input
                type="text" required value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Safaricom, Equity Bank..."
                className="input-base"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-stone-600 block mb-1.5">Email address</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-600 block mb-1.5">Password</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="input-base"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 !py-3 !text-base mt-2"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Creating your account...</>
              : 'Create account'
            }
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
