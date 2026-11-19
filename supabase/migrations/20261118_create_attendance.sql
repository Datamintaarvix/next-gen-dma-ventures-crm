-- NEXT GEN DMA VENTURES CRM - Attendance Management Table Schema
-- Supabase / PostgreSQL Migration

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM (
    'Present',
    'Absent',
    'Late',
    'Excused'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id VARCHAR(100) PRIMARY KEY, -- e.g. SESS-DM-2026-M1-20261118
  course_name VARCHAR(255) NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  batch_name VARCHAR(150) NOT NULL,
  session_date DATE NOT NULL,
  session_title VARCHAR(255) NOT NULL,
  trainer VARCHAR(150) NOT NULL,
  recorded_by VARCHAR(150) NOT NULL,
  total_students INT NOT NULL DEFAULT 0,
  present_count INT NOT NULL DEFAULT 0,
  absent_count INT NOT NULL DEFAULT 0,
  late_count INT NOT NULL DEFAULT 0,
  excused_count INT NOT NULL DEFAULT 0,
  attendance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(150),
  CONSTRAINT uq_session_batch_date UNIQUE (batch_code, session_date)
);

-- 2. Attendance Records Table (Individual Student Check-ins)
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(100) PRIMARY KEY, -- e.g. ATT-20261118-001
  session_id VARCHAR(100) NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL,
  student_code VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  batch_name VARCHAR(150) NOT NULL,
  attendance_date DATE NOT NULL,
  session_title VARCHAR(255) NOT NULL,
  status attendance_status NOT NULL DEFAULT 'Present',
  check_in_time VARCHAR(50),
  remarks TEXT,
  recorded_by VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(150),
  CONSTRAINT uq_record_batch_date_student UNIQUE (batch_code, attendance_date, student_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_code ON attendance_records(student_code);
CREATE INDEX IF NOT EXISTS idx_attendance_records_batch ON attendance_records(batch_code);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch ON attendance_sessions(batch_code);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(session_date);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attendance_sessions_timestamp ON attendance_sessions;
CREATE TRIGGER trigger_update_attendance_sessions_timestamp
  BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

DROP TRIGGER IF EXISTS trigger_update_attendance_records_timestamp ON attendance_records;
CREATE TRIGGER trigger_update_attendance_records_timestamp
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated counsellors, trainers, and administrators
CREATE POLICY "Allow authenticated staff to read attendance sessions"
  ON attendance_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to insert attendance sessions"
  ON attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update attendance sessions"
  ON attendance_sessions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to read attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to insert attendance records"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update attendance records"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to delete attendance records"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (true);
