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
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Percent,
} from "lucide-react";
import { CounsellingSessionRecord, CounsellorPerformanceStat } from "@/lib/validations/counselling";

interface CounsellingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CounsellingSessionRecord[];
}

export function CounsellingReportModal({
  isOpen,
  onClose,
  sessions,
}: CounsellingReportModalProps) {
  const [activeTab, setActiveTab] = useState<"counsellors" | "conversions">("counsellors");

  // Counsellor Performance Summary
  const counsellorStats = useMemo(() => {
    const map = new Map<string, CounsellorPerformanceStat>();

    sessions.forEach((s) => {
      const c = s.assignedCounsellor;
      const curr = map.get(c) || {
        counsellorName: c,
        totalAssigned: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        convertedToAdmission: 0,
        conversionRate: 0,
        avgDurationMinutes: 45,
      };

      curr.totalAssigned++;
      if (s.status === "Completed") curr.completed++;
      else if (s.status === "Cancelled") curr.cancelled++;
      else if (s.status === "No Show") curr.noShow++;

      if (s.isConvertedToAdmission) {
        curr.convertedToAdmission++;
      }

      map.set(c, curr);
    });

    return Array.from(map.values()).map((c) => ({
      ...c,
      conversionRate: c.completed > 0 ? Math.round((c.convertedToAdmission / c.completed) * 100) : 0,
    }));
  }, [sessions]);

  // Converted sessions list
  const convertedSessions = useMemo(() => {
    return sessions.filter((s) => s.isConvertedToAdmission);
  }, [sessions]);

  // Aggregate metrics
  const totalCompleted = sessions.filter((s) => s.status === "Completed").length;
  const totalConverted = convertedSessions.length;
  const overallConversionRate = totalCompleted > 0 ? Math.round((totalConverted / totalCompleted) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    window.open("/api/counselling/export", "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E2ECEB] bg-slate-50 print:hidden">
          {/* Tab Selector */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-[#E2ECEB]">
            <button
              type="button"
              onClick={() => setActiveTab("counsellors")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === "counsellors"
                  ? "bg-[#078783] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Counsellor Performance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("conversions")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === "conversions"
                  ? "bg-[#078783] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admissions Conversion Report ({convertedSessions.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
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

        {/* Printable Report Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="printable-counselling-report">
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
                  Career Guidance, Counselling & Admissions Conversion Audit
                </p>
              </div>
            </div>

            <div className="text-right">
              <Badge className="bg-[#E6F5F4] text-[#078783] border-[#078783]/30 font-bold px-3 py-1 text-xs">
                OFFICIAL COUNSELLING AUDIT REPORT
              </Badge>
              <p className="text-[11px] text-slate-500 mt-1">
                Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Aggregate KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-[#E2ECEB] rounded-xl text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Sessions</span>
              <p className="text-xl font-bold text-slate-900">{sessions.length}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[11px] text-emerald-700 uppercase font-semibold">Completed</span>
              <p className="text-xl font-bold text-emerald-700">{totalCompleted}</p>
            </div>
            <div className="p-3 bg-[#E6F5F4] border border-[#078783]/30 rounded-xl text-center">
              <span className="text-[11px] text-[#078783] uppercase font-semibold">Admissions Converted</span>
              <p className="text-xl font-bold text-[#078783]">{totalConverted}</p>
            </div>
            <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-center">
              <span className="text-[11px] text-teal-800 uppercase font-semibold">Conversion Rate</span>
              <p className="text-xl font-bold text-teal-800">{overallConversionRate}%</p>
            </div>
          </div>

          {/* Tab 1: Counsellor Performance Leaderboard */}
          {activeTab === "counsellors" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Counsellor Conversion & Performance Breakdown ({counsellorStats.length} Counsellors)
              </h3>
              <div className="border border-[#E2ECEB] rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E2ECEB] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Counsellor Name</th>
                      <th className="px-4 py-2.5 text-center">Total Sessions</th>
                      <th className="px-4 py-2.5 text-center">Completed</th>
                      <th className="px-4 py-2.5 text-center">Cancelled</th>
                      <th className="px-4 py-2.5 text-center">No-Show</th>
                      <th className="px-4 py-2.5 text-center">Converted</th>
                      <th className="px-4 py-2.5 text-right">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2ECEB]">
                    {counsellorStats.map((c) => (
                      <tr key={c.counsellorName} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-900">{c.counsellorName}</td>
                        <td className="px-4 py-3 text-center font-medium">{c.totalAssigned}</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-semibold">{c.completed}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{c.cancelled}</td>
                        <td className="px-4 py-3 text-center text-rose-600">{c.noShow}</td>
                        <td className="px-4 py-3 text-center font-bold text-[#078783]">{c.convertedToAdmission}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            className={`text-xs ${
                              c.conversionRate >= 70
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {c.conversionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Admission Conversion Detail */}
          {activeTab === "conversions" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Sessions Resulting in Confirmed Admissions ({convertedSessions.length})
              </h3>
              <div className="border border-[#E2ECEB] rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E2ECEB] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-3.5 py-2.5">Candidate Name</th>
                      <th className="px-3.5 py-2.5">Session Code</th>
                      <th className="px-3.5 py-2.5">Counsellor</th>
                      <th className="px-3.5 py-2.5">Session Date</th>
                      <th className="px-3.5 py-2.5">Enrolled Course</th>
                      <th className="px-3.5 py-2.5 text-right">Admission ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2ECEB]">
                    {convertedSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-3 font-bold text-slate-900">{s.personName}</td>
                        <td className="px-3.5 py-3 font-mono text-slate-600">{s.sessionCode}</td>
                        <td className="px-3.5 py-3 text-slate-700 font-medium">{s.assignedCounsellor}</td>
                        <td className="px-3.5 py-3 text-slate-600">{s.counsellingDate}</td>
                        <td className="px-3.5 py-3 text-slate-800 font-medium">{s.interestedCourse}</td>
                        <td className="px-3.5 py-3 text-right">
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-xs">
                            {s.admissionCode || "Enrolled"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Policy & Methodology Note */}
          <div className="p-3 bg-slate-50 border border-[#E2ECEB] rounded-xl text-[11px] text-slate-500">
            <strong>Conversion Attribution:</strong> Conversion rate is computed as completed career counselling consultations that culminated in verified institute admissions. Follow-ups linked to counselling sessions are monitored through the unified CRM pipeline.
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-[#E2ECEB] grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="border-b border-slate-300 w-48 mb-2"></div>
              <p className="font-bold text-slate-800">Lead Academic Counsellor</p>
              <p className="text-slate-500 text-[11px]">Priya Nair · Admissions Cell</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="border-b border-slate-300 w-48 mb-2"></div>
              <p className="font-bold text-slate-800">Academic Director / Center Head</p>
              <p className="text-slate-500 text-[11px]">NEXT GEN DMA VENTURES</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
