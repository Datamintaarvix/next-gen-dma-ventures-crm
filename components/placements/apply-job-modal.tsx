"use client";

import React, { useState, useEffect } from "react";
import {
  JobOpportunityRecord,
  StudentPlacementProfile,
  PlacementApplicationRecord,
  ApplyJobFormData,
} from "@/lib/validations/placement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Briefcase,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CalendarCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (application: PlacementApplicationRecord) => void;
  jobs: JobOpportunityRecord[];
  students: StudentPlacementProfile[];
  initialJobId?: string;
  initialStudentId?: string;
}

export function ApplyJobModal({
  isOpen,
  onClose,
  onSuccess,
  jobs = [],
  students = [],
  initialJobId,
  initialStudentId,
}: ApplyJobModalProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedJobId(initialJobId || (jobs.length > 0 ? jobs[0].id : ""));
      setSelectedStudentId(initialStudentId || (students.length > 0 ? students[0].studentId : ""));
      setNotes("");
      setErrorMsg(null);
    }
  }, [isOpen, initialJobId, initialStudentId, jobs, students]);

  if (!isOpen) return null;

  const currentJob = jobs.find((j) => j.id === selectedJobId);
  const currentStudent = students.find((s) => s.studentId === selectedStudentId);

  // Validation checks
  const isAttendanceShortfall =
    currentJob &&
    currentStudent &&
    currentStudent.attendancePercentage < currentJob.minAttendancePercentage;

  const isCourseTargeted =
    currentJob &&
    currentStudent &&
    (currentJob.targetCourses.includes(currentStudent.courseName) ||
      currentJob.targetCourses.some((c) =>
        currentStudent.courseName.toLowerCase().includes(c.toLowerCase())
      ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedJobId) {
      setErrorMsg("Please select an active job opportunity.");
      return;
    }
    if (!selectedStudentId) {
      setErrorMsg("Please select a student to apply.");
      return;
    }

    if (isAttendanceShortfall) {
      setErrorMsg(
        `Application Blocked: Student attendance (${currentStudent?.attendancePercentage}%) is below the job's minimum eligibility criteria (${currentJob?.minAttendancePercentage}%).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ApplyJobFormData = {
        jobId: selectedJobId,
        studentId: selectedStudentId,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/placements/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit job application");
      }

      onSuccess(data.application);
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
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Apply Student to Job Drive</h3>
              <p className="text-xs text-slate-500">
                Verify institutional attendance eligibility and match required skills
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

          {/* Job Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#078783]" />
              Select Job Opportunity / Drive <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.companyName} · {j.jobTitle} ({j.salaryRangeDisplay})
                </option>
              ))}
            </select>
          </div>

          {/* Job Preview Card */}
          {currentJob && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>{currentJob.jobTitle}</span>
                <span className="text-[#078783] font-bold">{currentJob.salaryRangeDisplay}</span>
              </div>
              <div className="text-slate-600">
                Company: <span className="font-medium text-slate-900">{currentJob.companyName}</span> ·{" "}
                Location: <span className="font-medium text-slate-900">{currentJob.jobLocation}</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-slate-500">Skills required:</span>
                {currentJob.requiredSkills.map((sk) => (
                  <span
                    key={sk}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 text-[10px]"
                  >
                    {sk}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Min Attendance Required:{" "}
                <span className="font-bold text-slate-800">{currentJob.minAttendancePercentage}%</span>
              </div>
            </div>
          )}

          {/* Student Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#078783]" />
              Select Student Candidate <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
            >
              {students.map((stu) => (
                <option key={stu.studentId} value={stu.studentId}>
                  {stu.studentName} ({stu.studentCode}) · {stu.courseName} · {stu.attendancePercentage}% Attendance
                </option>
              ))}
            </select>
          </div>

          {/* Student Eligibility Live Evaluation Card */}
          {currentStudent && currentJob && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isAttendanceShortfall
                  ? "bg-amber-50/70 border-amber-200 text-amber-900"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  {isAttendanceShortfall ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    {isAttendanceShortfall
                      ? "Attendance Threshold Warning"
                      : "Candidate Eligible for Drive"}
                  </span>
                </div>
                <span>{currentStudent.attendancePercentage}% Attendance</span>
              </div>

              <p className="text-[11px]">
                {isAttendanceShortfall
                  ? `Student has not met the mandatory ${currentJob.minAttendancePercentage}% attendance criterion. Attendance improvement required before drive application.`
                  : `Student meets the minimum attendance threshold (≥${currentJob.minAttendancePercentage}%) and is cleared for corporate referral.`}
              </p>

              {currentStudent.resumeUrl ? (
                <div className="text-[11px] text-teal-700 flex items-center gap-1 font-medium">
                  ✓ Resume uploaded & verified
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  Note: Candidate has not linked an external resume URL yet.
                </div>
              )}
            </div>
          )}

          {/* Referral / Application Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Internal Referral Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Recommended for frontend specialization, completed capstone project."
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
              disabled={isSubmitting || Boolean(isAttendanceShortfall)}
              className={`rounded-xl px-5 font-semibold shadow-sm flex items-center gap-2 text-white ${
                isAttendanceShortfall
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#078783] hover:bg-[#066f6c]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
