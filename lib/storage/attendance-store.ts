import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceKPIStats,
  AttendanceStatus,
  MarkAttendanceSessionFormData,
  StudentAttendanceProfile,
  BatchAttendanceReport,
} from "@/lib/validations/attendance";
import { readStudentsFromDisk, writeStudentsToDisk } from "@/lib/storage/students-store";
import { readBatchesFromDisk } from "@/lib/storage/batches-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "attendance.json");

interface AttendanceStorageShape {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
}

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    const empty: AttendanceStorageShape = { sessions: [], records: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2), "utf-8");
  }
}

export async function readAttendanceFromDisk(): Promise<AttendanceStorageShape> {
  if (isSupabaseServerConfigured()) {
    const [sessRes, recRes] = await Promise.all([
      supabaseAdmin.from("attendance_sessions").select("*").order("date", { ascending: false }),
      supabaseAdmin.from("attendance_records").select("*").order("date", { ascending: false }),
    ]);

    if (sessRes.error) {
      console.error("Supabase attendance_sessions error:", sessRes.error);
      throw new Error(`Failed to fetch attendance sessions from Supabase: ${sessRes.error.message}`);
    }
    if (recRes.error) {
      console.error("Supabase attendance_records error:", recRes.error);
      throw new Error(`Failed to fetch attendance records from Supabase: ${recRes.error.message}`);
    }

    const sessions: AttendanceSession[] = (sessRes.data || []).map((row) => ({
      id: row.id,
      courseName: row.course_name,
      batchCode: row.batch_code,
      batchName: row.batch_name,
      date: row.date,
      sessionTitle: row.session_title,
      trainer: row.trainer,
      recordedBy: row.recorded_by,
      totalStudents: row.total_students,
      presentCount: row.present_count,
      absentCount: row.absent_count,
      lateCount: row.late_count,
      excusedCount: row.excused_count,
      attendancePercentage: Number(row.attendance_percentage),
      notes: row.notes || undefined,
      records: (row.records as any) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const records: AttendanceRecord[] = (recRes.data || []).map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name,
      courseName: row.course_name,
      batchCode: row.batch_code,
      batchName: row.batch_name,
      date: row.date,
      sessionTitle: row.session_title,
      status: row.status as any,
      checkInTime: row.check_in_time || undefined,
      remarks: row.remarks || undefined,
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { sessions, records };
  }

  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { sessions: [], records: [] };
  }

  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return {
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      records: Array.isArray(data.records) ? data.records : [],
    };
  } catch (error) {
    console.error("Error reading attendance file:", error);
    return { sessions: [], records: [] };
  }
}

export async function writeAttendanceToDisk(data: AttendanceStorageShape): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Filter and search attendance records
 */
export async function getAttendanceRecords(params?: {
  search?: string;
  course?: string;
  batch?: string;
  status?: string;
  dateRange?: string;
  date?: string;
  sortBy?: "date" | "name" | "batch" | "status";
  sortOrder?: "asc" | "desc";
}): Promise<AttendanceRecord[]> {
  const { records } = await readAttendanceFromDisk();
  let result = [...records];

  if (!params) {
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }

  const { search, course, batch, status, dateRange, date, sortBy = "date", sortOrder = "desc" } = params;

  // Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q) ||
        r.batchName.toLowerCase().includes(q) ||
        r.batchCode.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q) ||
        (r.remarks && r.remarks.toLowerCase().includes(q)) ||
        (r.sessionTitle && r.sessionTitle.toLowerCase().includes(q))
    );
  }

  // Course filter
  if (course && course !== "All") {
    result = result.filter((r) => r.courseName === course);
  }

  // Batch filter
  if (batch && batch !== "All") {
    result = result.filter((r) => r.batchCode === batch || r.batchName === batch);
  }

  // Status filter
  if (status && status !== "All") {
    result = result.filter((r) => r.status === status);
  }

  // Specific single date filter
  if (date) {
    result = result.filter((r) => r.date === date);
  }

  // Date range filter
  if (dateRange && dateRange !== "All") {
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);

    if (dateRange === "Today") {
      result = result.filter((r) => r.date === todayStr);
    } else if (dateRange === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      result = result.filter((r) => r.date === yStr);
    } else if (dateRange === "This Week") {
      const weekStart = new Date(today);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      result = result.filter((r) => r.date >= weekStartStr && r.date <= todayStr);
    } else if (dateRange === "This Month") {
      const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
      result = result.filter((r) => r.date.startsWith(monthPrefix));
    }
  }

  // Sorting
  result.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      comparison = b.date.localeCompare(a.date);
    } else if (sortBy === "name") {
      comparison = a.studentName.localeCompare(b.studentName);
    } else if (sortBy === "batch") {
      comparison = a.batchName.localeCompare(b.batchName);
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    }

    return sortOrder === "asc" ? -comparison : comparison;
  });

  return result;
}

/**
 * Get overall attendance dashboard KPIs
 */
export async function getAttendanceKPIs(filterDate?: string, filterBatch?: string): Promise<AttendanceKPIStats> {
  const store = await readAttendanceFromDisk();
  const students = await readStudentsFromDisk();
  const batches = await readBatchesFromDisk();

  const todayStr = filterDate || new Date().toISOString().split("T")[0];

  let relevantStudents = students.filter((s) => s.status !== "Dropped");
  if (filterBatch && filterBatch !== "All") {
    relevantStudents = relevantStudents.filter((s) => s.batchCode === filterBatch);
  }

  // Today's records
  let todayRecords = store.records.filter((r) => r.date === todayStr);
  if (filterBatch && filterBatch !== "All") {
    todayRecords = todayRecords.filter((r) => r.batchCode === filterBatch);
  }

  const presentToday = todayRecords.filter((r) => r.status === "Present").length;
  const absentToday = todayRecords.filter((r) => r.status === "Absent").length;
  const lateArrivals = todayRecords.filter((r) => r.status === "Late").length;

  // Filter sessions if batch specified
  let sessions = store.sessions;
  if (filterBatch && filterBatch !== "All") {
    sessions = sessions.filter((s) => s.batchCode === filterBatch);
  }

  // Overall attendance calculation
  let overallPercentage = 0;
  let totalAttendedMarks = 0;
  let totalEvaluatedMarks = 0;

  let recordsForEval = store.records;
  if (filterBatch && filterBatch !== "All") {
    recordsForEval = recordsForEval.filter((r) => r.batchCode === filterBatch);
  }

  recordsForEval.forEach((r) => {
    totalEvaluatedMarks++;
    if (r.status === "Present" || r.status === "Late") {
      totalAttendedMarks++;
    }
  });

  if (totalEvaluatedMarks > 0) {
    overallPercentage = Math.round((totalAttendedMarks / totalEvaluatedMarks) * 100);
  } else {
    overallPercentage = 100;
  }

  // Count low attendance (< 75%) among active students with at least 1 session
  const lowAttendanceCount = relevantStudents.filter(
    (s) => s.totalClasses > 0 && s.attendancePercentage < 75
  ).length;

  const activeBatchesCount = batches.filter((b) => b.status === "Active").length;

  return {
    totalStudents: relevantStudents.length,
    presentToday,
    absentToday,
    lateArrivals,
    overallPercentage,
    totalSessionsHeld: sessions.length,
    activeBatchesCount,
    lowAttendanceCount,
  };
}

/**
 * Check if an attendance session already exists for batch and date
 */
export async function getSessionByBatchAndDate(
  batchCode: string,
  date: string
): Promise<AttendanceSession | null> {
  const { sessions } = await readAttendanceFromDisk();
  return sessions.find((s) => s.batchCode === batchCode && s.date === date) || null;
}

/**
 * Save or update a full attendance session and synchronize students.json
 */
export async function saveOrUpdateAttendanceSession(
  input: MarkAttendanceSessionFormData,
  operatorName?: string
): Promise<{ session: AttendanceSession; isNew: boolean }> {
  const store = await readAttendanceFromDisk();
  const now = new Date().toISOString();

  // Find if session already exists
  const existingSessionIndex = store.sessions.findIndex(
    (s) => s.batchCode === input.batchCode && s.date === input.date
  );

  let sessionId = "";
  let isNew = false;

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  input.records.forEach((r) => {
    if (r.status === "Present") presentCount++;
    else if (r.status === "Absent") absentCount++;
    else if (r.status === "Late") lateCount++;
    else if (r.status === "Excused") excusedCount++;
  });

  const totalStudents = input.records.length;
  const attendancePercentage =
    totalStudents > 0
      ? Math.round(((presentCount + lateCount) / totalStudents) * 100)
      : 100;

  if (existingSessionIndex !== -1) {
    // Update existing session
    const existing = store.sessions[existingSessionIndex];
    sessionId = existing.id;

    // Remove old individual records for this session
    store.records = store.records.filter((r) => r.sessionId !== sessionId);

    // Build new records
    const newRecords: AttendanceRecord[] = input.records.map((r, idx) => ({
      id: `ATT-${input.date.replace(/-/g, "")}-${String(idx + 1).padStart(3, "0")}-${Date.now().toString().slice(-4)}`,
      sessionId,
      studentId: r.studentId,
      studentCode: r.studentCode,
      studentName: r.studentName,
      courseName: input.courseName,
      batchCode: input.batchCode,
      batchName: input.batchName,
      date: input.date,
      sessionTitle: input.sessionTitle,
      status: r.status,
      checkInTime: r.checkInTime || null,
      remarks: r.remarks || null,
      recordedBy: input.recordedBy,
      createdAt: existing.createdAt,
      updatedAt: now,
      lastModifiedBy: operatorName || input.recordedBy,
    }));

    const updatedSession: AttendanceSession = {
      ...existing,
      courseName: input.courseName,
      batchCode: input.batchCode,
      batchName: input.batchName,
      date: input.date,
      sessionTitle: input.sessionTitle,
      trainer: input.trainer,
      recordedBy: input.recordedBy,
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage,
      notes: input.notes || null,
      records: newRecords,
      updatedAt: now,
      lastModifiedBy: operatorName || input.recordedBy,
    };

    store.sessions[existingSessionIndex] = updatedSession;
    store.records.push(...newRecords);

    if (isSupabaseServerConfigured()) {
      const sessionRow = {
        id: updatedSession.id,
        course_name: updatedSession.courseName,
        batch_code: updatedSession.batchCode,
        batch_name: updatedSession.batchName,
        date: updatedSession.date,
        session_title: updatedSession.sessionTitle,
        trainer: updatedSession.trainer,
        recorded_by: updatedSession.recordedBy,
        total_students: updatedSession.totalStudents,
        present_count: updatedSession.presentCount,
        absent_count: updatedSession.absentCount,
        late_count: updatedSession.lateCount,
        excused_count: updatedSession.excusedCount,
        attendance_percentage: updatedSession.attendancePercentage,
        notes: updatedSession.notes || null,
        records: updatedSession.records as any,
        created_at: updatedSession.createdAt,
        updated_at: updatedSession.updatedAt,
      };
      const { error: sessErr } = await supabaseAdmin.from("attendance_sessions").upsert(sessionRow, { onConflict: "id" });
      if (sessErr) throw new Error(`Supabase saveAttendanceSession failed: ${sessErr.message}`);

      await supabaseAdmin.from("attendance_records").delete().eq("session_id", sessionId);
      const recordRows = newRecords.map((r) => ({
        id: r.id,
        session_id: r.sessionId,
        student_id: r.studentId,
        student_code: r.studentCode,
        student_name: r.studentName,
        course_name: r.courseName,
        batch_code: r.batchCode,
        batch_name: r.batchName,
        date: r.date,
        session_title: r.sessionTitle,
        status: r.status,
        check_in_time: r.checkInTime || null,
        remarks: r.remarks || null,
        recorded_by: r.recordedBy,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      }));
      const { error: recsErr } = await supabaseAdmin.from("attendance_records").upsert(recordRows, { onConflict: "id" });
      if (recsErr) throw new Error(`Supabase saveAttendanceRecords failed: ${recsErr.message}`);
    }

    await writeAttendanceToDisk(store);
    await syncStudentsAttendanceMetrics(input.records.map((r) => r.studentId));

    return { session: updatedSession, isNew: false };
  } else {
    // Create new session
    isNew = true;
    sessionId = `SESS-${input.batchCode.replace(/[^a-zA-Z0-9]/g, "")}-${input.date.replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;

    const newRecords: AttendanceRecord[] = input.records.map((r, idx) => ({
      id: `ATT-${input.date.replace(/-/g, "")}-${String(idx + 1).padStart(3, "0")}-${Date.now().toString().slice(-4)}`,
      sessionId,
      studentId: r.studentId,
      studentCode: r.studentCode,
      studentName: r.studentName,
      courseName: input.courseName,
      batchCode: input.batchCode,
      batchName: input.batchName,
      date: input.date,
      sessionTitle: input.sessionTitle,
      status: r.status,
      checkInTime: r.checkInTime || null,
      remarks: r.remarks || null,
      recordedBy: input.recordedBy,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: operatorName || input.recordedBy,
    }));

    const newSession: AttendanceSession = {
      id: sessionId,
      courseName: input.courseName,
      batchCode: input.batchCode,
      batchName: input.batchName,
      date: input.date,
      sessionTitle: input.sessionTitle,
      trainer: input.trainer,
      recordedBy: input.recordedBy,
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage,
      notes: input.notes || null,
      records: newRecords,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: operatorName || input.recordedBy,
    };

    store.sessions.unshift(newSession);
    store.records.push(...newRecords);

    if (isSupabaseServerConfigured()) {
      const sessionRow = {
        id: newSession.id,
        course_name: newSession.courseName,
        batch_code: newSession.batchCode,
        batch_name: newSession.batchName,
        date: newSession.date,
        session_title: newSession.sessionTitle,
        trainer: newSession.trainer,
        recorded_by: newSession.recordedBy,
        total_students: newSession.totalStudents,
        present_count: newSession.presentCount,
        absent_count: newSession.absentCount,
        late_count: newSession.lateCount,
        excused_count: newSession.excusedCount,
        attendance_percentage: newSession.attendancePercentage,
        notes: newSession.notes || null,
        records: newSession.records as any,
        created_at: newSession.createdAt,
        updated_at: newSession.updatedAt,
      };
      const { error: sessErr } = await supabaseAdmin.from("attendance_sessions").insert(sessionRow);
      if (sessErr) throw new Error(`Supabase createAttendanceSession failed: ${sessErr.message}`);

      const recordRows = newRecords.map((r) => ({
        id: r.id,
        session_id: r.sessionId,
        student_id: r.studentId,
        student_code: r.studentCode,
        student_name: r.studentName,
        course_name: r.courseName,
        batch_code: r.batchCode,
        batch_name: r.batchName,
        date: r.date,
        session_title: r.sessionTitle,
        status: r.status,
        check_in_time: r.checkInTime || null,
        remarks: r.remarks || null,
        recorded_by: r.recordedBy,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      }));
      const { error: recsErr } = await supabaseAdmin.from("attendance_records").insert(recordRows);
      if (recsErr) throw new Error(`Supabase createAttendanceRecords failed: ${recsErr.message}`);
    }

    await writeAttendanceToDisk(store);
    await syncStudentsAttendanceMetrics(input.records.map((r) => r.studentId));

    return { session: newSession, isNew: true };
  }
}

/**
 * Synchronize attendance metrics in data/students.json
 */
export async function syncStudentsAttendanceMetrics(studentIds: string[]): Promise<void> {
  const store = await readAttendanceFromDisk();
  const students = await readStudentsFromDisk();

  let hasChanged = false;

  studentIds.forEach((studentId) => {
    const studentIndex = students.findIndex((s) => s.id === studentId || s.studentCode === studentId);
    if (studentIndex === -1) return;

    const student = students[studentIndex];

    // Find all attendance records for this student
    const studentRecords = store.records.filter(
      (r) => r.studentId === student.id || r.studentCode === student.studentCode
    );

    const totalClasses = studentRecords.length;
    const attendedClasses = studentRecords.filter(
      (r) => r.status === "Present" || r.status === "Late"
    ).length;

    const attendancePercentage =
      totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

    // Recent attendance list (latest 8 sessions sorted descending)
    const sortedRecords = [...studentRecords].sort((a, b) => b.date.localeCompare(a.date));
    const recentAttendance = sortedRecords.slice(0, 8).map((r) => ({
      id: r.id,
      date: r.date,
      sessionTitle: r.sessionTitle,
      status: r.status,
    }));

    students[studentIndex] = {
      ...student,
      totalClasses,
      attendedClasses,
      attendancePercentage,
      recentAttendance,
      updatedAt: new Date().toISOString(),
    };

    hasChanged = true;
  });

  if (hasChanged) {
    await writeStudentsToDisk(students);
  }
}

/**
 * Update a single attendance record
 */
export async function updateAttendanceRecord(
  id: string,
  updates: {
    status?: AttendanceStatus;
    checkInTime?: string | null;
    remarks?: string | null;
  },
  operatorName?: string
): Promise<AttendanceRecord | null> {
  const store = await readAttendanceFromDisk();
  const recordIndex = store.records.findIndex((r) => r.id === id);
  if (recordIndex === -1) return null;

  const current = store.records[recordIndex];
  const now = new Date().toISOString();

  const updated: AttendanceRecord = {
    ...current,
    status: updates.status || current.status,
    checkInTime: updates.checkInTime !== undefined ? updates.checkInTime : current.checkInTime,
    remarks: updates.remarks !== undefined ? updates.remarks : current.remarks,
    updatedAt: now,
    lastModifiedBy: operatorName || current.recordedBy,
  };

  store.records[recordIndex] = updated;

  // Also update inside corresponding session if found
  const sessionIndex = store.sessions.findIndex((s) => s.id === current.sessionId);
  if (sessionIndex !== -1) {
    const session = store.sessions[sessionIndex];
    const recIndexInSession = session.records.findIndex((r) => r.id === id);
    if (recIndexInSession !== -1) {
      session.records[recIndexInSession] = updated;
    }

    // Recalculate session counts
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    session.records.forEach((r) => {
      if (r.status === "Present") presentCount++;
      else if (r.status === "Absent") absentCount++;
      else if (r.status === "Late") lateCount++;
      else if (r.status === "Excused") excusedCount++;
    });

    session.presentCount = presentCount;
    session.absentCount = absentCount;
    session.lateCount = lateCount;
    session.excusedCount = excusedCount;
    session.attendancePercentage =
      session.totalStudents > 0
        ? Math.round(((presentCount + lateCount) / session.totalStudents) * 100)
        : 100;
    session.updatedAt = now;
    session.lastModifiedBy = operatorName || current.recordedBy;
  }

  if (isSupabaseServerConfigured()) {
    const { error: updErr } = await supabaseAdmin
      .from("attendance_records")
      .update({
        status: updated.status,
        check_in_time: updated.checkInTime || null,
        remarks: updated.remarks || null,
        updated_at: updated.updatedAt,
      })
      .eq("id", id);
    if (updErr) {
      throw new Error(`Supabase updateAttendanceRecord failed: ${updErr.message}`);
    }

    if (sessionIndex !== -1) {
      const session = store.sessions[sessionIndex];
      await supabaseAdmin
        .from("attendance_sessions")
        .update({
          present_count: session.presentCount,
          absent_count: session.absentCount,
          late_count: session.lateCount,
          excused_count: session.excusedCount,
          attendance_percentage: session.attendancePercentage,
          records: session.records as any,
          updated_at: now,
        })
        .eq("id", current.sessionId);
    }
  }

  await writeAttendanceToDisk(store);
  await syncStudentsAttendanceMetrics([current.studentId]);

  return updated;
}

/**
 * Delete a single attendance record
 */
export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  const store = await readAttendanceFromDisk();
  const record = store.records.find((r) => r.id === id);
  if (!record) return false;

  const studentId = record.studentId;
  const sessionId = record.sessionId;

  // Remove from records
  store.records = store.records.filter((r) => r.id !== id);

  if (isSupabaseServerConfigured()) {
    const { error: delErr } = await supabaseAdmin.from("attendance_records").delete().eq("id", id);
    if (delErr) {
      throw new Error(`Supabase deleteAttendanceRecord failed: ${delErr.message}`);
    }
  }

  // Update session
  const sessionIndex = store.sessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex !== -1) {
    const session = store.sessions[sessionIndex];
    session.records = session.records.filter((r) => r.id !== id);
    session.totalStudents = session.records.length;

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    session.records.forEach((r) => {
      if (r.status === "Present") presentCount++;
      else if (r.status === "Absent") absentCount++;
      else if (r.status === "Late") lateCount++;
      else if (r.status === "Excused") excusedCount++;
    });

    session.presentCount = presentCount;
    session.absentCount = absentCount;
    session.lateCount = lateCount;
    session.excusedCount = excusedCount;
    session.attendancePercentage =
      session.totalStudents > 0
        ? Math.round(((presentCount + lateCount) / session.totalStudents) * 100)
        : 100;
    session.updatedAt = new Date().toISOString();
  }

  await writeAttendanceToDisk(store);
  await syncStudentsAttendanceMetrics([studentId]);

  return true;
}

/**
 * Get comprehensive student attendance profile
 */
export async function getStudentAttendanceProfile(
  studentIdentifier: string
): Promise<StudentAttendanceProfile | null> {
  const students = await readStudentsFromDisk();
  const student = students.find(
    (s) => s.id === studentIdentifier || s.studentCode.toLowerCase() === studentIdentifier.toLowerCase()
  );

  if (!student) return null;

  const { records } = await readAttendanceFromDisk();
  const studentRecords = records
    .filter((r) => r.studentId === student.id || r.studentCode === student.studentCode)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalClasses = studentRecords.length;
  const presentClasses = studentRecords.filter((r) => r.status === "Present").length;
  const absentClasses = studentRecords.filter((r) => r.status === "Absent").length;
  const lateClasses = studentRecords.filter((r) => r.status === "Late").length;
  const excusedClasses = studentRecords.filter((r) => r.status === "Excused").length;

  const attended = presentClasses + lateClasses;
  const attendancePercentage =
    totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 100;

  // Monthly breakdown calculation
  const monthsMap = new Map<string, { total: number; attended: number }>();
  studentRecords.forEach((r) => {
    const d = new Date(r.date);
    const monthYear = d.toLocaleString("en-US", { month: "short", year: "numeric" }); // e.g. "Nov 2026"
    const current = monthsMap.get(monthYear) || { total: 0, attended: 0 };
    current.total++;
    if (r.status === "Present" || r.status === "Late") {
      current.attended++;
    }
    monthsMap.set(monthYear, current);
  });

  const monthlyBreakdown = Array.from(monthsMap.entries()).map(([monthYear, val]) => ({
    monthYear,
    totalClasses: val.total,
    attended: val.attended,
    percentage: Math.round((val.attended / val.total) * 100),
  }));

  return {
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.fullName,
    courseName: student.course,
    batchCode: student.batchCode,
    batchName: student.batchName,
    totalClasses,
    presentClasses,
    absentClasses,
    lateClasses,
    excusedClasses,
    attendancePercentage,
    status: student.status,
    isLowAttendance: totalClasses > 0 && attendancePercentage < 75,
    monthlyBreakdown,
    history: studentRecords,
  };
}

/**
 * Get batch-wise attendance report
 */
export async function getBatchAttendanceReport(
  batchCode: string
): Promise<BatchAttendanceReport | null> {
  const batches = await readBatchesFromDisk();
  const batch = batches.find((b) => b.batchCode === batchCode || b.id === batchCode);
  if (!batch) return null;

  const store = await readAttendanceFromDisk();
  const students = await readStudentsFromDisk();

  const batchSessions = store.sessions.filter((s) => s.batchCode === batch.batchCode);
  const enrolledStudents = students.filter(
    (s) => s.batchCode === batch.batchCode || (batch.studentIds && batch.studentIds.includes(s.id))
  );

  const studentStats = enrolledStudents.map((stu) => {
    const studentRecords = store.records.filter(
      (r) =>
        (r.studentId === stu.id || r.studentCode === stu.studentCode) &&
        r.batchCode === batch.batchCode
    );

    const totalClasses = studentRecords.length;
    const presentClasses = studentRecords.filter((r) => r.status === "Present").length;
    const absentClasses = studentRecords.filter((r) => r.status === "Absent").length;
    const lateClasses = studentRecords.filter((r) => r.status === "Late").length;
    const excusedClasses = studentRecords.filter((r) => r.status === "Excused").length;

    const attended = presentClasses + lateClasses;
    const attendancePercentage =
      totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 100;

    return {
      studentId: stu.id,
      studentCode: stu.studentCode,
      studentName: stu.fullName,
      totalClasses,
      presentClasses,
      absentClasses,
      lateClasses,
      excusedClasses,
      attendancePercentage,
      isLowAttendance: totalClasses > 0 && attendancePercentage < 75,
    };
  });

  const totalPossible = studentStats.reduce((sum, s) => sum + s.attendancePercentage, 0);
  const avgAttendancePercentage =
    studentStats.length > 0 ? Math.round(totalPossible / studentStats.length) : 100;

  return {
    batchCode: batch.batchCode,
    batchName: batch.batchName,
    courseName: batch.courseName,
    trainer: batch.trainer,
    totalEnrolled: enrolledStudents.length,
    totalSessions: batchSessions.length,
    avgAttendancePercentage,
    students: studentStats,
  };
}
