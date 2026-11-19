import { z } from "zod";
import { ALL_COURSES } from "@/lib/courses";

export const studentStatusEnum = ["Active", "Inactive", "Completed", "Dropped"] as const;
export type StudentStatus = (typeof studentStatusEnum)[number];

export const studentGenderEnum = ["Male", "Female", "Other"] as const;
export type StudentGender = (typeof studentGenderEnum)[number];

export const studentCourseList = ALL_COURSES;

export interface BatchInfo {
  code: string;
  course: string;
  name: string;
  trainer: string;
  timing: string;
  days: string;
}

export const studentBatchList: BatchInfo[] = [
  {
    code: "DM-2026-M1",
    course: "Digital Marketing",
    name: "DM Morning Elite (09:00 AM - 11:00 AM)",
    trainer: "Karan Verma",
    timing: "09:00 AM - 11:00 AM",
    days: "Mon - Fri",
  },
  {
    code: "DM-2026-E2",
    course: "Digital Marketing",
    name: "DM Evening FastTrack (06:30 PM - 08:30 PM)",
    trainer: "Karan Verma",
    timing: "06:30 PM - 08:30 PM",
    days: "Mon - Fri",
  },
  {
    code: "DA-2026-W1",
    course: "Data Analytics",
    name: "DA Weekend Master (10:00 AM - 02:00 PM)",
    trainer: "Pooja Reddy",
    timing: "10:00 AM - 02:00 PM",
    days: "Sat - Sun",
  },
  {
    code: "UI-2026-E1",
    course: "UI/UX Design",
    name: "UI/UX Product Design (05:00 PM - 07:00 PM)",
    trainer: "Arun Nair",
    timing: "05:00 PM - 07:00 PM",
    days: "Mon - Thu",
  },
  {
    code: "FSD-2026-R2",
    course: "Full-stack Development",
    name: "FSD MERN Stack Regular (11:30 AM - 01:30 PM)",
    trainer: "Ramesh Sen",
    timing: "11:30 AM - 01:30 PM",
    days: "Mon - Fri",
  },
  {
    code: "AIML-2026-M2",
    course: "AI & Machine Learning",
    name: "AI & Deep Learning Pro (09:00 AM - 01:00 PM)",
    trainer: "Dr. Sanjay Rao",
    timing: "09:00 AM - 01:00 PM",
    days: "Tue - Sat",
  },
];

export const guardianRelationList = [
  "Father",
  "Mother",
  "Guardian",
  "Spouse",
  "Other",
] as const;

export interface PaymentRecord {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  paymentMethod: "UPI" | "Credit/Debit Card" | "Net Banking" | "Cash" | "Bank Transfer";
  remarks?: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  sessionTitle: string;
  status: "Present" | "Absent" | "Late" | "Excused";
}

// Zod schema for student creation & editing
export const studentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must have at least 10 digits")
    .regex(/^[0-9+\s\-()]{10,20}$/, "Invalid phone number format"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(studentGenderEnum),
  address: z.string().min(3, "Address is required"),
  guardianName: z.string().min(2, "Parent/Guardian name is required"),
  guardianPhone: z
    .string()
    .min(10, "Guardian phone number must have at least 10 digits")
    .regex(/^[0-9+\s\-()]{10,20}$/, "Invalid phone number format"),
  guardianRelation: z.enum(guardianRelationList),
  course: z.string().min(1, "Please select a course"),
  batchCode: z.string().min(1, "Please assign a batch"),
  admissionDate: z.string().min(1, "Admission date is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  status: z.enum(studentStatusEnum).default("Active"),
  photoUrl: z.string().optional().nullable(),
  avatarColor: z.string().optional(),
  totalFee: z.coerce.number().min(0, "Total fee must be positive"),
  paidAmount: z.coerce.number().min(0, "Paid amount must be positive"),
  linkedLeadId: z.string().optional().nullable(),
  linkedLeadCode: z.string().optional().nullable(),
  linkedEnquiryId: z.string().optional().nullable(),
  linkedEnquiryCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export interface StudentRecord extends StudentFormData {
  id: string;
  studentCode: string; // STU-1001
  batchName: string;
  pendingAmount: number;
  paymentStatus: "Paid" | "Partial" | "Pending";
  payments: PaymentRecord[];
  attendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
  recentAttendance: AttendanceSession[];
  createdAt: string;
  updatedAt: string;
}

export const studentStatusUpdateSchema = z.object({
  status: z.enum(studentStatusEnum),
  remarks: z.string().optional(),
});
