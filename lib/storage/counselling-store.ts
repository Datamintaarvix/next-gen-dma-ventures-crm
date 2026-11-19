import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  CounsellingSessionRecord,
  ScheduleCounsellingFormData,
  CompleteSessionFormData,
  CounsellingKPIStats,
  CounsellorPerformanceStat,
  SessionStatus,
} from "@/lib/validations/counselling";
import { readAdmissionsFromDisk } from "@/lib/storage/admissions-store";
import { readFollowUpsFromDisk, writeFollowUpsToDisk, createFollowUp } from "@/lib/storage/follow-ups-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "counselling.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readCounsellingFromDisk(): Promise<CounsellingSessionRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("counselling_sessions")
      .select("*")
      .order("counselling_date", { ascending: false });

    if (error) {
      console.error("Supabase readCounselling error:", error);
      throw new Error(`Failed to fetch counselling sessions from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      sessionCode: row.session_code,
      participantType: row.participant_type as any,
      participantId: row.participant_id || undefined,
      participantCode: row.participant_code || undefined,
      personName: row.person_name,
      contactNumber: row.contact_number,
      email: row.email || undefined,
      interestedCourse: row.interested_course,
      assignedCounsellor: row.assigned_counsellor,
      counsellingDate: row.counselling_date,
      startTime: row.start_time,
      endTime: row.end_time,
      sessionType: row.session_type as any,
      purpose: row.purpose,
      meetingLocationOrLink: row.location_or_link || undefined,
      priority: row.priority as any,
      status: row.status as any,
      additionalNotes: row.notes || undefined,
      isConvertedToAdmission: Boolean(row.is_converted_to_admission),
      outcomeSummary: row.outcome_summary || undefined,
      recommendations: row.recommendations || undefined,
      actionPlan: (row.action_plan as any) || [],
      auditTrail: (row.audit_trail as any) || [],
      lastModifiedBy: row.last_modified_by || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }

  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error reading counselling file:", error);
    return [];
  }
}

export async function writeCounsellingToDisk(records: CounsellingSessionRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

/**
 * Convert time string like "10:00 AM", "02:30 PM", or "14:30" to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Check if counsellor has an overlapping appointment on the same date
 */
export async function checkCounsellorConflict(
  counsellor: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<{ hasConflict: boolean; conflictingSession?: CounsellingSessionRecord; message?: string }> {
  const sessions = await readCounsellingFromDisk();
  const newStart = timeStringToMinutes(startTime);
  const newEnd = timeStringToMinutes(endTime);

  // Check against active appointments for the same counsellor and date
  for (const s of sessions) {
    if (excludeId && (s.id === excludeId || s.sessionCode === excludeId)) continue;
    if (s.assignedCounsellor !== counsellor) continue;
    if (s.counsellingDate !== date) continue;
    if (s.status === "Cancelled" || s.status === "Completed") continue; // only active appointments conflict

    const existStart = timeStringToMinutes(s.startTime);
    const existEnd = timeStringToMinutes(s.endTime);

    // Overlap condition: startA < endB && endA > startB
    if (newStart < existEnd && newEnd > existStart) {
      return {
        hasConflict: true,
        conflictingSession: s,
        message: `${counsellor} already has an appointment scheduled on ${date} (${s.startTime} - ${s.endTime}) with ${s.personName} (${s.sessionCode})`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Search and filter counselling sessions
 */
export async function getCounsellingSessions(params?: {
  search?: string;
  counsellor?: string;
  status?: string;
  sessionType?: string;
  dateRange?: string;
  date?: string;
  sortBy?: "date" | "name" | "counsellor" | "status";
  sortOrder?: "asc" | "desc";
}): Promise<CounsellingSessionRecord[]> {
  const records = await readCounsellingFromDisk();
  let result = [...records];

  if (!params) {
    return result.sort((a, b) => b.counsellingDate.localeCompare(a.counsellingDate));
  }

  const { search, counsellor, status, sessionType, dateRange, date, sortBy = "date", sortOrder = "desc" } = params;

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.personName.toLowerCase().includes(q) ||
        r.sessionCode.toLowerCase().includes(q) ||
        r.contactNumber.includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        r.interestedCourse.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        (r.additionalNotes && r.additionalNotes.toLowerCase().includes(q)) ||
        (r.discussionNotes && r.discussionNotes.toLowerCase().includes(q))
    );
  }

  if (counsellor && counsellor !== "All") {
    result = result.filter((r) => r.assignedCounsellor === counsellor);
  }

  if (status && status !== "All") {
    result = result.filter((r) => r.status === status);
  }

  if (sessionType && sessionType !== "All") {
    result = result.filter((r) => r.sessionType === sessionType);
  }

  if (date) {
    result = result.filter((r) => r.counsellingDate === date);
  }

  if (dateRange && dateRange !== "All") {
    const todayStr = "2026-11-18"; // Reference simulation date
    const today = new Date(todayStr);

    if (dateRange === "Today") {
      result = result.filter((r) => r.counsellingDate === todayStr);
    } else if (dateRange === "Upcoming") {
      result = result.filter((r) => r.counsellingDate >= todayStr && (r.status === "Scheduled" || r.status === "Confirmed"));
    } else if (dateRange === "Yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      result = result.filter((r) => r.counsellingDate === yStr);
    } else if (dateRange === "This Week") {
      const weekStart = new Date(today);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().split("T")[0];

      result = result.filter((r) => r.counsellingDate >= weekStartStr && r.counsellingDate <= weekEndStr);
    } else if (dateRange === "This Month") {
      const prefix = todayStr.slice(0, 7); // "2026-11"
      result = result.filter((r) => r.counsellingDate.startsWith(prefix));
    }
  }

  // Sorting
  result.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "date") {
      cmp = b.counsellingDate.localeCompare(a.counsellingDate);
      if (cmp === 0) {
        cmp = timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
      }
    } else if (sortBy === "name") {
      cmp = a.personName.localeCompare(b.personName);
    } else if (sortBy === "counsellor") {
      cmp = a.assignedCounsellor.localeCompare(b.assignedCounsellor);
    } else if (sortBy === "status") {
      cmp = a.status.localeCompare(b.status);
    }

    return sortOrder === "asc" ? -cmp : cmp;
  });

  return result;
}

export async function getCounsellingSessionById(id: string): Promise<CounsellingSessionRecord | null> {
  const records = await readCounsellingFromDisk();
  return records.find((r) => r.id === id || r.sessionCode.toLowerCase() === id.toLowerCase()) || null;
}

/**
 * Generate next sequential session code: CS-2026-101, CS-2026-102, ...
 */
function generateNextSessionCode(records: CounsellingSessionRecord[]): string {
  let maxNum = 100;
  records.forEach((r) => {
    const match = r.sessionCode.match(/CS-2026-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  return `CS-2026-${maxNum + 1}`;
}

/**
 * Create a new counselling session
 */
export async function createCounsellingSession(
  input: ScheduleCounsellingFormData,
  operatorName?: string
): Promise<CounsellingSessionRecord> {
  // Validate conflict
  const conflict = await checkCounsellorConflict(
    input.assignedCounsellor,
    input.counsellingDate,
    input.startTime,
    input.endTime
  );

  if (conflict.hasConflict) {
    throw new Error(conflict.message || "Conflicting counselling appointment detected for this counsellor");
  }

  const records = await readCounsellingFromDisk();
  const sessionCode = generateNextSessionCode(records);
  const now = new Date().toISOString();

  // Check if person is already admitted
  const admissions = await readAdmissionsFromDisk();
  const matchingAdmission = admissions.find(
    (a) =>
      a.studentName.toLowerCase() === input.personName.toLowerCase() ||
      (a.studentPhone && a.studentPhone.replace(/\D/g, "") === input.contactNumber.replace(/\D/g, ""))
  );

  const newSession: CounsellingSessionRecord = {
    ...input,
    id: `CS-${Date.now().toString().slice(-6)}`,
    sessionCode,
    isConvertedToAdmission: Boolean(matchingAdmission),
    admissionCode: matchingAdmission ? matchingAdmission.admissionCode : null,
    admissionId: matchingAdmission ? matchingAdmission.id : null,
    createdAt: now,
    updatedAt: now,
    lastModifiedBy: operatorName || input.assignedCounsellor,
    auditTrail: [
      {
        timestamp: now,
        action: "Scheduled",
        performedBy: operatorName || input.assignedCounsellor,
        notes: `Counselling session scheduled for ${input.counsellingDate} at ${input.startTime}`,
      },
    ],
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("counselling_sessions").insert({
      id: newSession.id,
      session_code: newSession.sessionCode,
      participant_type: newSession.participantType,
      participant_id: newSession.participantId || null,
      participant_code: newSession.participantCode || null,
      person_name: newSession.personName,
      contact_number: newSession.contactNumber,
      email: newSession.email || null,
      interested_course: newSession.interestedCourse,
      assigned_counsellor: newSession.assignedCounsellor,
      counselling_date: newSession.counsellingDate,
      start_time: newSession.startTime,
      end_time: newSession.endTime,
      session_type: newSession.sessionType,
      purpose: newSession.purpose,
      location_or_link: newSession.meetingLocationOrLink || null,
      priority: newSession.priority,
      status: newSession.status,
      notes: newSession.additionalNotes || null,
      is_converted_to_admission: Boolean(newSession.isConvertedToAdmission),
      outcome_summary: (newSession as any).outcomeSummary || newSession.discussionNotes || null,
      recommendations: (newSession as any).recommendations || newSession.courseRecommendations || null,
      action_plan: (newSession as any).actionPlan || (newSession.nextAction ? [{ action: newSession.nextAction }] : []),
      audit_trail: (newSession.auditTrail as any) || [],
      last_modified_by: newSession.lastModifiedBy || null,
      created_at: newSession.createdAt,
      updated_at: newSession.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createCounsellingSession failed: ${error.message}`);
    }
  }

  records.unshift(newSession);
  await writeCounsellingToDisk(records);
  return newSession;
}

/**
 * Update a counselling session
 */
export async function updateCounsellingSession(
  id: string,
  input: Partial<ScheduleCounsellingFormData>,
  operatorName?: string
): Promise<CounsellingSessionRecord | null> {
  const records = await readCounsellingFromDisk();
  const index = records.findIndex((r) => r.id === id || r.sessionCode === id);
  if (index === -1) return null;

  const current = records[index];

  // If time, date, or counsellor changed, check conflict
  const counsellor = input.assignedCounsellor || current.assignedCounsellor;
  const date = input.counsellingDate || current.counsellingDate;
  const startTime = input.startTime || current.startTime;
  const endTime = input.endTime || current.endTime;

  if (
    counsellor !== current.assignedCounsellor ||
    date !== current.counsellingDate ||
    startTime !== current.startTime ||
    endTime !== current.endTime
  ) {
    const conflict = await checkCounsellorConflict(counsellor, date, startTime, endTime, current.id);
    if (conflict.hasConflict) {
      throw new Error(conflict.message || "Conflicting appointment detected for this counsellor");
    }
  }

  const now = new Date().toISOString();
  const updated: CounsellingSessionRecord = {
    ...current,
    ...input,
    updatedAt: now,
    lastModifiedBy: operatorName || current.assignedCounsellor,
    auditTrail: [
      ...current.auditTrail,
      {
        timestamp: now,
        action: "Updated",
        performedBy: operatorName || current.assignedCounsellor,
        notes: "Session parameters updated",
      },
    ],
  };

  records[index] = updated;

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("counselling_sessions")
      .update({
        participant_type: updated.participantType,
        participant_id: updated.participantId || null,
        participant_code: updated.participantCode || null,
        person_name: updated.personName,
        contact_number: updated.contactNumber,
        email: updated.email || null,
        interested_course: updated.interestedCourse,
        assigned_counsellor: updated.assignedCounsellor,
        counselling_date: updated.counsellingDate,
        start_time: updated.startTime,
        end_time: updated.endTime,
        session_type: updated.sessionType,
        purpose: updated.purpose,
        location_or_link: updated.meetingLocationOrLink || null,
        priority: updated.priority,
        status: updated.status,
        notes: updated.additionalNotes || null,
        audit_trail: updated.auditTrail as any,
        last_modified_by: updated.lastModifiedBy || null,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},session_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateCounsellingSession failed: ${error.message}`);
    }
  }

  await writeCounsellingToDisk(records);
  return updated;
}

/**
 * Complete a session, record discussion notes, and optionally link a follow-up
 */
export async function completeCounsellingSession(
  id: string,
  input: CompleteSessionFormData,
  operatorName?: string
): Promise<{ session: CounsellingSessionRecord; createdFollowUpId?: string }> {
  const records = await readCounsellingFromDisk();
  const index = records.findIndex((r) => r.id === id || r.sessionCode === id);
  if (index === -1) {
    throw new Error("Counselling session not found");
  }

  const current = records[index];
  const now = new Date().toISOString();

  // Cross check if student has admission
  const admissions = await readAdmissionsFromDisk();
  const matchingAdmission = admissions.find(
    (a) =>
      a.studentName.toLowerCase() === current.personName.toLowerCase() ||
      (a.studentPhone && a.studentPhone.replace(/\D/g, "") === current.contactNumber.replace(/\D/g, ""))
  );

  let linkedFollowUpId: string | null = current.linkedFollowUpId || null;

  // Create linked follow-up if requested and recommendedFollowUpDate is set
  if (input.createFollowUp && input.recommendedFollowUpDate) {
    try {
      const followUps = await readFollowUpsFromDisk();
      // Check duplicate
      const duplicateFollowUp = followUps.find(
        (f) =>
          f.studentName.toLowerCase() === current.personName.toLowerCase() &&
          f.followUpDate === input.recommendedFollowUpDate &&
          f.status !== "Completed" &&
          f.status !== "Cancelled"
      );

      if (!duplicateFollowUp) {
        const newFollowUp = await createFollowUp({
          studentName: current.personName,
          relatedType: current.participantType === "Student" ? "General" : (current.participantType as any),
          relatedId: current.participantId || current.id,
          relatedCode: current.participantCode || current.sessionCode,
          contactNumber: current.contactNumber,
          followUpDate: input.recommendedFollowUpDate,
          followUpTime: "11:00 AM",
          type: "Phone Call",
          assignedCounsellor: current.assignedCounsellor,
          priority: "Medium",
          status: "Pending",
          notes: `Created from Counselling Session ${current.sessionCode}. Next Action: ${input.nextAction}`,
        });
        linkedFollowUpId = newFollowUp.id;
      } else {
        linkedFollowUpId = duplicateFollowUp.id;
      }
    } catch (e) {
      console.error("Failed to auto-create follow-up from counselling:", e);
    }
  }

  const updated: CounsellingSessionRecord = {
    ...current,
    status: input.status,
    discussionNotes: input.discussionNotes,
    studentRequirements: input.studentRequirements || null,
    courseRecommendations: input.courseRecommendations,
    studentInterests: input.studentInterests || null,
    concernsOrObjections: input.concernsOrObjections || null,
    nextAction: input.nextAction,
    recommendedFollowUpDate: input.recommendedFollowUpDate || null,
    completedAt: now,
    completedBy: operatorName || input.counsellorName || current.assignedCounsellor,
    linkedFollowUpId,
    isConvertedToAdmission: Boolean(matchingAdmission),
    admissionCode: matchingAdmission ? matchingAdmission.admissionCode : current.admissionCode,
    admissionId: matchingAdmission ? matchingAdmission.id : current.admissionId,
    updatedAt: now,
    lastModifiedBy: operatorName || current.assignedCounsellor,
    auditTrail: [
      ...current.auditTrail,
      {
        timestamp: now,
        action: input.status === "Completed" ? "Completed" : input.status,
        performedBy: operatorName || input.counsellorName || current.assignedCounsellor,
        notes: `Recorded session discussion notes. Next action: ${input.nextAction}`,
      },
    ],
  };

  records[index] = updated;

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("counselling_sessions")
      .update({
        status: updated.status,
        outcome_summary: (updated as any).outcomeSummary || updated.discussionNotes || null,
        recommendations: (updated as any).recommendations || updated.courseRecommendations || null,
        action_plan: (updated as any).actionPlan || (updated.nextAction ? [{ action: updated.nextAction }] : []),
        audit_trail: updated.auditTrail as any,
        is_converted_to_admission: Boolean(updated.isConvertedToAdmission),
        last_modified_by: updated.lastModifiedBy || null,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},session_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase completeCounsellingSession failed: ${error.message}`);
    }
  }

  await writeCounsellingToDisk(records);

  return { session: updated, createdFollowUpId: linkedFollowUpId || undefined };
}

/**
 * Reschedule a counselling session
 */
export async function rescheduleCounsellingSession(
  id: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  reason?: string,
  operatorName?: string
): Promise<CounsellingSessionRecord | null> {
  const records = await readCounsellingFromDisk();
  const index = records.findIndex((r) => r.id === id || r.sessionCode === id);
  if (index === -1) return null;

  const current = records[index];

  // Conflict check on new date and time
  const conflict = await checkCounsellorConflict(
    current.assignedCounsellor,
    newDate,
    newStartTime,
    newEndTime,
    current.id
  );

  if (conflict.hasConflict) {
    throw new Error(conflict.message || "Conflicting appointment detected for this counsellor");
  }

  const now = new Date().toISOString();
  const oldDate = current.counsellingDate;
  const oldTime = `${current.startTime} - ${current.endTime}`;

  const updated: CounsellingSessionRecord = {
    ...current,
    counsellingDate: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
    status: "Confirmed",
    updatedAt: now,
    lastModifiedBy: operatorName || current.assignedCounsellor,
    auditTrail: [
      ...current.auditTrail,
      {
        timestamp: now,
        action: "Rescheduled",
        performedBy: operatorName || current.assignedCounsellor,
        notes: `Rescheduled from ${oldDate} (${oldTime}) to ${newDate} (${newStartTime} - ${newEndTime}). Reason: ${
          reason || "Requested by participant"
        }`,
      },
    ],
  };

  records[index] = updated;

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("counselling_sessions")
      .update({
        participant_type: updated.participantType,
        participant_id: updated.participantId || null,
        participant_code: updated.participantCode || null,
        person_name: updated.personName,
        contact_number: updated.contactNumber,
        email: updated.email || null,
        interested_course: updated.interestedCourse,
        assigned_counsellor: updated.assignedCounsellor,
        counselling_date: updated.counsellingDate,
        start_time: updated.startTime,
        end_time: updated.endTime,
        session_type: updated.sessionType,
        purpose: updated.purpose,
        location_or_link: updated.meetingLocationOrLink || null,
        priority: updated.priority,
        status: updated.status,
        notes: updated.additionalNotes || null,
        audit_trail: updated.auditTrail as any,
        last_modified_by: updated.lastModifiedBy || null,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},session_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateCounsellingSession failed: ${error.message}`);
    }
  }

  await writeCounsellingToDisk(records);
  return updated;
}

/**
 * Cancel a counselling session
 */
export async function cancelCounsellingSession(
  id: string,
  reason: string,
  operatorName?: string
): Promise<CounsellingSessionRecord | null> {
  const records = await readCounsellingFromDisk();
  const index = records.findIndex((r) => r.id === id || r.sessionCode === id);
  if (index === -1) return null;

  const current = records[index];
  const now = new Date().toISOString();

  const updated: CounsellingSessionRecord = {
    ...current,
    status: "Cancelled",
    cancellationReason: reason,
    updatedAt: now,
    lastModifiedBy: operatorName || current.assignedCounsellor,
    auditTrail: [
      ...current.auditTrail,
      {
        timestamp: now,
        action: "Cancelled",
        performedBy: operatorName || current.assignedCounsellor,
        notes: `Session cancelled. Reason: ${reason}`,
      },
    ],
  };

  records[index] = updated;

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("counselling_sessions")
      .update({
        participant_type: updated.participantType,
        participant_id: updated.participantId || null,
        participant_code: updated.participantCode || null,
        person_name: updated.personName,
        contact_number: updated.contactNumber,
        email: updated.email || null,
        interested_course: updated.interestedCourse,
        assigned_counsellor: updated.assignedCounsellor,
        counselling_date: updated.counsellingDate,
        start_time: updated.startTime,
        end_time: updated.endTime,
        session_type: updated.sessionType,
        purpose: updated.purpose,
        location_or_link: updated.meetingLocationOrLink || null,
        priority: updated.priority,
        status: updated.status,
        notes: updated.additionalNotes || null,
        audit_trail: updated.auditTrail as any,
        last_modified_by: updated.lastModifiedBy || null,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},session_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateCounsellingSession failed: ${error.message}`);
    }
  }

  await writeCounsellingToDisk(records);
  return updated;
}

/**
 * Delete a counselling session
 */
export async function deleteCounsellingSession(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("counselling_sessions")
      .delete()
      .or(`id.eq.${id},session_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase deleteCounsellingSession failed: ${error.message}`);
    }
  }

  const records = await readCounsellingFromDisk();
  const filtered = records.filter((r) => r.id !== id && r.sessionCode !== id);
  if (filtered.length === records.length) return false;

  await writeCounsellingToDisk(filtered);
  return true;
}

/**
 * Get full counselling history for a specific person
 */
export async function getCounsellingHistory(
  personName: string,
  contactNumber?: string,
  participantId?: string
): Promise<CounsellingSessionRecord[]> {
  const records = await readCounsellingFromDisk();
  const cleanPhone = contactNumber ? contactNumber.replace(/\D/g, "") : "";

  return records
    .filter((r) => {
      if (participantId && r.participantId === participantId) return true;
      if (r.personName.toLowerCase() === personName.toLowerCase()) return true;
      if (cleanPhone && r.contactNumber.replace(/\D/g, "") === cleanPhone) return true;
      return false;
    })
    .sort((a, b) => b.counsellingDate.localeCompare(a.counsellingDate));
}

/**
 * Calculate Dashboard KPIs
 */
export async function getCounsellingKPIs(
  filterDate?: string,
  filterCounsellor?: string
): Promise<CounsellingKPIStats> {
  let records = await readCounsellingFromDisk();

  if (filterCounsellor && filterCounsellor !== "All") {
    records = records.filter((r) => r.assignedCounsellor === filterCounsellor);
  }

  const todayStr = filterDate || "2026-11-18";

  const totalSessions = records.length;
  const todaySessions = records.filter((r) => r.counsellingDate === todayStr).length;
  const upcomingSessions = records.filter(
    (r) => r.counsellingDate >= todayStr && (r.status === "Scheduled" || r.status === "Confirmed")
  ).length;
  const completedSessions = records.filter((r) => r.status === "Completed").length;
  const cancelledSessions = records.filter((r) => r.status === "Cancelled").length;
  const noShowSessions = records.filter((r) => r.status === "No Show").length;

  const convertedCount = records.filter((r) => r.isConvertedToAdmission && r.status === "Completed").length;
  const conversionRate =
    completedSessions > 0 ? Math.min(100, Math.round((convertedCount / completedSessions) * 100)) : 0;

  return {
    totalSessions,
    todaySessions,
    upcomingSessions,
    completedSessions,
    cancelledSessions,
    noShowSessions,
    convertedCount,
    conversionRate,
  };
}

/**
 * Generate Counsellor Performance & Conversion analytics
 */
export async function getCounsellorPerformanceReports(): Promise<{
  counsellors: CounsellorPerformanceStat[];
  convertedSessions: CounsellingSessionRecord[];
}> {
  const records = await readCounsellingFromDisk();
  const admissions = await readAdmissionsFromDisk();

  const counsellorMap = new Map<string, CounsellorPerformanceStat>();

  records.forEach((r) => {
    const c = r.assignedCounsellor;
    const current = counsellorMap.get(c) || {
      counsellorName: c,
      totalAssigned: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      convertedToAdmission: 0,
      conversionRate: 0,
      avgDurationMinutes: 45,
    };

    current.totalAssigned++;
    if (r.status === "Completed") current.completed++;
    else if (r.status === "Cancelled") current.cancelled++;
    else if (r.status === "No Show") current.noShow++;

    if (r.isConvertedToAdmission && r.status === "Completed") {
      current.convertedToAdmission++;
    }

    counsellorMap.set(c, current);
  });

  const counsellors = Array.from(counsellorMap.values()).map((c) => ({
    ...c,
    conversionRate: c.completed > 0 ? Math.min(100, Math.round((c.convertedToAdmission / c.completed) * 100)) : 0,
  }));

  const convertedSessions = records.filter((r) => r.isConvertedToAdmission);

  return { counsellors, convertedSessions };
}
