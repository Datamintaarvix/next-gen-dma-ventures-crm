import { z } from "zod";
import { leadCounselorList } from "./lead";

export const sessionTypeEnum = ["In-person", "Phone", "Video Call"] as const;
export type SessionType = (typeof sessionTypeEnum)[number];

export const sessionStatusEnum = [
  "Scheduled",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No Show",
] as const;
export type SessionStatus = (typeof sessionStatusEnum)[number];

export const sessionPriorityEnum = ["Low", "Medium", "High", "Urgent"] as const;
export type SessionPriority = (typeof sessionPriorityEnum)[number];

export const participantTypeEnum = ["Lead", "Enquiry", "Student", "Direct Applicant"] as const;
export type ParticipantType = (typeof participantTypeEnum)[number];

export const counsellingPurposeList = [
  "Career Guidance & Skill Assessment",
  "Course Selection & Curriculum Walkthrough",
  "Fee Structure, Installments & Scholarships",
  "Admission Requirements & Batch Timings",
  "Parent / Guardian Consultation",
  "Placement Assistance & Industry Projects",
  "Post-Class Academic Mentorship",
  "Other Consultation",
] as const;
export type CounsellingPurpose = (typeof counsellingPurposeList)[number];

const phoneRegex = /^(\+?[1-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,14}$/;

export const scheduleCounsellingSchema = z.object({
  participantType: z.enum(participantTypeEnum).default("Lead"),
  participantId: z.string().optional().nullable(),
  participantCode: z.string().optional().nullable(),
  personName: z
    .string()
    .min(2, "Student / Person name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  contactNumber: z
    .string()
    .min(10, "Contact number must be at least 10 digits")
    .regex(phoneRegex, "Please enter a valid phone number (e.g., +91 98765 43210)"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  interestedCourse: z.string().min(1, "Please specify interested or enrolled course"),
  assignedCounsellor: z.string().min(1, "Please assign a counsellor"),
  counsellingDate: z
    .string()
    .min(1, "Please select counselling date")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().min(1, "Please select start time"),
  endTime: z.string().min(1, "Please select end time"),
  sessionType: z.enum(sessionTypeEnum).default("In-person"),
  purpose: z.string().min(1, "Please select counselling purpose"),
  meetingLocationOrLink: z
    .string()
    .min(2, "Meeting location or link is required (e.g. Room 102 or Google Meet URL)"),
  priority: z.enum(sessionPriorityEnum).default("Medium"),
  status: z.enum(sessionStatusEnum).default("Scheduled"),
  additionalNotes: z.string().optional().nullable(),
});

export type ScheduleCounsellingFormData = z.infer<typeof scheduleCounsellingSchema>;

export const completeSessionSchema = z.object({
  status: z.enum(["Completed", "Cancelled", "No Show"]).default("Completed"),
  discussionNotes: z.string().min(5, "Discussion notes must be at least 5 characters"),
  studentRequirements: z.string().optional().nullable(),
  courseRecommendations: z.string().min(2, "Recommended course is required"),
  studentInterests: z.string().optional().nullable(),
  concernsOrObjections: z.string().optional().nullable(),
  nextAction: z.string().min(2, "Next action is required"),
  recommendedFollowUpDate: z
    .string()
    .optional()
    .nullable()
    .refine((d) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d), "Date must be YYYY-MM-DD"),
  createFollowUp: z.boolean().default(false),
  counsellorName: z.string().optional().nullable(),
});

export type CompleteSessionFormData = z.infer<typeof completeSessionSchema>;

export interface CounsellingAuditEntry {
  timestamp: string;
  action: string; // e.g. "Scheduled", "Rescheduled", "Completed", "Cancelled"
  performedBy: string;
  notes?: string;
}

export interface CounsellingSessionRecord extends ScheduleCounsellingFormData {
  id: string; // Internal UUID / timestamp ID
  sessionCode: string; // e.g. "CS-2026-101"
  discussionNotes?: string | null;
  studentRequirements?: string | null;
  courseRecommendations?: string | null;
  studentInterests?: string | null;
  concernsOrObjections?: string | null;
  nextAction?: string | null;
  recommendedFollowUpDate?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  cancellationReason?: string | null;
  linkedFollowUpId?: string | null;
  isConvertedToAdmission?: boolean;
  admissionId?: string | null;
  admissionCode?: string | null;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: string | null;
  auditTrail: CounsellingAuditEntry[];
}

export interface CounsellingKPIStats {
  totalSessions: number;
  todaySessions: number;
  upcomingSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  convertedCount: number;
  conversionRate: number; // percentage of completed sessions that took admission
}

export interface CounsellorPerformanceStat {
  counsellorName: string;
  totalAssigned: number;
  completed: number;
  cancelled: number;
  noShow: number;
  convertedToAdmission: number;
  conversionRate: number;
  avgDurationMinutes: number;
}
