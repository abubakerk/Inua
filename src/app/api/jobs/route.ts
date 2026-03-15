// src/app/api/jobs/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const query    = searchParams.get('query') || ''
  const country  = searchParams.get('country') || ''
  const category = searchParams.get('category') || ''
  const type     = searchParams.get('type') || ''
  const page     = parseInt(searchParams.get('page') || '1')
  const limit    = 12
  const offset   = (page - 1) * limit

  let dbQuery = supabase
    .from('jobs')
    .select(`
      *,
      employer:employer_profiles(
        id, company_name, company_logo_url, industry, verified
      )
    `, { count: 'exact' })
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (country)  dbQuery = dbQuery.eq('country', country)
  if (category) dbQuery = dbQuery.eq('category', category)
  if (type)     dbQuery = dbQuery.eq('type', type)

  if (query) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,description.ilike.%${query}%`
    )
  }

  const { data, error, count } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check saved status if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  let savedJobIds: string[] = []
  if (user) {
    const { data: saved } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)
    savedJobIds = (saved || []).map(s => s.job_id)
  }

  const jobsWithSaved = (data || []).map(job => ({
    ...job,
    is_saved: savedJobIds.includes(job.id),
  }))

  return NextResponse.json({
    data: jobsWithSaved,
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get employer profile
  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!employer) {
    return NextResponse.json({ error: 'Employer profile not found' }, { status: 403 })
  }

  const body = await request.json()
  const {
    title, description, requirements, responsibilities,
    country, city, type, category,
    salary_min, salary_max, salary_currency,
    experience_years_min, application_deadline,
  } = body

  if (!title || !description || !country || !type || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      employer_id: employer.id,
      title, description, requirements, responsibilities,
      country, city, type, category,
      salary_min: salary_min || null,
      salary_max: salary_max || null,
      salary_currency: salary_currency || 'USD',
      experience_years_min: experience_years_min || 0,
      application_deadline: application_deadline || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: job }, { status: 201 })
}
