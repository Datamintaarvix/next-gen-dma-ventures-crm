-- NEXT GEN DMA VENTURES CRM - Counselling Management Table Schema
-- Supabase / PostgreSQL Migration

DO $$ BEGIN
  CREATE TYPE counselling_session_type AS ENUM (
    'In-person',
    'Phone',
    'Video Call'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE counselling_session_status AS ENUM (
    'Scheduled',
    'Confirmed',
    'Completed',
    'Cancelled',
    'No Show'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE counselling_priority AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Counselling Sessions Table
CREATE TABLE IF NOT EXISTS counselling_sessions (
  id VARCHAR(100) PRIMARY KEY, -- e.g. CS-1001
  session_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. CS-2026-101
  participant_type VARCHAR(50) NOT NULL DEFAULT 'Lead', -- Lead, Enquiry, Student, Direct Applicant
  participant_id VARCHAR(100),
  participant_code VARCHAR(50),
  person_name VARCHAR(150) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  interested_course VARCHAR(255) NOT NULL,
  assigned_counsellor VARCHAR(100) NOT NULL,
  counselling_date DATE NOT NULL,
  start_time VARCHAR(50) NOT NULL,
  end_time VARCHAR(50) NOT NULL,
  session_type counselling_session_type NOT NULL DEFAULT 'In-person',
  purpose VARCHAR(255) NOT NULL,
  meeting_location_or_link TEXT NOT NULL,
  priority counselling_priority NOT NULL DEFAULT 'Medium',
  status counselling_session_status NOT NULL DEFAULT 'Scheduled',
  additional_notes TEXT,
  
  -- Completed / Discussion Assessment Fields
  discussion_notes TEXT,
  student_requirements TEXT,
  course_recommendations VARCHAR(255),
  student_interests TEXT,
  concerns_or_objections TEXT,
  next_action TEXT,
  recommended_follow_up_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(100),
  cancellation_reason TEXT,
  linked_follow_up_id VARCHAR(100),
  
  -- Admission Conversion Tracking
  is_converted_to_admission BOOLEAN NOT NULL DEFAULT FALSE,
  admission_id VARCHAR(100),
  admission_code VARCHAR(50),
  
  -- Audit and Timestamps
  audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(100)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_counselling_assigned_counsellor ON counselling_sessions(assigned_counsellor);
CREATE INDEX IF NOT EXISTS idx_counselling_date ON counselling_sessions(counselling_date);
CREATE INDEX IF NOT EXISTS idx_counselling_status ON counselling_sessions(status);
CREATE INDEX IF NOT EXISTS idx_counselling_person_name ON counselling_sessions(person_name);
CREATE INDEX IF NOT EXISTS idx_counselling_contact ON counselling_sessions(contact_number);
CREATE INDEX IF NOT EXISTS idx_counselling_converted ON counselling_sessions(is_converted_to_admission);
CREATE INDEX IF NOT EXISTS idx_counselling_participant ON counselling_sessions(participant_type, participant_id);

-- Trigger for auto updated_at
CREATE OR REPLACE FUNCTION update_counselling_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_counselling_timestamp ON counselling_sessions;
CREATE TRIGGER trigger_update_counselling_timestamp
  BEFORE UPDATE ON counselling_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_counselling_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE counselling_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated staff members full access to counselling operations
CREATE POLICY "Allow authenticated staff to read counselling sessions"
  ON counselling_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to insert counselling sessions"
  ON counselling_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update counselling sessions"
  ON counselling_sessions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated staff to delete counselling sessions"
  ON counselling_sessions FOR DELETE
  TO authenticated
  USING (true);
