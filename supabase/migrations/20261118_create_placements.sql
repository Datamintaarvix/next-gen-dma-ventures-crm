-- NEXT GEN DMA VENTURES CRM - Placement Management Module Schema
-- Supabase / PostgreSQL Migration

DO $$ BEGIN
  CREATE TYPE partnership_status_type AS ENUM (
    'Active',
    'MOU Signed',
    'In Discussion',
    'Archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_status_type AS ENUM (
    'Open',
    'In Progress',
    'Closed',
    'Draft'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE placement_status_type AS ENUM (
    'Seeking Placement',
    'In Interview Process',
    'Offer Received',
    'Placed',
    'Opted Out'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE placement_eligibility_type AS ENUM (
    'Eligible',
    'In Training',
    'Not Eligible',
    'Placed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status_type AS ENUM (
    'Applied',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Rejected',
    'Not Selected',
    'Withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_status_type AS ENUM (
    'Offer Extended',
    'Accepted',
    'Declined',
    'Expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Partner Companies Table
CREATE TABLE IF NOT EXISTS partner_companies (
  id VARCHAR(100) PRIMARY KEY, -- e.g. CMP-101
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(150) NOT NULL,
  website TEXT,
  contact_person VARCHAR(150) NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  partnership_status partnership_status_type NOT NULL DEFAULT 'Active',
  notes TEXT,
  active_opportunities_count INTEGER NOT NULL DEFAULT 0,
  total_hired_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Job Opportunities / Drives Table
CREATE TABLE IF NOT EXISTS job_opportunities (
  id VARCHAR(100) PRIMARY KEY, -- e.g. JOB-2026-101
  company_id VARCHAR(100) NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_type VARCHAR(50) NOT NULL DEFAULT 'Full-time',
  job_description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  min_attendance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
  target_courses TEXT[] NOT NULL DEFAULT '{}',
  target_batches TEXT[] DEFAULT '{}',
  openings INTEGER NOT NULL DEFAULT 1,
  filled_openings INTEGER NOT NULL DEFAULT 0,
  salary_min_lpa NUMERIC(6, 2) NOT NULL DEFAULT 0,
  salary_max_lpa NUMERIC(6, 2) NOT NULL DEFAULT 0,
  salary_range_display VARCHAR(100) NOT NULL,
  job_location VARCHAR(255) NOT NULL,
  application_deadline DATE NOT NULL,
  status opportunity_status_type NOT NULL DEFAULT 'Open',
  total_applications INTEGER NOT NULL DEFAULT 0,
  shortlisted_count INTEGER NOT NULL DEFAULT 0,
  selected_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Student Placement Profiles Table
CREATE TABLE IF NOT EXISTS student_placement_profiles (
  student_id VARCHAR(100) PRIMARY KEY, -- References students(id)
  student_code VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  batch_name VARCHAR(150) NOT NULL,
  attendance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  skills TEXT[] NOT NULL DEFAULT '{}',
  resume_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  expected_salary_lpa NUMERIC(6, 2),
  placement_eligibility placement_eligibility_type NOT NULL DEFAULT 'Eligible',
  placement_status placement_status_type NOT NULL DEFAULT 'Seeking Placement',
  notes TEXT,
  total_applications INTEGER NOT NULL DEFAULT 0,
  total_interviews INTEGER NOT NULL DEFAULT 0,
  active_offers_count INTEGER NOT NULL DEFAULT 0,
  placed_company VARCHAR(255),
  placed_job_title VARCHAR(255),
  placed_salary_lpa NUMERIC(6, 2),
  placed_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Placement Applications Table
CREATE TABLE IF NOT EXISTS placement_applications (
  id VARCHAR(100) PRIMARY KEY, -- e.g. APP-2026-101
  job_id VARCHAR(100) NOT NULL REFERENCES job_opportunities(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  company_id VARCHAR(100) NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  student_id VARCHAR(100) NOT NULL REFERENCES student_placement_profiles(student_id) ON DELETE CASCADE,
  student_code VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  student_email VARCHAR(150) NOT NULL,
  student_phone VARCHAR(50) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status application_status_type NOT NULL DEFAULT 'Applied',
  resume_url TEXT,
  portfolio_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_job_application UNIQUE(student_id, job_id)
);

-- 5. Placement Interviews Table
CREATE TABLE IF NOT EXISTS placement_interviews (
  id VARCHAR(100) PRIMARY KEY, -- e.g. INT-2026-101
  application_id VARCHAR(100) NOT NULL REFERENCES placement_applications(id) ON DELETE CASCADE,
  job_id VARCHAR(100) NOT NULL REFERENCES job_opportunities(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  student_id VARCHAR(100) NOT NULL REFERENCES student_placement_profiles(student_id) ON DELETE CASCADE,
  student_code VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  round_name VARCHAR(150) NOT NULL,
  interview_date DATE NOT NULL,
  interview_time VARCHAR(50) NOT NULL,
  interview_mode VARCHAR(100) NOT NULL DEFAULT 'Virtual (Google Meet)',
  location_or_meeting_link TEXT NOT NULL,
  interviewer_name VARCHAR(150) NOT NULL,
  notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  result VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Placement Offers Table
CREATE TABLE IF NOT EXISTS placement_offers (
  id VARCHAR(100) PRIMARY KEY, -- e.g. OFR-2026-101
  application_id VARCHAR(100) NOT NULL REFERENCES placement_applications(id) ON DELETE CASCADE,
  job_id VARCHAR(100) NOT NULL REFERENCES job_opportunities(id) ON DELETE CASCADE,
  student_id VARCHAR(100) NOT NULL REFERENCES student_placement_profiles(student_id) ON DELETE CASCADE,
  student_code VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  offered_salary_lpa NUMERIC(6, 2) NOT NULL,
  offered_salary_display VARCHAR(100) NOT NULL,
  offer_date DATE NOT NULL,
  joining_date DATE NOT NULL,
  offer_letter_ref VARCHAR(150),
  status offer_status_type NOT NULL DEFAULT 'Offer Extended',
  acceptance_date DATE,
  notes TEXT,
  recorded_by VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_companies_status ON partner_companies(partnership_status);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_company ON job_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_status ON job_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_status ON student_placement_profiles(placement_status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_eligibility ON student_placement_profiles(placement_eligibility);
CREATE INDEX IF NOT EXISTS idx_placement_applications_job ON placement_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_placement_applications_student ON placement_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_interviews_app ON placement_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_app ON placement_offers(application_id);

-- Enable Row Level Security (RLS)
ALTER TABLE partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_placement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_offers ENABLE ROW LEVEL SECURITY;

-- Default permissive read/write policies for authenticated staff
DO $$ BEGIN
  CREATE POLICY "Allow authenticated staff to read companies" ON partner_companies FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write companies" ON partner_companies FOR ALL TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to read jobs" ON job_opportunities FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write jobs" ON job_opportunities FOR ALL TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to read profiles" ON student_placement_profiles FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write profiles" ON student_placement_profiles FOR ALL TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to read applications" ON placement_applications FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write applications" ON placement_applications FOR ALL TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to read interviews" ON placement_interviews FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write interviews" ON placement_interviews FOR ALL TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to read offers" ON placement_offers FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write offers" ON placement_offers FOR ALL TO authenticated USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
