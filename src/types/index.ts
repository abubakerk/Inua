export type UserRole = 'seeker' | 'employer'
export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote' | 'internship'
export type JobCategory = 'tech' | 'finance' | 'health' | 'ngo' | 'education' | 'agriculture' | 'logistics' | 'other'
export type Country = 'Kenya' | 'Uganda' | 'Tanzania' | 'Rwanda' | 'Ethiopia'
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
export type JobStatus = 'draft' | 'active' | 'closed' | 'expired'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  country?: Country
  bio?: string
  cv_url?: string
  cv_filename?: string
  company_name?: string
  company_logo_url?: string
  company_website?: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  employer_id: string
  title: string
  company: string
  company_logo_url?: string
  country: Country
  city?: string
  type: JobType
  category: JobCategory
  salary_min?: number
  salary_max?: number
  salary_currency: string
  description: string
  requirements: string[]
  benefits: string[]
  status: JobStatus
  is_featured: boolean
  application_count: number
  deadline?: string
  created_at: string
  updated_at: string
  employer?: Profile
}

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  cover_letter?: string
  status: ApplicationStatus
  notes?: string
  created_at: string
  updated_at: string
  job?: Job
  applicant?: Profile
}

export interface SavedJob {
  id: string
  user_id: string
  job_id: string
  created_at: string
  job?: Job
}

export interface JobFilters {
  query?: string
  country?: Country | ''
  category?: JobCategory | ''
  type?: JobType | ''
  salary_min?: number
  salary_max?: number
}
