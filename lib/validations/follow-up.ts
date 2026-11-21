import { z } from "zod";

const phoneRegex = /^(\+?[1-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,14}$/;

export const followUpTypeEnum = z.enum([
  "Phone Call",
  "WhatsApp",
  "Email",
  "Office Visit",
  "Counselling Session",
]);

export type FollowUpType = z.infer<typeof followUpTypeEnum>;

export const followUpStatusEnum = z.enum([
  "Pending",
  "Completed",
  "Rescheduled",
  "Missed",
  "Cancelled",
]);

export type FollowUpStatus = z.infer<typeof followUpStatusEnum>;

export const followUpPriorityEnum = z.enum(["Low", "Medium", "High"]);

export type FollowUpPriority = z.infer<typeof followUpPriorityEnum>;

export const followUpRelatedTypeEnum = z.enum(["Lead", "Enquiry", "General"]);

export const followUpSchema = z.object({
  studentName: z
    .string()
    .min(2, { message: "Student name must be at least 2 characters" })
    .max(100, { message: "Student name must not exceed 100 characters" }),
  relatedType: followUpRelatedTypeEnum.default("General"),
  relatedId: z.string().optional().nullable(),
  relatedCode: z.string().optional().nullable(),
  contactNumber: z
    .string()
    .min(10, { message: "Contact number must be at least 10 digits" })
    .regex(phoneRegex, {
      message: "Please enter a valid phone number (e.g., +91 98765 43210)",
    }),
  followUpDate: z.string().min(1, { message: "Please select a follow-up date" }),
  followUpTime: z.string().min(1, { message: "Please select a follow-up time" }),
  type: followUpTypeEnum,
  assignedCounsellor: z.string().min(1, { message: "Please enter assigned staff name" }),
  priority: followUpPriorityEnum.default("Medium"),
  status: followUpStatusEnum.default("Pending"),
  notes: z.string().optional(),
  completionNotes: z.string().optional(),
});

export type FollowUpFormData = z.infer<typeof followUpSchema>;

export interface FollowUpRecord extends FollowUpFormData {
  id: string;
  followUpCode: string;
  completedAt?: string | null;
  rescheduledToDate?: string | null;
  rescheduledToTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const completeFollowUpSchema = z.object({
  completionNotes: z.string().min(2, { message: "Please provide a completion summary" }),
  scheduleNext: z.boolean().default(false),
  nextDate: z.string().optional(),
  nextTime: z.string().optional(),
  nextType: followUpTypeEnum.optional(),
  nextNotes: z.string().optional(),
});

export type CompleteFollowUpData = z.infer<typeof completeFollowUpSchema>;

export const rescheduleFollowUpSchema = z.object({
  newDate: z.string().min(1, { message: "Please select a new date" }),
  newTime: z.string().min(1, { message: "Please select a new time" }),
  reason: z.string().min(2, { message: "Please provide a reschedule reason" }),
});

export type RescheduleFollowUpData = z.infer<typeof rescheduleFollowUpSchema>;
