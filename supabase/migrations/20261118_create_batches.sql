-- NEXT GEN DMA VENTURES CRM - Batch Management Table Schema
-- Supabase / PostgreSQL Migration

CREATE TYPE batch_status AS ENUM (
  'Upcoming',
  'Active',
  'Completed',
  'Cancelled'
);

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. DM-2026-M1
  batch_name VARCHAR(150) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  trainer VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  class_days VARCHAR(50) NOT NULL, -- e.g. 'Mon - Fri', 'Sat - Sun'
  class_timings VARCHAR(100) NOT NULL, -- e.g. '09:00 AM - 11:00 AM'
  max_capacity INTEGER NOT NULL DEFAULT 25 CHECK (max_capacity >= 5 AND max_capacity <= 100),
  status batch_status NOT NULL DEFAULT 'Upcoming',
  classroom VARCHAR(100),
  description TEXT,
  student_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Batch Student Enrollments Table (Relational Association)
CREATE TABLE IF NOT EXISTS batch_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  notes TEXT,
  UNIQUE(batch_id, student_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_batches_code ON batches(batch_code);
CREATE INDEX IF NOT EXISTS idx_batches_course ON batches(course_name);
CREATE INDEX IF NOT EXISTS idx_batches_trainer ON batches(trainer);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_start_date ON batches(start_date);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch ON batch_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_student ON batch_enrollments(student_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batches_updated_at
BEFORE UPDATE ON batches
FOR EACH ROW
EXECUTE FUNCTION update_batches_updated_at();

-- Row Level Security (RLS)
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated staff to read batches"
ON batches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to insert batches"
ON batches FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update batches"
ON batches FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to delete batches"
ON batches FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to manage batch enrollments"
ON batch_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
