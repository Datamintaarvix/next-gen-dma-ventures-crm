-- NEXT GEN DMA VENTURES CRM - Student Management Table Schema
-- Supabase / PostgreSQL Migration

CREATE TYPE student_status AS ENUM (
  'Active',
  'Inactive',
  'Completed',
  'Dropped'
);

CREATE TYPE student_gender AS ENUM (
  'Male',
  'Female',
  'Other'
);

CREATE TYPE payment_status AS ENUM (
  'Paid',
  'Partial',
  'Pending'
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code VARCHAR(20) UNIQUE NOT NULL, -- STU-1001
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender student_gender NOT NULL DEFAULT 'Male',
  address TEXT NOT NULL,
  
  -- Guardian Details
  guardian_name VARCHAR(255) NOT NULL,
  guardian_phone VARCHAR(50) NOT NULL,
  guardian_relation VARCHAR(50) NOT NULL DEFAULT 'Father',
  
  -- Enrollment
  course VARCHAR(100) NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  batch_name VARCHAR(255) NOT NULL,
  admission_date DATE NOT NULL,
  joining_date DATE NOT NULL,
  status student_status NOT NULL DEFAULT 'Active',
  photo_url TEXT,
  avatar_color VARCHAR(20) DEFAULT '#078783',
  
  -- Financials
  total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'Pending',
  
  -- Attendance
  attendance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100,
  total_classes INTEGER NOT NULL DEFAULT 0,
  attended_classes INTEGER NOT NULL DEFAULT 0,
  
  -- Integration Links
  linked_lead_id VARCHAR(100),
  linked_lead_code VARCHAR(50),
  linked_enquiry_id VARCHAR(100),
  linked_enquiry_code VARCHAR(50),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments sub-table
CREATE TABLE IF NOT EXISTS student_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  receipt_no VARCHAR(50) UNIQUE NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance sub-table
CREATE TABLE IF NOT EXISTS student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_title VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Present',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone_number);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_code);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_date);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_students_updated_at();

-- Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated staff to read students"
ON students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to insert students"
ON students FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update students"
ON students FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to delete students"
ON students FOR DELETE TO authenticated USING (true);
