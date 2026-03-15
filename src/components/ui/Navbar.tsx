// src/components/ui/Navbar.tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, BookmarkCheck, LayoutDashboard, LogOut, User } from 'lucide-react'
import type { Profile } from '@/types'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-emerald-700 font-serif text-xl">
          Kazi EA
        </Link>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse" />
          ) : profile ? (
            <>
              <Link href="/saved" className="p-2 text-stone-500 hover:text-emerald-600 transition-colors" title="Saved jobs">
                <BookmarkCheck size={18} />
              </Link>
              <Link href="/dashboard" className="p-2 text-stone-500 hover:text-emerald-600 transition-colors" title="Dashboard">
                <LayoutDashboard size={18} />
              </Link>
              {profile.role === 'employer' && (
                <Link href="/post-job" className="btn-primary !py-1.5 !px-3 text-xs">
                  Post job
                </Link>
              )}
              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-stone-200">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-medium">
                  {profile.full_name?.charAt(0) || <User size={14} />}
                </div>
                <button onClick={signOut} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors" title="Sign out">
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary !py-1.5 !px-4 text-xs">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !py-1.5 !px-4 text-xs">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
