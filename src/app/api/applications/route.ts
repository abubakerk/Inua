// src/app/api/applications/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { job_id, cover_letter } = await request.json()

  if (!job_id) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
  }

  // Get seeker profile
  const { data: seeker } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!seeker) {
    return NextResponse.json({ error: 'Please complete your profile first' }, { status: 403 })
  }

  // Check not already applied
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', job_id)
    .eq('seeker_id', seeker.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already applied to this job' }, { status: 409 })
  }

  // Create application
  const { data: application, error } = await supabase
    .from('applications')
    .insert({ job_id, seeker_id: seeker.id, cover_letter })
    .select(`
      *,
      job:jobs(title, country, employer:employer_profiles(company_name, user_id))
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send email notification to employer
  try {
    const { data: employerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', application.job?.employer?.user_id)
      .single()

    const { data: seekerProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (employerProfile?.email) {
      await resend.emails.send({
        from: 'Kazi EA <notifications@kazi-ea.com>',
        to: employerProfile.email,
        subject: `New application: ${application.job?.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1D9E75">New Application Received</h2>
            <p>Hi ${employerProfile.full_name || 'there'},</p>
            <p><strong>${seekerProfile?.full_name || 'A candidate'}</strong> has applied for the
            <strong>${application.job?.title}</strong> position at your company.</p>
            ${cover_letter ? `<blockquote style="border-left:3px solid #1D9E75;padding-left:16px;color:#555">${cover_letter.substring(0, 300)}...</blockquote>` : ''}
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/applications"
               style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
              View Application
            </a>
            <hr style="margin-top:32px;border-color:#eee"/>
            <p style="color:#999;font-size:12px">Kazi EA — East Africa's Job Platform</p>
          </div>
        `,
      })
    }

    // Confirmation to seeker
    if (seekerProfile?.email) {
      await resend.emails.send({
        from: 'Kazi EA <notifications@kazi-ea.com>',
        to: seekerProfile.email,
        subject: `Application submitted: ${application.job?.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1D9E75">Application Submitted!</h2>
            <p>Hi ${seekerProfile.full_name || 'there'},</p>
            <p>Your application for <strong>${application.job?.title}</strong>
            at <strong>${application.job?.employer?.company_name}</strong> has been submitted.</p>
            <p>We'll notify you when the employer reviews your application.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
              View My Applications
            </a>
          </div>
        `,
      })
    }
  } catch (emailError) {
    console.error('Email send failed:', emailError)
    // Don't fail the whole request for email errors
  }

  return NextResponse.json({ data: application }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'seeker') {
    const { data: seeker } = await supabase
      .from('seeker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const { data, error } = await supabase
      .from('applications')
      .select(`*, job:jobs(*, employer:employer_profiles(company_name, company_logo_url))`)
      .eq('seeker_id', seeker?.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Employer: get all applications for their jobs
  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('employer_id', employer?.id)

  const jobIds = (jobs || []).map(j => j.id)

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(title, country),
      seeker:seeker_profiles(*, profile:profiles(full_name, email, avatar_url))
    `)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
