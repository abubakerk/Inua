'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'
import { Briefcase, LogOut, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = profile?.role === 'employer'
    ? [{ href: '/employer', label: 'Dashboard' }, { href: '/employer/post', label: 'Post a Job' }, { href: '/employer/applications', label: 'Applicants' }]
    : [{ href: '/jobs', label: 'Find Jobs' }, { href: '/saved', label: 'Saved' }, { href: '/profile', label: 'Profile' }]

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Briefcase size={20} className="text-brand-400" />
          <span className="font-display font-medium text-lg text-brand-600">Kazi<span className="text-brand-400">EA</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors', pathname.startsWith(l.href) ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50')}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          {profile ? (
            <>
              <span className="text-sm text-gray-500 max-w-xs truncate">{profile.full_name || profile.email}</span>
              <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary">Log in</Link>
              <Link href="/auth/signup" className="btn-primary">Sign up free</Link>
            </>
          )}
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn('px-3 py-2.5 rounded-lg text-sm', pathname.startsWith(l.href) ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-700')}>
              {l.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2">
            {profile
              ? <button onClick={signOut} className="text-sm text-left text-gray-500 px-3 py-2 w-full">Sign out</button>
              : <>
                  <Link href="/auth/login" className="block px-3 py-2 text-sm text-gray-700" onClick={() => setOpen(false)}>Log in</Link>
                  <Link href="/auth/signup" className="block px-3 py-2 text-sm text-brand-600 font-medium" onClick={() => setOpen(false)}>Sign up free</Link>
                </>
            }
          </div>
        </div>
      )}
    </nav>
  )
}
