import { z } from "zod";

export const staffRoleEnum = [
  "Super Admin",
  "Admin",
  "Manager",
  "Counsellor",
  "Trainer",
  "Placement Officer",
  "Finance Staff",
  "Receptionist",
] as const;
export type StaffRole = (typeof staffRoleEnum)[number];

export const staffDepartmentEnum = [
  "Admissions & Counselling",
  "Academics & Training",
  "Corporate Relations & Placements",
  "Finance & Accounts",
  "Front Desk & Operations",
  "Administration & Leadership",
] as const;
export type StaffDepartment = (typeof staffDepartmentEnum)[number];

export const employmentTypeEnum = [
  "Full-time",
  "Part-time",
  "Contract",
  "Visiting Faculty",
] as const;
export type EmploymentType = (typeof employmentTypeEnum)[number];

export const employmentStatusEnum = [
  "Active",
  "On Leave",
  "Probation",
  "Inactive",
] as const;
export type EmploymentStatus = (typeof employmentStatusEnum)[number];

export const crmModules = [
  "leads",
  "enquiries",
  "follow_ups",
  "students",
  "courses",
  "batches",
  "admissions",
  "payments",
  "attendance",
  "counselling",
  "placements",
  "staff",
  "reports",
  "settings",
] as const;
export type CrmModule = (typeof crmModules)[number];

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export type StaffPermissions = Record<CrmModule, ModulePermission>;

export const defaultPermissionsForRole = (role: StaffRole): StaffPermissions => {
  const fullAccess: ModulePermission = { view: true, create: true, edit: true, delete: true, export: true };
  const readWrite: ModulePermission = { view: true, create: true, edit: true, delete: false, export: true };
  const readOnly: ModulePermission = { view: true, create: false, edit: false, delete: false, export: false };
  const noAccess: ModulePermission = { view: false, create: false, edit: false, delete: false, export: false };

  const perms: Partial<StaffPermissions> = {};

  crmModules.forEach((m) => {
    if (role === "Super Admin" || role === "Admin") {
      perms[m] = { ...fullAccess };
    } else if (role === "Manager") {
      perms[m] = { ...fullAccess, delete: false };
    } else if (role === "Counsellor") {
      if (["leads", "enquiries", "counselling", "follow_ups", "admissions"].includes(m)) {
        perms[m] = { ...readWrite };
      } else if (["students", "courses", "batches"].includes(m)) {
        perms[m] = { ...readOnly };
      } else {
        perms[m] = { ...noAccess };
      }
    } else if (role === "Trainer") {
      if (["attendance", "batches", "courses"].includes(m)) {
        perms[m] = { ...readWrite };
      } else if (["students"].includes(m)) {
        perms[m] = { ...readOnly };
      } else {
        perms[m] = { ...noAccess };
      }
    } else if (role === "Placement Officer") {
      if (["placements"].includes(m)) {
        perms[m] = { ...fullAccess };
      } else if (["students", "courses", "batches"].includes(m)) {
        perms[m] = { ...readOnly };
      } else {
        perms[m] = { ...noAccess };
      }
    } else if (role === "Finance Staff") {
      if (["payments", "admissions"].includes(m)) {
        perms[m] = { ...readWrite };
      } else if (["reports", "students"].includes(m)) {
        perms[m] = { ...readOnly };
      } else {
        perms[m] = { ...noAccess };
      }
    } else if (role === "Receptionist") {
      if (["leads", "enquiries", "counselling"].includes(m)) {
        perms[m] = { ...readWrite };
      } else if (["courses", "staff"].includes(m)) {
        perms[m] = { ...readOnly };
      } else {
        perms[m] = { ...noAccess };
      }
    } else {
      perms[m] = { ...readOnly };
    }
  });

  return perms as StaffPermissions;
};

const phoneRegex = /^(\+?[1-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,14}$/;

export const emergencyContactSchema = z.object({
  name: z.string().min(2, "Contact name is required"),
  relation: z.string().min(2, "Relationship is required"),
  phone: z.string().min(10, "Valid phone number required").regex(phoneRegex, "Valid phone format required"),
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export const staffAuditSchema = z.object({
  timestamp: z.string(),
  action: z.string(),
  changedBy: z.string(),
  details: z.string(),
});

export type StaffAudit = z.infer<typeof staffAuditSchema>;

export const staffSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(phoneRegex, "Valid phone number required"),
  avatarUrl: z.string().url("Valid image URL").optional().nullable().or(z.literal("")),
  address: z.string().min(3, "Full address / city is required"),
  department: z.enum(staffDepartmentEnum),
  designation: z.string().min(2, "Designation is required"),
  role: z.enum(staffRoleEnum).default("Counsellor"),
  employmentType: z.enum(employmentTypeEnum).default("Full-time"),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be in YYYY-MM-DD format"),
  reportingManager: z.string().min(2, "Reporting manager is required"),
  employmentStatus: z.enum(employmentStatusEnum).default("Active"),
  emergencyContact: emergencyContactSchema,
  notes: z.string().optional().nullable(),
  permissions: z.record(z.string(), z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
    export: z.boolean(),
  })).optional(),
});

export type StaffFormData = z.infer<typeof staffSchema>;

export interface StaffRecord extends StaffFormData {
  id: string; // e.g. "STF-101"
  permissions: StaffPermissions;
  auditHistory: StaffAudit[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffKPIStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  counsellors: number;
  trainers: number;
  administrators: number;
  departmentCounts: Record<StaffDepartment, number>;
  employmentTypeCounts: Record<EmploymentType, number>;
}

export interface StaffPerformanceSummary {
  staffId: string;
  staffName: string;
  role: StaffRole;
  department: StaffDepartment;
  leadsAssigned: number;
  leadsConverted: number;
  conversionRate: number; // %
  enquiriesHandled: number;
  counsellingSessionsTotal: number;
  counsellingSessionsCompleted: number;
  followUpsCompleted: number;
  batchesAssigned: number;
  studentsTrained: number;
  attendanceSessionsTaken: number;
  placementOffersRecorded: number;
}
