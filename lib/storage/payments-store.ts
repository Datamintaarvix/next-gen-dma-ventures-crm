import fs from "fs/promises";
import path from "path";
import { isSupabaseServerConfigured, supabaseAdmin } from "@/lib/supabase/server";
import {
  PaymentTransactionRecord,
  CreatePaymentFormData,
  RefundPaymentFormData,
  InstallmentPlan,
  InstallmentItem,
  PaymentMethod,
} from "@/lib/validations/payment";
import { getAdmissions, updateAdmission } from "./admissions-store";
import { getStudentById, updateStudent } from "./students-store";

const DATA_DIR = path.join(process.cwd(), "data");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
const INSTALLMENTS_FILE = path.join(DATA_DIR, "installments.json");

async function ensureDataFiles(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(PAYMENTS_FILE);
    } catch {
      await fs.writeFile(PAYMENTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    try {
      await fs.access(INSTALLMENTS_FILE);
    } catch {
      await fs.writeFile(INSTALLMENTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Error ensuring payment data files:", error);
  }
}

export async function readPaymentsFromDisk(): Promise<PaymentTransactionRecord[]> {
  await ensureDataFiles();
  try {
    const raw = await fs.readFile(PAYMENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading payments file:", error);
    return [];
  }
}

export async function writePaymentsToDisk(records: PaymentTransactionRecord[]): Promise<void> {
  await ensureDataFiles();
  await fs.writeFile(PAYMENTS_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function readInstallmentsFromDisk(): Promise<InstallmentPlan[]> {
  await ensureDataFiles();
  try {
    const raw = await fs.readFile(INSTALLMENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading installments file:", error);
    return [];
  }
}

export async function writeInstallmentsToDisk(records: InstallmentPlan[]): Promise<void> {
  await ensureDataFiles();
  await fs.writeFile(INSTALLMENTS_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function getPayments(): Promise<PaymentTransactionRecord[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getPayments error:", error);
      throw new Error(`Failed to fetch payments from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      receiptNo: row.receipt_no,
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name,
      studentPhone: row.student_phone || undefined,
      studentEmail: row.student_email || undefined,
      admissionId: row.admission_id,
      admissionCode: row.admission_code,
      courseName: row.course_name,
      courseCode: row.course_code || undefined,
      batchCode: row.batch_code,
      batchName: row.batch_name || undefined,
      totalFee: Number(row.total_fee),
      discountAmount: Number(row.discount_amount),
      finalFee: Number(row.final_fee),
      amount: Number(row.amount),
      cumulativePaid: Number(row.cumulative_paid),
      outstandingBalance: Number(row.outstanding_balance),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method as any,
      transactionRef: row.transaction_ref,
      receivedBy: row.received_by,
      type: row.type as any,
      status: row.status as any,
      installmentNumber: row.installment_number || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return await readPaymentsFromDisk();
}

export async function getPaymentById(id: string): Promise<PaymentTransactionRecord | null> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(`id.eq.${id},receipt_no.ilike.${id},transaction_ref.ilike.${id}`)
      .maybeSingle();

    if (error) {
      console.error("Supabase getPaymentById error:", error);
      throw new Error(`Failed to fetch payment from Supabase: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      receiptNo: data.receipt_no,
      studentId: data.student_id,
      studentCode: data.student_code,
      studentName: data.student_name,
      studentPhone: data.student_phone || undefined,
      studentEmail: data.student_email || undefined,
      admissionId: data.admission_id,
      admissionCode: data.admission_code,
      courseName: data.course_name,
      courseCode: data.course_code || undefined,
      batchCode: data.batch_code,
      batchName: data.batch_name || undefined,
      totalFee: Number(data.total_fee),
      discountAmount: Number(data.discount_amount),
      finalFee: Number(data.final_fee),
      amount: Number(data.amount),
      cumulativePaid: Number(data.cumulative_paid),
      outstandingBalance: Number(data.outstanding_balance),
      paymentDate: data.payment_date,
      paymentMethod: data.payment_method as any,
      transactionRef: data.transaction_ref,
      receivedBy: data.received_by,
      type: data.type as any,
      status: data.status as any,
      installmentNumber: data.installment_number || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const payments = await readPaymentsFromDisk();
  return (
    payments.find(
      (p) =>
        p.id === id ||
        p.receiptNo.toLowerCase() === id.toLowerCase() ||
        p.transactionRef.toLowerCase() === id.toLowerCase()
    ) || null
  );
}

// Generate Next Payment ID and Receipt Number
export async function getNextPaymentIds(): Promise<{ id: string; receiptNo: string }> {
  const payments = await readPaymentsFromDisk();
  let maxPayNum = 100;
  let maxRecNum = 200;

  payments.forEach((p) => {
    const payMatch = p.id?.match(/PAY-2026-(\d+)/);
    if (payMatch) {
      const num = parseInt(payMatch[1], 10);
      if (num > maxPayNum) maxPayNum = num;
    }
    const recMatch = p.receiptNo?.match(/REC-2026-(\d+)/);
    if (recMatch) {
      const num = parseInt(recMatch[1], 10);
      if (num > maxRecNum) maxRecNum = num;
    }
  });

  return {
    id: `PAY-2026-${maxPayNum + 1}`,
    receiptNo: `REC-2026-${maxRecNum + 1}`,
  };
}

// Record a New Payment Transaction
export async function recordPayment(input: CreatePaymentFormData): Promise<PaymentTransactionRecord> {
  const payments = await readPaymentsFromDisk();

  // 1. Validate Admission and Student
  const admissions = await getAdmissions();
  const admission = admissions.find((a) => a.id === input.admissionId || a.admissionCode === input.admissionId);
  if (!admission) {
    throw new Error("Linked admission record not found");
  }

  const student = await getStudentById(input.studentId);
  if (!student) {
    throw new Error("Student not found");
  }

  // 2. Validate Amount against Outstanding Balance
  const paymentAmount = Number(input.amount);
  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (paymentAmount > admission.pendingAmount) {
    throw new Error(
      `Payment amount of ₹${paymentAmount.toLocaleString("en-IN")} exceeds the remaining outstanding balance of ₹${admission.pendingAmount.toLocaleString("en-IN")}`
    );
  }

  // 3. Duplicate Transaction Ref Check (for non-cash payments)
  if (input.paymentMethod !== "Cash" && input.transactionRef) {
    const cleanRef = input.transactionRef.trim().toLowerCase();
    const duplicate = payments.find(
      (p) => p.transactionRef && p.transactionRef.trim().toLowerCase() === cleanRef && p.type === "Payment"
    );
    if (duplicate) {
      throw new Error(
        `A payment transaction with reference "${input.transactionRef}" already exists (${duplicate.receiptNo} for ${duplicate.studentName})`
      );
    }
  }

  // 4. Calculate updated balances
  const { id: paymentId, receiptNo } = await getNextPaymentIds();
  const newCumulativePaid = admission.paidAmount + paymentAmount;
  const newOutstandingBalance = Math.max(0, admission.finalFee - newCumulativePaid);
  const transactionStatus = newOutstandingBalance === 0 ? "Paid" : "Partially Paid";
  const now = new Date().toISOString();

  // 5. Create Payment Record
  const newPayment: PaymentTransactionRecord = {
    id: paymentId,
    receiptNo,
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.fullName,
    studentPhone: student.phoneNumber,
    studentEmail: student.email,
    admissionId: admission.id,
    admissionCode: admission.admissionCode,
    courseName: admission.courseName,
    courseCode: admission.courseCode,
    batchCode: admission.batchCode,
    batchName: admission.batchName,
    totalFee: admission.totalFee,
    discountAmount: admission.discountAmount,
    finalFee: admission.finalFee,
    amount: paymentAmount,
    cumulativePaid: newCumulativePaid,
    outstandingBalance: newOutstandingBalance,
    paymentDate: input.paymentDate,
    paymentMethod: input.paymentMethod,
    transactionRef: input.transactionRef,
    receivedBy: input.receivedBy,
    type: "Payment",
    status: transactionStatus,
    installmentNumber: input.installmentNumber || null,
    notes: input.notes || null,
    createdAt: now,
    updatedAt: now,
  };

  // 6. Update linked Admission
  const admissionPayments = admission.paymentHistory || [];
  admissionPayments.push({
    id: paymentId,
    receiptNo,
    date: input.paymentDate,
    amount: paymentAmount,
    paymentMethod: input.paymentMethod,
    transactionRef: input.transactionRef,
    remarks: input.notes || `Installment payment received by ${input.receivedBy}`,
  });

  const timeline = admission.timeline || [];
  timeline.unshift({
    id: `tl-${Date.now()}`,
    date: now,
    status: admission.status,
    title: "Tuition Payment Received",
    description: `Received ₹${paymentAmount.toLocaleString("en-IN")} via ${input.paymentMethod} (Receipt: ${receiptNo}). Outstanding balance: ₹${newOutstandingBalance.toLocaleString("en-IN")}.`,
    performedBy: input.receivedBy,
  });

  await updateAdmission(admission.id, {
    status: admission.status === "Approved" && newCumulativePaid > 0 ? "Enrolled" : admission.status,
  });

  // Re-read admissions to update JSON directly
  const freshAdmissions = await getAdmissions();
  const admIdx = freshAdmissions.findIndex((a) => a.id === admission.id);
  if (admIdx !== -1) {
    freshAdmissions[admIdx].paidAmount = newCumulativePaid;
    freshAdmissions[admIdx].pendingAmount = newOutstandingBalance;
    freshAdmissions[admIdx].paymentStatus = newOutstandingBalance === 0 ? "Paid" : "Partial";
    freshAdmissions[admIdx].paymentHistory = admissionPayments;
    freshAdmissions[admIdx].timeline = timeline;
    freshAdmissions[admIdx].updatedAt = now;
    const ADM_FILE = path.join(DATA_DIR, "admissions.json");
    await fs.writeFile(ADM_FILE, JSON.stringify(freshAdmissions, null, 2), "utf-8");
  }

  // 7. Update Student record
  await updateStudent(student.id, {
    paidAmount: newCumulativePaid,
  });

  // 8. Update Installments Schedule
  try {
    const plans = await readInstallmentsFromDisk();
    const planIndex = plans.findIndex((p) => p.admissionId === admission.id || p.admissionCode === admission.admissionCode);
    if (planIndex !== -1) {
      const plan = plans[planIndex];
      plan.paidAmount = newCumulativePaid;
      plan.pendingAmount = newOutstandingBalance;
      plan.updatedAt = now;

      // Find matching or first pending/overdue installment
      let remainingToApply = paymentAmount;
      for (const inst of plan.installments) {
        if (remainingToApply <= 0) break;
        if (inst.status !== "Paid") {
          const dueForThisInst = inst.amount - (inst.paidAmount || 0);
          if (remainingToApply >= dueForThisInst) {
            inst.paidAmount = inst.amount;
            inst.status = "Paid";
            inst.paidDate = input.paymentDate;
            inst.receiptNo = receiptNo;
            inst.transactionRef = input.transactionRef;
            remainingToApply -= dueForThisInst;
          } else {
            inst.paidAmount = (inst.paidAmount || 0) + remainingToApply;
            inst.status = "Partially Paid";
            inst.paidDate = input.paymentDate;
            inst.receiptNo = receiptNo;
            remainingToApply = 0;
          }
        }
      }

      if (isSupabaseServerConfigured()) {
        await supabaseAdmin
          .from("installments")
          .update({
            paid_amount: newCumulativePaid,
            pending_amount: newOutstandingBalance,
            installments: plan.installments as any,
            updated_at: now,
          })
          .or(`id.eq.${plan.id},admission_id.eq.${admission.id}`);
      }

      await writeInstallmentsToDisk(plans);
    }
  } catch (err) {
    console.warn("Could not synchronize installments plan:", err);
  }

  // 9. Save Payment to Supabase and Disk
  if (isSupabaseServerConfigured()) {
    const { error: payErr } = await supabaseAdmin.from("payments").insert({
      id: newPayment.id,
      receipt_no: newPayment.receiptNo,
      student_id: newPayment.studentId,
      student_code: newPayment.studentCode,
      student_name: newPayment.studentName,
      student_phone: newPayment.studentPhone || null,
      student_email: newPayment.studentEmail || null,
      admission_id: newPayment.admissionId,
      admission_code: newPayment.admissionCode,
      course_name: newPayment.courseName,
      course_code: newPayment.courseCode || null,
      batch_code: newPayment.batchCode,
      batch_name: newPayment.batchName || null,
      total_fee: newPayment.totalFee,
      discount_amount: newPayment.discountAmount,
      final_fee: newPayment.finalFee,
      amount: newPayment.amount,
      cumulative_paid: newPayment.cumulativePaid,
      outstanding_balance: newPayment.outstandingBalance,
      payment_date: newPayment.paymentDate,
      payment_method: newPayment.paymentMethod,
      transaction_ref: newPayment.transactionRef,
      received_by: newPayment.receivedBy,
      type: newPayment.type,
      status: newPayment.status,
      installment_number: newPayment.installmentNumber || null,
      notes: newPayment.notes || null,
      created_at: newPayment.createdAt,
      updated_at: newPayment.updatedAt,
    });
    if (payErr) {
      throw new Error(`Supabase recordPayment failed: ${payErr.message}`);
    }
    return newPayment;
  }

  payments.unshift(newPayment);
  await writePaymentsToDisk(payments);

  return newPayment;
}

// Record an Auditable Refund
export async function recordRefund(input: RefundPaymentFormData): Promise<PaymentTransactionRecord> {
  const payments = await readPaymentsFromDisk();
  const originalPayment = payments.find((p) => p.id === input.paymentId);
  if (!originalPayment) {
    throw new Error("Original payment transaction not found");
  }

  const refundAmount = Number(input.refundAmount);
  if (refundAmount <= 0) {
    throw new Error("Refund amount must be greater than zero");
  }

  if (refundAmount > originalPayment.amount) {
    throw new Error(
      `Refund amount of ₹${refundAmount.toLocaleString("en-IN")} cannot exceed original payment amount of ₹${originalPayment.amount.toLocaleString("en-IN")}`
    );
  }

  const { id: refundId, receiptNo: refundReceiptNo } = await getNextPaymentIds();
  const now = new Date().toISOString();

  // Adjust admissions and students
  const admissions = await getAdmissions();
  const admission = admissions.find((a) => a.id === originalPayment.admissionId);
  if (admission) {
    const newPaid = Math.max(0, admission.paidAmount - refundAmount);
    const newPending = Math.min(admission.finalFee, admission.pendingAmount + refundAmount);
    const newStatus = newPaid === 0 ? "Pending" : "Partial";

    admission.paidAmount = newPaid;
    admission.pendingAmount = newPending;
    admission.paymentStatus = newStatus;
    admission.timeline = [
      {
        id: `tl-${Date.now()}`,
        date: now,
        status: admission.status,
        title: "Tuition Refund Processed",
        description: `Refund of ₹${refundAmount.toLocaleString("en-IN")} processed via ${input.refundMethod}. Reason: ${input.refundReason}. Authorized by ${input.authorizedBy}.`,
        performedBy: input.authorizedBy,
      },
      ...(admission.timeline || []),
    ];

    const ADM_FILE = path.join(DATA_DIR, "admissions.json");
    await fs.writeFile(ADM_FILE, JSON.stringify(admissions, null, 2), "utf-8");

    // Update student
    await updateStudent(originalPayment.studentId, {
      paidAmount: newPaid,
    });
  }

  // Create auditable refund transaction
  const refundRecord: PaymentTransactionRecord = {
    id: refundId,
    receiptNo: `REF-${refundReceiptNo.replace("REC-", "")}`,
    studentId: originalPayment.studentId,
    studentCode: originalPayment.studentCode,
    studentName: originalPayment.studentName,
    studentPhone: originalPayment.studentPhone,
    studentEmail: originalPayment.studentEmail,
    admissionId: originalPayment.admissionId,
    admissionCode: originalPayment.admissionCode,
    courseName: originalPayment.courseName,
    courseCode: originalPayment.courseCode,
    batchCode: originalPayment.batchCode,
    batchName: originalPayment.batchName,
    totalFee: originalPayment.totalFee,
    discountAmount: originalPayment.discountAmount,
    finalFee: originalPayment.finalFee,
    amount: -refundAmount,
    cumulativePaid: (originalPayment.cumulativePaid || originalPayment.amount) - refundAmount,
    outstandingBalance: originalPayment.outstandingBalance + refundAmount,
    paymentDate: input.refundDate,
    paymentMethod: input.refundMethod,
    transactionRef: input.transactionRef,
    receivedBy: input.authorizedBy,
    type: "Refund",
    status: "Refunded",
    notes: `Refund: ${input.refundReason}`,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseServerConfigured()) {
    const { error: refErr } = await supabaseAdmin.from("payments").insert({
      id: refundRecord.id,
      receipt_no: refundRecord.receiptNo,
      student_id: refundRecord.studentId,
      student_code: refundRecord.studentCode,
      student_name: refundRecord.studentName,
      student_phone: refundRecord.studentPhone || null,
      student_email: refundRecord.studentEmail || null,
      admission_id: refundRecord.admissionId,
      admission_code: refundRecord.admissionCode,
      course_name: refundRecord.courseName,
      course_code: refundRecord.courseCode || null,
      batch_code: refundRecord.batchCode,
      batch_name: refundRecord.batchName || null,
      total_fee: refundRecord.totalFee,
      discount_amount: refundRecord.discountAmount,
      final_fee: refundRecord.finalFee,
      amount: refundRecord.amount,
      cumulative_paid: refundRecord.cumulativePaid,
      outstanding_balance: refundRecord.outstandingBalance,
      payment_date: refundRecord.paymentDate,
      payment_method: refundRecord.paymentMethod,
      transaction_ref: refundRecord.transactionRef,
      received_by: refundRecord.receivedBy,
      type: refundRecord.type,
      status: refundRecord.status,
      notes: refundRecord.notes || null,
      created_at: refundRecord.createdAt,
      updated_at: refundRecord.updatedAt,
    });
    if (refErr) {
      throw new Error(`Supabase recordRefund failed: ${refErr.message}`);
    }
    return refundRecord;
  }

  payments.unshift(refundRecord);
  await writePaymentsToDisk(payments);
  return refundRecord;
}

// Get Installment Plans
export async function getInstallmentPlans(): Promise<InstallmentPlan[]> {
  if (isSupabaseServerConfigured()) {
    const { data, error } = await supabaseAdmin
      .from("installments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getInstallmentPlans error:", error);
      throw new Error(`Failed to fetch installments from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      admissionId: row.admission_id,
      admissionCode: row.admission_code,
      studentId: row.student_id,
      studentName: row.student_name,
      courseName: row.course_name,
      totalFee: Number(row.total_fee),
      finalFee: Number(row.final_fee),
      paidAmount: Number(row.paid_amount),
      pendingAmount: Number(row.pending_amount),
      installments: (row.installments as any) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [];
  }
  return await readInstallmentsFromDisk();
}

export async function getInstallmentPlanByAdmission(admissionId: string): Promise<InstallmentPlan | null> {
  const plans = await getInstallmentPlans();
  return (
    plans.find(
      (p) =>
        p.admissionId === admissionId ||
        p.admissionCode.toLowerCase() === admissionId.toLowerCase()
    ) || null
  );
}

// Update Installment Schedule
export async function updateInstallmentSchedule(
  planId: string,
  updatedInstallments: { id: string; dueDate: string; amount: number; notes?: string | null }[]
): Promise<InstallmentPlan | null> {
  const plans = await readInstallmentsFromDisk();
  const index = plans.findIndex((p) => p.id === planId);
  if (index === -1) return null;

  const plan = plans[index];
  const now = new Date().toISOString();
  const todayStr = now.split("T")[0];

  plan.installments = plan.installments.map((inst) => {
    const match = updatedInstallments.find((u) => u.id === inst.id);
    if (!match) return inst;

    // Recalculate status if not paid
    let status = inst.status;
    if (inst.status !== "Paid") {
      status = match.dueDate < todayStr ? "Overdue" : "Pending";
    }

    return {
      ...inst,
      dueDate: match.dueDate,
      amount: match.amount,
      notes: match.notes !== undefined ? match.notes : inst.notes,
      status,
    };
  });

  plan.updatedAt = now;

  if (isSupabaseServerConfigured()) {
    const { error: instErr } = await supabaseAdmin
      .from("installments")
      .update({
        installments: plan.installments as any,
        updated_at: now,
      })
      .eq("id", planId);
    if (instErr) {
      throw new Error(`Supabase updateInstallmentSchedule failed: ${instErr.message}`);
    }
    return plan;
  }

  await writeInstallmentsToDisk(plans);
  return plan;
}

// Payment KPI Dashboard Statistics
export async function getPaymentStats(): Promise<{
  totalFees: number;
  totalCollected: number;
  outstandingAmount: number;
  todayCollected: number;
  pendingCount: number;
  overdueCount: number;
  courseBreakdown: {
    courseName: string;
    totalFee: number;
    collected: number;
    pending: number;
    studentCount: number;
  }[];
}> {
  const admissions = await getAdmissions();
  const payments = await getPayments();
  const plans = await getInstallmentPlans();

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Total committed fees & collected from admissions
  let totalFees = 0;
  let totalCollected = 0;
  let pendingCount = 0;
  const courseMap: Record<
    string,
    { totalFee: number; collected: number; pending: number; count: number }
  > = {};

  admissions.forEach((a) => {
    if (a.status !== "Cancelled" && a.status !== "Rejected") {
      totalFees += a.finalFee || 0;
      totalCollected += a.paidAmount || 0;
      if (a.pendingAmount > 0) {
        pendingCount++;
      }

      const cName = a.courseName || "Other";
      if (!courseMap[cName]) {
        courseMap[cName] = { totalFee: 0, collected: 0, pending: 0, count: 0 };
      }
      courseMap[cName].totalFee += a.finalFee || 0;
      courseMap[cName].collected += a.paidAmount || 0;
      courseMap[cName].pending += a.pendingAmount || 0;
      courseMap[cName].count += 1;
    }
  });

  const outstandingAmount = Math.max(0, totalFees - totalCollected);

  // 2. Payments received today
  let todayCollected = 0;
  payments.forEach((p) => {
    if (p.paymentDate === todayStr && p.type === "Payment") {
      todayCollected += p.amount;
    }
  });

  // 3. Overdue installments count
  let overdueCount = 0;
  plans.forEach((plan) => {
    (plan.installments || []).forEach((inst) => {
      if (inst.status === "Overdue" || (inst.status !== "Paid" && inst.dueDate < todayStr)) {
        overdueCount++;
      }
    });
  });

  const courseBreakdown = Object.entries(courseMap).map(([courseName, val]) => ({
    courseName,
    totalFee: val.totalFee,
    collected: val.collected,
    pending: val.pending,
    studentCount: val.count,
  }));

  return {
    totalFees,
    totalCollected,
    outstandingAmount,
    todayCollected,
    pendingCount,
    overdueCount,
    courseBreakdown,
  };
}
