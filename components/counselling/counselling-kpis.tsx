"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  CheckCircle2,
  CalendarCheck,
  XCircle,
  UserX,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { CounsellingKPIStats } from "@/lib/validations/counselling";

interface CounsellingKPIsProps {
  stats: CounsellingKPIStats;
  activeStatusFilter?: string;
  onStatusFilterSelect?: (status: string) => void;
  selectedCounsellor?: string;
  onCounsellorFilterSelect?: (counsellor: string) => void;
  counsellors?: string[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export function CounsellingKPIs({
  stats,
  activeStatusFilter = "All",
  onStatusFilterSelect,
  selectedCounsellor = "All",
  onCounsellorFilterSelect,
  counsellors = [],
  selectedDate,
  onDateChange,
}: CounsellingKPIsProps) {
  const kpiItems = [
    {
      id: "total",
      label: "Total Sessions",
      value: stats.totalSessions,
      subtext: `${stats.convertedCount} Converted to Admissions`,
      icon: Calendar,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
      filterStatus: "All",
    },
    {
      id: "today",
      label: "Today's Sessions",
      value: stats.todaySessions,
      subtext: "Scheduled for today",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      filterStatus: "Today",
    },
    {
      id: "upcoming",
      label: "Upcoming Sessions",
      value: stats.upcomingSessions,
      subtext: "Confirmed & Scheduled",
      icon: CalendarCheck,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      filterStatus: "Upcoming",
    },
    {
      id: "completed",
      label: "Completed Sessions",
      value: stats.completedSessions,
      subtext: `${stats.conversionRate}% conversion rate`,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      filterStatus: "Completed",
    },
    {
      id: "cancelled",
      label: "Cancelled Sessions",
      value: stats.cancelledSessions,
      subtext: "Rescheduling required",
      icon: XCircle,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      filterStatus: "Cancelled",
    },
    {
      id: "no-show",
      label: "No-Show Sessions",
      value: stats.noShowSessions,
      subtext: "Follow-up SMS sent",
      icon: UserX,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      filterStatus: "No Show",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <UserCheck className="w-4 h-4 text-[#078783]" />
            <span>Filter by Counsellor:</span>
          </div>
          <select
            value={selectedCounsellor}
            onChange={(e) => onCounsellorFilterSelect && onCounsellorFilterSelect(e.target.value)}
            className="h-8.5 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#078783]/30"
          >
            <option value="All">All Counsellors (Team Overview)</option>
            {counsellors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {selectedDate && onDateChange && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
            <span>Filter Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-8.5 px-2.5 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#078783]/30"
            />
            {selectedDate !== "2026-11-18" && (
              <button
                type="button"
                onClick={() => onDateChange("2026-11-18")}
                className="text-xs text-[#078783] hover:underline font-medium"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid (6 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiItems.map((kpi) => {
          const Icon = kpi.icon;
          const isSelected = activeStatusFilter === kpi.filterStatus && kpi.filterStatus !== "All";

          return (
            <Card
              key={kpi.id}
              onClick={() => onStatusFilterSelect && onStatusFilterSelect(kpi.filterStatus)}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-[#078783] bg-teal-50/40 border-[#078783]"
                  : "bg-white border-[#E2ECEB] hover:border-[#078783]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bgColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
              </div>

              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {kpi.value}
              </div>

              <div className="mt-1 text-[11px] text-slate-500 truncate">
                {kpi.subtext}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
