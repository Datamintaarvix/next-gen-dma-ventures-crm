"use client";

import React, { useState, useEffect } from "react";
import { StudentAttendanceProfile } from "@/lib/validations/attendance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Calendar,
  BookOpen,
  User,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  FileText,
  Printer,
  ChevronRight,
} from "lucide-react";

interface StudentAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
}

export function StudentAttendanceModal({
  isOpen,
  onClose,
  studentId,
}: StudentAttendanceModalProps) {
  const [profile, setProfile] = useState<StudentAttendanceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentId) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attendance/student/${encodeURIComponent(studentId)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load student attendance profile");
        }

        setProfile(data.profile);
      } catch (err: any) {
        if (isMounted) setError(err.message || "An error occurred");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783] font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Attendance Profile</h2>
              <p className="text-xs text-slate-500">
                Detailed session history, punctuality records, and monthly percentages
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
              <p className="text-sm font-medium">Loading student attendance profile...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !profile ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No attendance records found for this student.
            </div>
          ) : (
            <>
              {/* Student Header Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#E2ECEB] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#078783] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {profile.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{profile.studentName}</h3>
                      <Badge variant="outline" className="text-xs border-[#E2ECEB] text-slate-600 bg-white">
                        {profile.studentCode}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          profile.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {profile.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>Course: <strong className="text-slate-700">{profile.courseName}</strong></span>
                      <span>·</span>
                      <span>Batch: <strong className="text-slate-700">{profile.batchCode}</strong> ({profile.batchName})</span>
                    </div>
                  </div>
                </div>

                {/* Overall Attendance Ring/Badge */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">Overall Attendance</div>
                    <div
                      className={`text-2xl font-bold ${
                        profile.attendancePercentage >= 75 ? "text-[#078783]" : "text-rose-600"
                      }`}
                    >
                      {profile.attendancePercentage}%
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold text-sm ${
                      profile.attendancePercentage >= 75
                        ? "bg-[#E6F5F4] text-[#078783] border-[#078783]/30"
                        : "bg-rose-50 text-rose-600 border-rose-300"
                    }`}
                  >
                    {profile.attendancePercentage >= 75 ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                </div>
              </div>

              {/* Low Attendance Warning Banner if < 75% */}
              {profile.isLowAttendance && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Low Attendance Warning Threshold (Below 75%)
                    </h4>
                    <p className="text-xs mt-0.5 text-rose-700">
                      Institute policy requires a minimum of 75% class attendance for exam eligibility and certificate issuance. Please schedule a student counselling intervention.
                    </p>
                  </div>
                </div>
              )}

              {/* 5 Attendance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-white border border-[#E2ECEB] rounded-xl text-center shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-400 uppercase">Total Held</span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{profile.totalClasses}</p>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center shadow-2xs">
                  <span className="text-[11px] font-medium text-emerald-700 uppercase">Present</span>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">{profile.presentClasses}</p>
                </div>
                <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-center shadow-2xs">
                  <span className="text-[11px] font-medium text-rose-700 uppercase">Absent</span>
                  <p className="text-xl font-bold text-rose-700 mt-0.5">{profile.absentClasses}</p>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-center shadow-2xs">
                  <span className="text-[11px] font-medium text-amber-700 uppercase">Late</span>
                  <p className="text-xl font-bold text-amber-700 mt-0.5">{profile.lateClasses}</p>
                </div>
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-center shadow-2xs">
                  <span className="text-[11px] font-medium text-blue-700 uppercase">Excused</span>
                  <p className="text-xl font-bold text-blue-700 mt-0.5">{profile.excusedClasses}</p>
                </div>
              </div>

              {/* Monthly Breakdown */}
              {profile.monthlyBreakdown.length > 0 && (
                <div className="p-4 bg-slate-50/60 border border-[#E2ECEB] rounded-xl space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#078783]" />
                    Monthly Attendance Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {profile.monthlyBreakdown.map((m) => (
                      <div
                        key={m.monthYear}
                        className="p-3 bg-white border border-[#E2ECEB] rounded-lg flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-800">{m.monthYear}</span>
                          <p className="text-[11px] text-slate-500">
                            {m.attended} / {m.totalClasses} classes
                          </p>
                        </div>
                        <Badge
                          className={`text-xs ${
                            m.percentage >= 75
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {m.percentage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Session History Table */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#078783]" />
                  Class Session History ({profile.history.length})
                </h4>

                {profile.history.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-[#E2ECEB] rounded-xl text-slate-500 text-xs">
                    No historical sessions found for this student.
                  </div>
                ) : (
                  <div className="border border-[#E2ECEB] rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-[#E2ECEB] text-slate-500 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                          <tr>
                            <th className="px-3.5 py-2.5">Date</th>
                            <th className="px-3.5 py-2.5">Session Title</th>
                            <th className="px-3.5 py-2.5">Status</th>
                            <th className="px-3.5 py-2.5">Check-in</th>
                            <th className="px-3.5 py-2.5">Remarks</th>
                            <th className="px-3.5 py-2.5">Trainer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2ECEB]">
                          {profile.history.map((record) => {
                            let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                            if (record.status === "Present") {
                              badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                            } else if (record.status === "Absent") {
                              badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                            } else if (record.status === "Late") {
                              badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                            } else if (record.status === "Excused") {
                              badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                            }

                            return (
                              <tr key={record.id} className="hover:bg-slate-50/50">
                                <td className="px-3.5 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                                  {record.date}
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-700 max-w-[200px] truncate" title={record.sessionTitle}>
                                  {record.sessionTitle || "Standard Batch Lecture"}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <Badge className={`text-[11px] font-semibold ${badgeStyle}`}>
                                    {record.status}
                                  </Badge>
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                                  {record.checkInTime || "--"}
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-500 max-w-[150px] truncate" title={record.remarks || ""}>
                                  {record.remarks || "--"}
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                                  {record.recordedBy}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2ECEB] bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-slate-600 border-[#E2ECEB] hover:bg-slate-100"
          >
            Close
          </Button>

          {profile && (
            <Button
              type="button"
              onClick={() => window.print()}
              className="bg-[#078783] hover:bg-[#066f6c] text-white flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Profile</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
