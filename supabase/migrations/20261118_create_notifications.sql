-- NEXT GEN DMA VENTURES CRM - Notifications Management Module Schema
-- Supabase / PostgreSQL Migration

DO $$ BEGIN
  CREATE TYPE notification_type_type AS ENUM (
    'New Lead Assigned',
    'New Enquiry Received',
    'Follow-up Due',
    'Follow-up Overdue',
    'New Admission',
    'Payment Received',
    'Pending Payment',
    'Counselling Appointment',
    'Upcoming Batch',
    'Attendance Alert',
    'Placement Update',
    'Staff Activity'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority_type AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status_type AS ENUM (
    'Unread',
    'Read',
    'Archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE related_module_type AS ENUM (
    'leads',
    'enquiries',
    'follow-ups',
    'admissions',
    'payments',
    'counselling',
    'batches',
    'attendance',
    'placements',
    'staff',
    'students'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(100) PRIMARY KEY, -- e.g. NTF-2026-101
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type_type NOT NULL,
  priority notification_priority_type NOT NULL DEFAULT 'Medium',
  status notification_status_type NOT NULL DEFAULT 'Unread',
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_role VARCHAR(100) NOT NULL DEFAULT 'All',
  recipient_name VARCHAR(150),
  related_module related_module_type NOT NULL,
  related_id VARCHAR(100) NOT NULL,
  link_url VARCHAR(255) NOT NULL,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_settings (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'global_default',
  in_app_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  desktop_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_digest BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_minutes_before INTEGER NOT NULL DEFAULT 15,
  category_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
DO $$ BEGIN
  CREATE POLICY "Allow authenticated staff to read notifications" ON notifications FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write notifications" ON notifications FOR ALL TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to read notification settings" ON notification_settings FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow authenticated staff to write notification settings" ON notification_settings FOR ALL TO authenticated USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
