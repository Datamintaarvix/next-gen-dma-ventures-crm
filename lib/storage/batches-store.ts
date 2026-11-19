import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  BatchRecord,
  BatchFormData,
  BatchStatus,
} from "@/lib/validations/batch";
import { getStudents, updateStudent } from "./students-store";
import { StudentRecord } from "@/lib/validations/student";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "batches.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readBatchesFromDisk(): Promise<BatchRecord[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading batches file:", error);
    return [];
  }
}

export async function writeBatchesToDisk(records: BatchRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function getBatches(): Promise<BatchRecord[]> {
  let batches: BatchRecord[] = [];
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("batches")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Supabase getBatches error:", error);
      throw new Error(`Failed to fetch batches from Supabase: ${error.message}`);
    }

    batches = (data || []).map((row) => ({
      id: row.id,
      batchCode: row.batch_code,
      batchName: row.batch_name,
      courseName: row.course_name,
      trainer: row.trainer,
      startDate: row.start_date,
      endDate: row.end_date,
      classDays: row.class_days,
      classTimings: row.class_timings,
      maxCapacity: row.max_capacity,
      enrolledCount: row.enrolled_count,
      availableSeats: row.available_seats,
      status: row.status as any,
      classroom: row.classroom || "Lab 1",
      description: row.description || undefined,
      studentIds: (row.student_ids as any) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } else if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    batches = [];
  } else {
    batches = await readBatchesFromDisk();
  }

  const students = await getStudents();

  // Dynamically enrich batches with actual enrolled count and live student IDs from students.json
  return batches.map((batch) => {
    const matchingStudents = students.filter(
      (s) =>
        s.batchCode?.toLowerCase() === batch.batchCode.toLowerCase() ||
        (batch.studentIds && batch.studentIds.includes(s.id))
    );

    const enrolledCount = matchingStudents.length;
    const availableSeats = Math.max(0, batch.maxCapacity - enrolledCount);
    const studentIds = matchingStudents.map((s) => s.id);

    return {
      ...batch,
      enrolledCount,
      availableSeats,
      studentIds,
    };
  });
}

export async function getBatchById(id: string): Promise<{
  batch: BatchRecord | null;
  enrolledStudents: StudentRecord[];
}> {
  const batches = await getBatches();
  const batch =
    batches.find(
      (b) => b.id === id || b.batchCode.toLowerCase() === id.toLowerCase()
    ) || null;

  if (!batch) {
    return { batch: null, enrolledStudents: [] };
  }

  const allStudents = await getStudents();
  const enrolledStudents = allStudents.filter(
    (s) =>
      s.batchCode?.toLowerCase() === batch.batchCode.toLowerCase() ||
      (batch.studentIds && batch.studentIds.includes(s.id))
  );

  return { batch, enrolledStudents };
}

export async function createBatch(input: BatchFormData): Promise<BatchRecord> {
  const batches = await readBatchesFromDisk();

  // Check duplicate batch name
  const existing = batches.find(
    (b) => b.batchName.toLowerCase().trim() === input.batchName.toLowerCase().trim()
  );
  if (existing) {
    throw new Error(`A batch named "${input.batchName}" already exists (${existing.batchCode})`);
  }

  // Generate batch code BCH-1001 or course-prefix based
  let nextNum = 1001;
  batches.forEach((b) => {
    const match = b.batchCode?.match(/BCH-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextNum) nextNum = num + 1;
    }
  });

  const batchCode = `BCH-${nextNum}`;
  const now = new Date().toISOString();

  const newBatch: BatchRecord = {
    ...input,
    id: Date.now().toString(),
    batchCode,
    enrolledCount: 0,
    availableSeats: input.maxCapacity,
    studentIds: [],
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("batches").insert({
      id: newBatch.id,
      batch_code: newBatch.batchCode,
      batch_name: newBatch.batchName,
      course_name: newBatch.courseName,
      trainer: newBatch.trainer,
      start_date: newBatch.startDate,
      end_date: newBatch.endDate,
      class_days: newBatch.classDays,
      class_timings: newBatch.classTimings,
      max_capacity: newBatch.maxCapacity,
      enrolled_count: newBatch.enrolledCount,
      available_seats: newBatch.availableSeats,
      status: newBatch.status,
      classroom: newBatch.classroom,
      description: newBatch.description || null,
      student_ids: newBatch.studentIds as any,
      created_at: newBatch.createdAt,
      updated_at: newBatch.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createBatch failed: ${error.message}`);
    }
    return newBatch;
  }

  batches.unshift(newBatch);
  await writeBatchesToDisk(batches);
  return newBatch;
}

export async function updateBatch(
  id: string,
  input: Partial<BatchFormData>
): Promise<BatchRecord | null> {
  const batches = await readBatchesFromDisk();
  const index = batches.findIndex((b) => b.id === id || b.batchCode === id);
  if (index === -1) return null;

  const current = batches[index];

  // If renaming, check duplicates
  if (
    input.batchName &&
    input.batchName.toLowerCase().trim() !== current.batchName.toLowerCase().trim()
  ) {
    const duplicate = batches.find(
      (b) =>
        b.id !== current.id &&
        b.batchName.toLowerCase().trim() === input.batchName!.toLowerCase().trim()
    );
    if (duplicate) {
      throw new Error(`Another batch named "${input.batchName}" already exists`);
    }
  }

  const updated: BatchRecord = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("batches")
      .update({
        batch_name: updated.batchName,
        course_name: updated.courseName,
        trainer: updated.trainer,
        start_date: updated.startDate,
        end_date: updated.endDate,
        class_days: updated.classDays,
        class_timings: updated.classTimings,
        max_capacity: updated.maxCapacity,
        classroom: updated.classroom,
        description: updated.description || null,
        status: updated.status,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},batch_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateBatch failed: ${error.message}`);
    }
    return updated;
  }

  batches[index] = updated;
  await writeBatchesToDisk(batches);
  return updated;
}

export async function updateBatchStatus(
  id: string,
  status: BatchStatus
): Promise<BatchRecord | null> {
  const batches = await readBatchesFromDisk();
  const index = batches.findIndex((b) => b.id === id || b.batchCode === id);
  if (index === -1) return null;

  batches[index].status = status;
  batches[index].updatedAt = new Date().toISOString();

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("batches")
      .update({
        status,
        updated_at: batches[index].updatedAt,
      })
      .or(`id.eq.${id},batch_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateBatchStatus failed: ${error.message}`);
    }
    return batches[index];
  }

  await writeBatchesToDisk(batches);
  return batches[index];
}

export async function deleteBatch(
  id: string,
  force: boolean = false
): Promise<{ success: boolean; message?: string; blockedByStudents?: number }> {
  const batches = await readBatchesFromDisk();
  const index = batches.findIndex((b) => b.id === id || b.batchCode === id);
  if (index === -1) {
    return { success: false, message: "Batch not found" };
  }

  const targetBatch = batches[index];

  // Check active enrolled students in this batch
  const students = await getStudents();
  const activeEnrolled = students.filter(
    (s) =>
      (s.batchCode?.toLowerCase() === targetBatch.batchCode.toLowerCase() ||
        (targetBatch.studentIds && targetBatch.studentIds.includes(s.id))) &&
      s.status === "Active"
  );

  if (activeEnrolled.length > 0 && !force) {
    return {
      success: false,
      blockedByStudents: activeEnrolled.length,
      message: `Cannot delete batch "${targetBatch.batchName}": ${activeEnrolled.length} active student(s) are currently enrolled. Transfer students to another batch or cancel the batch first.`,
    };
  }

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("batches")
      .delete()
      .or(`id.eq.${targetBatch.id},batch_code.eq.${targetBatch.batchCode}`);
    if (error) {
      throw new Error(`Supabase deleteBatch failed: ${error.message}`);
    }
    return { success: true, message: `Batch "${targetBatch.batchName}" deleted successfully.` };
  }

  const filtered = batches.filter((b) => b.id !== targetBatch.id);
  await writeBatchesToDisk(filtered);
  return { success: true, message: `Batch "${targetBatch.batchName}" deleted successfully.` };
}

// Student Assignment to Batch
export async function assignStudentToBatch(
  batchId: string,
  studentId: string,
  remarks?: string
): Promise<{ batch: BatchRecord; student: StudentRecord }> {
  const batches = await readBatchesFromDisk();
  const batchIndex = batches.findIndex((b) => b.id === batchId || b.batchCode === batchId);
  if (batchIndex === -1) throw new Error("Batch not found");

  const batch = batches[batchIndex];

  if (batch.status === "Cancelled" || batch.status === "Completed") {
    throw new Error(`Cannot assign student to a ${batch.status} batch`);
  }

  // Get student
  const students = await getStudents();
  const student = students.find((s) => s.id === studentId || s.studentCode === studentId);
  if (!student) throw new Error("Student not found");

  // Check duplicate enrollment in this batch
  const isAlreadyEnrolled =
    student.batchCode?.toLowerCase() === batch.batchCode.toLowerCase() ||
    (batch.studentIds && batch.studentIds.includes(student.id));

  if (isAlreadyEnrolled) {
    throw new Error(`Student ${student.fullName} (${student.studentCode}) is already enrolled in this batch`);
  }

  // Check capacity constraint
  const currentlyEnrolledCount = students.filter(
    (s) => s.batchCode?.toLowerCase() === batch.batchCode.toLowerCase()
  ).length;

  if (currentlyEnrolledCount >= batch.maxCapacity) {
    throw new Error(
      `Batch "${batch.batchName}" has reached maximum capacity (${currentlyEnrolledCount}/${batch.maxCapacity} seats filled). Cannot enroll more students.`
    );
  }

  // Update student record with new batch code and batch name
  const updatedStudent = await updateStudent(student.id, {
    batchCode: batch.batchCode,
    notes: remarks
      ? `${student.notes || ""}\n[Assigned to ${batch.batchName} (${batch.batchCode}): ${remarks}]`
      : student.notes,
  });

  if (!updatedStudent) throw new Error("Failed to update student enrollment");

  // Update batch studentIds
  const currentIds = batch.studentIds || [];
  if (!currentIds.includes(student.id)) {
    currentIds.push(student.id);
    batch.studentIds = currentIds;
    batch.updatedAt = new Date().toISOString();

    if (isSupabaseServerConfigured()) {
      await supabaseAdmin
        .from("batches")
        .update({
          student_ids: currentIds as any,
          updated_at: batch.updatedAt,
        })
        .or(`id.eq.${batch.id},batch_code.eq.${batch.batchCode}`);
    }

    batches[batchIndex] = batch;
    await writeBatchesToDisk(batches);
  }

  return { batch, student: updatedStudent };
}

// Transfer Student Between Batches
export async function transferStudentBatch(
  studentId: string,
  toBatchId: string,
  remarks?: string
): Promise<{ fromBatchCode: string; toBatch: BatchRecord; student: StudentRecord }> {
  const students = await getStudents();
  const student = students.find((s) => s.id === studentId || s.studentCode === studentId);
  if (!student) throw new Error("Student not found");

  const fromBatchCode = student.batchCode;

  // Assign to destination batch (will check capacity and update student)
  const result = await assignStudentToBatch(toBatchId, studentId, remarks);

  // Remove from old batch studentIds list
  const batches = await readBatchesFromDisk();
  const oldBatchIndex = batches.findIndex(
    (b) => b.batchCode.toLowerCase() === fromBatchCode?.toLowerCase()
  );
  if (oldBatchIndex !== -1) {
    const updatedIds = (batches[oldBatchIndex].studentIds || []).filter(
      (id) => id !== student.id
    );
    batches[oldBatchIndex].studentIds = updatedIds;
    batches[oldBatchIndex].updatedAt = new Date().toISOString();

    if (isSupabaseServerConfigured()) {
      await supabaseAdmin
        .from("batches")
        .update({
          student_ids: updatedIds as any,
          updated_at: batches[oldBatchIndex].updatedAt,
        })
        .or(`id.eq.${batches[oldBatchIndex].id},batch_code.eq.${batches[oldBatchIndex].batchCode}`);
    }

    await writeBatchesToDisk(batches);
  }

  return {
    fromBatchCode,
    toBatch: result.batch,
    student: result.student,
  };
}

// Remove Student From Batch
export async function removeStudentFromBatch(
  batchId: string,
  studentId: string
): Promise<boolean> {
  const batches = await readBatchesFromDisk();
  const batchIndex = batches.findIndex((b) => b.id === batchId || b.batchCode === batchId);
  if (batchIndex === -1) return false;

  const batch = batches[batchIndex];
  const updatedIds = (batch.studentIds || []).filter((id) => id !== studentId);
  batch.studentIds = updatedIds;
  batch.updatedAt = new Date().toISOString();

  if (isSupabaseServerConfigured()) {
    await supabaseAdmin
      .from("batches")
      .update({
        student_ids: updatedIds as any,
        updated_at: batch.updatedAt,
      })
      .or(`id.eq.${batch.id},batch_code.eq.${batch.batchCode}`);
  }

  await writeBatchesToDisk(batches);

  // Unlink batch on student record
  await updateStudent(studentId, {
    batchCode: "Unassigned",
  });

  return true;
}

export async function getBatchStats(): Promise<{
  totalBatches: number;
  activeBatches: number;
  upcomingBatches: number;
  completedBatches: number;
  totalAvailableSeats: number;
  totalEnrolledStudents: number;
}> {
  const batches = await getBatches();
  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === "Active").length;
  const upcomingBatches = batches.filter((b) => b.status === "Upcoming").length;
  const completedBatches = batches.filter((b) => b.status === "Completed").length;

  let totalAvailableSeats = 0;
  let totalEnrolledStudents = 0;

  batches.forEach((b) => {
    totalEnrolledStudents += b.enrolledCount || 0;
    if (b.status === "Active" || b.status === "Upcoming") {
      totalAvailableSeats += b.availableSeats || 0;
    }
  });

  return {
    totalBatches,
    activeBatches,
    upcomingBatches,
    completedBatches,
    totalAvailableSeats,
    totalEnrolledStudents,
  };
}
