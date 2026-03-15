-- ============================================================
-- KAZI EA - Full Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fuzzy text search
create extension if not exists "vector";     -- AI semantic search (pgvector)

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  role        text not null check (role in ('seeker', 'employer')) default 'seeker',
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'seeker')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEEKER PROFILES
-- ============================================================
create table public.seeker_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade unique,
  headline          text,
  summary           text,
  cv_url            text,
  cv_filename       text,
  location          text,
  skills            text[] default '{}',
  experience_years  integer,
  linkedin_url      text,
  portfolio_url     text,
  updated_at        timestamptz default now()
);

alter table public.seeker_profiles enable row level security;
create policy "Seekers are publicly viewable" on public.seeker_profiles for select using (true);
create policy "Seekers can manage own profile" on public.seeker_profiles for all using (auth.uid() = user_id);

-- ============================================================
-- EMPLOYER PROFILES
-- ============================================================
create table public.employer_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade unique,
  company_name      text not null,
  company_logo_url  text,
  industry          text,
  company_size      text,
  website           text,
  description       text,
  verified          boolean default false,
  updated_at        timestamptz default now()
);

alter table public.employer_profiles enable row level security;
create policy "Employers are publicly viewable" on public.employer_profiles for select using (true);
create policy "Employers can manage own profile" on public.employer_profiles for all using (auth.uid() = user_id);

-- ============================================================
-- JOBS
-- ============================================================
create table public.jobs (
  id                      uuid primary key default uuid_generate_v4(),
  employer_id             uuid references public.employer_profiles(id) on delete cascade,
  title                   text not null,
  description             text not null,
  requirements            text,
  responsibilities        text,
  country                 text not null check (country in ('Kenya','Uganda','Tanzania','Rwanda','Ethiopia')),
  city                    text,
  type                    text not null check (type in ('full-time','part-time','contract','remote','internship')),
  category                text not null check (category in ('tech','finance','health','ngo','education','agriculture','logistics','hospitality','other')),
  salary_min              integer,
  salary_max              integer,
  salary_currency         text default 'USD',
  experience_years_min    integer default 0,
  status                  text default 'active' check (status in ('active','closed','draft')),
  is_featured             boolean default false,
  application_deadline    date,
  embedding               vector(1536),   -- for AI semantic search
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table public.jobs enable row level security;
create policy "Active jobs are publicly viewable" on public.jobs for select using (status = 'active' or auth.uid() in (select user_id from employer_profiles where id = employer_id));
create policy "Employers can manage own jobs" on public.jobs for all using (auth.uid() in (select user_id from employer_profiles where id = employer_id));

-- Full-text search index
create index jobs_search_idx on public.jobs using gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(requirements,''))
);
-- pgvector index for semantic search
create index jobs_embedding_idx on public.jobs using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- APPLICATIONS
-- ============================================================
create table public.applications (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid references public.jobs(id) on delete cascade,
  seeker_id     uuid references public.seeker_profiles(id) on delete cascade,
  cover_letter  text,
  status        text default 'pending' check (status in ('pending','reviewing','shortlisted','rejected','hired')),
  created_at    timestamptz default now(),
  unique(job_id, seeker_id)
);

alter table public.applications enable row level security;
create policy "Seekers can view own applications" on public.applications for select using (
  auth.uid() in (select user_id from seeker_profiles where id = seeker_id)
);
create policy "Employers can view applications for their jobs" on public.applications for select using (
  auth.uid() in (select ep.user_id from employer_profiles ep join jobs j on j.employer_id = ep.id where j.id = job_id)
);
create policy "Seekers can apply" on public.applications for insert with check (
  auth.uid() in (select user_id from seeker_profiles where id = seeker_id)
);
create policy "Employers can update application status" on public.applications for update using (
  auth.uid() in (select ep.user_id from employer_profiles ep join jobs j on j.employer_id = ep.id where j.id = job_id)
);

-- ============================================================
-- SAVED JOBS
-- ============================================================
create table public.saved_jobs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  job_id      uuid references public.jobs(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, job_id)
);

alter table public.saved_jobs enable row level security;
create policy "Users manage own saved jobs" on public.saved_jobs for all using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false);
insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Authenticated users can upload CVs" on storage.objects for insert
  with check (bucket_id = 'cvs' and auth.role() = 'authenticated');
create policy "Users can access own CVs" on storage.objects for select
  using (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view logos" on storage.objects for select using (bucket_id = 'logos');
create policy "Employers can upload logos" on storage.objects for insert
  with check (bucket_id = 'logos' and auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA - Sample jobs for East Africa
-- ============================================================
-- (Run after creating at least one employer account)
-- See seeds/jobs.sql for sample data
