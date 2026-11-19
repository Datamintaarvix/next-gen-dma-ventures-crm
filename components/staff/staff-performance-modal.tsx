"use client";

import React, { useState, useEffect } from "react";
import { StaffPerformanceSummary, StaffDepartment, staffDepartmentEnum } from "@/lib/validations/staff";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  TrendingUp,
  Award,
  Users,
  HeartHandshake,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  CalendarCheck,
  Search,
  Filter,
} from "lucide-react";

interface StaffPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffPerformanceModal({ isOpen, onClose }: StaffPerformanceModalProps) {
  const [performanceList, setPerformanceList] = useState<StaffPerformanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/staff/performance")
        .then((res) => res.json())
        .then((data) => {
          if (data.performance) setPerformanceList(data.performance);
        })
        .catch((err) => console.error("Failed to load staff performance metrics", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = performanceList.filter((p) => {
    const matchDept = selectedDept === "All" || p.department === selectedDept;
    const matchSearch =
      p.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Staff Performance & Operational Productivity Scorecard
              </h3>
              <p className="text-xs text-slate-500">
                Live metrics aggregated from CRM leads, counselling, batches, attendance & placements
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

        {/* Filters Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#078783]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none font-medium cursor-pointer"
            >
              <option value="All">All Departments</option>
              {staffDepartmentEnum.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F9FBFA] text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member & Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-2 text-center">Leads Handled</th>
                  <th className="py-3 px-2 text-center">Converted</th>
                  <th className="py-3 px-2 text-center">Conversion %</th>
                  <th className="py-3 px-2 text-center">Counselling</th>
                  <th className="py-3 px-2 text-center">Batches / Students</th>
                  <th className="py-3 px-2 text-center">Attendance Sessions</th>
                  <th className="py-3 px-2 text-center">Placements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.staffId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.staffName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.staffId} · {p.role}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.department}</td>

                    {/* Leads Handled */}
                    <td className="py-3 px-2 text-center font-semibold text-slate-800">
                      {p.leadsAssigned > 0 ? p.leadsAssigned : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Converted */}
                    <td className="py-3 px-2 text-center font-bold text-emerald-700">
                      {p.leadsConverted > 0 ? p.leadsConverted : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-3 px-2 text-center">
                      {p.leadsAssigned > 0 ? (
                        <Badge
                          className={`text-[10px] font-bold ${
                            p.conversionRate >= 25
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-teal-50 text-teal-800"
                          }`}
                        >
                          {p.conversionRate}%
                        </Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Counselling */}
                    <td className="py-3 px-2 text-center font-medium text-slate-700">
                      {p.counsellingSessionsCompleted > 0 ? (
                        <span>
                          {p.counsellingSessionsCompleted} / {p.counsellingSessionsTotal}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Batches / Students */}
                    <td className="py-3 px-2 text-center">
                      {p.batchesAssigned > 0 ? (
                        <div className="text-[11px] font-semibold text-indigo-700">
                          {p.batchesAssigned} batches ({p.studentsTrained} stu)
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Attendance sessions */}
                    <td className="py-3 px-2 text-center font-semibold text-slate-800">
                      {p.attendanceSessionsTaken > 0 ? (
                        p.attendanceSessionsTaken
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Placements */}
                    <td className="py-3 px-2 text-center font-bold text-teal-700">
                      {p.placementOffersRecorded > 0 ? (
                        `${p.placementOffersRecorded} offers`
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No staff performance records match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
