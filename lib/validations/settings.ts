import { z } from "zod";

export const companySettingsSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  logoUrl: z.string().min(1, "Logo path or URL is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  website: z.string().url("Valid website URL required").or(z.literal("")),
  address: z.string().min(5, "Office address is required"),
  description: z.string().min(5, "Company description is required"),
  gstNumber: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
});

export type CompanySettings = z.infer<typeof companySettingsSchema>;

export const generalSettingsSchema = z.object({
  crmName: z.string().min(2, "CRM Name is required"),
  defaultCurrency: z.string().default("INR"),
  currencySymbol: z.string().default("₹"),
  dateFormat: z.enum(["DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY", "DD MMM YYYY"]).default("DD/MM/YYYY"),
  timeZone: z.string().default("Asia/Kolkata"),
  defaultLanguage: z.string().default("English (India)"),
  paginationLimit: z.coerce.number().min(5).max(100).default(10),
  defaultDashboard: z.enum(["executive", "admissions", "leads", "academics"]).default("executive"),
  fiscalYearStart: z.enum(["April", "January"]).default("April"),
});

export type GeneralSettings = z.infer<typeof generalSettingsSchema>;

export const departmentItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Department name is required"),
  description: z.string(),
  headOfDepartment: z.string().optional().nullable(),
  designations: z.array(z.string()).min(1, "At least one designation required"),
  colorBadge: z.string().default("teal"),
});

export type DepartmentItem = z.infer<typeof departmentItemSchema>;

export const courseBatchConfigSchema = z.object({
  courseCategories: z.array(z.string()).min(1, "At least one course category required"),
  defaultBatchCapacity: z.coerce.number().min(5).max(100).default(25),
  autoEnrollmentApproval: z.boolean().default(false),
  lowAttendanceThreshold: z.coerce.number().min(50).max(90).default(75),
  minPassingAttendance: z.coerce.number().min(60).max(100).default(80),
  allowBatchTransfer: z.boolean().default(true),
  defaultClassroom: z.string().default("Lab 1 - Koramangala Campus"),
});

export type CourseBatchConfig = z.infer<typeof courseBatchConfigSchema>;

export const securitySettingsSchema = z.object({
  sessionTimeoutMinutes: z.coerce.number().min(15).max(480).default(60),
  passwordMinLength: z.coerce.number().min(6).max(32).default(8),
  requireSpecialChar: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  maxLoginAttempts: z.coerce.number().min(3).max(10).default(5),
  twoFactorAuth: z.boolean().default(false),
  superAdminEmail: z.string().email().default("info@datamintaarvix.com"),
  allowRegistration: z.boolean().default(false),
});

export type SecuritySettings = z.infer<typeof securitySettingsSchema>;

export const auditCategoryEnum = [
  "Company",
  "Users",
  "Permissions",
  "Departments",
  "Security",
  "Courses & Batches",
  "Notifications",
  "Data & Backup",
  "System",
] as const;

export type AuditCategory = (typeof auditCategoryEnum)[number];

export interface AuditLogRecord {
  id: string; // e.g. "LOG-2026-101"
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  category: AuditCategory;
  details: string;
  ipAddress?: string;
  affectedRecordId?: string | null;
}

export interface BackupRecord {
  id: string; // e.g. "BKP-20261118-120000"
  timestamp: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  totalRecords: number;
  moduleCounts: Record<string, number>;
  createdBy: string;
  verified: boolean;
  status: "Success" | "Failed";
}

export interface DatabaseHealthStats {
  status: "Healthy" | "Degraded" | "Offline";
  connectionMode: "Local Persistent File Storage" | "Supabase Cloud";
  storageUsedBytes: number;
  storageUsedFormatted: string;
  totalModulesCount: number;
  moduleMetrics: {
    module: string;
    file: string;
    recordCount: number;
    sizeBytes: number;
    sizeFormatted: string;
  }[];
  lastBackupTimestamp?: string | null;
  totalBackupsCount: number;
}

export interface FullSettingsPayload {
  company: CompanySettings;
  general: GeneralSettings;
  departments: DepartmentItem[];
  courseBatch: CourseBatchConfig;
  security: SecuritySettings;
  databaseHealth: DatabaseHealthStats;
}
