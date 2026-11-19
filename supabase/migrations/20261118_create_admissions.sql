-- NEXT GEN DMA VENTURES CRM - Admissions Management Table Schema
-- Supabase / PostgreSQL Migration

CREATE TYPE admission_status AS ENUM (
  'Application Received',
  'Documents Pending',
  'Under Review',
  'Approved',
  'Enrolled',
  'Rejected',
  'Cancelled'
);

CREATE TYPE admission_payment_status AS ENUM (
  'Paid',
  'Partial',
  'Pending'
);

CREATE TABLE IF NOT EXISTS admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. AD-401, AD-402
  student_id UUID REFERENCES students(id) ON DELETE RESTRICT,
  student_code VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  student_phone VARCHAR(50) NOT NULL,
  student_email VARCHAR(150) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  batch_code VARCHAR(50) NOT NULL,
  batch_name VARCHAR(150) NOT NULL,
  admission_date DATE NOT NULL,
  counsellor VARCHAR(100) NOT NULL,
  total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_reason TEXT,
  final_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status admission_payment_status NOT NULL DEFAULT 'Pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI / GPay',
  status admission_status NOT NULL DEFAULT 'Application Received',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admission Documents Verification Table
CREATE TABLE IF NOT EXISTS admission_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  submitted BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  document_number VARCHAR(100),
  url TEXT,
  notes TEXT
);

-- Admission Payments History Table
CREATE TABLE IF NOT EXISTS admission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  receipt_no VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_ref VARCHAR(100),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admission Activity Timeline Table
CREATE TABLE IF NOT EXISTS admission_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status admission_status NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  performed_by VARCHAR(100) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_admissions_code ON admissions(admission_code);
CREATE INDEX IF NOT EXISTS idx_admissions_student ON admissions(student_id);
CREATE INDEX IF NOT EXISTS idx_admissions_course ON admissions(course_name);
CREATE INDEX IF NOT EXISTS idx_admissions_batch ON admissions(batch_code);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_payment_status ON admissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_admissions_date ON admissions(admission_date);
CREATE INDEX IF NOT EXISTS idx_admissions_counsellor ON admissions(counsellor);
CREATE INDEX IF NOT EXISTS idx_admission_documents_adm ON admission_documents(admission_id);
CREATE INDEX IF NOT EXISTS idx_admission_payments_adm ON admission_payments(admission_id);
CREATE INDEX IF NOT EXISTS idx_admission_timeline_adm ON admission_timeline(admission_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_admissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admissions_updated_at
BEFORE UPDATE ON admissions
FOR EACH ROW
EXECUTE FUNCTION update_admissions_updated_at();

-- Row Level Security (RLS)
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated staff to read admissions"
ON admissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to insert admissions"
ON admissions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update admissions"
ON admissions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to delete admissions"
ON admissions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to manage admission documents"
ON admission_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to manage admission payments"
ON admission_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to manage admission timeline"
ON admission_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);
