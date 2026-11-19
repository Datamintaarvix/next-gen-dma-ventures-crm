-- NEXT GEN DMA VENTURES CRM - Follow-up Management Table Schema
-- Supabase / PostgreSQL Migration

CREATE TYPE followup_type AS ENUM (
  'Phone Call',
  'WhatsApp',
  'Email',
  'Office Visit',
  'Counselling Session'
);

CREATE TYPE followup_status AS ENUM (
  'Pending',
  'Completed',
  'Rescheduled',
  'Missed',
  'Cancelled'
);

CREATE TYPE followup_priority AS ENUM (
  'Low',
  'Medium',
  'High'
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_code VARCHAR(20) UNIQUE NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  related_type VARCHAR(50) DEFAULT 'Lead', -- 'Lead', 'Enquiry', 'Direct'
  related_id VARCHAR(100),
  related_code VARCHAR(50),
  contact_number VARCHAR(50) NOT NULL,
  follow_up_date DATE NOT NULL,
  follow_up_time VARCHAR(20) NOT NULL,
  type followup_type NOT NULL DEFAULT 'Phone Call',
  assigned_counsellor VARCHAR(100) NOT NULL,
  priority followup_priority NOT NULL DEFAULT 'Medium',
  status followup_status NOT NULL DEFAULT 'Pending',
  notes TEXT,
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  rescheduled_to_date DATE,
  rescheduled_to_time VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_priority ON follow_ups(priority);
CREATE INDEX IF NOT EXISTS idx_follow_ups_counsellor ON follow_ups(assigned_counsellor);
CREATE INDEX IF NOT EXISTS idx_follow_ups_related ON follow_ups(related_type, related_id);

-- Updated_at auto-trigger
CREATE OR REPLACE FUNCTION update_follow_ups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follow_ups_updated_at
BEFORE UPDATE ON follow_ups
FOR EACH ROW
EXECUTE FUNCTION update_follow_ups_updated_at();

-- Row Level Security (RLS)
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated staff to read follow-ups"
ON follow_ups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated staff to insert follow-ups"
ON follow_ups FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update follow-ups"
ON follow_ups FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated staff to delete follow-ups"
ON follow_ups FOR DELETE
TO authenticated
USING (true);
