-- ========================================================
-- NEXT GEN DMA VENTURES CRM - Leads Management Migration
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Lead Status Type
DO $$ BEGIN
    CREATE TYPE lead_status_type AS ENUM ('New', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_code VARCHAR(20) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    interested_course VARCHAR(100) NOT NULL,
    lead_source VARCHAR(50) NOT NULL,
    assigned_counselor VARCHAR(100) NOT NULL,
    follow_up_date DATE NOT NULL,
    status lead_status_type NOT NULL DEFAULT 'New',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for lightning fast search and filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_course ON public.leads (interested_course);
CREATE INDEX IF NOT EXISTS idx_leads_counselor ON public.leads (assigned_counselor);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON public.leads (follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_student_name ON public.leads (student_name);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and service roles to read and manage leads
CREATE POLICY "Allow all access to authenticated users" ON public.leads
    FOR ALL
    USING (true)
    WITH CHECK (true);
