import { z } from "zod";

export const courseStatusEnum = ["Active", "Inactive", "Draft", "Archived"] as const;
export type CourseStatus = (typeof courseStatusEnum)[number];

export const courseCategoryList = [
  "Digital Marketing",
  "Data Science & Analytics",
  "UI/UX & Product Design",
  "Software Development",
  "AI & Machine Learning",
  "Cloud & Cybersecurity",
] as const;

export const courseLevelEnum = ["Beginner", "Intermediate", "Advanced", "All Levels"] as const;
export type CourseLevel = (typeof courseLevelEnum)[number];

export const courseModeEnum = [
  "Classroom & Online",
  "Classroom Only",
  "Online Live",
] as const;
export type CourseMode = (typeof courseModeEnum)[number];

export const courseInstructorList = [
  "Karan Verma",
  "Pooja Reddy",
  "Arun Nair",
  "Ramesh Sen",
  "Dr. Sanjay Rao",
  "Vikram Joshi",
  "Sneha Iyer",
] as const;

export interface SyllabusModule {
  id: string;
  moduleNumber: number;
  title: string;
  durationHours: number;
  topics: string[];
}

export const courseSchema = z.object({
  courseName: z
    .string()
    .min(3, "Course name must be at least 3 characters")
    .max(100, "Course name cannot exceed 100 characters"),
  category: z.string().min(1, "Please select a course category"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
  duration: z.string().min(2, "Duration is required (e.g. '12 Weeks')"),
  durationWeeks: z.coerce.number().min(1, "Duration must be at least 1 week"),
  fees: z.coerce.number().min(0, "Course fee must be a positive number"),
  syllabus: z.array(z.string()).min(1, "At least one syllabus topic or module is required"),
  instructor: z.string().min(2, "Lead instructor is required"),
  instructorBio: z.string().optional().nullable(),
  status: z.enum(courseStatusEnum).default("Active"),
  level: z.enum(courseLevelEnum).default("Beginner"),
  mode: z.enum(courseModeEnum).default("Classroom & Online"),
  maxBatchCapacity: z.coerce.number().min(5).default(25),
  imageUrl: z.string().optional().nullable(),
});

export type CourseFormData = z.infer<typeof courseSchema>;

export interface CourseRecord extends CourseFormData {
  id: string;
  courseCode: string; // CRS-101, CRS-102
  enrolledStudentsCount: number;
  activeBatchesCount: number;
  activeBatchesList: string[];
  createdAt: string;
  updatedAt: string;
}

export const courseStatusUpdateSchema = z.object({
  status: z.enum(courseStatusEnum),
});
