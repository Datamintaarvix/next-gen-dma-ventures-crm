"use client";

import React, { useState } from "react";
import {
  PaymentTransactionRecord,
  paymentMethodList,
  PaymentMethod,
} from "@/lib/validations/payment";
import { Button } from "@/components/ui/button";
import { X, Loader2, RotateCcw, AlertTriangle } from "lucide-react";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentTransactionRecord | null;
  onSuccess: () => void;
}

export function RefundModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: RefundModalProps) {
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("Finance Director");
  const [refundDate, setRefundDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (payment) {
      setRefundAmount(payment.amount);
      setRefundReason("");
      setTransactionRef("");
      setError(null);
    }
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (refundAmount <= 0) {
        throw new Error("Refund amount must be greater than zero");
      }
      if (refundAmount > payment.amount) {
        throw new Error(
          `Refund amount cannot exceed original transaction amount of ₹${payment.amount.toLocaleString("en-IN")}`
        );
      }
      if (!refundReason.trim()) {
        throw new Error("Please specify the reason for the tuition refund");
      }

      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          refundAmount,
          refundReason,
          refundMethod,
          transactionRef: transactionRef || `REF-TXN-${Date.now()}`,
          authorizedBy,
          refundDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process refund");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
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
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#11232B]">Process Auditable Refund</h2>
              <p className="text-[11px] text-[#5A7178]">
                {payment.studentName} · {payment.receiptNo}
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
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] space-y-1 text-xs">
            <div className="flex justify-between text-[#5A7178]">
              <span>Original Amount:</span>
              <strong className="text-[#11232B]">₹{payment.amount.toLocaleString("en-IN")}</strong>
            </div>
            <div className="flex justify-between text-[#5A7178]">
              <span>Original Method:</span>
              <span className="text-[#11232B]">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-[#5A7178]">
              <span>Payment Date:</span>
              <span className="text-[#11232B]">{payment.paymentDate}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">
                Refund Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={payment.amount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 font-mono font-bold text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">
                Reason for Refund <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Relocation, Course cancellation, Excess fee adjustment"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {paymentMethodList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">Refund Date</label>
                <input
                  type="date"
                  required
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">Refund Reference / UTR</label>
              <input
                type="text"
                placeholder="e.g. REF/NEFT/998124"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">Authorized By</label>
              <input
                type="text"
                required
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
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
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Issue Refund"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
