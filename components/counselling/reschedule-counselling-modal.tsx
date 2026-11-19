"use client";

import React, { useState, useEffect } from "react";
import { CounsellingSessionRecord } from "@/lib/validations/counselling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Calendar,
  Clock,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface RescheduleCounsellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CounsellingSessionRecord | null;
  onSuccess: (updated: CounsellingSessionRecord) => void;
}

export function RescheduleCounsellingModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: RescheduleCounsellingModalProps) {
  const [newDate, setNewDate] = useState<string>("");
  const [newStartTime, setNewStartTime] = useState<string>("10:00 AM");
  const [newEndTime, setNewEndTime] = useState<string>("10:45 AM");
  const [reason, setReason] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setNewDate(session.counsellingDate);
      setNewStartTime(session.startTime);
      setNewEndTime(session.endTime);
      setReason("");
      setError(null);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newDate) {
      setError("Please select a new date");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/counselling/${encodeURIComponent(session.id)}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDate,
          newStartTime,
          newEndTime,
          reason: reason.trim() || undefined,
          operatorName: session.assignedCounsellor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reschedule session");
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783]">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reschedule Session</h3>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current slot pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-[#E2ECEB] text-xs space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Current Appointment:</span>
            <div className="font-bold text-slate-800">
              {session.counsellingDate} · {session.startTime} - {session.endTime}
            </div>
            <div className="text-slate-500">
              Counsellor: {session.assignedCounsellor}
            </div>
          </div>

          {/* New Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              required
            />
          </div>

          {/* New Start & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Start Time <span className="text-rose-500">*</span>
              </label>
              <select
                value={newStartTime}
                onChange={(e) => {
                  setNewStartTime(e.target.value);
                  const times = [
                    "09:00 AM", "09:45 AM", "10:00 AM", "10:45 AM",
                    "11:00 AM", "11:45 AM", "02:00 PM", "02:45 PM",
                    "03:00 PM", "03:45 PM", "04:30 PM", "05:15 PM"
                  ];
                  const idx = times.indexOf(e.target.value);
                  if (idx !== -1 && idx + 1 < times.length) {
                    setNewEndTime(times[idx + 1]);
                  }
                }}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New End Time <span className="text-rose-500">*</span>
              </label>
              <select
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value="09:45 AM">09:45 AM</option>
                <option value="10:45 AM">10:45 AM</option>
                <option value="11:45 AM">11:45 AM</option>
                <option value="12:15 PM">12:15 PM</option>
                <option value="02:45 PM">02:45 PM</option>
                <option value="03:45 PM">03:45 PM</option>
                <option value="04:45 PM">04:45 PM</option>
                <option value="05:15 PM">05:15 PM</option>
                <option value="05:45 PM">05:45 PM</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reschedule Reason (Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student requested evening slot due to college exam."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-1 focus:ring-[#078783] focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2ECEB]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-600 border-[#E2ECEB] hover:bg-slate-100"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#078783] hover:bg-[#066f6c] text-white flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking & Rescheduling...</span>
                </>
              ) : (
                <span>Confirm Reschedule</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
