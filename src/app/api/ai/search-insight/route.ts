// src/app/api/ai/search-insight/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { query, country } = await request.json()

  if (!query) return NextResponse.json({ insight: '' })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are an East Africa job market expert. User searched for: "${query}"${country ? ` in ${country}` : ' across East Africa (Kenya, Uganda, Tanzania, Rwanda, Ethiopia)'}.

Give a 2-sentence insight: which industries/companies are hiring for this role, and one practical tip for their search. Be specific to East Africa. Mention real companies or organisations when relevant (e.g., Safaricom, Equity Bank, AMREF, MTN, Andela, UNICEF).`
    }],
  })

  const insight = message.content[0]?.type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ insight })
}
