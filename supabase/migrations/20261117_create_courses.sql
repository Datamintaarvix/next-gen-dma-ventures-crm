-- NEXT GEN DMA VENTURES CRM - Course Management Table Schema
-- Supabase / PostgreSQL Migration

CREATE TYPE course_status AS ENUM (
  'Active',
  'Inactive',
  'Draft',
  'Archived'
);

CREATE TYPE course_level AS ENUM (
  'Beginner',
  'Intermediate',
  'Advanced',
  'All Levels'
);

CREATE TYPE course_mode AS ENUM (
  'Classroom & Online',
  'Classroom Only',
  'Online Live'
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(20) UNIQUE NOT NULL, -- CRS-101
  course_name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  duration VARCHAR(100) NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  syllabus TEXT[] NOT NULL DEFAULT '{}',
  instructor VARCHAR(100) NOT NULL,
  instructor_bio TEXT,
  status course_status NOT NULL DEFAULT 'Active',
  level course_level NOT NULL DEFAULT 'All Levels',
  mode course_mode NOT NULL DEFAULT 'Classroom & Online',
  max_batch_capacity INTEGER NOT NULL DEFAULT 25,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(course_name);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_courses_updated_at();

-- Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated staff to read courses"
ON courses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to insert courses"
ON courses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update courses"
ON courses FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to delete courses"
ON courses FOR DELETE TO authenticated USING (true);
