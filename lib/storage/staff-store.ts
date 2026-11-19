import fs from "fs";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  StaffRecord,
  StaffFormData,
  StaffKPIStats,
  StaffPermissions,
  StaffDepartment,
  EmploymentType,
  CrmModule,
  ModulePermission,
  defaultPermissionsForRole,
  StaffPerformanceSummary,
} from "@/lib/validations/staff";

const STAFF_FILE_PATH = path.join(process.cwd(), "data", "staff.json");

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file at ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing file at ${filePath}:`, err);
    throw err;
  }
}

function rowToStaff(row: any): StaffRecord {
  return {
    id: row.id,
    fullName: row.full_name || "",
    email: row.email || "",
    phoneNumber: row.phone_number || "",
    avatarUrl: row.avatar_url || undefined,
    address: row.address || "",
    department: row.department as any,
    designation: row.designation || "",
    role: row.role as any,
    employmentType: row.employment_type as any,
    joiningDate: row.joining_date || "",
    reportingManager: row.reporting_manager || "",
    employmentStatus: row.employment_status as any,
    emergencyContact: row.emergency_contact || undefined,
    notes: row.notes || undefined,
    permissions: (typeof row.permissions === "string" ? JSON.parse(row.permissions) : row.permissions) || {},
    auditHistory: (typeof row.audit_history === "string" ? JSON.parse(row.audit_history) : row.audit_history) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function staffToRow(s: StaffRecord): any {
  return {
    id: s.id,
    full_name: s.fullName,
    email: s.email,
    phone_number: s.phoneNumber,
    avatar_url: s.avatarUrl || null,
    address: s.address,
    department: s.department,
    designation: s.designation,
    role: s.role,
    employment_type: s.employmentType,
    joining_date: s.joiningDate,
    reporting_manager: s.reportingManager,
    employment_status: s.employmentStatus,
    emergency_contact: s.emergencyContact || null,
    notes: s.notes || null,
    permissions: s.permissions || {},
    audit_history: s.auditHistory || [],
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export function readStaffFromDisk(): StaffRecord[] {
  return readJsonFile<StaffRecord[]>(STAFF_FILE_PATH, []);
}

export function writeStaffToDisk(data: StaffRecord[]): void {
  writeJsonFile(STAFF_FILE_PATH, data);
}

export async function getAllStaff(): Promise<StaffRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching staff from Supabase:", error);
      throw new Error(`Failed to fetch staff from Supabase: ${error.message}`);
    }

    const records = (data || []).map(rowToStaff);
    return records;
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return readStaffFromDisk();
}

export async function getStaffById(id: string): Promise<StaffRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching staff ${id} from Supabase:`, error);
      throw new Error(`Failed to fetch staff ${id} from Supabase: ${error.message}`);
    }

    return data ? rowToStaff(data) : null;
  }
  const list = readStaffFromDisk();
  return list.find((s) => s.id === id) || null;
}

export async function getStaffByEmail(email: string): Promise<StaffRecord | null> {
  const lower = email.trim().toLowerCase();
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .ilike("email", lower)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching staff by email ${email} from Supabase:`, error);
      throw new Error(`Failed to fetch staff by email from Supabase: ${error.message}`);
    }

    return data ? rowToStaff(data) : null;
  }
  const list = readStaffFromDisk();
  return list.find((s) => s.email.toLowerCase() === lower) || null;
}

export async function getStaffByName(name: string): Promise<StaffRecord | null> {
  const trimmed = name.trim().toLowerCase();
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .ilike("full_name", trimmed)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching staff by name ${name} from Supabase:`, error);
      throw new Error(`Failed to fetch staff by name from Supabase: ${error.message}`);
    }

    return data ? rowToStaff(data) : null;
  }
  const list = readStaffFromDisk();
  return list.find((s) => s.fullName.toLowerCase() === trimmed) || null;
}

export async function createStaff(data: StaffFormData, creatorName: string = "Admin"): Promise<StaffRecord> {
  const list = await getAllStaff();

  // Validate duplicate email
  const existing = list.find((s) => s.email.toLowerCase() === data.email.trim().toLowerCase());
  if (existing) {
    throw new Error(`A staff member with email "${data.email}" already exists (${existing.fullName} - ${existing.id})`);
  }

  // Auto-generate ID: STF-1XX
  let maxIdNum = 100;
  list.forEach((s) => {
    const match = s.id.match(/STF-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxIdNum) maxIdNum = n;
    }
  });

  const newId = `STF-${maxIdNum + 1}`;
  const now = new Date().toISOString();

  const finalPermissions: StaffPermissions =
    (data.permissions as StaffPermissions) || defaultPermissionsForRole(data.role);

  const newStaff: StaffRecord = {
    ...data,
    id: newId,
    email: data.email.trim().toLowerCase(),
    fullName: data.fullName.trim(),
    permissions: finalPermissions,
    auditHistory: [
      {
        timestamp: now,
        action: "STAFF_CREATED",
        changedBy: creatorName,
        details: `Staff registered as ${data.designation} (${data.role}) in ${data.department}.`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const row = staffToRow(newStaff);
    const { data: inserted, error } = await supabaseAdmin
      .from("staff")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Error creating staff in Supabase:", error);
      throw new Error(`Failed to create staff in Supabase: ${error.message}`);
    }

    const created = rowToStaff(inserted);
    const diskRecords = readStaffFromDisk();
    diskRecords.push(created);
    try {
      writeStaffToDisk(diskRecords);
    } catch (e) {
      console.error("Failed to sync created staff to fallback disk:", e);
    }
    return created;
  }

  const diskRecords = readStaffFromDisk();
  diskRecords.push(newStaff);
  writeStaffToDisk(diskRecords);
  return newStaff;
}

export async function updateStaff(
  id: string,
  data: Partial<StaffFormData>,
  updatedBy: string = "Admin"
): Promise<StaffRecord> {
  const existing = await getStaffById(id);
  if (!existing) {
    throw new Error(`Staff member with ID "${id}" not found.`);
  }

  // Protect Primary Super Admin account
  if (existing.id === "STF-101" || existing.role === "Super Admin") {
    if (data.role && data.role !== "Super Admin") {
      throw new Error("Cannot demote or change the role of the primary Super Admin account (STF-101).");
    }
    if (data.employmentStatus && data.employmentStatus !== "Active") {
      throw new Error("Cannot deactivate or modify the active status of the primary Super Admin account (STF-101).");
    }
  }

  // If email changed, check for conflict
  if (data.email && data.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
    const allStaff = await getAllStaff();
    const conflict = allStaff.find(
      (s) => s.id !== id && s.email.toLowerCase() === data.email!.trim().toLowerCase()
    );
    if (conflict) {
      throw new Error(`Email "${data.email}" is already used by ${conflict.fullName} (${conflict.id})`);
    }
  }

  const now = new Date().toISOString();
  const auditEntries = existing.auditHistory || [];

  const changes: string[] = [];
  if (data.role && data.role !== existing.role) changes.push(`Role changed from ${existing.role} to ${data.role}`);
  if (data.department && data.department !== existing.department) changes.push(`Department changed from ${existing.department} to ${data.department}`);
  if (data.employmentStatus && data.employmentStatus !== existing.employmentStatus) changes.push(`Status changed from ${existing.employmentStatus} to ${data.employmentStatus}`);
  if (data.designation && data.designation !== existing.designation) changes.push(`Designation changed to ${data.designation}`);

  if (changes.length === 0) {
    changes.push("General profile details updated");
  }

  auditEntries.unshift({
    timestamp: now,
    action: "STAFF_UPDATED",
    changedBy: updatedBy,
    details: changes.join("; "),
  });

  const updatedRecord: StaffRecord = {
    ...existing,
    ...data,
    id: existing.id,
    email: data.email ? data.email.trim().toLowerCase() : existing.email,
    permissions: (data.permissions as StaffPermissions) || existing.permissions,
    auditHistory: auditEntries.slice(0, 30),
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const row = staffToRow(updatedRecord);
    const { data: updated, error } = await supabaseAdmin
      .from("staff")
      .update(row)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating staff ${id} in Supabase:`, error);
      throw new Error(`Failed to update staff in Supabase: ${error.message}`);
    }

    const result = rowToStaff(updated);
    const diskRecords = readStaffFromDisk();
    const idx = diskRecords.findIndex((s) => s.id === id);
    if (idx !== -1) {
      diskRecords[idx] = result;
      try {
        writeStaffToDisk(diskRecords);
      } catch (e) {
        console.error("Failed to sync updated staff to fallback disk:", e);
      }
    }
    return result;
  }

  const list = readStaffFromDisk();
  const index = list.findIndex((s) => s.id === id);
  if (index !== -1) {
    list[index] = updatedRecord;
    writeStaffToDisk(list);
  }
  return updatedRecord;
}

export async function updateStaffPermissions(
  id: string,
  permissions: StaffPermissions,
  updatedBy: string = "Admin"
): Promise<StaffRecord> {
  const existing = await getStaffById(id);
  if (!existing) {
    throw new Error(`Staff member with ID "${id}" not found.`);
  }

  const now = new Date().toISOString();
  const auditEntries = existing.auditHistory || [];

  auditEntries.unshift({
    timestamp: now,
    action: "PERMISSIONS_UPDATED",
    changedBy: updatedBy,
    details: "Configured custom module-level permission matrix.",
  });

  const updatedRecord: StaffRecord = {
    ...existing,
    permissions,
    auditHistory: auditEntries.slice(0, 30),
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const row = staffToRow(updatedRecord);
    const { data: updated, error } = await supabaseAdmin
      .from("staff")
      .update(row)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating staff permissions for ${id} in Supabase:`, error);
      throw new Error(`Failed to update staff permissions in Supabase: ${error.message}`);
    }

    const result = rowToStaff(updated);
    const diskRecords = readStaffFromDisk();
    const idx = diskRecords.findIndex((s) => s.id === id);
    if (idx !== -1) {
      diskRecords[idx] = result;
      try {
        writeStaffToDisk(diskRecords);
      } catch (e) {
        console.error("Failed to sync updated staff permissions to fallback disk:", e);
      }
    }
    return result;
  }

  const list = readStaffFromDisk();
  const index = list.findIndex((s) => s.id === id);
  if (index !== -1) {
    list[index] = updatedRecord;
    writeStaffToDisk(list);
  }
  return updatedRecord;
}

export async function deleteStaff(id: string, deletedBy: string = "Admin"): Promise<boolean> {
  const target = await getStaffById(id);
  if (!target) return false;

  if (target.id === "STF-101" || target.role === "Super Admin") {
    throw new Error("Cannot deactivate or delete the primary Super Admin account (STF-101).");
  }

  const now = new Date().toISOString();
  target.employmentStatus = "Inactive";
  target.updatedAt = now;
  target.auditHistory.unshift({
    timestamp: now,
    action: "STAFF_DEACTIVATED",
    changedBy: deletedBy,
    details: "Staff member marked as Inactive.",
  });

  if (isSupabaseServerConfigured()) {
    const row = staffToRow(target);
    const { error } = await supabaseAdmin
      .from("staff")
      .update(row)
      .eq("id", id);

    if (error) {
      console.error(`Error deactivating staff ${id} in Supabase:`, error);
      throw new Error(`Failed to deactivate staff in Supabase: ${error.message}`);
    }

    const diskRecords = readStaffFromDisk();
    const idx = diskRecords.findIndex((s) => s.id === id);
    if (idx !== -1) {
      diskRecords[idx] = target;
      try {
        writeStaffToDisk(diskRecords);
      } catch (e) {
        console.error("Failed to sync deactivated staff to fallback disk:", e);
      }
    }
    return true;
  }

  const list = readStaffFromDisk();
  const index = list.findIndex((s) => s.id === id);
  if (index !== -1) {
    list[index] = target;
    writeStaffToDisk(list);
  }
  return true;
}

export interface StaffCrossModuleDetails {
  leads: any[];
  enquiries: any[];
  counsellingSessions: any[];
  followUps: any[];
  batches: any[];
  attendanceSessions: any[];
  placements: any[];
}

export async function getStaffKPIs(): Promise<StaffKPIStats> {
  const list = await getAllStaff();

  const departmentCounts: Record<StaffDepartment, number> = {
    "Admissions & Counselling": 0,
    "Academics & Training": 0,
    "Corporate Relations & Placements": 0,
    "Finance & Accounts": 0,
    "Front Desk & Operations": 0,
    "Administration & Leadership": 0,
  };

  const employmentTypeCounts: Record<EmploymentType, number> = {
    "Full-time": 0,
    "Part-time": 0,
    "Contract": 0,
    "Visiting Faculty": 0,
  };

  let active = 0;
  let inactive = 0;
  let counsellors = 0;
  let trainers = 0;
  let administrators = 0;

  list.forEach((s) => {
    if (departmentCounts[s.department] !== undefined) {
      departmentCounts[s.department]++;
    }
    if (employmentTypeCounts[s.employmentType] !== undefined) {
      employmentTypeCounts[s.employmentType]++;
    }

    if (s.employmentStatus === "Active") active++;
    else inactive++;

    if (s.role === "Counsellor") counsellors++;
    if (s.role === "Trainer") trainers++;
    if (s.role === "Super Admin" || s.role === "Admin") administrators++;
  });

  return {
    totalStaff: list.length,
    activeStaff: active,
    inactiveStaff: inactive,
    counsellors,
    trainers,
    administrators,
    departmentCounts,
    employmentTypeCounts,
  };
}

export async function getStaffPerformanceMetrics(): Promise<StaffPerformanceSummary[]> {
  const staffList = await getAllStaff();

  const leads = readJsonFile<any[]>(path.join(process.cwd(), "data", "leads.json"), []);
  const enquiries = readJsonFile<any[]>(path.join(process.cwd(), "data", "enquiries.json"), []);
  const counselling = readJsonFile<any[]>(path.join(process.cwd(), "data", "counselling.json"), []);
  const followUps = readJsonFile<any[]>(path.join(process.cwd(), "data", "follow-ups.json"), []);
  const batches = readJsonFile<any[]>(path.join(process.cwd(), "data", "batches.json"), []);
  const attendanceData = readJsonFile<any>(path.join(process.cwd(), "data", "attendance.json"), { sessions: [] });
  const attendanceSessions = attendanceData.sessions || [];
  const placementsData = readJsonFile<any>(path.join(process.cwd(), "data", "placements.json"), { offers: [] });
  const offers = placementsData.offers || [];

  return staffList.map((staff) => {
    const sName = staff.fullName.toLowerCase();

    // 1. Leads
    const staffLeads = leads.filter((l) => l.assignedCounselor && l.assignedCounselor.toLowerCase() === sName);
    const convertedLeads = staffLeads.filter(
      (l) => l.status === "Enrolled" || l.status === "Admitted" || l.status === "Converted"
    );
    const conversionRate =
      staffLeads.length > 0 ? Math.round((convertedLeads.length / staffLeads.length) * 100) : 0;

    // 2. Enquiries
    const staffEnquiries = enquiries.filter(
      (e) => (e.assignedCounselor && e.assignedCounselor.toLowerCase() === sName) ||
             (e.staffName && e.staffName.toLowerCase() === sName)
    );

    // 3. Counselling
    const staffCounselling = counselling.filter(
      (c) => c.assignedCounsellor && c.assignedCounsellor.toLowerCase() === sName
    );
    const completedCounselling = staffCounselling.filter((c) => c.status === "Completed");

    // 4. Follow ups
    const staffFollowUps = followUps.filter(
      (f) => f.assignedCounselor && f.assignedCounselor.toLowerCase() === sName && f.status === "Completed"
    );

    // 5. Batches & Students
    const staffBatches = batches.filter((b) => b.trainer && b.trainer.toLowerCase() === sName);
    const studentsTrained = staffBatches.reduce((acc, b) => acc + (b.studentCount || b.enrolledStudents?.length || 0), 0);

    // 6. Attendance Sessions
    const staffAttendance = attendanceSessions.filter(
      (s: any) => (s.trainer && s.trainer.toLowerCase() === sName) ||
                  (s.recordedBy && s.recordedBy.toLowerCase() === sName)
    );

    // 7. Placements
    const staffOffers = offers.filter(
      (o: any) => o.recordedBy && o.recordedBy.toLowerCase().includes(sName)
    );

    return {
      staffId: staff.id,
      staffName: staff.fullName,
      role: staff.role,
      department: staff.department,
      leadsAssigned: staffLeads.length,
      leadsConverted: convertedLeads.length,
      conversionRate,
      enquiriesHandled: staffEnquiries.length,
      counsellingSessionsTotal: staffCounselling.length,
      counsellingSessionsCompleted: completedCounselling.length,
      followUpsCompleted: staffFollowUps.length,
      batchesAssigned: staffBatches.length,
      studentsTrained,
      attendanceSessionsTaken: staffAttendance.length,
      placementOffersRecorded: staffOffers.length,
    };
  });
}

export function getStaffCrossModuleActivity(staffName: string): StaffCrossModuleDetails {
  const sName = staffName.trim().toLowerCase();

  const leads = readJsonFile<any[]>(path.join(process.cwd(), "data", "leads.json"), []);
  const enquiries = readJsonFile<any[]>(path.join(process.cwd(), "data", "enquiries.json"), []);
  const counselling = readJsonFile<any[]>(path.join(process.cwd(), "data", "counselling.json"), []);
  const followUps = readJsonFile<any[]>(path.join(process.cwd(), "data", "follow-ups.json"), []);
  const batches = readJsonFile<any[]>(path.join(process.cwd(), "data", "batches.json"), []);
  const attendanceData = readJsonFile<any>(path.join(process.cwd(), "data", "attendance.json"), { sessions: [] });
  const attendanceSessions = attendanceData.sessions || [];
  const placementsData = readJsonFile<any>(path.join(process.cwd(), "data", "placements.json"), { offers: [] });
  const offers = placementsData.offers || [];

  return {
    leads: leads.filter((l) => l.assignedCounselor && l.assignedCounselor.toLowerCase() === sName),
    enquiries: enquiries.filter(
      (e) => (e.assignedCounselor && e.assignedCounselor.toLowerCase() === sName) ||
             (e.staffName && e.staffName.toLowerCase() === sName)
    ),
    counsellingSessions: counselling.filter(
      (c) => c.assignedCounsellor && c.assignedCounsellor.toLowerCase() === sName
    ),
    followUps: followUps.filter(
      (f) => (f.assignedCounsellor && f.assignedCounsellor.toLowerCase() === sName) ||
             (f.assignedCounselor && f.assignedCounselor.toLowerCase() === sName)
    ),
    batches: batches.filter((b) => b.trainer && b.trainer.toLowerCase() === sName),
    attendanceSessions: attendanceSessions.filter(
      (s: any) => (s.trainer && s.trainer.toLowerCase() === sName) ||
                  (s.recordedBy && s.recordedBy.toLowerCase() === sName)
    ),
    placements: offers.filter(
      (o: any) => o.recordedBy && o.recordedBy.toLowerCase().includes(sName)
    ),
  };
}

// Role-Based Access Control permission enforcement utility
export function hasPermission(
  staff: StaffRecord | null | undefined,
  module: CrmModule,
  action: keyof ModulePermission
): boolean {
  if (!staff) return false;
  if (staff.role === "Super Admin") return true;

  const perms = staff.permissions || defaultPermissionsForRole(staff.role);
  const modulePerm = perms[module];
  if (!modulePerm) return false;

  return !!modulePerm[action];
}
