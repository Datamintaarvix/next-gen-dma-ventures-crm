"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  PlacementKPIStats,
  CoursePlacementReportItem,
  CompanyHiringReportItem,
} from "@/lib/validations/placement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Printer,
  FileSpreadsheet,
  Building2,
  Award,
  Users,
  TrendingUp,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Sparkles,
  Download,
} from "lucide-react";

interface PlacementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: PlacementKPIStats;
}

export function PlacementReportModal({
  isOpen,
  onClose,
  kpis,
}: PlacementReportModalProps) {
  const [courseReports, setCourseReports] = useState<CoursePlacementReportItem[]>([]);
  const [companyReports, setCompanyReports] = useState<CompanyHiringReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/placements/reports")
        .then((res) => res.json())
        .then((data) => {
          if (data.courseReports) setCourseReports(data.courseReports);
          if (data.companyReports) setCompanyReports(data.companyReports);
        })
        .catch((err) => console.error("Failed to load placement reports", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    window.open("/api/placements/export", "_blank");
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none">
        {/* Modal Top Bar - Hidden in Print */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#078783]/10 text-[#078783] rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Official Placement & Corporate Hiring Report
              </h3>
              <p className="text-xs text-slate-500">
                Printable institutional analytics document · Academic Year 2026-27
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs rounded-xl border-slate-300 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export CSV
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="text-xs rounded-xl bg-[#078783] hover:bg-[#066f6c] text-white flex items-center gap-1.5 font-semibold"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-800 print:overflow-visible print:p-4">
          {/* Official Letterhead */}
          <div className="flex items-center justify-between border-b-2 border-[#078783] pb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                <Image
                  src="/assets/nextgen-dma-logo.png"
                  alt="NEXT GEN DMA VENTURES Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  NEXT GEN DMA VENTURES
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#078783]">
                  Corporate Placement Cell & Career Development Centre
                </p>
                <p className="text-[11px] text-slate-500">
                  DMA Tech Park, Indiranagar, Bengaluru, Karnataka · placement@nextgendma.com
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-bold text-slate-900">PLACEMENT AUDIT REPORT</div>
              <div className="text-slate-500">AY 2026-27 (Fall / Winter)</div>
              <div className="text-[11px] text-slate-400 mt-1">Generated: {todayStr}</div>
            </div>
          </div>

          {/* Key Placement Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Eligible Candidates</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {kpis.totalEligibleStudents}
              </div>
              <div className="text-[10px] text-slate-400">≥75% Attendance certified</div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-xs text-emerald-800 font-medium">Students Placed</div>
              <div className="text-2xl font-bold text-emerald-900 mt-0.5">
                {kpis.studentsPlaced}
              </div>
              <div className="text-[10px] text-emerald-700">Verified joining letters</div>
            </div>

            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl">
              <div className="text-xs text-teal-800 font-medium">Placement Success Rate</div>
              <div className="text-2xl font-bold text-[#078783] mt-0.5">
                {kpis.placementSuccessRate}%
              </div>
              <div className="text-[10px] text-teal-700">Across active eligible pool</div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-xs text-amber-800 font-medium">Salary Highlights</div>
              <div className="text-base font-bold text-amber-900 mt-0.5">
                Avg: ₹{kpis.averageSalaryLPA.toFixed(1)} LPA
              </div>
              <div className="text-[11px] font-semibold text-amber-800">
                Peak: ₹{kpis.highestSalaryLPA.toFixed(1)} LPA
              </div>
            </div>
          </div>

          {/* 1. Course-wise Performance Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Award className="w-4 h-4 text-[#078783]" />
                Course-wise Placement Performance Breakdown
              </h3>
              <span className="text-xs text-slate-500">Live institute statistics</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Course Name</th>
                    <th className="py-2.5 px-2 text-center">Enrolled</th>
                    <th className="py-2.5 px-2 text-center">Eligible (≥75%)</th>
                    <th className="py-2.5 px-2 text-center">Placed</th>
                    <th className="py-2.5 px-2 text-center">Placement Rate</th>
                    <th className="py-2.5 px-3 text-right">Avg Package</th>
                    <th className="py-2.5 px-3 text-right">Max Package</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courseReports.map((c) => (
                    <tr key={c.courseName} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{c.courseName}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{c.totalStudents}</td>
                      <td className="py-2 px-2 text-center text-slate-800 font-medium">{c.eligibleStudents}</td>
                      <td className="py-2 px-2 text-center text-emerald-700 font-bold">{c.placedStudents}</td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`font-semibold ${
                            c.placementRate >= 75 ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {c.placementRate}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-700">
                        {c.avgPackageLPA > 0 ? `₹${c.avgPackageLPA.toFixed(1)} LPA` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {c.highestPackageLPA > 0 ? `₹${c.highestPackageLPA.toFixed(1)} LPA` : "—"}
                      </td>
                    </tr>
                  ))}
                  {courseReports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        No course data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Top Hiring Partner Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-[#078783]" />
              Corporate Hiring Partners & Selected Candidates
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Company Partner</th>
                    <th className="py-2.5 px-2">Industry</th>
                    <th className="py-2.5 px-2 text-center">Total Hired</th>
                    <th className="py-2.5 px-2 text-right">Avg Package</th>
                    <th className="py-2.5 px-3">Selected Candidates (Role & Package)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {companyReports.map((comp) => (
                    <tr key={comp.companyId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{comp.companyName}</td>
                      <td className="py-2.5 px-2 text-slate-600">{comp.industry}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-700">
                        {comp.hiredCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-800">
                        {comp.avgOfferedLPA > 0 ? `₹${comp.avgOfferedLPA.toFixed(1)} LPA` : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {comp.hiredStudents.length > 0 ? (
                          <div className="space-y-1">
                            {comp.hiredStudents.map((st) => (
                              <div
                                key={st.studentCode}
                                className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                              >
                                <span className="font-semibold text-slate-800">
                                  {st.studentName} ({st.studentCode})
                                </span>
                                <span className="text-slate-600">
                                  {st.jobTitle} ·{" "}
                                  <span className="font-bold text-emerald-700">₹{st.salaryLPA} LPA</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Interviews ongoing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Institutional Sign-off Block */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Head of Corporate Relations & Placements</p>
              <p className="text-[11px] text-slate-500">NEXT GEN DMA VENTURES</p>
              <div className="mt-8 border-t border-slate-300 w-44 pt-1 text-[10px] text-slate-400">
                Authorized Signatory & Seal
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-900">Academic Director & Head of Institution</p>
              <p className="text-[11px] text-slate-500">NEXT GEN DMA VENTURES</p>
              <div className="mt-8 ml-auto border-t border-slate-300 w-44 pt-1 text-[10px] text-slate-400">
                Verification & Approval
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
