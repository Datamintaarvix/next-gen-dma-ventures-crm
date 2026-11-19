"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  HeartHandshake,
  GraduationCap,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  StaffKPIStats,
  staffDepartmentEnum,
  employmentStatusEnum,
  StaffDepartment,
  EmploymentStatus,
} from "@/lib/validations/staff";

interface StaffKPIsProps {
  stats: StaffKPIStats;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onResetFilters: () => void;
}

export function StaffKPIs({
  stats,
  selectedDepartment,
  onDepartmentChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
}: StaffKPIsProps) {
  const kpiItems = [
    {
      id: "total",
      label: "Total Staff",
      value: stats.totalStaff,
      subtext: "Permanent & visiting faculty",
      icon: Users,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
      borderAccent: "border-l-4 border-l-[#078783]",
    },
    {
      id: "active",
      label: "Active Staff",
      value: stats.activeStaff,
      subtext: "On-duty personnel",
      icon: UserCheck,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderAccent: "border-l-4 border-l-emerald-600",
    },
    {
      id: "inactive",
      label: "Inactive / On Leave",
      value: stats.inactiveStaff,
      subtext: "Probation & on leave",
      icon: UserX,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderAccent: "border-l-4 border-l-amber-500",
    },
    {
      id: "counsellors",
      label: "Counsellors",
      value: stats.counsellors,
      subtext: "Admissions & career leads",
      icon: HeartHandshake,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderAccent: "border-l-4 border-l-blue-600",
    },
    {
      id: "trainers",
      label: "Trainers & Faculty",
      value: stats.trainers,
      subtext: "Domain technical mentors",
      icon: GraduationCap,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderAccent: "border-l-4 border-l-indigo-600",
    },
    {
      id: "administrators",
      label: "Administrators",
      value: stats.administrators,
      subtext: "Executive & dept managers",
      icon: ShieldCheck,
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderAccent: "border-l-4 border-l-purple-600",
    },
  ];

  const hasActiveFilters = selectedDepartment !== "All" || selectedStatus !== "All";

  return (
    <div className="space-y-4">
      {/* Top Banner with Integrated Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#192C34] to-[#254450] text-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm text-[#38B2AC]">
            <Sparkles className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">
              Institutional Staff Directory & Governance
            </h3>
            <p className="text-xs text-slate-300">
              Role-based access control, departmental assignments, and verified staff profiles
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-300 font-medium">Department:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-1"
            >
              <option value="All" className="bg-[#192C34] text-white">
                All Departments ({stats.totalStaff})
              </option>
              {staffDepartmentEnum.map((dept) => (
                <option key={dept} value={dept} className="bg-[#192C34] text-white">
                  {dept} ({stats.departmentCounts[dept] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-300 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-1"
            >
              <option value="All" className="bg-[#192C34] text-white">
                All Statuses
              </option>
              {employmentStatusEnum.map((st) => (
                <option key={st} value={st} className="bg-[#192C34] text-white">
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs text-teal-300 hover:text-white underline font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card
              key={item.id}
              className={`p-3.5 bg-white border border-[#E2ECEB] rounded-xl hover:shadow-md transition-all duration-150 ${item.borderAccent}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg ${item.bgColor}`}>
                  <IconComponent className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {item.value}
              </div>
              <div className="mt-1 text-[10px] text-slate-500 line-clamp-1">
                {item.subtext}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
