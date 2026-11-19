import { z } from "zod";

export const paymentMethodList = [
  "UPI",
  "Bank Transfer",
  "Credit/Debit Card",
  "Cash",
  "Cheque",
  "Other",
] as const;

export type PaymentMethod = (typeof paymentMethodList)[number];

export const transactionStatusEnum = [
  "Paid",
  "Partially Paid",
  "Pending",
  "Overdue",
  "Refunded",
] as const;

export type TransactionStatus = (typeof transactionStatusEnum)[number];

export const transactionTypeEnum = ["Payment", "Refund", "Adjustment"] as const;
export type TransactionType = (typeof transactionTypeEnum)[number];

export const installmentStatusEnum = [
  "Paid",
  "Partially Paid",
  "Pending",
  "Overdue",
] as const;
export type InstallmentStatus = (typeof installmentStatusEnum)[number];

export interface InstallmentItem {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
  paidDate?: string | null;
  receiptNo?: string | null;
  transactionRef?: string | null;
  notes?: string | null;
}

export interface InstallmentPlan {
  id: string;
  admissionId: string;
  admissionCode: string;
  studentId: string;
  studentName: string;
  courseName: string;
  totalFee: number;
  finalFee: number;
  paidAmount: number;
  pendingAmount: number;
  installments: InstallmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionRecord {
  id: string; // e.g. PAY-2026-101
  receiptNo: string; // e.g. REC-2026-077
  studentId: string;
  studentCode: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  admissionId: string;
  admissionCode: string;
  courseName: string;
  courseCode: string;
  batchCode: string;
  batchName: string;
  totalFee: number;
  discountAmount: number;
  finalFee: number;
  amount: number; // Transaction amount
  cumulativePaid: number;
  outstandingBalance: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionRef: string;
  receivedBy: string;
  type: TransactionType;
  status: TransactionStatus;
  installmentNumber?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  admissionId: z.string().min(1, "Please select an admission record"),
  amount: z.coerce.number().positive("Payment amount must be greater than zero"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(paymentMethodList),
  transactionRef: z.string().min(2, "Transaction reference or UTR is required"),
  receivedBy: z.string().min(2, "Received by staff name is required"),
  installmentNumber: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  refundAmount: z.coerce.number().positive("Refund amount must be greater than zero"),
  refundReason: z.string().min(3, "Refund reason is required"),
  refundMethod: z.enum(paymentMethodList),
  transactionRef: z.string().min(2, "Transaction reference is required"),
  authorizedBy: z.string().min(2, "Authorizer name is required"),
  refundDate: z.string().min(1, "Refund date is required"),
});

export type RefundPaymentFormData = z.infer<typeof refundPaymentSchema>;

export const updateInstallmentPlanSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  installments: z.array(
    z.object({
      id: z.string(),
      installmentNumber: z.number(),
      dueDate: z.string().min(1, "Due date is required"),
      amount: z.coerce.number().positive("Installment amount must be positive"),
      notes: z.string().optional().nullable(),
    })
  ),
});

export type UpdateInstallmentPlanFormData = z.infer<typeof updateInstallmentPlanSchema>;
