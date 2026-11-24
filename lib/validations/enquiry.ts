import { z } from "zod";
import { leadCourseList } from "./lead";

const phoneRegex = /^(\+?[1-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,14}$/;

export const enquiryStatusEnum = z.enum([
  "New",
  "Pending",
  "In Progress",
  "Follow-up",
  "Responded",
  "Converted",
  "Closed",
]);

export type EnquiryStatus = z.infer<typeof enquiryStatusEnum>;

export const enquirySourceList = [
  "Website",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Walk-in",
  "Phone Call",
  "Referral",
  "Other",
] as const;

export type EnquirySource = (typeof enquirySourceList)[number];

export const interactionTypeEnum = z.enum([
  "Phone Call",
  "WhatsApp",
  "Email",
  "Counselling",
  "Follow-up",
  "Note",
]);

export type InteractionType = z.infer<typeof interactionTypeEnum>;

export interface CommunicationRecord {
  id: string;
  type: InteractionType;
  staffName: string;
  date: string;
  summary: string;
}

export const enquirySchema = z.object({
  studentName: z
    .string()
    .min(2, { message: "Student name must be at least 2 characters" })
    .max(100, { message: "Student name must not exceed 100 characters" }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .regex(phoneRegex, {
      message: "Please enter a valid phone number (e.g., +91 98765 43210)",
    }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .or(z.literal("")),
  interestedCourse: z.string().min(1, { message: "Please select an interested course" }),
  enquirySource: z.string().min(1, { message: "Please select an enquiry source" }),
  enquiryDate: z.string().min(1, { message: "Please select enquiry date" }),
  enquiryMessage: z
    .string()
    .min(3, { message: "Enquiry message must be at least 3 characters" }),
  assignedCounsellor: z.string().min(1, { message: "Please enter assigned staff name" }),
  status: enquiryStatusEnum,
  nextFollowUpDate: z.string().min(1, { message: "Please select next follow-up date" }),
});

export type EnquiryFormData = z.infer<typeof enquirySchema>;

export interface EnquiryRecord extends EnquiryFormData {
  id: string;
  enquiryCode: string;
  convertedToLeadId?: string | null;
  convertedLeadCode?: string | null;
  convertedAt?: string | null;
  interactions: CommunicationRecord[];
  createdAt: string;
  updatedAt: string;
}

export const interactionSchema = z
  .object({
    type: interactionTypeEnum,
    staffName: z.string().min(1, { message: "Staff name is required" }),
    summary: z.string().min(2, { message: "Summary/note is required" }),
    followUpDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "Follow-up") {
        return Boolean(data.followUpDate && data.followUpDate.trim().length > 0);
      }
      return true;
    },
    {
      message: "A valid follow-up date is required when interaction type is Follow-up",
      path: ["followUpDate"],
    }
  );

export type InteractionFormData = z.infer<typeof interactionSchema>;
