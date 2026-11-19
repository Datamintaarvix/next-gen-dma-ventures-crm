"use client";

import React, { useState } from "react";
import { FollowUpRecord } from "@/lib/validations/follow-up";
import { Button } from "@/components/ui/button";
import { X, CalendarClock, Loader2 } from "lucide-react";

interface RescheduleModalProps {
  followUp: FollowUpRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRescheduled: (updated: FollowUpRecord) => void;
}

export function RescheduleModal({
  followUp,
  isOpen,
  onClose,
  onRescheduled,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("11:00");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setError("Please select a new date");
      return;
    }
    if (!reason.trim()) {
      setError("Please enter the reason for rescheduling");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/follow-ups/${followUp.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDate,
          newTime,
          reason: reason.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to reschedule follow-up");
      }

      onRescheduled(result.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reschedule follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2ECEB] flex items-center justify-between bg-[#FAFCFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#078783] uppercase">
                {followUp.followUpCode}
              </div>
              <h2 className="text-base font-bold text-[#11232B]">
                Reschedule Follow-up
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB]">
            <div className="font-semibold text-[#11232B]">{followUp.studentName}</div>
            <div className="text-[#5A7178] text-[11px]">
              Currently: {followUp.followUpDate} at {followUp.followUpTime} ({followUp.type})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#11232B] mb-1">
                New Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#11232B] mb-1">
                New Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#11232B] mb-1">
              Reason for Rescheduling <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student busy with exams, requested call on Saturday morning..."
              className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white resize-none"
            />
          </div>

          <div className="pt-2 border-t border-[#E2ECEB] flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#078783] hover:bg-[#066F6C] text-white gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                "Save Rescheduled Date"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
