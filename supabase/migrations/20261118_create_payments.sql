-- NEXT GEN DMA VENTURES CRM - Payment Management Table Schema
-- Supabase / PostgreSQL Migration

CREATE TYPE payment_method AS ENUM (
  'UPI',
  'Bank Transfer',
  'Credit/Debit Card',
  'Cash',
  'Cheque',
  'Other'
);

CREATE TYPE payment_transaction_type AS ENUM (
  'Payment',
  'Refund',
  'Adjustment'
);

CREATE TYPE payment_transaction_status AS ENUM (
  'Paid',
  'Partially Paid',
  'Pending',
  'Overdue',
  'Refunded'
);

CREATE TYPE installment_status AS ENUM (
  'Paid',
  'Partially Paid',
  'Pending',
  'Overdue'
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(50) PRIMARY KEY, -- e.g. PAY-2026-101
  receipt_no VARCHAR(50) UNIQUE NOT NULL, -- e.g. REC-2026-077
  student_id UUID REFERENCES students(id) ON DELETE RESTRICT,
  student_code VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  student_phone VARCHAR(50),
  student_email VARCHAR(150),
  admission_id UUID REFERENCES admissions(id) ON DELETE RESTRICT,
  admission_code VARCHAR(50) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50),
  batch_code VARCHAR(50) NOT NULL,
  batch_name VARCHAR(150),
  total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  final_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(10, 2) NOT NULL,
  cumulative_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_method payment_method NOT NULL,
  transaction_ref VARCHAR(100) NOT NULL,
  received_by VARCHAR(100) NOT NULL,
  type payment_transaction_type NOT NULL DEFAULT 'Payment',
  status payment_transaction_status NOT NULL DEFAULT 'Paid',
  installment_number INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Installment Plans Table
CREATE TABLE IF NOT EXISTS installment_plans (
  id VARCHAR(50) PRIMARY KEY, -- e.g. PLAN-AD-402
  admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  final_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  pending_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Installment Schedule Items Table
CREATE TABLE IF NOT EXISTS installment_items (
  id VARCHAR(50) PRIMARY KEY, -- e.g. INST-402-1
  plan_id VARCHAR(50) NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status installment_status NOT NULL DEFAULT 'Pending',
  paid_date DATE,
  receipt_no VARCHAR(50),
  transaction_ref VARCHAR(100),
  notes TEXT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payment_transactions(receipt_no);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payment_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_admission ON payment_transactions(admission_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payment_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payment_transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_installments_plan ON installment_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installment_items(status);
CREATE INDEX IF NOT EXISTS idx_installments_due ON installment_items(due_date);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Row Level Security (RLS)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated staff to read payments"
ON payment_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to insert payments"
ON payment_transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to update payments"
ON payment_transactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to delete payments"
ON payment_transactions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated staff to manage installment plans"
ON installment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to manage installment items"
ON installment_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
