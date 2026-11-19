import { z } from "zod";

export const batchStatusEnum = ["Upcoming", "Active", "Completed", "Cancelled"] as const;
export type BatchStatus = (typeof batchStatusEnum)[number];

export const batchClassDaysList = [
  "Mon - Fri",
  "Sat - Sun",
  "Mon - Thu",
  "Tue - Sat",
  "Mon, Wed, Fri",
  "Tue, Thu, Sat",
] as const;

export const batchTrainerList = [
  "Karan Verma",
  "Pooja Reddy",
  "Arun Nair",
  "Ramesh Sen",
  "Dr. Sanjay Rao",
  "Vikram Joshi",
  "Sneha Iyer",
] as const;

export const batchSchema = z.object({
  batchName: z
    .string()
    .min(3, "Batch name must be at least 3 characters")
    .max(100, "Batch name cannot exceed 100 characters"),
  courseName: z.string().min(1, "Please select an existing course"),
  trainer: z.string().min(2, "Trainer is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  classDays: z.string().min(1, "Class days are required"),
  classTimings: z.string().min(1, "Class timings are required"),
  maxCapacity: z.coerce.number().min(5, "Capacity must be at least 5 students").max(100),
  status: z.enum(batchStatusEnum).default("Upcoming"),
  classroom: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type BatchFormData = z.infer<typeof batchSchema>;

export interface BatchRecord extends BatchFormData {
  id: string;
  batchCode: string; // BCH-2026-M1, BCH-1001
  enrolledCount: number;
  availableSeats: number;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const batchStatusUpdateSchema = z.object({
  status: z.enum(batchStatusEnum),
});

export const assignStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  transferFromBatchCode: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});
