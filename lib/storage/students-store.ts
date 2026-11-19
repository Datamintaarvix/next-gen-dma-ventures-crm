import fs from "fs/promises";
import path from "path";
import {
  StudentRecord,
  StudentFormData,
  StudentStatus,
  studentBatchList,
} from "@/lib/validations/student";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "students.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readStudentsFromDisk(): Promise<StudentRecord[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading students file:", error);
    return [];
  }
}

export async function writeStudentsToDisk(records: StudentRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function getStudents(): Promise<StudentRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getStudents error:", error);
      throw new Error(`Failed to fetch students from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      studentCode: row.student_code,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      email: row.email,
      dateOfBirth: row.date_of_birth,
      gender: row.gender as any,
      address: row.address,
      guardianName: row.guardian_name,
      guardianPhone: row.guardian_phone,
      guardianRelation: row.guardian_relation,
      course: row.course,
      batchCode: row.batch_code,
      batchName: row.batch_name,
      admissionDate: row.admission_date,
      joiningDate: row.joining_date,
      status: row.status as any,
      avatarColor: row.avatar_color || undefined,
      photoUrl: row.photo_url || undefined,
      totalFee: Number(row.total_fee),
      paidAmount: Number(row.paid_amount),
      pendingAmount: Number(row.pending_amount),
      paymentStatus: row.payment_status as any,
      attendancePercentage: Number(row.attendance_percentage),
      totalClasses: row.total_classes,
      attendedClasses: row.attended_classes,
      payments: (row.payments as any) || [],
      recentAttendance: (row.recent_attendance as any) || [],
      linkedLeadId: row.linked_lead_id,
      linkedLeadCode: row.linked_lead_code,
      linkedEnquiryId: row.linked_enquiry_id,
      linkedEnquiryCode: row.linked_enquiry_code,
      notes: row.notes || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return await readStudentsFromDisk();
}

export async function getStudentById(id: string): Promise<StudentRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("students")
      .select("*")
      .or(`id.eq.${id},student_code.ilike.${id}`)
      .maybeSingle();

    if (error) {
      console.error("Supabase getStudentById error:", error);
      throw new Error(`Failed to fetch student from Supabase: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      studentCode: data.student_code,
      fullName: data.full_name,
      phoneNumber: data.phone_number,
      email: data.email,
      dateOfBirth: data.date_of_birth,
      gender: data.gender as any,
      address: data.address,
      guardianName: data.guardian_name,
      guardianPhone: data.guardian_phone,
      guardianRelation: data.guardian_relation,
      course: data.course,
      batchCode: data.batch_code,
      batchName: data.batch_name,
      admissionDate: data.admission_date,
      joiningDate: data.joining_date,
      status: data.status as any,
      avatarColor: data.avatar_color || undefined,
      photoUrl: data.photo_url || undefined,
      totalFee: Number(data.total_fee),
      paidAmount: Number(data.paid_amount),
      pendingAmount: Number(data.pending_amount),
      paymentStatus: data.payment_status as any,
      attendancePercentage: Number(data.attendance_percentage),
      totalClasses: data.total_classes,
      attendedClasses: data.attended_classes,
      payments: (data.payments as any) || [],
      recentAttendance: (data.recent_attendance as any) || [],
      linkedLeadId: data.linked_lead_id,
      linkedLeadCode: data.linked_lead_code,
      linkedEnquiryId: data.linked_enquiry_id,
      linkedEnquiryCode: data.linked_enquiry_code,
      notes: data.notes || "",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const students = await readStudentsFromDisk();
  return (
    students.find((s) => s.id === id || s.studentCode.toLowerCase() === id.toLowerCase()) ||
    null
  );
}

// Clean phone for duplicate comparison
function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export async function checkDuplicateStudent(
  email: string,
  phoneNumber: string,
  excludeId?: string
): Promise<{ isDuplicate: boolean; reason?: string }> {
  const students = await getStudents();
  const cleanedInputPhone = cleanPhone(phoneNumber);
  const normalizedEmail = email.trim().toLowerCase();

  for (const s of students) {
    if (excludeId && (s.id === excludeId || s.studentCode === excludeId)) continue;

    if (s.email.trim().toLowerCase() === normalizedEmail) {
      return {
        isDuplicate: true,
        reason: `A student with email "${email}" already exists (${s.studentCode} - ${s.fullName})`,
      };
    }

    if (cleanPhone(s.phoneNumber) === cleanedInputPhone) {
      return {
        isDuplicate: true,
        reason: `A student with phone number "${phoneNumber}" already exists (${s.studentCode} - ${s.fullName})`,
      };
    }
  }

  return { isDuplicate: false };
}

const AVATAR_COLORS = [
  "#078783",
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#0D9488",
  "#D97706",
  "#4F46E5",
  "#0284C7",
];

export async function createStudent(input: StudentFormData): Promise<StudentRecord> {
  const dupCheck = await checkDuplicateStudent(input.email, input.phoneNumber);
  if (dupCheck.isDuplicate) {
    throw new Error(dupCheck.reason || "Student already exists");
  }

  const students = await readStudentsFromDisk();

  // Generate next student code STU-1001, STU-1002, etc.
  let nextNum = 1001;
  students.forEach((s) => {
    const match = s.studentCode?.match(/STU-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextNum) nextNum = num + 1;
    }
  });

  const studentCode = `STU-${nextNum}`;
  const batch = studentBatchList.find((b) => b.code === input.batchCode);
  const batchName = batch ? batch.name : input.batchCode;

  const totalFee = Number(input.totalFee) || 0;
  const paidAmount = Number(input.paidAmount) || 0;
  const pendingAmount = Math.max(0, totalFee - paidAmount);

  let paymentStatus: "Paid" | "Partial" | "Pending" = "Pending";
  if (paidAmount >= totalFee && totalFee > 0) {
    paymentStatus = "Paid";
  } else if (paidAmount > 0) {
    paymentStatus = "Partial";
  }

  const now = new Date().toISOString();
  const todayDateStr = now.split("T")[0];

  const payments = [];
  if (paidAmount > 0) {
    payments.push({
      id: `PAY-${Date.now().toString().slice(-4)}`,
      receiptNo: `REC-${todayDateStr.replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
      date: todayDateStr,
      amount: paidAmount,
      paymentMethod: "UPI" as const,
      remarks: "Initial admission fee payment",
    });
  }

  // Pick deterministic avatar color
  const colorIndex = (nextNum - 1001) % AVATAR_COLORS.length;
  const avatarColor = input.avatarColor || AVATAR_COLORS[colorIndex];

  const newStudent: StudentRecord = {
    ...input,
    id: Date.now().toString(),
    studentCode,
    batchName,
    avatarColor,
    totalFee,
    paidAmount,
    pendingAmount,
    paymentStatus,
    payments,
    attendancePercentage: 100,
    totalClasses: 0,
    attendedClasses: 0,
    recentAttendance: [],
    linkedLeadId: input.linkedLeadId || null,
    linkedLeadCode: input.linkedLeadCode || null,
    linkedEnquiryId: input.linkedEnquiryId || null,
    linkedEnquiryCode: input.linkedEnquiryCode || null,
    notes: input.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("students").insert({
      id: newStudent.id,
      student_code: newStudent.studentCode,
      full_name: newStudent.fullName,
      phone_number: newStudent.phoneNumber,
      email: newStudent.email,
      date_of_birth: newStudent.dateOfBirth,
      gender: newStudent.gender,
      address: newStudent.address,
      guardian_name: newStudent.guardianName,
      guardian_phone: newStudent.guardianPhone,
      guardian_relation: newStudent.guardianRelation,
      course: newStudent.course,
      batch_code: newStudent.batchCode,
      batch_name: newStudent.batchName,
      admission_date: newStudent.admissionDate,
      joining_date: newStudent.joiningDate,
      status: newStudent.status,
      avatar_color: newStudent.avatarColor || null,
      photo_url: newStudent.photoUrl || null,
      total_fee: newStudent.totalFee,
      paid_amount: newStudent.paidAmount,
      pending_amount: newStudent.pendingAmount,
      payment_status: newStudent.paymentStatus,
      attendance_percentage: newStudent.attendancePercentage,
      total_classes: newStudent.totalClasses,
      attended_classes: newStudent.attendedClasses,
      payments: newStudent.payments as any,
      recent_attendance: newStudent.recentAttendance as any,
      linked_lead_id: newStudent.linkedLeadId || null,
      linked_lead_code: newStudent.linkedLeadCode || null,
      linked_enquiry_id: newStudent.linkedEnquiryId || null,
      linked_enquiry_code: newStudent.linkedEnquiryCode || null,
      notes: newStudent.notes || null,
      created_at: newStudent.createdAt,
      updated_at: newStudent.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createStudent failed: ${error.message}`);
    }
    return newStudent;
  }

  students.unshift(newStudent);
  await writeStudentsToDisk(students);
  return newStudent;
}

export async function updateStudent(
  id: string,
  input: Partial<StudentFormData>
): Promise<StudentRecord | null> {
  if (isSupabaseServerConfigured()) {
    const current = await getStudentById(id);
    if (!current) return null;

    // If email or phone updated, check duplicates
    if (
      (input.email && input.email.trim().toLowerCase() !== current.email.trim().toLowerCase()) ||
      (input.phoneNumber && cleanPhone(input.phoneNumber) !== cleanPhone(current.phoneNumber))
    ) {
      const dupCheck = await checkDuplicateStudent(
        input.email || current.email,
        input.phoneNumber || current.phoneNumber,
        current.id
      );
      if (dupCheck.isDuplicate) {
        throw new Error(dupCheck.reason || "Student email or phone number already in use");
      }
    }

    let batchName = current.batchName;
    if (input.batchCode && input.batchCode !== current.batchCode) {
      const batch = studentBatchList.find((b) => b.code === input.batchCode);
      batchName = batch ? batch.name : input.batchCode;
    }

    const totalFee = input.totalFee !== undefined ? Number(input.totalFee) : current.totalFee;
    const paidAmount = input.paidAmount !== undefined ? Number(input.paidAmount) : current.paidAmount;
    const pendingAmount = Math.max(0, totalFee - paidAmount);

    let paymentStatus = current.paymentStatus;
    if (paidAmount >= totalFee && totalFee > 0) {
      paymentStatus = "Paid";
    } else if (paidAmount > 0) {
      paymentStatus = "Partial";
    } else {
      paymentStatus = "Pending";
    }

    const updated: StudentRecord = {
      ...current,
      ...input,
      batchName,
      totalFee,
      paidAmount,
      pendingAmount,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("students")
      .update({
        full_name: updated.fullName,
        phone_number: updated.phoneNumber,
        email: updated.email,
        date_of_birth: updated.dateOfBirth,
        gender: updated.gender,
        address: updated.address,
        guardian_name: updated.guardianName,
        guardian_phone: updated.guardianPhone,
        guardian_relation: updated.guardianRelation,
        course: updated.course,
        batch_code: updated.batchCode,
        batch_name: updated.batchName,
        total_fee: updated.totalFee,
        paid_amount: updated.paidAmount,
        pending_amount: updated.pendingAmount,
        payment_status: updated.paymentStatus,
        notes: updated.notes || null,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},student_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateStudent failed: ${error.message}`);
    }

    return updated;
  }

  const students = await readStudentsFromDisk();
  const index = students.findIndex((s) => s.id === id || s.studentCode === id);
  if (index === -1) return null;

  const current = students[index];

  // If email or phone updated, check duplicates
  if (
    (input.email && input.email.trim().toLowerCase() !== current.email.trim().toLowerCase()) ||
    (input.phoneNumber && cleanPhone(input.phoneNumber) !== cleanPhone(current.phoneNumber))
  ) {
    const dupCheck = await checkDuplicateStudent(
      input.email || current.email,
      input.phoneNumber || current.phoneNumber,
      current.id
    );
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.reason || "Student email or phone number already in use");
    }
  }

  let batchName = current.batchName;
  if (input.batchCode && input.batchCode !== current.batchCode) {
    const batch = studentBatchList.find((b) => b.code === input.batchCode);
    batchName = batch ? batch.name : input.batchCode;
  }

  const totalFee = input.totalFee !== undefined ? Number(input.totalFee) : current.totalFee;
  const paidAmount = input.paidAmount !== undefined ? Number(input.paidAmount) : current.paidAmount;
  const pendingAmount = Math.max(0, totalFee - paidAmount);

  let paymentStatus = current.paymentStatus;
  if (paidAmount >= totalFee && totalFee > 0) {
    paymentStatus = "Paid";
  } else if (paidAmount > 0) {
    paymentStatus = "Partial";
  } else {
    paymentStatus = "Pending";
  }

  const updated: StudentRecord = {
    ...current,
    ...input,
    batchName,
    totalFee,
    paidAmount,
    pendingAmount,
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  students[index] = updated;
  await writeStudentsToDisk(students);
  return updated;
}

export async function updateStudentStatus(
  id: string,
  status: StudentStatus,
  remarks?: string
): Promise<StudentRecord | null> {
  if (isSupabaseServerConfigured()) {
    const current = await getStudentById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    let notes = current.notes || "";
    if (remarks) {
      const timestamp = now.split("T")[0];
      notes = notes
        ? `${notes}\n[${timestamp}] Status changed to ${status}: ${remarks}`
        : `[${timestamp}] Status changed to ${status}: ${remarks}`;
    }

    const updated: StudentRecord = {
      ...current,
      status,
      notes,
      updatedAt: now,
    };

    const { error } = await supabaseAdmin
      .from("students")
      .update({
        status: updated.status,
        notes: updated.notes || null,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},student_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateStudentStatus failed: ${error.message}`);
    }

    return updated;
  }

  const students = await readStudentsFromDisk();
  const index = students.findIndex((s) => s.id === id || s.studentCode === id);
  if (index === -1) return null;

  const current = students[index];
  const now = new Date().toISOString();

  let notes = current.notes || "";
  if (remarks) {
    const timestamp = now.split("T")[0];
    notes = notes
      ? `${notes}\n[${timestamp}] Status changed to ${status}: ${remarks}`
      : `[${timestamp}] Status changed to ${status}: ${remarks}`;
  }

  const updated: StudentRecord = {
    ...current,
    status,
    notes,
    updatedAt: now,
  };

  students[index] = updated;
  await writeStudentsToDisk(students);
  return updated;
}

export async function deleteStudent(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("students")
      .delete()
      .or(`id.eq.${id},student_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase deleteStudent failed: ${error.message}`);
    }
    return true;
  }

  const students = await readStudentsFromDisk();
  const filtered = students.filter((s) => s.id !== id && s.studentCode !== id);
  if (filtered.length === students.length) return false;

  await writeStudentsToDisk(filtered);
  return true;
}

export async function getStudentStats(): Promise<{
  total: number;
  active: number;
  newlyAdmitted: number;
  completed: number;
  avgAttendance: number;
}> {
  const students = await getStudents();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const total = students.length;
  const active = students.filter((s) => s.status === "Active").length;
  const completed = students.filter((s) => s.status === "Completed").length;

  const newlyAdmitted = students.filter((s) => {
    try {
      const adm = new Date(s.admissionDate);
      return adm >= thirtyDaysAgo;
    } catch {
      return false;
    }
  }).length;

  const totalAtt = students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0);
  const avgAttendance = total > 0 ? Math.round(totalAtt / total) : 0;

  return {
    total,
    active,
    newlyAdmitted,
    completed,
    avgAttendance,
  };
}

export function generateStudentsCsv(students: StudentRecord[]): string {
  const headers = [
    "Student ID",
    "Full Name",
    "Phone Number",
    "Email",
    "Course",
    "Batch Code",
    "Batch Name",
    "Admission Date",
    "Joining Date",
    "Status",
    "Attendance %",
    "Total Fee (INR)",
    "Paid Amount (INR)",
    "Pending Amount (INR)",
    "Payment Status",
    "Guardian Name",
    "Guardian Phone",
    "Guardian Relation",
    "Gender",
    "Address",
    "Linked Lead",
    "Linked Enquiry",
    "Notes",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = students.map((s) => [
    escapeCsv(s.studentCode),
    escapeCsv(s.fullName),
    escapeCsv(s.phoneNumber),
    escapeCsv(s.email),
    escapeCsv(s.course),
    escapeCsv(s.batchCode),
    escapeCsv(s.batchName),
    escapeCsv(s.admissionDate),
    escapeCsv(s.joiningDate),
    escapeCsv(s.status),
    escapeCsv(s.attendancePercentage),
    escapeCsv(s.totalFee),
    escapeCsv(s.paidAmount),
    escapeCsv(s.pendingAmount),
    escapeCsv(s.paymentStatus),
    escapeCsv(s.guardianName),
    escapeCsv(s.guardianPhone),
    escapeCsv(s.guardianRelation),
    escapeCsv(s.gender),
    escapeCsv(s.address),
    escapeCsv(s.linkedLeadCode || ""),
    escapeCsv(s.linkedEnquiryCode || ""),
    escapeCsv(s.notes || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
