'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/ui/Navbar'
import SeekerDashboard from '@/components/seeker/SeekerDashboard'
import EmployerDashboard from '@/components/employer/EmployerDashboard'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="flex justify-center items-center py-32">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {profile?.role === 'employer'
              ? 'Manage your job listings and applicants'
              : 'Track your applications and saved jobs'}
          </p>
        </div>

        {profile?.role === 'employer'
          ? <EmployerDashboard userId={profile.id} />
          : <SeekerDashboard userId={profile.id} />
        }
      </main>
    </div>
  )
}
