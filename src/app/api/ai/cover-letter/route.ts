// src/app/api/ai/cover-letter/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { job_id } = await request.json()

  // Fetch job details
  const { data: job } = await supabase
    .from('jobs')
    .select('*, employer:employer_profiles(company_name)')
    .eq('id', job_id)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Fetch seeker profile for personalisation
  const { data: seeker } = await supabase
    .from('seeker_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const seekerContext = seeker
    ? `Applicant: ${profile?.full_name || 'Candidate'}
       Headline: ${seeker.headline || 'Not specified'}
       Summary: ${seeker.summary || 'Not specified'}
       Skills: ${(seeker.skills || []).join(', ') || 'Not listed'}
       Experience: ${seeker.experience_years ? `${seeker.experience_years} years` : 'Not specified'}
       Location: ${seeker.location || 'East Africa'}`
    : `Applicant is a job seeker in East Africa`

  // Stream the response
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Write a compelling, professional cover letter for this East Africa job application.

JOB DETAILS:
Title: ${job.title}
Company: ${job.employer?.company_name}
Country: ${job.country}
Type: ${job.type}
Description: ${job.description}
${job.requirements ? `Requirements: ${job.requirements}` : ''}

APPLICANT:
${seekerContext}

Write a 3-paragraph cover letter:
1. Opening: Express enthusiasm for the role and company, mention East Africa context
2. Middle: Match applicant's skills/experience to the job requirements
3. Closing: Call to action and professional sign-off

Format: Plain text, professional tone, no placeholder brackets. Sign off with the applicant's name.`
    }],
  })

  // Return as a streaming text response
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
