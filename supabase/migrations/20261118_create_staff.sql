-- NEXT GEN DMA VENTURES CRM - Staff Management Module Schema
-- Supabase / PostgreSQL Migration

DO $$ BEGIN
  CREATE TYPE staff_role_type AS ENUM (
    'Super Admin',
    'Admin',
    'Manager',
    'Counsellor',
    'Trainer',
    'Placement Officer',
    'Finance Staff',
    'Receptionist'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE staff_department_type AS ENUM (
    'Admissions & Counselling',
    'Academics & Training',
    'Corporate Relations & Placements',
    'Finance & Accounts',
    'Front Desk & Operations',
    'Administration & Leadership'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE employment_type_type AS ENUM (
    'Full-time',
    'Part-time',
    'Contract',
    'Visiting Faculty'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE employment_status_type AS ENUM (
    'Active',
    'On Leave',
    'Probation',
    'Inactive'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Staff Members Table
CREATE TABLE IF NOT EXISTS staff_members (
  id VARCHAR(100) PRIMARY KEY, -- e.g. STF-101
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  address TEXT NOT NULL,
  department staff_department_type NOT NULL,
  designation VARCHAR(150) NOT NULL,
  role staff_role_type NOT NULL DEFAULT 'Counsellor',
  employment_type employment_type_type NOT NULL DEFAULT 'Full-time',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reporting_manager VARCHAR(150) NOT NULL,
  employment_status employment_status_type NOT NULL DEFAULT 'Active',
  emergency_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Staff Audit Logs Table
CREATE TABLE IF NOT EXISTS staff_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  staff_id VARCHAR(100) NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  changed_by VARCHAR(150) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_members(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_members(role);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff_members(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff_members(employment_status);
CREATE INDEX IF NOT EXISTS idx_staff_audit_staff_id ON staff_audit_logs(staff_id);

-- Enable Row Level Security (RLS)
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
DO $$ BEGIN
  CREATE POLICY "Allow authenticated staff to read staff members" ON staff_members FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write staff members" ON staff_members FOR ALL TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to read staff audit logs" ON staff_audit_logs FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to insert staff audit logs" ON staff_audit_logs FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
