"use client";

import React, { useState, useEffect } from "react";
import {
  AdmissionRecord,
  paymentMethodEnum,
  PaymentMethod,
} from "@/lib/validations/admission";
import { Button } from "@/components/ui/button";
import { X, Loader2, CreditCard, AlertCircle, Receipt } from "lucide-react";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionRecord | null;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  admission,
  onSuccess,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI / GPay");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [receiptNo, setReceiptNo] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (admission) {
      setAmount(admission.pendingAmount || 0);
      setPaymentMethod("UPI / GPay");
      setDate(new Date().toISOString().split("T")[0]);
      setReceiptNo(`REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setTransactionRef("");
      setRemarks("Tuition installment payment");
      setError(null);
    }
  }, [admission, isOpen]);

  if (!isOpen || !admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (amount <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }
      if (amount > admission.pendingAmount) {
        throw new Error(
          `Payment amount (₹${amount.toLocaleString("en-IN")}) cannot exceed the pending balance of ₹${admission.pendingAmount.toLocaleString("en-IN")}`
        );
      }

      const res = await fetch(`/api/admissions/${admission.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod,
          date,
          receiptNo,
          transactionRef,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record payment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2ECEB] bg-[#F8FBFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F5F4] flex items-center justify-center text-[#078783]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#11232B]">Record Tuition Payment</h2>
              <p className="text-[11px] text-[#5A7178]">
                {admission.studentName} ({admission.admissionCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#EAEAEA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Pending Balance Callout */}
          <div className="p-3 bg-[#E6F5F4] rounded-xl border border-[#CDEAE8] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#5A7178]">Pending Balance:</span>
              <div className="text-base font-bold font-mono text-[#078783]">
                ₹{admission.pendingAmount.toLocaleString("en-IN")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAmount(admission.pendingAmount)}
              className="text-[11px] text-[#078783] hover:underline font-semibold bg-white px-2.5 py-1 rounded-lg border border-[#CDEAE8]"
            >
              Pay Full Balance
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={admission.pendingAmount}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 font-mono font-bold text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {paymentMethodEnum.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">Payment Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">Transaction Ref / UTR / Cheque No.</label>
              <input
                type="text"
                placeholder="e.g. UPI/88392104"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">Remarks / Notes</label>
              <input
                type="text"
                placeholder="e.g. 2nd Installment payment"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2ECEB] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
