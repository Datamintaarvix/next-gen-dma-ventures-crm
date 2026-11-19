"use client";

import React, { useState } from "react";
import { FollowUpRecord, FollowUpType, followUpTypeEnum } from "@/lib/validations/follow-up";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, Loader2, CalendarPlus } from "lucide-react";

interface CompleteFollowUpModalProps {
  followUp: FollowUpRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (result: { completed: FollowUpRecord; nextFollowUp?: FollowUpRecord }) => void;
}

export function CompleteFollowUpModal({
  followUp,
  isOpen,
  onClose,
  onCompleted,
}: CompleteFollowUpModalProps) {
  const [completionNotes, setCompletionNotes] = useState("");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("11:00");
  const [nextType, setNextType] = useState<FollowUpType>("Phone Call");
  const [nextNotes, setNextNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionNotes.trim()) {
      setError("Please enter notes summarizing the discussion outcome");
      return;
    }

    if (scheduleNext && !nextDate) {
      setError("Please select a date for the next follow-up");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/follow-ups/${followUp.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionNotes: completionNotes.trim(),
          scheduleNext,
          nextDate: scheduleNext ? nextDate : undefined,
          nextTime: scheduleNext ? nextTime : undefined,
          nextType: scheduleNext ? nextType : undefined,
          nextNotes: scheduleNext ? nextNotes.trim() : undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to complete follow-up");
      }

      onCompleted(result.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2ECEB] flex items-center justify-between bg-[#FAFCFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#078783] uppercase">
                {followUp.followUpCode}
              </div>
              <h2 className="text-base font-bold text-[#11232B]">
                Mark Follow-up as Completed
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A9EA5] hover:text-[#11232B] hover:bg-[#F3F8F7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] space-y-1">
            <div className="font-semibold text-[#11232B]">{followUp.studentName}</div>
            <div className="text-[#5A7178] text-[11px]">
              {followUp.type} · Scheduled for {followUp.followUpDate} at {followUp.followUpTime}
            </div>
            {followUp.notes && (
              <p className="text-[11px] text-[#3E555C] italic pt-1 border-t border-[#E2ECEB]/60 mt-1">
                &ldquo;{followUp.notes}&rdquo;
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#11232B] mb-1">
              Discussion Outcome / Completion Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Summary of student response, questions answered, commitments made..."
              className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white resize-none"
            />
          </div>

          {/* Schedule Next Follow-up Checkbox & Fields */}
          <div className="pt-2 border-t border-[#E2ECEB] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => {
                  setScheduleNext(e.target.checked);
                  if (e.target.checked && !nextDate) {
                    // Default next follow-up in 3 days
                    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0];
                    setNextDate(d);
                  }
                }}
                className="w-4 h-4 text-[#078783] rounded border-[#E2ECEB] focus:ring-[#078783]"
              />
              <span className="text-xs font-semibold text-[#11232B] flex items-center gap-1.5">
                <CalendarPlus className="w-3.5 h-3.5 text-[#078783]" />
                Schedule Next Follow-up with this student
              </span>
            </label>

            {scheduleNext && (
              <div className="p-3.5 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A7178] mb-1">
                      Next Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A7178] mb-1">
                      Next Time
                    </label>
                    <input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A7178] mb-1">
                    Follow-up Type
                  </label>
                  <select
                    value={nextType}
                    onChange={(e) => setNextType(e.target.value as FollowUpType)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  >
                    {followUpTypeEnum.options.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A7178] mb-1">
                    Next Follow-up Objective
                  </label>
                  <input
                    type="text"
                    value={nextNotes}
                    onChange={(e) => setNextNotes(e.target.value)}
                    placeholder="e.g. Confirm fee payment or course enrollment"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E2ECEB] flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[140px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Complete</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
