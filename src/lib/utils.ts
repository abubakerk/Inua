import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import type { JobCategory, JobType, Country } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatSalary(min?: number, max?: number, currency = 'USD') {
  if (!min && !max) return 'Negotiable'
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`
  if (min && max) return `${fmt(min)} – ${fmt(max)}/mo`
  if (min) return `From ${fmt(min)}/mo`
  return `Up to ${fmt(max!)}/mo`
}

export const COUNTRIES: Country[] = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia']

export const CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'tech', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Healthcare' },
  { value: 'ngo', label: 'NGO / Development' },
  { value: 'education', label: 'Education' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'other', label: 'Other' },
]

export const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
  { value: 'internship', label: 'Internship' },
]

export const CATEGORY_COLORS: Record<JobCategory, string> = {
  tech: 'bg-blue-50 text-blue-800 border-blue-200',
  finance: 'bg-amber-50 text-amber-800 border-amber-200',
  health: 'bg-green-50 text-green-800 border-green-200',
  ngo: 'bg-purple-50 text-purple-800 border-purple-200',
  education: 'bg-teal-50 text-teal-800 border-teal-200',
  agriculture: 'bg-lime-50 text-lime-800 border-lime-200',
  logistics: 'bg-orange-50 text-orange-800 border-orange-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
}
