"use client";

import React, { useState, useEffect } from "react";
import {
  PlacementApplicationRecord,
  PlacementOfferRecord,
  RecordOfferFormData,
  offerStatusEnum,
  OfferStatus,
} from "@/lib/validations/placement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Award,
  IndianRupee,
  Calendar,
  Building2,
  User,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface RecordOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (offer: PlacementOfferRecord) => void;
  applications: PlacementApplicationRecord[];
  initialApplicationId?: string;
}

export function RecordOfferModal({
  isOpen,
  onClose,
  onSuccess,
  applications = [],
  initialApplicationId,
}: RecordOfferModalProps) {
  const [applicationId, setApplicationId] = useState<string>("");
  const [offeredSalaryLPA, setOfferedSalaryLPA] = useState<number>(6.0);
  const [offerDate, setOfferDate] = useState<string>("2026-11-18");
  const [joiningDate, setJoiningDate] = useState<string>("2026-12-01");
  const [offerLetterRef, setOfferLetterRef] = useState<string>("");
  const [status, setStatus] = useState<OfferStatus>("Offer Extended");
  const [recordedBy, setRecordedBy] = useState<string>("Vikram Malhotra (Placement Lead)");
  const [notes, setNotes] = useState<string>("");
  const [isImmediateAccepted, setIsImmediateAccepted] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApplicationId(initialApplicationId || (applications.length > 0 ? applications[0].id : ""));
      setOfferedSalaryLPA(6.0);
      const today = new Date().toISOString().split("T")[0];
      setOfferDate(today);
      const join = new Date();
      join.setDate(join.getDate() + 14);
      setJoiningDate(join.toISOString().split("T")[0]);
      setOfferLetterRef(`DMA/OFFER/2026/${Math.floor(100 + Math.random() * 900)}`);
      setStatus("Offer Extended");
      setIsImmediateAccepted(false);
      setRecordedBy("Vikram Malhotra (Placement Lead)");
      setNotes("");
      setErrorMsg(null);
    }
  }, [isOpen, initialApplicationId, applications]);

  if (!isOpen) return null;

  const currentApp = applications.find((a) => a.id === applicationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!applicationId) {
      setErrorMsg("Please select an application.");
      return;
    }
    if (Number(offeredSalaryLPA) <= 0) {
      setErrorMsg("Offered salary package must be greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalStatus = isImmediateAccepted ? "Accepted" : status;

      const payload: RecordOfferFormData = {
        applicationId,
        offeredSalaryLPA: Number(offeredSalaryLPA),
        offerDate,
        joiningDate,
        offerLetterRef: offerLetterRef.trim() || undefined,
        status: finalStatus,
        notes: notes.trim() || undefined,
        recordedBy: recordedBy.trim(),
      };

      const res = await fetch("/api/placements/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record placement offer");
      }

      onSuccess(data.offer);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Record Placement Offer</h3>
              <p className="text-xs text-slate-500">
                Log corporate offer letter, CTC package details & joining commitments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Application Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#078783]" />
              Select Candidate & Job Application <span className="text-red-500">*</span>
            </label>
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.studentName} ({app.studentCode}) · {app.companyName} ({app.jobTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Current Application Snapshot */}
          {currentApp && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>{currentApp.studentName}</span>
                <span className="text-[#078783] font-bold">{currentApp.companyName}</span>
              </div>
              <div className="text-slate-600">
                Role: {currentApp.jobTitle} · Course: {currentApp.courseName}
              </div>
            </div>
          )}

          {/* Salary in LPA */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-[#078783]" />
              Offered Annual Package (₹ LPA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              value={offeredSalaryLPA}
              onChange={(e) => setOfferedSalaryLPA(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
            />
            <p className="text-[11px] text-slate-500">
              E.g. ₹6.5 LPA equates to approx ₹54,166 gross monthly compensation.
            </p>
          </div>

          {/* Offer Date & Joining Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Offer Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Joining Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>
          </div>

          {/* Offer Letter Ref & Recorded By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-slate-500" />
                Offer Letter Reference
              </label>
              <input
                type="text"
                placeholder="e.g. GPM/OFFER/2026/088"
                value={offerLetterRef}
                onChange={(e) => setOfferLetterRef(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Placement Officer / Staff</label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none text-xs"
              />
            </div>
          </div>

          {/* Immediate Acceptance Checkbox Banner */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isImmediateAccepted}
                onChange={(e) => setIsImmediateAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-xs text-emerald-900 block">
                  Candidate has Accepted this Offer (Immediate Placement)
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  Automatically marks student profile as "Placed", updates job drive filled openings, and adds to Hall of Fame.
                </span>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Remarks / Joining Conditions (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. 6-month probation followed by performance review; laptop and health insurance provided."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none resize-none text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 font-semibold shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Record Offer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
