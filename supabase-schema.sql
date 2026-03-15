-- ============================================================
-- KAZI EA — Full Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Full-text search
CREATE EXTENSION IF NOT EXISTS "vector";    -- pgvector for AI semantic search

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'seeker' CHECK (role IN ('seeker', 'employer')),
  avatar_url      TEXT,
  phone           TEXT,
  country         TEXT,
  bio             TEXT,
  cv_url          TEXT,
  cv_filename     TEXT,
  company_name    TEXT,
  company_logo_url TEXT,
  company_website TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'seeker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  company           TEXT NOT NULL,
  company_logo_url  TEXT,
  country           TEXT NOT NULL,
  city              TEXT,
  type              TEXT NOT NULL DEFAULT 'full-time'
                    CHECK (type IN ('full-time','part-time','contract','remote','internship')),
  category          TEXT NOT NULL DEFAULT 'other'
                    CHECK (category IN ('tech','finance','health','ngo','education','agriculture','logistics','other')),
  salary_min        INTEGER,
  salary_max        INTEGER,
  salary_currency   TEXT DEFAULT 'USD',
  description       TEXT NOT NULL,
  requirements      TEXT[] DEFAULT '{}',
  benefits          TEXT[] DEFAULT '{}',
  status            TEXT DEFAULT 'active'
                    CHECK (status IN ('draft','active','closed','expired')),
  is_featured       BOOLEAN DEFAULT false,
  application_count INTEGER DEFAULT 0,
  deadline          DATE,
  embedding         vector(1536),  -- For AI semantic search
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active jobs visible to all"
  ON jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Employers can manage own jobs"
  ON jobs FOR ALL USING (auth.uid() = employer_id);

-- Full-text search index
CREATE INDEX jobs_fts_idx ON jobs
  USING GIN(to_tsvector('english', title || ' ' || company || ' ' || description));

-- Vector similarity search index
CREATE INDEX jobs_embedding_idx ON jobs
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter  TEXT,
  status        TEXT DEFAULT 'pending'
                CHECK (status IN ('pending','reviewing','shortlisted','rejected','hired')),
  notes         TEXT,  -- Private employer notes
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = applicant_id);
CREATE POLICY "Employers can view applications for their jobs"
  ON applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.employer_id = auth.uid()
  ));
CREATE POLICY "Authenticated users can apply"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Employers can update application status"
  ON applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.employer_id = auth.uid()
  ));

-- Increment application count trigger
CREATE OR REPLACE FUNCTION increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_application
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION increment_application_count();

-- ============================================================
-- SAVED JOBS
-- ============================================================
CREATE TABLE saved_jobs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved jobs"
  ON saved_jobs FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SEED DATA — Sample East Africa jobs
-- ============================================================
-- Note: Replace employer_id with a real UUID after creating an employer account
-- These are for demonstration; in production jobs come from real employer signups

-- Full-text search function
CREATE OR REPLACE FUNCTION search_jobs(search_query TEXT, p_country TEXT DEFAULT NULL, p_category TEXT DEFAULT NULL, p_type TEXT DEFAULT NULL)
RETURNS SETOF jobs AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM jobs
  WHERE status = 'active'
    AND (search_query IS NULL OR search_query = '' OR
         to_tsvector('english', title || ' ' || company || ' ' || description) @@ plainto_tsquery('english', search_query))
    AND (p_country IS NULL OR p_country = '' OR country = p_country)
    AND (p_category IS NULL OR p_category = '' OR category = p_category)
    AND (p_type IS NULL OR p_type = '' OR type = p_type)
  ORDER BY is_featured DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Storage bucket for CVs
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload own CV" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can read own CV" ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public logo access" ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');
CREATE POLICY "Employers can upload logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
