// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import SeekerDashboard from '@/components/seeker/SeekerDashboard'
import EmployerDashboard from '@/components/employer/EmployerDashboard'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {profile?.role === 'employer' ? 'Manage your job listings and applicants' : 'Track your applications and saved jobs'}
          </p>
        </div>

        {profile?.role === 'employer'
          ? <EmployerDashboard userId={user.id} />
          : <SeekerDashboard userId={user.id} />
        }
      </main>
    </div>
  )
}
