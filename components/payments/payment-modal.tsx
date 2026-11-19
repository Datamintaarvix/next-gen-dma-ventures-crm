"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreatePaymentFormData,
  paymentMethodList,
  PaymentMethod,
  PaymentTransactionRecord,
} from "@/lib/validations/payment";
import { AdmissionRecord } from "@/lib/validations/admission";
import { StudentRecord } from "@/lib/validations/student";
import { leadCounselorList } from "@/lib/validations/lead";
import { Button } from "@/components/ui/button";
import {
  X,
  Loader2,
  CreditCard,
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Search,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: PaymentTransactionRecord) => void;
  preSelectedAdmissionId?: string | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedAdmissionId,
}: PaymentModalProps) {
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchStudent, setSearchStudent] = useState("");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<{
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    transactionRef: string;
    receivedBy: string;
    installmentNumber: number | "";
    notes: string;
  }>({
    amount: 0,
    paymentDate: todayStr,
    paymentMethod: "UPI",
    transactionRef: "",
    receivedBy: "Priya Nair",
    installmentNumber: "",
    notes: "Tuition installment payment",
  });

  // Fetch admissions and students
  useEffect(() => {
    if (isOpen) {
      setIsLoadingData(true);
      setError(null);
      Promise.all([
        fetch("/api/admissions").then((r) => r.json()),
        fetch("/api/students").then((r) => r.json()),
      ])
        .then(([admData, stuData]) => {
          if (admData.success) {
            setAdmissions(admData.data || []);
            if (preSelectedAdmissionId) {
              setSelectedAdmissionId(preSelectedAdmissionId);
            }
          }
          if (stuData.success) setStudents(stuData.data || []);
        })
        .catch((err) => console.error("Error loading payment modal data:", err))
        .finally(() => setIsLoadingData(false));
    }
  }, [isOpen, preSelectedAdmissionId]);

  // Selected admission details
  const selectedAdmission = useMemo(() => {
    return admissions.find(
      (a) => a.id === selectedAdmissionId || a.admissionCode === selectedAdmissionId
    );
  }, [admissions, selectedAdmissionId]);

  // When admission changes, set default amount to pending balance
  useEffect(() => {
    if (selectedAdmission) {
      setFormData((prev) => ({
        ...prev,
        amount: selectedAdmission.pendingAmount > 0 ? selectedAdmission.pendingAmount : 0,
        transactionRef: "",
      }));
    }
  }, [selectedAdmission]);

  // Filter admissions for dropdown
  const filteredAdmissions = useMemo(() => {
    if (!searchStudent) return admissions;
    const q = searchStudent.toLowerCase();
    return admissions.filter(
      (a) =>
        a.studentName.toLowerCase().includes(q) ||
        a.admissionCode.toLowerCase().includes(q) ||
        a.studentCode.toLowerCase().includes(q) ||
        a.courseName.toLowerCase().includes(q)
    );
  }, [admissions, searchStudent]);

  if (!isOpen) return null;

  const currentPending = selectedAdmission?.pendingAmount ?? 0;
  const balanceAfterPayment = Math.max(0, currentPending - formData.amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedAdmission) {
        throw new Error("Please select an admission record");
      }

      if (formData.amount <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }

      if (formData.amount > currentPending) {
        throw new Error(
          `Payment amount (₹${formData.amount.toLocaleString("en-IN")}) cannot exceed the outstanding balance of ₹${currentPending.toLocaleString("en-IN")}`
        );
      }

      if (formData.paymentMethod !== "Cash" && !formData.transactionRef.trim()) {
        throw new Error("Please enter a transaction reference, UTR, or check number");
      }

      const payload: CreatePaymentFormData = {
        studentId: selectedAdmission.studentId,
        admissionId: selectedAdmission.id,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        transactionRef: formData.transactionRef.trim() || `CASH-${Date.now()}`,
        receivedBy: formData.receivedBy,
        installmentNumber: formData.installmentNumber ? Number(formData.installmentNumber) : null,
        notes: formData.notes,
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record payment");
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while processing payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2ECEB] bg-[#F8FBFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F5F4] flex items-center justify-center text-[#078783]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#11232B]">Record Tuition Fee Payment</h2>
              <p className="text-xs text-[#5A7178]">
                Issue an official payment receipt and reconcile student outstanding balance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#EAEAEA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Select Admission & Student */}
          <div className="space-y-3 p-4 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB]">
            <label className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#078783]" />
              Select Candidate & Admission
            </label>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#5A7178] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate name, admission code (AD-401), or student ID..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2ECEB] bg-white text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>

              <select
                value={selectedAdmissionId}
                onChange={(e) => setSelectedAdmissionId(e.target.value)}
                required
                className="w-full text-xs bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
              >
                <option value="">-- Choose an admission from directory ({filteredAdmissions.length} available) --</option>
                {filteredAdmissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.admissionCode} · {a.studentName} ({a.studentCode}) - {a.courseName} | Due: ₹{a.pendingAmount?.toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Admission Summary Card */}
            {selectedAdmission && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-[#E2ECEB] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#5A7178] block">Course & Batch</span>
                  <strong className="text-[#11232B] truncate block">{selectedAdmission.courseName}</strong>
                  <span className="text-[10px] text-[#5A7178] font-mono">{selectedAdmission.batchCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5A7178] block">Final Tuition Fee</span>
                  <strong className="text-[#11232B] font-mono block">₹{selectedAdmission.finalFee.toLocaleString("en-IN")}</strong>
                  <span className="text-[10px] text-emerald-600">Disc: ₹{selectedAdmission.discountAmount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5A7178] block">Previously Paid</span>
                  <strong className="text-[#078783] font-mono block">₹{selectedAdmission.paidAmount.toLocaleString("en-IN")}</strong>
                  <span className="text-[10px] text-[#5A7178]">
                    {Math.round((selectedAdmission.paidAmount / selectedAdmission.finalFee) * 100)}% cleared
                  </span>
                </div>
                <div className="p-2 bg-[#E6F5F4] rounded-lg border border-[#CDEAE8]">
                  <span className="text-[10px] text-[#078783] font-bold block uppercase">Outstanding Due</span>
                  <strong className="text-base text-[#078783] font-mono font-bold block">
                    ₹{selectedAdmission.pendingAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Payment Particulars */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#078783]" />
              Payment Transaction Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Payment Amount */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={currentPending > 0 ? currentPending : undefined}
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: Number(e.target.value) }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 font-mono font-bold text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
                {selectedAdmission && (
                  <div className="text-[10px] text-[#5A7178] mt-1 flex items-center justify-between">
                    <span>Balance after this payment:</span>
                    <strong className="font-mono text-[#078783]">
                      ₹{balanceAfterPayment.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData((p) => ({ ...p, paymentDate: e.target.value }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value as any }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {paymentMethodList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Ref / UTR */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Transaction Ref / UTR / Cheque No. {formData.paymentMethod !== "Cash" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={formData.paymentMethod !== "Cash"}
                  placeholder="e.g. UPI/998124510 or NEFT/321948"
                  value={formData.transactionRef}
                  onChange={(e) => setFormData((p) => ({ ...p, transactionRef: e.target.value }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>

              {/* Received By */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Received By (Staff) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.receivedBy}
                  onChange={(e) => setFormData((p) => ({ ...p, receivedBy: e.target.value }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {leadCounselorList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Admin">Admin</option>
                  <option value="Accounts Desk">Accounts Desk</option>
                </select>
              </div>

              {/* Installment Number */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">Installment Number (Optional)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 1, 2, 3"
                  value={formData.installmentNumber}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      installmentNumber: e.target.value ? Number(e.target.value) : "",
                    }))
                  }
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">Notes & Remarks</label>
              <input
                type="text"
                placeholder="e.g. 2nd installment clearance, verified on HDFC portal..."
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#E2ECEB] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedAdmission || formData.amount <= 0}
              className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Recording Payment...
                </>
              ) : (
                "Issue Payment Receipt"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
