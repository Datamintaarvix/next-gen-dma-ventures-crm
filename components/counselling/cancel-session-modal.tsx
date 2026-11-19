"use client";

import React, { useState } from "react";
import { CounsellingSessionRecord } from "@/lib/validations/counselling";
import { Button } from "@/components/ui/button";
import {
  X,
  Loader2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface CancelSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CounsellingSessionRecord | null;
  onSuccess: (updated: CounsellingSessionRecord) => void;
}

export function CancelSessionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: CancelSessionModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please provide a reason for cancelling this counselling session");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/counselling/${encodeURIComponent(session.id)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          operatorName: session.assignedCounsellor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel session");
      }

      onSuccess(data.session);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cancel Counselling Session</h3>
              <p className="text-xs text-slate-500">{session.sessionCode} · {session.personName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Please record why this appointment with <strong>{session.personName}</strong> on{" "}
            <strong>{session.counsellingDate}</strong> is being cancelled.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Candidate called to postpone due to university exams; requested callback in 2 weeks."
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:outline-none resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2ECEB]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-600 border-[#E2ECEB]"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
