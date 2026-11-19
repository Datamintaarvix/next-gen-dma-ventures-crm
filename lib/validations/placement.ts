import { z } from "zod";

export const partnershipStatusEnum = [
  "Active",
  "MOU Signed",
  "In Discussion",
  "Archived",
] as const;
export type PartnershipStatus = (typeof partnershipStatusEnum)[number];

export const opportunityStatusEnum = [
  "Open",
  "In Progress",
  "Closed",
  "Draft",
] as const;
export type OpportunityStatus = (typeof opportunityStatusEnum)[number];

export const jobTypeEnum = ["Full-time", "Internship", "Internship + PPO"] as const;
export type JobType = (typeof jobTypeEnum)[number];

export const placementStatusEnum = [
  "Seeking Placement",
  "In Interview Process",
  "Offer Received",
  "Placed",
  "Opted Out",
] as const;
export type PlacementStatus = (typeof placementStatusEnum)[number];

export const placementEligibilityEnum = [
  "Eligible",
  "In Training",
  "Not Eligible",
  "Placed",
] as const;
export type PlacementEligibility = (typeof placementEligibilityEnum)[number];

export const applicationStatusEnum = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Rejected",
  "Not Selected",
  "Withdrawn",
] as const;
export type ApplicationStatus = (typeof applicationStatusEnum)[number];

export const interviewRoundEnum = [
  "Round 1: Screening / Aptitude",
  "Round 2: Technical & Domain Assessment",
  "Round 3: Case Study / Portfolio Review",
  "Round 4: HR & Leadership Interview",
] as const;
export type InterviewRound = (typeof interviewRoundEnum)[number];

export const interviewModeEnum = [
  "Campus Drive / In-person",
  "Virtual (Google Meet)",
  "Virtual (Zoom / Teams)",
  "Telephonic",
] as const;
export type InterviewMode = (typeof interviewModeEnum)[number];

export const offerStatusEnum = [
  "Offer Extended",
  "Accepted",
  "Declined",
  "Expired",
] as const;
export type OfferStatus = (typeof offerStatusEnum)[number];

const phoneRegex = /^(\+?[1-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,14}$/;

// 1. Company Validation Schema
export const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Industry is required"),
  website: z.string().url("Please enter a valid website URL").or(z.literal("")),
  contactPerson: z.string().min(2, "Contact person name is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits").regex(phoneRegex, "Valid phone number required"),
  address: z.string().min(3, "Company location / address is required"),
  partnershipStatus: z.enum(partnershipStatusEnum).default("Active"),
  notes: z.string().optional().nullable(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

export interface CompanyRecord extends CompanyFormData {
  id: string; // e.g. "CMP-101"
  activeOpportunitiesCount: number;
  totalHiredCount: number;
  createdAt: string;
  updatedAt: string;
}

// 2. Job Opportunity Validation Schema
export const jobOpportunitySchema = z.object({
  companyId: z.string().min(1, "Please select a partner company"),
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  jobDescription: z.string().min(10, "Job description must be at least 10 characters"),
  requiredSkills: z.array(z.string()).min(1, "At least one required skill must be specified"),
  minAttendancePercentage: z.coerce.number().min(0).max(100).default(75),
  targetCourses: z.array(z.string()).min(1, "At least one target course is required"),
  targetBatches: z.array(z.string()).optional(),
  openings: z.coerce.number().min(1, "At least 1 opening is required"),
  salaryMinLPA: z.coerce.number().min(0, "Minimum salary cannot be negative"),
  salaryMaxLPA: z.coerce.number().min(0, "Maximum salary cannot be negative"),
  jobLocation: z.string().min(2, "Job location is required"),
  jobType: z.enum(jobTypeEnum).default("Full-time"),
  applicationDeadline: z.string().min(1, "Deadline is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  status: z.enum(opportunityStatusEnum).default("Open"),
});

export type JobOpportunityFormData = z.infer<typeof jobOpportunitySchema>;

export interface JobOpportunityRecord extends JobOpportunityFormData {
  id: string; // e.g. "JOB-2026-101"
  filledOpenings: number;
  salaryRangeDisplay: string;
  totalApplications: number;
  shortlistedCount: number;
  selectedCount: number;
  createdAt: string;
  updatedAt: string;
}

// 3. Student Placement Profile
export const studentPlacementProfileSchema = z.object({
  skills: z.array(z.string()).default([]),
  resumeUrl: z.string().url("Please enter valid resume URL").optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url("Please enter valid portfolio URL").optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url("Please enter valid LinkedIn URL").optional().nullable().or(z.literal("")),
  githubUrl: z.string().url("Please enter valid GitHub URL").optional().nullable().or(z.literal("")),
  expectedSalaryLPA: z.coerce.number().optional().nullable(),
  placementEligibility: z.enum(placementEligibilityEnum).default("Eligible"),
  placementStatus: z.enum(placementStatusEnum).default("Seeking Placement"),
  notes: z.string().optional().nullable(),
});

export type StudentPlacementProfileFormData = z.infer<typeof studentPlacementProfileSchema>;

export interface StudentPlacementProfile extends StudentPlacementProfileFormData {
  studentId: string;
  studentCode: string; // STU-1003
  studentName: string;
  email: string;
  phoneNumber: string;
  courseName: string;
  batchCode: string;
  batchName: string;
  attendancePercentage: number;
  totalApplications: number;
  totalInterviews: number;
  activeOffersCount: number;
  placedCompany?: string | null;
  placedJobTitle?: string | null;
  placedSalaryLPA?: number | null;
  placedDate?: string | null;
  updatedAt: string;
}

// 4. Job Application & Interview Schemas
export const applyJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  notes: z.string().optional().nullable(),
});

export type ApplyJobFormData = z.infer<typeof applyJobSchema>;

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  roundName: z.enum(interviewRoundEnum),
  interviewDate: z.string().min(1, "Date required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  interviewTime: z.string().min(1, "Time is required"),
  interviewMode: z.enum(interviewModeEnum).default("Virtual (Google Meet)"),
  locationOrMeetingLink: z.string().min(2, "Meeting location or video link is required"),
  interviewerName: z.string().min(2, "Interviewer name / role is required"),
  notes: z.string().optional().nullable(),
});

export type ScheduleInterviewFormData = z.infer<typeof scheduleInterviewSchema>;

export interface PlacementInterviewRecord extends ScheduleInterviewFormData {
  id: string; // INT-2026-101
  jobId: string;
  jobTitle: string;
  companyName: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  feedback?: string | null;
  rating?: number | null; // 1-5
  result: "Scheduled" | "Passed" | "Pending Feedback" | "Failed";
  createdAt: string;
  updatedAt: string;
}

export interface PlacementApplicationRecord {
  id: string; // APP-2026-101
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseName: string;
  batchCode: string;
  appliedDate: string; // YYYY-MM-DD
  status: ApplicationStatus;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  interviews: PlacementInterviewRecord[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 5. Placement Offer Schema
export const recordOfferSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  offeredSalaryLPA: z.coerce.number().min(0.5, "Salary in LPA must be greater than 0"),
  offerDate: z.string().min(1, "Offer date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  joiningDate: z.string().min(1, "Joining date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  offerLetterRef: z.string().optional().nullable(),
  status: z.enum(offerStatusEnum).default("Offer Extended"),
  notes: z.string().optional().nullable(),
  recordedBy: z.string().min(1, "Staff name is required"),
});

export type RecordOfferFormData = z.infer<typeof recordOfferSchema>;

export interface PlacementOfferRecord extends RecordOfferFormData {
  id: string; // OFR-2026-101
  jobId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  courseName: string;
  batchCode: string;
  companyName: string;
  jobTitle: string;
  offeredSalaryDisplay: string;
  acceptanceDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 6. Placement KPI and Analytics Interfaces
export interface PlacementKPIStats {
  totalEligibleStudents: number;
  studentsPlaced: number;
  studentsSeekingPlacement: number;
  companiesRegistered: number;
  activeJobOpportunities: number;
  interviewsScheduled: number;
  placementSuccessRate: number; // percentage
  highestSalaryLPA: number;
  averageSalaryLPA: number;
  totalOffersExtended: number;
}

export interface CoursePlacementReportItem {
  courseName: string;
  totalStudents: number;
  eligibleStudents: number;
  placedStudents: number;
  placementRate: number;
  avgPackageLPA: number;
  highestPackageLPA: number;
}

export interface CompanyHiringReportItem {
  companyId: string;
  companyName: string;
  industry: string;
  totalOpenings: number;
  hiredCount: number;
  avgOfferedLPA: number;
  hiredStudents: {
    studentCode: string;
    studentName: string;
    courseName: string;
    jobTitle: string;
    salaryLPA: number;
    joiningDate: string;
  }[];
}
