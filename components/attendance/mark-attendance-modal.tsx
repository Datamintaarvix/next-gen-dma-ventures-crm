"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AttendanceStatus,
  attendanceStatusEnum,
  MarkAttendanceSessionFormData,
  SingleStudentAttendance,
} from "@/lib/validations/attendance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Calendar,
  BookOpen,
  GraduationCap,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Check,
  AlertTriangle,
  FileText,
  Sparkles,
} from "lucide-react";

interface BatchOption {
  id: string;
  batchCode: string;
  batchName: string;
  courseName: string;
  trainer: string;
  classTimings: string;
  studentIds?: string[];
}

interface StudentOption {
  id: string;
  studentCode: string;
  fullName: string;
  course: string;
  batchCode: string;
  status: string;
}

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: any, isNew: boolean) => void;
  courses: string[];
  batches: BatchOption[];
  students: StudentOption[];
  preSelectedBatchCode?: string | null;
  preSelectedDate?: string | null;
}

export function MarkAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  courses,
  batches,
  students,
  preSelectedBatchCode,
  preSelectedDate,
}: MarkAttendanceModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(preSelectedDate || todayStr);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [trainer, setTrainer] = useState<string>("");
  const [recordedBy, setRecordedBy] = useState<string>("Admin Counsellor");
  const [sessionNotes, setSessionNotes] = useState<string>("");

  const [studentRows, setStudentRows] = useState<SingleStudentAttendance[]>([]);
  const [isCheckingExisting, setIsCheckingExisting] = useState<boolean>(false);
  const [existingSessionFound, setExistingSessionFound] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter batches matching selected course
  const availableBatches = useMemo(() => {
    if (!selectedCourse) return batches;
    return batches.filter((b) => b.courseName === selectedCourse);
  }, [batches, selectedCourse]);

  // Selected batch object
  const activeBatch = useMemo(() => {
    return batches.find((b) => b.batchCode === selectedBatchCode);
  }, [batches, selectedBatchCode]);

  // Initialize or reset when modal opens or preSelectedBatchCode changes
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      const initDate = preSelectedDate || todayStr;
      setAttendanceDate(initDate);

      if (preSelectedBatchCode) {
        const foundBatch = batches.find((b) => b.batchCode === preSelectedBatchCode);
        if (foundBatch) {
          setSelectedCourse(foundBatch.courseName);
          setSelectedBatchCode(foundBatch.batchCode);
          setTrainer(foundBatch.trainer);
          setRecordedBy(foundBatch.trainer || "Academic Staff");
          return;
        }
      }

      if (batches.length > 0 && !selectedBatchCode) {
        const first = batches[0];
        setSelectedCourse(first.courseName);
        setSelectedBatchCode(first.batchCode);
        setTrainer(first.trainer);
        setRecordedBy(first.trainer || "Academic Staff");
      }
    }
  }, [isOpen, preSelectedBatchCode, preSelectedDate, batches, todayStr]);

  // When Course changes, update Batch if needed
  const handleCourseChange = (course: string) => {
    setSelectedCourse(course);
    const matchingBatches = batches.filter((b) => b.courseName === course);
    if (matchingBatches.length > 0) {
      const firstBatch = matchingBatches[0];
      setSelectedBatchCode(firstBatch.batchCode);
      setTrainer(firstBatch.trainer);
      setRecordedBy(firstBatch.trainer || "Academic Staff");
    } else {
      setSelectedBatchCode("");
      setStudentRows([]);
    }
  };

  // When Batch changes
  const handleBatchChange = (batchCode: string) => {
    setSelectedBatchCode(batchCode);
    const foundBatch = batches.find((b) => b.batchCode === batchCode);
    if (foundBatch) {
      setSelectedCourse(foundBatch.courseName);
      setTrainer(foundBatch.trainer);
      setRecordedBy(foundBatch.trainer || "Academic Staff");
    }
  };

  // Check for existing session whenever batchCode or attendanceDate changes
  useEffect(() => {
    if (!isOpen || !selectedBatchCode || !attendanceDate) return;

    let isMounted = true;
    const checkExisting = async () => {
      setIsCheckingExisting(true);
      try {
        const res = await fetch(
          `/api/attendance/session?batchCode=${encodeURIComponent(selectedBatchCode)}&date=${encodeURIComponent(attendanceDate)}`
        );
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.exists && data.session) {
          const sess = data.session;
          setExistingSessionFound(true);
          setSessionTitle(sess.sessionTitle || "");
          setTrainer(sess.trainer || activeBatch?.trainer || "");
          setRecordedBy(sess.recordedBy || "Academic Staff");
          setSessionNotes(sess.notes || "");

          // Map session records to studentRows
          const mappedRows: SingleStudentAttendance[] = sess.records.map((r: any) => ({
            studentId: r.studentId,
            studentCode: r.studentCode,
            studentName: r.studentName,
            status: r.status,
            checkInTime: r.checkInTime || "",
            remarks: r.remarks || "",
          }));

          // Also check if any new students were added to the batch that are not in the session
          const enrolledStudents = students.filter(
            (s) =>
              s.batchCode === selectedBatchCode ||
              (activeBatch?.studentIds && activeBatch.studentIds.includes(s.id))
          );

          enrolledStudents.forEach((stu) => {
            if (!mappedRows.some((m) => m.studentId === stu.id)) {
              mappedRows.push({
                studentId: stu.id,
                studentCode: stu.studentCode,
                studentName: stu.fullName,
                status: "Present",
                checkInTime: "09:00 AM",
                remarks: "",
              });
            }
          });

          setStudentRows(mappedRows);
        } else {
          // No existing session: load students fresh
          setExistingSessionFound(false);
          if (!sessionTitle) {
            setSessionTitle(`Session on ${attendanceDate} - ${activeBatch?.batchName || ""}`);
          }

          const enrolledStudents = students.filter(
            (s) =>
              s.batchCode === selectedBatchCode ||
              (activeBatch?.studentIds && activeBatch.studentIds.includes(s.id))
          );

          // Default time based on batch timing or standard morning
          const defaultTime = activeBatch?.classTimings?.split("-")[0]?.trim() || "09:00 AM";

          const rows: SingleStudentAttendance[] = enrolledStudents.map((s) => ({
            studentId: s.id,
            studentCode: s.studentCode,
            studentName: s.fullName,
            status: "Present",
            checkInTime: defaultTime,
            remarks: "",
          }));

          setStudentRows(rows);
        }
      } catch (err) {
        console.error("Error checking attendance session:", err);
      } finally {
        if (isMounted) setIsCheckingExisting(false);
      }
    };

    checkExisting();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedBatchCode, attendanceDate, activeBatch, students]);

  // Bulk status updates
  const setAllStatus = (status: AttendanceStatus) => {
    setStudentRows((prev) =>
      prev.map((row) => ({
        ...row,
        status,
        checkInTime: status === "Absent" ? "" : row.checkInTime || "09:00 AM",
      }))
    );
  };

  // Row update helpers
  const updateRowStatus = (index: number, status: AttendanceStatus) => {
    setStudentRows((prev) => {
      const next = [...prev];
      const defaultTime = activeBatch?.classTimings?.split("-")[0]?.trim() || "09:00 AM";
      next[index] = {
        ...next[index],
        status,
        checkInTime: status === "Absent" ? "" : next[index].checkInTime || defaultTime,
      };
      return next;
    });
  };

  const updateRowField = (index: number, field: "checkInTime" | "remarks", val: string) => {
    setStudentRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Counts summary
  const summaryCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    studentRows.forEach((r) => {
      if (r.status === "Present") present++;
      else if (r.status === "Absent") absent++;
      else if (r.status === "Late") late++;
      else if (r.status === "Excused") excused++;
    });
    return { present, absent, late, excused, total: studentRows.length };
  }, [studentRows]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCourse) {
      setFormError("Please select a course");
      return;
    }
    if (!selectedBatchCode) {
      setFormError("Please select a batch");
      return;
    }
    if (!attendanceDate) {
      setFormError("Please select an attendance date");
      return;
    }
    if (!sessionTitle.trim()) {
      setFormError("Session title or class topic is required");
      return;
    }
    if (studentRows.length === 0) {
      setFormError("No students enrolled in this batch to mark attendance for");
      return;
    }

    const payload: MarkAttendanceSessionFormData = {
      courseName: selectedCourse,
      batchCode: selectedBatchCode,
      batchName: activeBatch ? activeBatch.batchName : selectedBatchCode,
      date: attendanceDate,
      sessionTitle: sessionTitle.trim(),
      trainer: trainer.trim() || activeBatch?.trainer || "Instructor",
      recordedBy: recordedBy.trim() || "Academic Staff",
      notes: sessionNotes.trim() || undefined,
      records: studentRows,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record attendance session");
      }

      onSuccess(data.session, data.isNew);
      onClose();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {existingSessionFound ? "Update Batch Attendance" : "Take Batch Attendance"}
                </h2>
                {existingSessionFound ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                    Editing Existing Session
                  </Badge>
                ) : (
                  <Badge className="bg-[#E6F5F4] text-[#078783] border-[#078783]/30 text-xs">
                    New Session
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Record student attendance, check-in timings, and academic participation remarks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {existingSessionFound && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Attendance was already marked for this batch on <strong>{attendanceDate}</strong>. Any changes you make will safely update the existing records without duplicates.
              </span>
            </div>
          )}

          {/* Session Parameters Card */}
          <div className="p-4 bg-slate-50/70 border border-[#E2ECEB] rounded-xl space-y-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#078783]" />
              Session Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Course */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Batch Code & Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBatchCode}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                  required
                >
                  <option value="">Select Batch</option>
                  {availableBatches.map((b) => (
                    <option key={b.batchCode} value={b.batchCode}>
                      {b.batchCode} · {b.batchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Attendance Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    max={todayStr}
                    className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Recorded By */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Recorded By Staff <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  placeholder="Staff / Trainer name"
                  className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Session Title and Trainer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Session Topic / Class Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Google Ads Search Campaign Optimization"
                  className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trainer / Instructor
                </label>
                <input
                  type="text"
                  value={trainer}
                  onChange={(e) => setTrainer(e.target.value)}
                  placeholder="Instructor Name"
                  className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions & Roster Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#078783]" />
                <h3 className="text-sm font-bold text-slate-800">
                  Student Roster ({studentRows.length})
                </h3>
                {isCheckingExisting && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading records...
                  </span>
                )}
              </div>

              {/* Bulk mark buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1">Quick Mark:</span>
                <button
                  type="button"
                  onClick={() => setAllStatus("Present")}
                  className="px-2.5 py-1 text-xs rounded-md font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus("Absent")}
                  className="px-2.5 py-1 text-xs rounded-md font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  All Absent
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus("Late")}
                  className="px-2.5 py-1 text-xs rounded-md font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                >
                  All Late
                </button>
              </div>
            </div>

            {/* Attendance Roster Table */}
            {studentRows.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-[#E2ECEB] rounded-xl text-slate-500 text-sm">
                No active students found for batch {selectedBatchCode || "(select a batch)"}.
              </div>
            ) : (
              <div className="border border-[#E2ECEB] rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-[#E2ECEB] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3">Check-in Time</th>
                        <th className="px-4 py-3">Remarks / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2ECEB]">
                      {studentRows.map((row, idx) => (
                        <tr key={row.studentId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-medium text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{row.studentName}</div>
                            <div className="text-[11px] text-slate-500">{row.studentCode}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {attendanceStatusEnum.map((st) => {
                                const isCurrent = row.status === st;
                                let colorStyle = "text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200";

                                if (isCurrent) {
                                  if (st === "Present") colorStyle = "bg-emerald-600 text-white border-emerald-600 shadow-2xs";
                                  else if (st === "Absent") colorStyle = "bg-rose-600 text-white border-rose-600 shadow-2xs";
                                  else if (st === "Late") colorStyle = "bg-amber-500 text-white border-amber-500 shadow-2xs";
                                  else if (st === "Excused") colorStyle = "bg-blue-600 text-white border-blue-600 shadow-2xs";
                                }

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => updateRowStatus(idx, st)}
                                    className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-all ${colorStyle}`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.checkInTime || ""}
                              onChange={(e) => updateRowField(idx, "checkInTime", e.target.value)}
                              placeholder="e.g. 09:05 AM"
                              disabled={row.status === "Absent"}
                              className={`w-28 h-8 px-2 text-xs rounded-md border border-[#E2ECEB] bg-white focus:outline-none focus:ring-1 focus:ring-[#078783] ${
                                row.status === "Absent" ? "opacity-40 bg-slate-100 cursor-not-allowed" : ""
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.remarks || ""}
                              onChange={(e) => updateRowField(idx, "remarks", e.target.value)}
                              placeholder="Optional remarks"
                              className="w-full min-w-[150px] h-8 px-2.5 text-xs rounded-md border border-[#E2ECEB] bg-white focus:outline-none focus:ring-1 focus:ring-[#078783]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Counts */}
                <div className="px-4 py-3 bg-slate-50 border-t border-[#E2ECEB] flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                  <div className="flex items-center gap-4 font-medium">
                    <span>Summary:</span>
                    <span className="text-emerald-700 font-semibold">{summaryCounts.present} Present</span>
                    <span className="text-rose-600 font-semibold">{summaryCounts.absent} Absent</span>
                    <span className="text-amber-600 font-semibold">{summaryCounts.late} Late</span>
                    <span className="text-blue-600 font-semibold">{summaryCounts.excused} Excused</span>
                  </div>
                  <div className="text-slate-500">
                    Total: {summaryCounts.total} Students · Batch Attendance:{" "}
                    <strong className="text-slate-900">
                      {summaryCounts.total > 0
                        ? `${Math.round(((summaryCounts.present + summaryCounts.late) / summaryCounts.total) * 100)}%`
                        : "0%"}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overall Session Remarks / Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              General Class / Session Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="e.g. Conducted live quiz. 3 students need extra revision on ad copy generation."
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2ECEB] bg-slate-50">
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
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || studentRows.length === 0}
            className="bg-[#078783] hover:bg-[#066f6c] text-white font-medium px-5 flex items-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Attendance...</span>
              </>
            ) : existingSessionFound ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Update Attendance Session</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Attendance Session</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
