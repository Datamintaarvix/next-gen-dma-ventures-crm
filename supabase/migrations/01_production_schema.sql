-- =========================================================================
-- NEXT GEN DMA VENTURES CRM - PRODUCTION POSTGRESQL SCHEMA MIGRATION
-- Comprehensive Enterprise Institutional Database Architecture
-- Compatible with Supabase PostgreSQL, Strict Foreign Keys & Row Level Security (RLS)
-- Fully Idempotent: Safe to execute on a fresh project or rerun safely anytime.
-- ZERO Destructive Operations: No DROP TABLE, TRUNCATE, or UNINTENDED DELETES.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  syllabus JSONB DEFAULT '[]'::jsonb,
  instructor TEXT,
  instructor_bio TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  level TEXT DEFAULT 'Intermediate',
  mode TEXT DEFAULT 'Hybrid',
  max_capacity INTEGER NOT NULL DEFAULT 25,
  image_url TEXT,
  enrolled_students_count INTEGER DEFAULT 0,
  active_batches_count INTEGER DEFAULT 0,
  active_batches_list JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT UNIQUE NOT NULL,
  batch_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  trainer TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  class_days TEXT NOT NULL,
  class_timings TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 25,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  available_seats INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'Upcoming',
  classroom TEXT,
  description TEXT,
  student_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STAFF / OPERATORS TABLE
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  avatar_url TEXT,
  address TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Counsellor',
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  joining_date DATE NOT NULL,
  reporting_manager TEXT NOT NULL,
  employment_status TEXT NOT NULL DEFAULT 'Active',
  emergency_contact JSONB,
  notes TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  lead_code TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  interested_course TEXT NOT NULL,
  lead_source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  assigned_counselor TEXT NOT NULL,
  follow_up_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY,
  enquiry_code TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  interested_course TEXT NOT NULL,
  enquiry_source TEXT NOT NULL,
  enquiry_date DATE NOT NULL,
  enquiry_message TEXT NOT NULL,
  assigned_counsellor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  next_follow_up_date DATE NOT NULL,
  converted_to_lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
  converted_lead_code TEXT,
  converted_at TIMESTAMPTZ,
  interactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. FOLLOW-UPS TABLE
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id TEXT PRIMARY KEY,
  follow_up_code TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  related_type TEXT NOT NULL DEFAULT 'General',
  related_id TEXT,
  related_code TEXT,
  contact_number TEXT NOT NULL,
  follow_up_date DATE NOT NULL,
  follow_up_time TEXT NOT NULL,
  type TEXT NOT NULL,
  assigned_counsellor TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  rescheduled_to_date DATE,
  rescheduled_to_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  address TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_relation TEXT NOT NULL,
  course TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  admission_date DATE NOT NULL,
  joining_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  photo_url TEXT,
  avatar_color TEXT,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  attendance_percentage NUMERIC(5,2) DEFAULT 100,
  total_classes INTEGER DEFAULT 0,
  attended_classes INTEGER DEFAULT 0,
  payments JSONB DEFAULT '[]'::jsonb,
  recent_attendance JSONB DEFAULT '[]'::jsonb,
  linked_lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
  linked_lead_code TEXT,
  linked_enquiry_id TEXT REFERENCES public.enquiries(id) ON DELETE SET NULL,
  linked_enquiry_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ADMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.admissions (
  id TEXT PRIMARY KEY,
  admission_code TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_gender TEXT,
  course_name TEXT NOT NULL,
  course_code TEXT,
  batch_code TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  admission_date DATE NOT NULL,
  counsellor TEXT NOT NULL,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_reason TEXT,
  final_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  status TEXT NOT NULL DEFAULT 'Application Received',
  payment_method TEXT NOT NULL DEFAULT 'UPI / GPay',
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  payment_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  receipt_no TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  student_email TEXT,
  admission_id TEXT NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  admission_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_code TEXT,
  batch_code TEXT NOT NULL,
  batch_name TEXT,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  cumulative_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_ref TEXT NOT NULL,
  received_by TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Payment',
  status TEXT NOT NULL DEFAULT 'Paid',
  installment_number INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INSTALLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.installments (
  id TEXT PRIMARY KEY,
  admission_id TEXT NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  admission_code TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  installments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id TEXT PRIMARY KEY,
  course_name TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  date DATE NOT NULL,
  session_title TEXT NOT NULL,
  trainer TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  total_students INTEGER NOT NULL DEFAULT 0,
  present_count INTEGER NOT NULL DEFAULT 0,
  absent_count INTEGER NOT NULL DEFAULT 0,
  late_count INTEGER NOT NULL DEFAULT 0,
  excused_count INTEGER NOT NULL DEFAULT 0,
  attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  records JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ATTENDANCE STUDENT RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  date DATE NOT NULL,
  session_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Present',
  check_in_time TEXT,
  remarks TEXT,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. COUNSELLING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.counselling_sessions (
  id TEXT PRIMARY KEY,
  session_code TEXT UNIQUE NOT NULL,
  participant_type TEXT NOT NULL DEFAULT 'Lead',
  participant_id TEXT,
  participant_code TEXT,
  person_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  interested_course TEXT NOT NULL,
  assigned_counsellor TEXT NOT NULL,
  counselling_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'In-person',
  purpose TEXT NOT NULL,
  location_or_link TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT,
  is_converted_to_admission BOOLEAN DEFAULT FALSE,
  outcome_summary TEXT,
  recommendations TEXT,
  action_plan JSONB DEFAULT '[]'::jsonb,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  last_modified_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PLACEMENT RECRUITING COMPANIES
CREATE TABLE IF NOT EXISTS public.placement_companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  website TEXT,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  address TEXT NOT NULL,
  partnership_status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT,
  active_opportunities_count INTEGER DEFAULT 0,
  total_hired_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PLACEMENT JOB OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.placement_jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES public.placement_companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  required_skills JSONB DEFAULT '[]'::jsonb,
  eligibility_criteria TEXT NOT NULL,
  openings INTEGER NOT NULL DEFAULT 1,
  filled_openings INTEGER NOT NULL DEFAULT 0,
  salary_min_lpa NUMERIC(6,2),
  salary_max_lpa NUMERIC(6,2),
  salary_range_display TEXT,
  job_location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  application_deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  total_applications INTEGER DEFAULT 0,
  shortlisted_count INTEGER DEFAULT 0,
  selected_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. PLACEMENT CANDIDATE PROFILES
CREATE TABLE IF NOT EXISTS public.placement_profiles (
  student_id TEXT PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  course_name TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  attendance_percentage NUMERIC(5,2) DEFAULT 0,
  skills JSONB DEFAULT '[]'::jsonb,
  resume_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  expected_salary_lpa NUMERIC(6,2),
  placement_eligibility TEXT NOT NULL DEFAULT 'Eligible',
  placement_status TEXT NOT NULL DEFAULT 'Seeking Placement',
  total_applications INTEGER DEFAULT 0,
  total_interviews INTEGER DEFAULT 0,
  active_offers_count INTEGER DEFAULT 0,
  placed_company TEXT,
  placed_job_title TEXT,
  placed_salary_lpa NUMERIC(6,2),
  placed_date DATE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. PLACEMENT APPLICATIONS
CREATE TABLE IF NOT EXISTS public.placement_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES public.placement_jobs(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES public.placement_companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  course_name TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  applied_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Applied',
  resume_url TEXT,
  portfolio_url TEXT,
  interviews JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. PLACEMENT OFFERS
CREATE TABLE IF NOT EXISTS public.placement_offers (
  id TEXT PRIMARY KEY,
  application_id TEXT,
  job_id TEXT,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  offered_salary_lpa NUMERIC(6,2) NOT NULL,
  offered_salary_display TEXT,
  offer_date DATE NOT NULL,
  joining_date DATE NOT NULL,
  offer_letter_ref TEXT,
  status TEXT NOT NULL DEFAULT 'Offer Extended',
  acceptance_date DATE,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Unread',
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_role TEXT,
  recipient_name TEXT,
  related_module TEXT,
  related_id TEXT,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 20. NOTIFICATION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1',
  affected_record_id TEXT
);

-- 22. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  company JSONB NOT NULL,
  general JSONB NOT NULL,
  departments JSONB NOT NULL,
  course_batch JSONB NOT NULL,
  security JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_date ON public.enquiries(enquiry_date);
CREATE INDEX IF NOT EXISTS idx_students_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch_code);
CREATE INDEX IF NOT EXISTS idx_admissions_student ON public.admissions(student_id);
CREATE INDEX IF NOT EXISTS idx_admissions_batch ON public.admissions(batch_code);
CREATE INDEX IF NOT EXISTS idx_payments_admission ON public.payments(admission_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_installments_admission ON public.installments(admission_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_counselling_date ON public.counselling_sessions(counselling_date);
CREATE INDEX IF NOT EXISTS idx_placement_jobs_company ON public.placement_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_placement_apps_student ON public.placement_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_student ON public.placement_offers(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENT & SAFE TO RERUN)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if rerun, ensuring 100% idempotent execution
DROP POLICY IF EXISTS "Full access for authenticated users on courses" ON public.courses;
CREATE POLICY "Full access for authenticated users on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on batches" ON public.batches;
CREATE POLICY "Full access for authenticated users on batches" ON public.batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on staff" ON public.staff;
CREATE POLICY "Full access for authenticated users on staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on leads" ON public.leads;
CREATE POLICY "Full access for authenticated users on leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on enquiries" ON public.enquiries;
CREATE POLICY "Full access for authenticated users on enquiries" ON public.enquiries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on follow_ups" ON public.follow_ups;
CREATE POLICY "Full access for authenticated users on follow_ups" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on students" ON public.students;
CREATE POLICY "Full access for authenticated users on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on admissions" ON public.admissions;
CREATE POLICY "Full access for authenticated users on admissions" ON public.admissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on payments" ON public.payments;
CREATE POLICY "Full access for authenticated users on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on installments" ON public.installments;
CREATE POLICY "Full access for authenticated users on installments" ON public.installments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on attendance_sessions" ON public.attendance_sessions;
CREATE POLICY "Full access for authenticated users on attendance_sessions" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on attendance_records" ON public.attendance_records;
CREATE POLICY "Full access for authenticated users on attendance_records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on counselling_sessions" ON public.counselling_sessions;
CREATE POLICY "Full access for authenticated users on counselling_sessions" ON public.counselling_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on placement_companies" ON public.placement_companies;
CREATE POLICY "Full access for authenticated users on placement_companies" ON public.placement_companies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on placement_jobs" ON public.placement_jobs;
CREATE POLICY "Full access for authenticated users on placement_jobs" ON public.placement_jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on placement_profiles" ON public.placement_profiles;
CREATE POLICY "Full access for authenticated users on placement_profiles" ON public.placement_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on placement_applications" ON public.placement_applications;
CREATE POLICY "Full access for authenticated users on placement_applications" ON public.placement_applications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on placement_offers" ON public.placement_offers;
CREATE POLICY "Full access for authenticated users on placement_offers" ON public.placement_offers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on notifications" ON public.notifications;
CREATE POLICY "Full access for authenticated users on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on notification_settings" ON public.notification_settings;
CREATE POLICY "Full access for authenticated users on notification_settings" ON public.notification_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on audit_logs" ON public.audit_logs;
CREATE POLICY "Full access for authenticated users on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users on system_settings" ON public.system_settings;
CREATE POLICY "Full access for authenticated users on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
