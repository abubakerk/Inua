// src/app/api/ai/cv-analysis/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const summary = formData.get('summary') as string || ''

  let fileContext = ''

  if (file && file.type === 'application/pdf') {
    // Convert PDF to base64 for Claude
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: `You are an expert East Africa career coach. Analyse this CV and give exactly 3 numbered, specific, actionable tips to improve it for the East Africa job market.

Be very specific: mention skills to add, format improvements, or keyword gaps. Reference East Africa context (e.g., M-Pesa/mobile money experience, NGO sector, Safaricom ecosystem, regional certifications).

${summary ? `The applicant also said: "${summary}"` : ''}

Format as:
1. [Tip]
2. [Tip]
3. [Tip]`,
          },
        ],
      }],
    })

    fileContext = message.content[0]?.type === 'text' ? message.content[0].text : ''
  } else {
    // No PDF — use summary text only
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are an East Africa career coach. Based on this applicant summary, give 3 specific tips for the East Africa job market:

"${summary || 'Job seeker in East Africa'}"

Format:
1. [Tip]
2. [Tip]
3. [Tip]`,
      }],
    })
    fileContext = message.content[0]?.type === 'text' ? message.content[0].text : ''
  }

  return NextResponse.json({ analysis: fileContext })
}
