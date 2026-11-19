"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Printer,
  Download,
  Calendar,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { AttendanceRecord } from "@/lib/validations/attendance";

interface BatchOption {
  batchCode: string;
  batchName: string;
  courseName: string;
  trainer: string;
}

interface AttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  batches: BatchOption[];
  selectedBatchCode?: string;
  dateRangeFilter?: string;
}

export function AttendanceReportModal({
  isOpen,
  onClose,
  records,
  batches,
  selectedBatchCode = "All",
  dateRangeFilter = "All Time",
}: AttendanceReportModalProps) {
  const [activeBatch, setActiveBatch] = useState<string>(selectedBatchCode);

  const filteredRecords = useMemo(() => {
    if (activeBatch === "All") return records;
    return records.filter((r) => r.batchCode === activeBatch);
  }, [records, activeBatch]);

  // Aggregate student-wise summary
  const studentMap = useMemo(() => {
    const map = new Map<
      string,
      {
        studentCode: string;
        studentName: string;
        courseName: string;
        batchCode: string;
        batchName: string;
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const key = `${r.studentCode}-${r.batchCode}`;
      const curr = map.get(key) || {
        studentCode: r.studentCode,
        studentName: r.studentName,
        courseName: r.courseName,
        batchCode: r.batchCode,
        batchName: r.batchName,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      curr.total++;
      if (r.status === "Present") curr.present++;
      else if (r.status === "Absent") curr.absent++;
      else if (r.status === "Late") curr.late++;
      else if (r.status === "Excused") curr.excused++;

      map.set(key, curr);
    });

    return Array.from(map.values()).map((s) => {
      const attended = s.present + s.late;
      const percentage = s.total > 0 ? Math.round((attended / s.total) * 100) : 100;
      return {
        ...s,
        percentage,
        isLow: s.total > 0 && percentage < 75,
      };
    });
  }, [filteredRecords]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    filteredRecords.forEach((r) => {
      if (r.status === "Present") present++;
      else if (r.status === "Absent") absent++;
      else if (r.status === "Late") late++;
      else if (r.status === "Excused") excused++;
    });

    const total = filteredRecords.length;
    const attended = present + late;
    const overallRate = total > 0 ? Math.round((attended / total) * 100) : 100;

    return { total, present, absent, late, excused, overallRate };
  }, [filteredRecords]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const url = `/api/attendance/export?batch=${encodeURIComponent(activeBatch)}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  const currentBatchObj = batches.find((b) => b.batchCode === activeBatch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E2ECEB] bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Filter Report:</span>
            <select
              value={activeBatch}
              onChange={(e) => setActiveBatch(e.target.value)}
              className="h-8.5 px-3 text-xs rounded-lg border border-[#E2ECEB] bg-white font-medium text-slate-800"
            >
              <option value="All">All Batches (Overall Institute)</option>
              {batches.map((b) => (
                <option key={b.batchCode} value={b.batchCode}>
                  {b.batchCode} · {b.batchName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              className="h-8.5 text-xs text-slate-700 border-[#E2ECEB] hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-8.5 text-xs bg-[#078783] hover:bg-[#066f6c] text-white flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Report</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="printable-attendance-report">
          {/* Institute Official Header */}
          <div className="border-b-2 border-[#078783] pb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0 bg-white rounded-lg p-1 border border-[#E2ECEB]">
                <Image
                  src="/assets/nextgen-dma-logo.png"
                  alt="Next Gen DMA Logo"
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  NEXT GEN DMA VENTURES
                </h1>
                <p className="text-xs font-semibold text-[#078783] uppercase tracking-wider">
                  INSTITUTE OF ADVANCED DIGITAL MEDIA, TECHNOLOGY & DESIGN
                </p>
                <p className="text-[11px] text-slate-500">
                  Affiliated Training & Vocational Excellence Center · Bengaluru, Karnataka
                </p>
              </div>
            </div>

            <div className="text-right">
              <Badge className="bg-[#E6F5F4] text-[#078783] border-[#078783]/30 font-bold px-3 py-1 text-xs">
                OFFICIAL ATTENDANCE REPORT
              </Badge>
              <p className="text-[11px] text-slate-500 mt-1">
                Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Report Scope & Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-[#E2ECEB] rounded-xl text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Batch Target:</span>
              <strong className="text-slate-900">
                {currentBatchObj ? `${currentBatchObj.batchCode} (${currentBatchObj.batchName})` : "All Active Cohorts"}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Course Stream:</span>
              <strong className="text-slate-900">{currentBatchObj ? currentBatchObj.courseName : "Multi-disciplinary"}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Trainer / Faculty:</span>
              <strong className="text-slate-900">{currentBatchObj ? currentBatchObj.trainer : "Academic Faculty Team"}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Scope Filter:</span>
              <strong className="text-slate-900">{dateRangeFilter}</strong>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-white border border-[#E2ECEB] rounded-xl text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Sessions</span>
              <p className="text-xl font-bold text-slate-900">{filteredRecords.length}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[11px] text-emerald-700 uppercase font-semibold">Present Records</span>
              <p className="text-xl font-bold text-emerald-700">{aggregateStats.present}</p>
            </div>
            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-center">
              <span className="text-[11px] text-rose-700 uppercase font-semibold">Absent Records</span>
              <p className="text-xl font-bold text-rose-700">{aggregateStats.absent}</p>
            </div>
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-center">
              <span className="text-[11px] text-amber-700 uppercase font-semibold">Late Check-ins</span>
              <p className="text-xl font-bold text-amber-700">{aggregateStats.late}</p>
            </div>
            <div className="p-3 bg-[#E6F5F4] border border-[#078783]/30 rounded-xl text-center">
              <span className="text-[11px] text-[#078783] uppercase font-semibold">Aggregate Rate</span>
              <p className="text-xl font-bold text-[#078783]">{aggregateStats.overallRate}%</p>
            </div>
          </div>

          {/* Student Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Student Attendance Performance Summary ({studentMap.length})
            </h3>
            <div className="border border-[#E2ECEB] rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#E2ECEB] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Student Code</th>
                    <th className="px-3.5 py-2.5">Full Name</th>
                    <th className="px-3.5 py-2.5">Batch</th>
                    <th className="px-3.5 py-2.5 text-center">Classes</th>
                    <th className="px-3.5 py-2.5 text-center">Present</th>
                    <th className="px-3.5 py-2.5 text-center">Absent</th>
                    <th className="px-3.5 py-2.5 text-center">Late</th>
                    <th className="px-3.5 py-2.5 text-center">Attendance %</th>
                    <th className="px-3.5 py-2.5 text-right">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2ECEB]">
                  {studentMap.map((stu) => (
                    <tr key={`${stu.studentCode}-${stu.batchCode}`} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5 font-semibold text-slate-700">{stu.studentCode}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{stu.studentName}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">{stu.batchCode}</td>
                      <td className="px-3.5 py-2.5 text-center font-medium">{stu.total}</td>
                      <td className="px-3.5 py-2.5 text-center text-emerald-700 font-semibold">{stu.present}</td>
                      <td className="px-3.5 py-2.5 text-center text-rose-600 font-semibold">{stu.absent}</td>
                      <td className="px-3.5 py-2.5 text-center text-amber-600 font-medium">{stu.late}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`font-bold ${
                            stu.percentage >= 75 ? "text-[#078783]" : "text-rose-600"
                          }`}
                        >
                          {stu.percentage}%
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        {stu.percentage >= 75 ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            Eligible
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                            ⚠️ Critical (&lt;75%)
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Institute Policy Note */}
          <div className="p-3 bg-slate-50 border border-[#E2ECEB] rounded-xl text-[11px] text-slate-500">
            <strong>Attendance Regulation:</strong> A minimum of 75% recorded attendance is mandatory for academic completion, practical project submission, and placement cell endorsement. Students marked with critical attendance must obtain clearance from the Academic Dean.
          </div>

          {/* Signatures Section */}
          <div className="pt-8 border-t border-[#E2ECEB] grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="border-b border-slate-300 w-48 mb-2"></div>
              <p className="font-bold text-slate-800">Faculty Trainer Signature</p>
              <p className="text-slate-500 text-[11px]">{currentBatchObj?.trainer || "Lead Instructor"}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="border-b border-slate-300 w-48 mb-2"></div>
              <p className="font-bold text-slate-800">Academic Director / Operations</p>
              <p className="text-slate-500 text-[11px]">NEXT GEN DMA VENTURES</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
