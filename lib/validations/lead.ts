import { z } from "zod";

// Phone validation regex supporting international and standard formats
const phoneRegex = /^(\+?[1-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,14}$/;

export const leadStatusEnum = z.enum([
  "New",
  "Contacted",
  "Interested",
  "Follow-up",
  "Converted",
  "Lost",
]);

export const leadCourseList = [
  "Digital Marketing",
  "Data Analytics",
  "UI/UX Design",
  "Full-stack Development",
  "AI & Machine Learning",
  "Cybersecurity",
  "Cloud Computing",
] as const;

export const leadSourceList = [
  "Website",
  "Referral",
  "Social media",
  "Event",
  "Direct Walk-in",
  "Google Ads",
  "Email Campaign",
  "Other",
] as const;

export const leadCounselorList = [
  "Priya Nair",
  "Rahul Mehta",
  "Sneha Iyer",
  "Vikram Joshi",
  "Ananya Sen",
  "Unassigned",
] as const;

export const leadSchema = z.object({
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
  leadSource: z.string().min(1, { message: "Please select an enquiry source" }),
  status: leadStatusEnum,
  assignedCounselor: z.string().min(1, { message: "Please enter assigned staff name" }),
  followUpDate: z.string().min(1, { message: "Please select a follow-up date" }),
  notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export interface LeadRecord extends LeadFormData {
  id: string;
  leadCode: string;
  createdAt: string;
  updatedAt: string;
}
