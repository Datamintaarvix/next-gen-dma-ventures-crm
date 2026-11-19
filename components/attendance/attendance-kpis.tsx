"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { AttendanceKPIStats } from "@/lib/validations/attendance";

interface AttendanceKPIsProps {
  stats: AttendanceKPIStats;
  activeStatusFilter?: string;
  onStatusFilterSelect?: (status: string) => void;
  selectedBatch?: string;
  onBatchFilterSelect?: (batch: string) => void;
  batches?: { batchCode: string; batchName: string }[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export function AttendanceKPIs({
  stats,
  activeStatusFilter = "All",
  onStatusFilterSelect,
  selectedBatch = "All",
  onBatchFilterSelect,
  batches = [],
  selectedDate,
  onDateChange,
}: AttendanceKPIsProps) {
  const isHealthyAttendance = stats.overallPercentage >= 75;

  const kpiCards = [
    {
      id: "total",
      label: "Total Students",
      value: stats.totalStudents,
      subtext: `${stats.activeBatchesCount} Active Batches`,
      icon: Users,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
      borderColor: "border-[#078783]/20",
      filterStatus: "All",
    },
    {
      id: "present",
      label: "Present Today",
      value: stats.presentToday,
      subtext: stats.totalStudents > 0
        ? `${Math.round((stats.presentToday / stats.totalStudents) * 100)}% of roster`
        : "Recorded today",
      icon: UserCheck,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      filterStatus: "Present",
    },
    {
      id: "absent",
      label: "Absent Today",
      value: stats.absentToday,
      subtext: stats.absentToday > 0 ? "Requires follow-up" : "Zero absences",
      icon: UserX,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      filterStatus: "Absent",
    },
    {
      id: "late",
      label: "Late Arrivals",
      value: stats.lateArrivals,
      subtext: stats.lateArrivals > 0 ? "Check-in after start" : "Punctual cohort",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      filterStatus: "Late",
    },
    {
      id: "overall",
      label: "Overall Attendance",
      value: `${stats.overallPercentage}%`,
      subtext: isHealthyAttendance
        ? "Above 75% requirement"
        : `${stats.lowAttendanceCount} students below 75%`,
      icon: isHealthyAttendance ? TrendingUp : AlertTriangle,
      color: isHealthyAttendance ? "text-[#078783]" : "text-amber-600",
      bgColor: isHealthyAttendance ? "bg-[#E6F5F4]" : "bg-amber-50",
      borderColor: isHealthyAttendance ? "border-[#078783]/20" : "border-amber-300",
      filterStatus: "All",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Filter Bar for Date and Batch */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <GraduationCap className="w-4 h-4 text-[#078783]" />
            <span>Filter KPIs by Batch:</span>
          </div>
          <select
            value={selectedBatch}
            onChange={(e) => onBatchFilterSelect && onBatchFilterSelect(e.target.value)}
            className="h-8.5 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#078783]/30 transition-colors"
          >
            <option value="All">All Batches (Overall Institute)</option>
            {batches.map((b) => (
              <option key={b.batchCode} value={b.batchCode}>
                {b.batchCode} · {b.batchName}
              </option>
            ))}
          </select>
        </div>

        {selectedDate && onDateChange && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
            <span>Attendance Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-8.5 px-2.5 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#078783]/30"
            />
            {selectedDate !== new Date().toISOString().split("T")[0] && (
              <button
                type="button"
                onClick={() => onDateChange(new Date().toISOString().split("T")[0])}
                className="text-xs text-[#078783] hover:underline font-medium"
              >
                Reset to Today
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const isSelected = activeStatusFilter === kpi.filterStatus && kpi.filterStatus !== "All";

          return (
            <Card
              key={kpi.id}
              onClick={() => onStatusFilterSelect && onStatusFilterSelect(kpi.filterStatus)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-[#078783] bg-teal-50/40 border-[#078783]"
                  : "bg-white border-[#E2ECEB] hover:border-[#078783]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {kpi.value}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <span>{kpi.subtext}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
