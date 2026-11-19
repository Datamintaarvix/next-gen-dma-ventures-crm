import fs from "fs";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  CompanySettings,
  GeneralSettings,
  DepartmentItem,
  CourseBatchConfig,
  SecuritySettings,
  AuditLogRecord,
  AuditCategory,
  BackupRecord,
  DatabaseHealthStats,
  FullSettingsPayload,
} from "@/lib/validations/settings";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const AUDIT_LOGS_FILE = path.join(DATA_DIR, "audit-logs.json");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");

export interface SettingsStorageShape {
  company: CompanySettings;
  general: GeneralSettings;
  departments: DepartmentItem[];
  courseBatch: CourseBatchConfig;
  security: SecuritySettings;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: "NEXT GEN DMA VENTURES",
  logoUrl: "/assets/nextgen-dma-logo.png",
  email: "contact@nextgendma.com",
  phone: "+91 98450 12345",
  website: "https://nextgendma.com",
  address: "#42, 3rd Floor, Tech Boulevard, Koramangala 4th Block, Bengaluru, Karnataka - 560034",
  description:
    "Premier Institute of Digital Marketing, Full Stack Development, Data Analytics, and AI & Machine Learning Excellence.",
  gstNumber: "29ABCDE1234F1Z5",
  registrationNumber: "DMA-REG-2024-889",
  tagline: "Empowering Tomorrow's Industry Ready Tech Leaders",
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  crmName: "NEXT GEN DMA VENTURES CRM",
  defaultCurrency: "INR",
  currencySymbol: "₹",
  dateFormat: "DD/MM/YYYY",
  timeZone: "Asia/Kolkata",
  defaultLanguage: "English (India)",
  paginationLimit: 10,
  defaultDashboard: "executive",
  fiscalYearStart: "April",
};

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  {
    id: "dept-1",
    name: "Admissions & Counselling",
    description: "Lead nurturing, prospect student counselling, walk-ins, and cohort admissions.",
    headOfDepartment: "Priya Nair",
    designations: ["Head of Admissions", "Senior Academic Counsellor", "Academic Counsellor", "Lead Telecaller"],
    colorBadge: "teal",
  },
  {
    id: "dept-2",
    name: "Academics & Training",
    description: "Curriculum delivery, cohort mentorship, hands-on lab sessions, and student evaluations.",
    headOfDepartment: "Dr. Sanjay Rao",
    designations: ["Academic Director", "Lead Technical Trainer", "Full Stack Faculty", "Data Science Trainer", "UI/UX Mentor"],
    colorBadge: "blue",
  },
  {
    id: "dept-3",
    name: "Corporate Relations & Placements",
    description: "Hiring partnerships, recruitment drives, resume reviews, and student placement assistance.",
    headOfDepartment: "Vikram Malhotra",
    designations: ["Placement Head", "Corporate Relations Manager", "Placement Coordinator"],
    colorBadge: "emerald",
  },
  {
    id: "dept-4",
    name: "Finance & Accounts",
    description: "Tuition collections, installment tracking, GST billing, and institutional fee reconciliation.",
    headOfDepartment: "Meenakshi Sundaram",
    designations: ["Chief Financial Officer", "Accounts Manager", "Billing Executive"],
    colorBadge: "indigo",
  },
  {
    id: "dept-5",
    name: "Front Desk & Operations",
    description: "Reception, walk-in registration, campus logistics, and student inquiries management.",
    headOfDepartment: "Kavita Sharma",
    designations: ["Front Desk Manager", "Operations Executive", "Guest Coordinator"],
    colorBadge: "amber",
  },
  {
    id: "dept-6",
    name: "Administration & Leadership",
    description: "Executive strategic governance, system compliance, staff management, and CRM administration.",
    headOfDepartment: "Rajesh Khanna",
    designations: ["Managing Director & CEO", "General Manager", "System Administrator", "Operations Lead"],
    colorBadge: "purple",
  },
];

const DEFAULT_COURSE_BATCH_CONFIG: CourseBatchConfig = {
  courseCategories: [
    "Digital Marketing",
    "Data Science & Analytics",
    "Full-stack Web Development",
    "UI/UX Product Design",
    "AI & Machine Learning",
    "Cloud Computing & DevOps",
  ],
  defaultBatchCapacity: 25,
  autoEnrollmentApproval: false,
  lowAttendanceThreshold: 75,
  minPassingAttendance: 80,
  allowBatchTransfer: true,
  defaultClassroom: "Lab 1 - Koramangala Tech Campus",
};

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  passwordMinLength: 8,
  requireSpecialChar: true,
  requireNumbers: true,
  maxLoginAttempts: 5,
  twoFactorAuth: false,
  superAdminEmail: "info@datamintaarvix.com",
  allowRegistration: false,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function ensureDirectoriesAndFiles(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      const initial: SettingsStorageShape = {
        company: DEFAULT_COMPANY_SETTINGS,
        general: DEFAULT_GENERAL_SETTINGS,
        departments: DEFAULT_DEPARTMENTS,
        courseBatch: DEFAULT_COURSE_BATCH_CONFIG,
        security: DEFAULT_SECURITY_SETTINGS,
      };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initial, null, 2), "utf-8");
    }
    if (!fs.existsSync(AUDIT_LOGS_FILE)) {
      const initialLogs: AuditLogRecord[] = [
        {
          id: "LOG-INIT-101",
          timestamp: new Date().toISOString(),
          user: "Rajesh Khanna (Super Admin)",
          userEmail: "rajesh.khanna@nextgendma.com",
          action: "SYSTEM_INITIALIZED",
          category: "System",
          details: "NEXT GEN DMA VENTURES CRM Settings & Administration engine initialized with production security.",
          ipAddress: "127.0.0.1",
        },
      ];
      fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(initialLogs, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error ensuring settings data files:", err);
  }
}

function rowToAuditLog(row: any): AuditLogRecord {
  return {
    id: row.id,
    timestamp: row.timestamp,
    user: row.user_name || row.user || "Administrator",
    userEmail: row.user_email || "admin@nextgendma.com",
    action: row.action,
    category: row.category as any,
    details: row.details || "",
    ipAddress: row.ip_address || "127.0.0.1",
    affectedRecordId: row.affected_record_id || null,
  };
}

function auditLogToRow(log: AuditLogRecord): any {
  return {
    id: log.id,
    timestamp: log.timestamp,
    user_name: log.user,
    user_email: log.userEmail,
    action: log.action,
    category: log.category,
    details: log.details,
    ip_address: log.ipAddress || "127.0.0.1",
    affected_record_id: log.affectedRecordId || null,
  };
}

export function readSettingsFromDiskSync(): SettingsStorageShape {
  ensureDirectoriesAndFiles();
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return {
      company: { ...DEFAULT_COMPANY_SETTINGS, ...(data.company || {}) },
      general: { ...DEFAULT_GENERAL_SETTINGS, ...(data.general || {}) },
      departments: Array.isArray(data.departments) && data.departments.length > 0 ? data.departments : DEFAULT_DEPARTMENTS,
      courseBatch: { ...DEFAULT_COURSE_BATCH_CONFIG, ...(data.courseBatch || {}) },
      security: { ...DEFAULT_SECURITY_SETTINGS, ...(data.security || {}) },
    };
  } catch (err) {
    console.error("Error reading settings file:", err);
    return {
      company: DEFAULT_COMPANY_SETTINGS,
      general: DEFAULT_GENERAL_SETTINGS,
      departments: DEFAULT_DEPARTMENTS,
      courseBatch: DEFAULT_COURSE_BATCH_CONFIG,
      security: DEFAULT_SECURITY_SETTINGS,
    };
  }
}

export async function readSettingsFromDisk(): Promise<SettingsStorageShape> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("*")
      .eq("id", "current")
      .maybeSingle();

    if (error) {
      console.error("Error reading system_settings from Supabase:", error);
      throw new Error(`Failed to read system settings from Supabase: ${error.message}`);
    }

    if (data) {
      const result: SettingsStorageShape = {
        company: { ...DEFAULT_COMPANY_SETTINGS, ...(data.company || {}) },
        general: { ...DEFAULT_GENERAL_SETTINGS, ...(data.general || {}) },
        departments: Array.isArray(data.departments) && data.departments.length > 0 ? data.departments : DEFAULT_DEPARTMENTS,
        courseBatch: { ...DEFAULT_COURSE_BATCH_CONFIG, ...(data.course_batch || {}) },
        security: { ...DEFAULT_SECURITY_SETTINGS, ...(data.security || {}) },
      };
      return result;
    }
  }

  return readSettingsFromDiskSync();
}

export function writeSettingsToDisk(settings: SettingsStorageShape): void {
  ensureDirectoriesAndFiles();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

export async function writeSettingsToSupabase(settings: SettingsStorageShape): Promise<void> {
  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert({
        id: "current",
        company: settings.company,
        general: settings.general,
        departments: settings.departments,
        course_batch: settings.courseBatch,
        security: settings.security,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error saving system settings to Supabase:", error);
      throw new Error(`Failed to save system settings to Supabase: ${error.message}`);
    }
  }
  writeSettingsToDisk(settings);
}

export async function readAuditLogsFromDisk(): Promise<AuditLogRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(250);

    if (error) {
      console.error("Error reading audit_logs from Supabase:", error);
      throw new Error(`Failed to read audit logs from Supabase: ${error.message}`);
    }

    return (data || []).map(rowToAuditLog);
  }

  ensureDirectoriesAndFiles();
  try {
    const raw = fs.readFileSync(AUDIT_LOGS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading audit logs file:", err);
    return [];
  }
}

export async function logAuditAction(params: {
  user: string;
  userEmail: string;
  action: string;
  category: AuditCategory;
  details: string;
  affectedRecordId?: string | null;
  ipAddress?: string;
}): Promise<AuditLogRecord> {
  const nextNum = Math.floor(Math.random() * 900 + 100);
  const newLog: AuditLogRecord = {
    id: `LOG-${Date.now().toString().slice(-6)}-${nextNum}`,
    timestamp: new Date().toISOString(),
    user: params.user || "Administrator",
    userEmail: params.userEmail || "admin@nextgendma.com",
    action: params.action,
    category: params.category,
    details: params.details,
    affectedRecordId: params.affectedRecordId || null,
    ipAddress: params.ipAddress || "127.0.0.1",
  };

  if (isSupabaseServerConfigured()) {
    const row = auditLogToRow(newLog);
    const { error } = await supabaseAdmin.from("audit_logs").insert(row);
    if (error) {
      console.error("Error inserting audit log in Supabase:", error);
      throw new Error(`Failed to log audit action in Supabase: ${error.message}`);
    }
  }

  try {
    ensureDirectoriesAndFiles();
    let logs: AuditLogRecord[] = [];
    try {
      const raw = fs.readFileSync(AUDIT_LOGS_FILE, "utf-8");
      logs = JSON.parse(raw);
    } catch {}
    logs.unshift(newLog);
    const trimmed = logs.slice(0, 250);
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to sync audit log to fallback disk:", e);
  }

  return newLog;
}

export function getDatabaseHealthAndStorage(): DatabaseHealthStats {
  ensureDirectoriesAndFiles();
  const dataFiles = [
    { module: "Admissions Management", file: "admissions.json" },
    { module: "Attendance Management", file: "attendance.json" },
    { module: "Batch Management", file: "batches.json" },
    { module: "Counselling Management", file: "counselling.json" },
    { module: "Course Management", file: "courses.json" },
    { module: "Enquiry Management", file: "enquiries.json" },
    { module: "Follow-up Management", file: "follow-ups.json" },
    { module: "Payment & Installments", file: "payments.json" },
    { module: "Payment Schedules", file: "installments.json" },
    { module: "Leads Management", file: "leads.json" },
    { module: "Notifications Center", file: "notifications.json" },
    { module: "Notification Settings", file: "notification-settings.json" },
    { module: "Placement Management", file: "placements.json" },
    { module: "Staff Management", file: "staff.json" },
    { module: "Student Management", file: "students.json" },
    { module: "System Settings", file: "settings.json" },
    { module: "Audit Log Trail", file: "audit-logs.json" },
  ];

  let totalBytes = 0;
  const metrics = dataFiles.map((df) => {
    const fullPath = path.join(DATA_DIR, df.file);
    let size = 0;
    let count = 0;
    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        size = stats.size;
        totalBytes += size;
        const raw = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          count = parsed.length;
        } else if (parsed && typeof parsed === "object") {
          count = Object.keys(parsed).length;
        }
      }
    } catch {
      // ignore
    }
    return {
      module: df.module,
      file: df.file,
      recordCount: count,
      sizeBytes: size,
      sizeFormatted: formatBytes(size),
    };
  });

  let lastBackup: string | null = null;
  let totalBackups = 0;
  try {
    if (fs.existsSync(BACKUPS_DIR)) {
      const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith(".json"));
      totalBackups = files.length;
      if (files.length > 0) {
        files.sort().reverse();
        const latestStat = fs.statSync(path.join(BACKUPS_DIR, files[0]));
        lastBackup = latestStat.mtime.toISOString();
      }
    }
  } catch {
    // ignore
  }

  return {
    status: "Healthy",
    connectionMode: isSupabaseServerConfigured() ? "Supabase Cloud" : "Local Persistent File Storage",
    storageUsedBytes: totalBytes,
    storageUsedFormatted: formatBytes(totalBytes),
    totalModulesCount: dataFiles.length,
    moduleMetrics: metrics,
    lastBackupTimestamp: lastBackup,
    totalBackupsCount: totalBackups,
  };
}

export async function updateCompanySettings(
  company: Partial<CompanySettings>,
  adminUser: string = "Rajesh Khanna",
  adminEmail: string = "rajesh.khanna@nextgendma.com"
): Promise<CompanySettings> {
  const settings = await readSettingsFromDisk();
  settings.company = { ...settings.company, ...company };
  await writeSettingsToSupabase(settings);

  await logAuditAction({
    user: adminUser,
    userEmail: adminEmail,
    action: "COMPANY_PROFILE_UPDATED",
    category: "Company",
    details: `Updated company details for ${settings.company.name}.`,
  });

  return settings.company;
}

export async function updateGeneralSettings(
  general: Partial<GeneralSettings>,
  adminUser: string = "Rajesh Khanna",
  adminEmail: string = "rajesh.khanna@nextgendma.com"
): Promise<GeneralSettings> {
  const settings = await readSettingsFromDisk();
  settings.general = { ...settings.general, ...general };
  await writeSettingsToSupabase(settings);

  await logAuditAction({
    user: adminUser,
    userEmail: adminEmail,
    action: "GENERAL_SETTINGS_UPDATED",
    category: "System",
    details: `Updated general preferences (Currency: ${settings.general.defaultCurrency}, Timezone: ${settings.general.timeZone}, DateFormat: ${settings.general.dateFormat}).`,
  });

  return settings.general;
}

export async function updateDepartmentSettings(
  departments: DepartmentItem[],
  adminUser: string = "Rajesh Khanna",
  adminEmail: string = "rajesh.khanna@nextgendma.com"
): Promise<DepartmentItem[]> {
  const settings = await readSettingsFromDisk();
  settings.departments = departments;
  await writeSettingsToSupabase(settings);

  await logAuditAction({
    user: adminUser,
    userEmail: adminEmail,
    action: "DEPARTMENTS_CONFIGURED",
    category: "Departments",
    details: `Configured ${departments.length} institutional departments and designations.`,
  });

  return settings.departments;
}

export async function updateCourseBatchSettings(
  config: Partial<CourseBatchConfig>,
  adminUser: string = "Rajesh Khanna",
  adminEmail: string = "rajesh.khanna@nextgendma.com"
): Promise<CourseBatchConfig> {
  const settings = await readSettingsFromDisk();
  settings.courseBatch = { ...settings.courseBatch, ...config };
  await writeSettingsToSupabase(settings);

  await logAuditAction({
    user: adminUser,
    userEmail: adminEmail,
    action: "COURSE_BATCH_SETTINGS_UPDATED",
    category: "Courses & Batches",
    details: `Updated course categories & batch capacity (Capacity: ${settings.courseBatch.defaultBatchCapacity}, Low Attendance: ${settings.courseBatch.lowAttendanceThreshold}%).`,
  });

  return settings.courseBatch;
}

export async function updateSecuritySettings(
  security: Partial<SecuritySettings>,
  adminUser: string = "Rajesh Khanna",
  adminEmail: string = "rajesh.khanna@nextgendma.com"
): Promise<SecuritySettings> {
  const settings = await readSettingsFromDisk();
  settings.security = { ...settings.security, ...security };
  await writeSettingsToSupabase(settings);

  await logAuditAction({
    user: adminUser,
    userEmail: adminEmail,
    action: "SECURITY_SETTINGS_UPDATED",
    category: "Security",
    details: `Updated session timeout (${settings.security.sessionTimeoutMinutes} min) and security policies.`,
  });

  return settings.security;
}

export async function createRealDatabaseBackup(
  adminUser: string = "Rajesh Khanna",
  adminEmail: string = "rajesh.khanna@nextgendma.com"
): Promise<BackupRecord> {
  ensureDirectoriesAndFiles();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `BKP-${timestamp}`;
  const fileName = `nextgen_crm_backup_${timestamp}.json`;
  const backupFilePath = path.join(BACKUPS_DIR, fileName);

  const dataFiles = [
    "admissions.json",
    "attendance.json",
    "batches.json",
    "counselling.json",
    "courses.json",
    "enquiries.json",
    "follow-ups.json",
    "payments.json",
    "installments.json",
    "leads.json",
    "notifications.json",
    "notification-settings.json",
    "placements.json",
    "staff.json",
    "students.json",
    "settings.json",
  ];

  const backupPayload: Record<string, any> = {
    backupId,
    timestamp: new Date().toISOString(),
    organization: "NEXT GEN DMA VENTURES",
    crmVersion: "2.4.0",
    createdBy: `${adminUser} (${adminEmail})`,
    modules: {},
  };

  const moduleCounts: Record<string, number> = {};
  let totalRecordsCount = 0;

  dataFiles.forEach((file) => {
    const filePath = path.join(DATA_DIR, file);
    const key = file.replace(".json", "");
    if (fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        backupPayload.modules[key] = content;
        if (Array.isArray(content)) {
          moduleCounts[key] = content.length;
          totalRecordsCount += content.length;
        } else {
          moduleCounts[key] = 1;
          totalRecordsCount += 1;
        }
      } catch (e) {
        backupPayload.modules[key] = null;
        moduleCounts[key] = 0;
      }
    }
  });

  const serialized = JSON.stringify(backupPayload, null, 2);
  fs.writeFileSync(backupFilePath, serialized, "utf-8");

  const stat = fs.statSync(backupFilePath);
  const sizeFormatted = formatBytes(stat.size);

  await logAuditAction({
    user: adminUser,
    userEmail: adminEmail,
    action: "DATABASE_BACKUP_CREATED",
    category: "System",
    details: `Full CRM database backup generated (${fileName}) containing ${totalRecordsCount} records across ${Object.keys(moduleCounts).length} modules. Size: ${sizeFormatted}.`,
    affectedRecordId: backupId,
  });

  return {
    id: backupId,
    timestamp: new Date().toISOString(),
    fileName,
    fileSizeBytes: stat.size,
    fileSizeFormatted: sizeFormatted,
    totalRecords: totalRecordsCount,
    moduleCounts,
    createdBy: `${adminUser} (${adminEmail})`,
    verified: true,
    status: "Success",
  };
}

export function getBackupList(): BackupRecord[] {
  ensureDirectoriesAndFiles();
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith(".json"));

    return files.map((fileName) => {
      const fullPath = path.join(BACKUPS_DIR, fileName);
      const stat = fs.statSync(fullPath);
      let recordsCount = 0;
      let moduleBreakdown: Record<string, number> = {};
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        if (content.modules) {
          Object.keys(content.modules).forEach((k) => {
            const mod = content.modules[k];
            if (Array.isArray(mod)) {
              moduleBreakdown[k] = mod.length;
              recordsCount += mod.length;
            } else if (mod) {
              moduleBreakdown[k] = 1;
              recordsCount += 1;
            }
          });
        }
      } catch {
        // ignore
      }

      const id = fileName.replace("nextgen_crm_backup_", "").replace(".json", "");

      return {
        id: `BKP-${id}`,
        timestamp: stat.mtime.toISOString(),
        fileName,
        fileSizeBytes: stat.size,
        fileSizeFormatted: formatBytes(stat.size),
        totalRecords: recordsCount,
        moduleCounts: moduleBreakdown,
        createdBy: "Rajesh Khanna (Super Admin)",
        verified: true,
        status: "Success" as const,
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error("Error reading backups list:", err);
    return [];
  }
}

export function getBackupRawContent(fileName: string): string | null {
  ensureDirectoriesAndFiles();
  const safeName = path.basename(fileName);
  const fullPath = path.join(BACKUPS_DIR, safeName);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8");
}
