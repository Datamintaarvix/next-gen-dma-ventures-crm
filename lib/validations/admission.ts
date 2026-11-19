import { z } from "zod";
import { leadCounselorList } from "./lead";

// Phone validation regex
export const phoneRegex = /^(\+?[1-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,14}$/;

export const admissionStatusEnum = [
  "Application Received",
  "Documents Pending",
  "Under Review",
  "Approved",
  "Enrolled",
  "Rejected",
  "Cancelled",
] as const;

export type AdmissionStatus = (typeof admissionStatusEnum)[number];

export const paymentStatusEnum = ["Paid", "Partial", "Pending"] as const;
export type AdmissionPaymentStatus = (typeof paymentStatusEnum)[number];

export const paymentMethodEnum = [
  "UPI / GPay",
  "Net Banking",
  "Debit / Credit Card",
  "Cash",
  "Cheque",
  "EMI / Loan",
] as const;
export type PaymentMethod = (typeof paymentMethodEnum)[number];

export interface AdmissionDocumentItem {
  id: string;
  name: string;
  submitted: boolean;
  verified: boolean;
  documentNumber?: string | null;
  url?: string | null;
  notes?: string | null;
}

export interface AdmissionTimelineItem {
  id: string;
  date: string;
  status: AdmissionStatus;
  title: string;
  description: string;
  performedBy: string;
}

export interface AdmissionPaymentItem {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod | string;
  transactionRef?: string;
  remarks?: string;
}

export const admissionSchema = z.object({
  studentMode: z.enum(["existing", "new"]).default("existing"),
  // Existing student ID (optional if new student)
  studentId: z.string().optional().nullable(),

  // New student details (required if studentMode === "new")
  newStudent: z
    .object({
      fullName: z.string().min(2, "Full name must be at least 2 characters"),
      phoneNumber: z.string().regex(phoneRegex, "Please enter a valid phone number"),
      email: z.string().email("Please enter a valid email address"),
      gender: z.enum(["Male", "Female", "Other"]).default("Male"),
      dateOfBirth: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      guardianName: z.string().optional().nullable(),
      guardianPhone: z.string().optional().nullable(),
    })
    .optional(),

  // Academic Course & Cohort Batch
  courseName: z.string().min(1, "Please select a course"),
  courseCode: z.string().optional().nullable(),
  batchCode: z.string().min(1, "Please select an available batch"),
  batchName: z.string().optional().nullable(),

  // Dates & Staff
  admissionDate: z.string().min(1, "Admission date is required"),
  counsellor: z.string().min(2, "Counsellor is required"),

  // Financials
  totalFee: z.coerce.number().min(0, "Total fee must be positive"),
  discountAmount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  discountReason: z.string().optional().nullable(),
  finalFee: z.coerce.number().min(0, "Final fee must be positive"),
  initialPayment: z.coerce.number().min(0, "Initial payment cannot be negative").default(0),
  paymentMethod: z.enum(paymentMethodEnum).default("UPI / GPay"),
  transactionRef: z.string().optional().nullable(),

  // Status & Notes
  status: z.enum(admissionStatusEnum).default("Application Received"),
  notes: z.string().optional().nullable(),

  // Checklists
  documents: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        submitted: z.boolean().default(false),
        verified: z.boolean().default(false),
        documentNumber: z.string().optional().nullable(),
        url: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
});

export type AdmissionFormData = z.infer<typeof admissionSchema>;

export interface AdmissionRecord {
  id: string;
  admissionCode: string; // e.g. AD-401, AD-402
  studentId: string;
  studentCode: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  studentGender?: string;
  courseName: string;
  courseCode: string;
  batchCode: string;
  batchName: string;
  admissionDate: string;
  counsellor: string;
  totalFee: number;
  discountAmount: number;
  discountReason?: string | null;
  finalFee: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: AdmissionPaymentStatus;
  status: AdmissionStatus;
  paymentMethod: string;
  notes?: string | null;
  documents: AdmissionDocumentItem[];
  timeline: AdmissionTimelineItem[];
  paymentHistory: AdmissionPaymentItem[];
  createdAt: string;
  updatedAt: string;
}

export const admissionStatusUpdateSchema = z.object({
  status: z.enum(admissionStatusEnum),
  remarks: z.string().optional(),
  staffName: z.string().default("Admin"),
});

export const addPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentMethod: z.enum(paymentMethodEnum),
  receiptNo: z.string().optional(),
  transactionRef: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  date: z.string().min(1, "Payment date is required"),
});

export type AddPaymentFormData = z.infer<typeof addPaymentSchema>;

export const defaultDocumentsList: AdmissionDocumentItem[] = [
  { id: "doc-1", name: "Government ID Proof (Aadhaar / Voter / Passport)", submitted: true, verified: true },
  { id: "doc-2", name: "10th / 12th Academic Marksheet", submitted: true, verified: false },
  { id: "doc-3", name: "Graduation / Diploma Certificate", submitted: false, verified: false },
  { id: "doc-4", name: "Recent Passport Size Photograph", submitted: true, verified: true },
  { id: "doc-5", name: "Admission Fee Payment Receipt", submitted: true, verified: true },
];
