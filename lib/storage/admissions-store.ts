import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  AdmissionRecord,
  AdmissionFormData,
  AdmissionStatus,
  AdmissionPaymentItem,
  defaultDocumentsList,
} from "@/lib/validations/admission";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
} from "./students-store";
import { getBatches, assignStudentToBatch } from "./batches-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admissions.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function readAdmissionsFromDisk(): Promise<AdmissionRecord[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading admissions file:", error);
    return [];
  }
}

export async function writeAdmissionsToDisk(records: AdmissionRecord[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function getAdmissions(): Promise<AdmissionRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("admissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getAdmissions error:", error);
      throw new Error(`Failed to fetch admissions from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      admissionCode: row.admission_code,
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name,
      studentPhone: row.student_phone,
      studentEmail: row.student_email,
      studentGender: row.student_gender || undefined,
      courseName: row.course_name,
      courseCode: row.course_code || undefined,
      batchCode: row.batch_code,
      batchName: row.batch_name,
      admissionDate: row.admission_date,
      counsellor: row.counsellor,
      totalFee: Number(row.total_fee),
      discountAmount: Number(row.discount_amount),
      discountReason: row.discount_reason || undefined,
      finalFee: Number(row.final_fee),
      paidAmount: Number(row.paid_amount),
      pendingAmount: Number(row.pending_amount),
      paymentStatus: row.payment_status as any,
      status: row.status as any,
      paymentMethod: row.payment_method,
      notes: row.notes || undefined,
      documents: (row.documents as any) || [],
      timeline: (row.timeline as any) || [],
      paymentHistory: (row.payment_history as any) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return await readAdmissionsFromDisk();
}

export async function getAdmissionById(id: string): Promise<AdmissionRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("admissions")
      .select("*")
      .or(`id.eq.${id},admission_code.ilike.${id}`)
      .maybeSingle();

    if (error) {
      console.error("Supabase getAdmissionById error:", error);
      throw new Error(`Failed to fetch admission from Supabase: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      admissionCode: data.admission_code,
      studentId: data.student_id,
      studentCode: data.student_code,
      studentName: data.student_name,
      studentPhone: data.student_phone,
      studentEmail: data.student_email,
      studentGender: data.student_gender || undefined,
      courseName: data.course_name,
      courseCode: data.course_code || undefined,
      batchCode: data.batch_code,
      batchName: data.batch_name,
      admissionDate: data.admission_date,
      counsellor: data.counsellor,
      totalFee: Number(data.total_fee),
      discountAmount: Number(data.discount_amount),
      discountReason: data.discount_reason || undefined,
      finalFee: Number(data.final_fee),
      paidAmount: Number(data.paid_amount),
      pendingAmount: Number(data.pending_amount),
      paymentStatus: data.payment_status as any,
      status: data.status as any,
      paymentMethod: data.payment_method,
      notes: data.notes || undefined,
      documents: (data.documents as any) || [],
      timeline: (data.timeline as any) || [],
      paymentHistory: (data.payment_history as any) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const admissions = await readAdmissionsFromDisk();
  return (
    admissions.find(
      (a) => a.id === id || a.admissionCode.toLowerCase() === id.toLowerCase()
    ) || null
  );
}

// Generate Next Admission Code (e.g. AD-401, AD-402, ...)
export async function getNextAdmissionCode(): Promise<string> {
  const admissions = await getAdmissions();
  let maxNum = 400;

  admissions.forEach((a) => {
    const match = a.admissionCode?.match(/AD-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return `AD-${maxNum + 1}`;
}

// Check Duplicate Admission
export async function checkDuplicateAdmission(
  studentId: string,
  courseName: string,
  excludeId?: string
): Promise<{ isDuplicate: boolean; existingRecord?: AdmissionRecord }> {
  const admissions = await getAdmissions();
  const existing = admissions.find((a) => {
    if (excludeId && a.id === excludeId) return false;
    // If student matches, and course matches, and not Cancelled/Rejected
    const sameStudent = a.studentId === studentId;
    const sameCourse = a.courseName.toLowerCase().trim() === courseName.toLowerCase().trim();
    const isActiveStatus = !["Cancelled", "Rejected"].includes(a.status);
    return sameStudent && sameCourse && isActiveStatus;
  });

  if (existing) {
    return { isDuplicate: true, existingRecord: existing };
  }
  return { isDuplicate: false };
}

// Create Admission
export async function createAdmission(input: AdmissionFormData): Promise<AdmissionRecord> {
  const admissions = await readAdmissionsFromDisk();
  let studentId = input.studentId;
  let studentName = "";
  let studentCode = "";
  let studentEmail = "";
  let studentPhone = "";
  let studentGender = "Male";

  // 1. Resolve or Create Student
  if (input.studentMode === "new") {
    if (!input.newStudent) {
      throw new Error("New student registration details are required");
    }

    // Create the student in Student Management store
    const createdStudent = await createStudent({
      fullName: input.newStudent.fullName,
      phoneNumber: input.newStudent.phoneNumber,
      email: input.newStudent.email,
      dateOfBirth: input.newStudent.dateOfBirth || "2002-01-01",
      gender: input.newStudent.gender || "Male",
      address: input.newStudent.address || "Bengaluru, Karnataka",
      guardianName: input.newStudent.guardianName || "Guardian",
      guardianPhone: input.newStudent.guardianPhone || input.newStudent.phoneNumber,
      guardianRelation: "Guardian",
      course: input.courseName,
      batchCode: input.batchCode,
      admissionDate: input.admissionDate,
      joiningDate: input.admissionDate,
      status: input.status === "Enrolled" || input.status === "Approved" ? "Active" : "Inactive",
      totalFee: input.finalFee,
      paidAmount: input.initialPayment || 0,
      notes: input.notes || "Registered via Admissions module",
    });

    studentId = createdStudent.id;
    studentCode = createdStudent.studentCode;
    studentName = createdStudent.fullName;
    studentEmail = createdStudent.email;
    studentPhone = createdStudent.phoneNumber;
    studentGender = createdStudent.gender;
  } else {
    if (!studentId) {
      throw new Error("Please select an existing student");
    }

    const student = await getStudentById(studentId);
    if (!student) {
      throw new Error("Selected student not found");
    }

    studentCode = student.studentCode;
    studentName = student.fullName;
    studentEmail = student.email;
    studentPhone = student.phoneNumber;
    studentGender = student.gender || "Male";
  }

  // 2. Duplicate Check
  const dupCheck = await checkDuplicateAdmission(studentId, input.courseName);
  if (dupCheck.isDuplicate) {
    throw new Error(
      `An active admission application (${dupCheck.existingRecord?.admissionCode}) already exists for ${studentName} in "${input.courseName}".`
    );
  }

  // 3. Financial calculations
  const totalFee = Number(input.totalFee) || 0;
  const discountAmount = Number(input.discountAmount) || 0;
  const finalFee = Math.max(0, totalFee - discountAmount);
  const paidAmount = Number(input.initialPayment) || 0;
  const pendingAmount = Math.max(0, finalFee - paidAmount);

  const paymentStatus =
    pendingAmount === 0 && finalFee > 0
      ? "Paid"
      : paidAmount > 0
      ? "Partial"
      : "Pending";

  // 4. Generate Code & Timeline
  const admissionCode = await getNextAdmissionCode();
  const now = new Date().toISOString();

  const initialTimeline = [
    {
      id: `tl-${Date.now()}-1`,
      date: now,
      status: input.status,
      title: "Application Received",
      description: `Admission application submitted for ${input.courseName} (${input.batchCode}). Assigned counsellor: ${input.counsellor}.`,
      performedBy: input.counsellor || "Admin",
    },
  ];

  const paymentHistory: AdmissionPaymentItem[] = [];
  if (paidAmount > 0) {
    paymentHistory.push({
      id: `PAY-${admissionCode}-1`,
      receiptNo: `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: input.admissionDate,
      amount: paidAmount,
      paymentMethod: input.paymentMethod,
      transactionRef: input.transactionRef || undefined,
      remarks: "Initial admission payment",
    });
  }

  // Documents checklist
  const documents =
    input.documents && input.documents.length > 0
      ? input.documents
      : defaultDocumentsList;

  const newAdmission: AdmissionRecord = {
    id: Date.now().toString(),
    admissionCode,
    studentId,
    studentCode,
    studentName,
    studentPhone,
    studentEmail,
    studentGender,
    courseName: input.courseName,
    courseCode: input.courseCode || "CRS-GEN",
    batchCode: input.batchCode,
    batchName: input.batchName || input.batchCode,
    admissionDate: input.admissionDate,
    counsellor: input.counsellor,
    totalFee,
    discountAmount,
    discountReason: input.discountReason || null,
    finalFee,
    paidAmount,
    pendingAmount,
    paymentStatus,
    status: input.status,
    paymentMethod: input.paymentMethod,
    notes: input.notes || null,
    documents,
    timeline: initialTimeline,
    paymentHistory,
    createdAt: now,
    updatedAt: now,
  };

  // 5. If initial status is Approved or Enrolled, update student & batch
  if (input.status === "Approved" || input.status === "Enrolled") {
    await syncAdmissionWithStudentAndBatch(newAdmission);
  }

  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin.from("admissions").insert({
      id: newAdmission.id,
      admission_code: newAdmission.admissionCode,
      student_id: newAdmission.studentId,
      student_code: newAdmission.studentCode,
      student_name: newAdmission.studentName,
      student_phone: newAdmission.studentPhone,
      student_email: newAdmission.studentEmail,
      student_gender: newAdmission.studentGender || null,
      course_name: newAdmission.courseName,
      course_code: newAdmission.courseCode || null,
      batch_code: newAdmission.batchCode,
      batch_name: newAdmission.batchName,
      admission_date: newAdmission.admissionDate,
      counsellor: newAdmission.counsellor,
      total_fee: newAdmission.totalFee,
      discount_amount: newAdmission.discountAmount,
      discount_reason: newAdmission.discountReason || null,
      final_fee: newAdmission.finalFee,
      paid_amount: newAdmission.paidAmount,
      pending_amount: newAdmission.pendingAmount,
      payment_status: newAdmission.paymentStatus,
      status: newAdmission.status,
      payment_method: newAdmission.paymentMethod,
      notes: newAdmission.notes || null,
      documents: newAdmission.documents as any,
      timeline: newAdmission.timeline as any,
      payment_history: newAdmission.paymentHistory as any,
      created_at: newAdmission.createdAt,
      updated_at: newAdmission.updatedAt,
    });
    if (error) {
      throw new Error(`Supabase createAdmission failed: ${error.message}`);
    }
    return newAdmission;
  }

  admissions.unshift(newAdmission);
  await writeAdmissionsToDisk(admissions);
  return newAdmission;
}

// Update Admission
export async function updateAdmission(
  id: string,
  input: Partial<AdmissionFormData>
): Promise<AdmissionRecord | null> {
  if (isSupabaseServerConfigured()) {
    const current = await getAdmissionById(id);
    if (!current) return null;

    // Financial recalculation
    const totalFee = input.totalFee !== undefined ? Number(input.totalFee) : current.totalFee;
    const discountAmount =
      input.discountAmount !== undefined ? Number(input.discountAmount) : current.discountAmount;
    const finalFee = Math.max(0, totalFee - discountAmount);
    const paidAmount = current.paidAmount;
    const pendingAmount = Math.max(0, finalFee - paidAmount);

    const paymentStatus =
      pendingAmount === 0 && finalFee > 0
        ? "Paid"
        : paidAmount > 0
        ? "Partial"
        : "Pending";

    const updated: AdmissionRecord = {
      ...current,
      courseName: input.courseName || current.courseName,
      courseCode: input.courseCode || current.courseCode,
      batchCode: input.batchCode || current.batchCode,
      batchName: input.batchName || current.batchName,
      admissionDate: input.admissionDate || current.admissionDate,
      counsellor: input.counsellor || current.counsellor,
      totalFee,
      discountAmount,
      discountReason: input.discountReason !== undefined ? input.discountReason : current.discountReason,
      finalFee,
      paidAmount,
      pendingAmount,
      paymentStatus,
      paymentMethod: input.paymentMethod || current.paymentMethod,
      notes: input.notes !== undefined ? input.notes : current.notes,
      documents: input.documents || current.documents,
      status: input.status || current.status,
      updatedAt: new Date().toISOString(),
    };

    // If status changed to Approved/Enrolled or batch changed, sync
    if (
      (input.status === "Approved" || input.status === "Enrolled") &&
      current.status !== input.status
    ) {
      await syncAdmissionWithStudentAndBatch(updated);
    }

    const { error } = await supabaseAdmin
      .from("admissions")
      .update({
        course_name: updated.courseName,
        course_code: updated.courseCode || null,
        batch_code: updated.batchCode,
        batch_name: updated.batchName,
        admission_date: updated.admissionDate,
        counsellor: updated.counsellor,
        total_fee: updated.totalFee,
        discount_amount: updated.discountAmount,
        discount_reason: updated.discountReason || null,
        final_fee: updated.finalFee,
        paid_amount: updated.paidAmount,
        pending_amount: updated.pendingAmount,
        payment_status: updated.paymentStatus,
        payment_method: updated.paymentMethod,
        notes: updated.notes || null,
        documents: updated.documents as any,
        status: updated.status,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},admission_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateAdmission failed: ${error.message}`);
    }

    return updated;
  }

  const admissions = await readAdmissionsFromDisk();
  const index = admissions.findIndex((a) => a.id === id || a.admissionCode === id);
  if (index === -1) return null;

  const current = admissions[index];

  // Financial recalculation
  const totalFee = input.totalFee !== undefined ? Number(input.totalFee) : current.totalFee;
  const discountAmount =
    input.discountAmount !== undefined ? Number(input.discountAmount) : current.discountAmount;
  const finalFee = Math.max(0, totalFee - discountAmount);
  const paidAmount = current.paidAmount;
  const pendingAmount = Math.max(0, finalFee - paidAmount);

  const paymentStatus =
    pendingAmount === 0 && finalFee > 0
      ? "Paid"
      : paidAmount > 0
      ? "Partial"
      : "Pending";

  const updated: AdmissionRecord = {
    ...current,
    courseName: input.courseName || current.courseName,
    courseCode: input.courseCode || current.courseCode,
    batchCode: input.batchCode || current.batchCode,
    batchName: input.batchName || current.batchName,
    admissionDate: input.admissionDate || current.admissionDate,
    counsellor: input.counsellor || current.counsellor,
    totalFee,
    discountAmount,
    discountReason: input.discountReason !== undefined ? input.discountReason : current.discountReason,
    finalFee,
    paidAmount,
    pendingAmount,
    paymentStatus,
    paymentMethod: input.paymentMethod || current.paymentMethod,
    notes: input.notes !== undefined ? input.notes : current.notes,
    documents: input.documents || current.documents,
    status: input.status || current.status,
    updatedAt: new Date().toISOString(),
  };

  // If status changed to Approved/Enrolled or batch changed, sync
  if (
    (input.status === "Approved" || input.status === "Enrolled") &&
    current.status !== input.status
  ) {
    await syncAdmissionWithStudentAndBatch(updated);
  }

  admissions[index] = updated;
  await writeAdmissionsToDisk(admissions);
  return updated;
}

// Quick Workflow Status Update
export async function updateAdmissionStatus(
  id: string,
  newStatus: AdmissionStatus,
  remarks?: string,
  staffName: string = "Admin"
): Promise<AdmissionRecord | null> {
  if (isSupabaseServerConfigured()) {
    const current = await getAdmissionById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const timelineItem = {
      id: `tl-${Date.now()}`,
      date: now,
      status: newStatus,
      title: `Status Changed to ${newStatus}`,
      description: remarks || `Admission workflow progressed from "${current.status}" to "${newStatus}".`,
      performedBy: staffName,
    };

    const updated: AdmissionRecord = {
      ...current,
      status: newStatus,
      timeline: [timelineItem, ...(current.timeline || [])],
      updatedAt: now,
    };

    if (newStatus === "Approved" || newStatus === "Enrolled") {
      await syncAdmissionWithStudentAndBatch(updated);
    }

    const { error } = await supabaseAdmin
      .from("admissions")
      .update({
        status: updated.status,
        timeline: updated.timeline as any,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},admission_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase updateAdmissionStatus failed: ${error.message}`);
    }

    return updated;
  }

  const admissions = await readAdmissionsFromDisk();
  const index = admissions.findIndex((a) => a.id === id || a.admissionCode === id);
  if (index === -1) return null;

  const current = admissions[index];
  const now = new Date().toISOString();

  // Create timeline activity
  const timelineItem = {
    id: `tl-${Date.now()}`,
    date: now,
    status: newStatus,
    title: `Status Changed to ${newStatus}`,
    description: remarks || `Admission workflow progressed from "${current.status}" to "${newStatus}".`,
    performedBy: staffName,
  };

  const updated: AdmissionRecord = {
    ...current,
    status: newStatus,
    timeline: [timelineItem, ...(current.timeline || [])],
    updatedAt: now,
  };

  // Sync if status is Approved or Enrolled
  if (newStatus === "Approved" || newStatus === "Enrolled") {
    await syncAdmissionWithStudentAndBatch(updated);
  }

  admissions[index] = updated;
  await writeAdmissionsToDisk(admissions);
  return updated;
}

// Record Additional Payment
export async function recordAdmissionPayment(
  id: string,
  payment: {
    amount: number;
    paymentMethod: string;
    receiptNo?: string;
    transactionRef?: string;
    remarks?: string;
    date: string;
  }
): Promise<AdmissionRecord | null> {
  if (isSupabaseServerConfigured()) {
    const current = await getAdmissionById(id);
    if (!current) return null;

    const newPaidAmount = current.paidAmount + payment.amount;
    const newPendingAmount = Math.max(0, current.finalFee - newPaidAmount);

    const paymentStatus =
      newPendingAmount === 0 && current.finalFee > 0
        ? "Paid"
        : newPaidAmount > 0
        ? "Partial"
        : "Pending";

    const receiptNo =
      payment.receiptNo ||
      `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const paymentItem: AdmissionPaymentItem = {
      id: `PAY-${current.admissionCode}-${(current.paymentHistory?.length || 0) + 1}`,
      receiptNo,
      date: payment.date,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef || undefined,
      remarks: payment.remarks || undefined,
    };

    const timelineItem = {
      id: `tl-${Date.now()}`,
      date: new Date().toISOString(),
      status: current.status,
      title: "Payment Received",
      description: `Payment of ₹${payment.amount.toLocaleString("en-IN")} received via ${payment.paymentMethod}. Receipt #${receiptNo}.`,
      performedBy: "Accounts Staff",
    };

    const updated: AdmissionRecord = {
      ...current,
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      paymentStatus,
      paymentHistory: [...(current.paymentHistory || []), paymentItem],
      timeline: [timelineItem, ...(current.timeline || [])],
      updatedAt: new Date().toISOString(),
    };

    try {
      const student = await getStudentById(current.studentId);
      if (student) {
        await updateStudent(student.id, {
          paidAmount: newPaidAmount,
        });
      }
    } catch (err) {
      console.warn("Could not sync payment with student store:", err);
    }

    const { error } = await supabaseAdmin
      .from("admissions")
      .update({
        paid_amount: updated.paidAmount,
        pending_amount: updated.pendingAmount,
        payment_status: updated.paymentStatus,
        payment_history: updated.paymentHistory as any,
        timeline: updated.timeline as any,
        updated_at: updated.updatedAt,
      })
      .or(`id.eq.${id},admission_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase recordAdmissionPayment failed: ${error.message}`);
    }

    return updated;
  }

  const admissions = await readAdmissionsFromDisk();
  const index = admissions.findIndex((a) => a.id === id || a.admissionCode === id);
  if (index === -1) return null;

  const current = admissions[index];
  const newPaidAmount = current.paidAmount + payment.amount;
  const newPendingAmount = Math.max(0, current.finalFee - newPaidAmount);

  const paymentStatus =
    newPendingAmount === 0 && current.finalFee > 0
      ? "Paid"
      : newPaidAmount > 0
      ? "Partial"
      : "Pending";

  const receiptNo =
    payment.receiptNo ||
    `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const paymentItem: AdmissionPaymentItem = {
    id: `PAY-${current.admissionCode}-${(current.paymentHistory?.length || 0) + 1}`,
    receiptNo,
    date: payment.date,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    transactionRef: payment.transactionRef || undefined,
    remarks: payment.remarks || undefined,
  };

  const timelineItem = {
    id: `tl-${Date.now()}`,
    date: new Date().toISOString(),
    status: current.status,
    title: "Payment Received",
    description: `Payment of ₹${payment.amount.toLocaleString("en-IN")} received via ${payment.paymentMethod}. Receipt #${receiptNo}.`,
    performedBy: "Accounts Staff",
  };

  const updated: AdmissionRecord = {
    ...current,
    paidAmount: newPaidAmount,
    pendingAmount: newPendingAmount,
    paymentStatus,
    paymentHistory: [...(current.paymentHistory || []), paymentItem],
    timeline: [timelineItem, ...(current.timeline || [])],
    updatedAt: new Date().toISOString(),
  };

  // Update payment in Student Record if exists
  try {
    const student = await getStudentById(current.studentId);
    if (student) {
      await updateStudent(student.id, {
        paidAmount: newPaidAmount,
      });
    }
  } catch (err) {
    console.warn("Could not sync payment with student store:", err);
  }

  admissions[index] = updated;
  await writeAdmissionsToDisk(admissions);
  return updated;
}

// Delete Admission
export async function deleteAdmission(id: string): Promise<boolean> {
  if (isSupabaseServerConfigured()) {
    const { error } = await supabaseAdmin
      .from("admissions")
      .delete()
      .or(`id.eq.${id},admission_code.eq.${id}`);
    if (error) {
      throw new Error(`Supabase deleteAdmission failed: ${error.message}`);
    }
    return true;
  }

  const admissions = await readAdmissionsFromDisk();
  const filtered = admissions.filter((a) => a.id !== id && a.admissionCode !== id);
  if (filtered.length === admissions.length) return false;

  await writeAdmissionsToDisk(filtered);
  return true;
}

// Helper: Sync Approved/Enrolled admission with Student and Batch store
async function syncAdmissionWithStudentAndBatch(admission: AdmissionRecord): Promise<void> {
  try {
    // 1. Update Student record
    await updateStudent(admission.studentId, {
      course: admission.courseName,
      batchCode: admission.batchCode,
      status: "Active",
      totalFee: admission.finalFee,
      paidAmount: admission.paidAmount,
    });

    // 2. Assign to Batch if not already assigned
    const batches = await getBatches();
    const batch = batches.find(
      (b) => b.batchCode === admission.batchCode || b.id === admission.batchCode
    );

    if (batch && !batch.studentIds?.includes(admission.studentId)) {
      try {
        await assignStudentToBatch(batch.id, admission.studentId, "Enrolled via Admission approval");
      } catch (e: any) {
        console.warn(`Could not auto-assign student to batch: ${e.message}`);
      }
    }
  } catch (err) {
    console.error("Error syncing admission with student and batch:", err);
  }
}

// KPI Dashboard Statistics
export async function getAdmissionStats(): Promise<{
  totalAdmissions: number;
  newApplications: number;
  pendingApplications: number;
  approvedAdmissions: number;
  enrolledStudents: number;
  rejectedApplications: number;
}> {
  const admissions = await getAdmissions();

  const totalAdmissions = admissions.length;
  const newApplications = admissions.filter(
    (a) => a.status === "Application Received"
  ).length;
  const pendingApplications = admissions.filter(
    (a) => a.status === "Documents Pending" || a.status === "Under Review"
  ).length;
  const approvedAdmissions = admissions.filter(
    (a) => a.status === "Approved"
  ).length;
  const enrolledStudents = admissions.filter(
    (a) => a.status === "Enrolled"
  ).length;
  const rejectedApplications = admissions.filter(
    (a) => a.status === "Rejected" || a.status === "Cancelled"
  ).length;

  return {
    totalAdmissions,
    newApplications,
    pendingApplications,
    approvedAdmissions,
    enrolledStudents,
    rejectedApplications,
  };
}
