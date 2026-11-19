"use client";

import React, { useState, useEffect } from "react";
import {
  AttendanceRecord,
  AttendanceStatus,
  attendanceStatusEnum,
} from "@/lib/validations/attendance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

interface EditAttendanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSuccess: (updated: AttendanceRecord) => void;
}

export function EditAttendanceRecordModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: EditAttendanceRecordModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>("Present");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("Staff Member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setCheckInTime(record.checkInTime || "");
      setRemarks(record.remarks || "");
      setError(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/attendance/${encodeURIComponent(record.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          checkInTime: status === "Absent" ? null : checkInTime.trim() || null,
          remarks: remarks.trim() || null,
          operatorName: operatorName.trim() || "Staff Member",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update record");
      }

      onSuccess(data.record);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2ECEB] bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Attendance Record</h3>
              <p className="text-xs text-slate-500">Record ID: {record.id}</p>
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

          {/* Student Info Pill */}
          <div className="p-3 bg-slate-50 border border-[#E2ECEB] rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{record.studentName}</span>
              <Badge variant="outline" className="text-slate-600 border-[#E2ECEB] bg-white">
                {record.studentCode}
              </Badge>
            </div>
            <div className="text-slate-500">
              {record.batchCode} ({record.batchName}) · {record.date}
            </div>
            <div className="text-slate-600 font-medium">Session: {record.sessionTitle}</div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Attendance Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {attendanceStatusEnum.map((st) => {
                const isSelected = status === st;
                let activeStyle = "bg-[#078783] text-white border-[#078783]";
                if (st === "Absent") activeStyle = "bg-rose-600 text-white border-rose-600";
                if (st === "Late") activeStyle = "bg-amber-500 text-white border-amber-500";
                if (st === "Excused") activeStyle = "bg-blue-600 text-white border-blue-600";

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? activeStyle
                        : "bg-white text-slate-700 border-[#E2ECEB] hover:bg-slate-50"
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Check-in Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Check-in Time
            </label>
            <input
              type="text"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              placeholder="e.g. 09:15 AM"
              disabled={status === "Absent"}
              className={`w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none ${
                status === "Absent" ? "opacity-40 bg-slate-100 cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Justification
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Arrived late due to train delay, notified trainer."
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none resize-none"
            />
          </div>

          {/* Operator Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modified By (Staff Name)
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2ECEB]">
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Record</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
