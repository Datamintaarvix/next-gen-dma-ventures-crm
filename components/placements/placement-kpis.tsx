"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  Award,
  Briefcase,
  Building2,
  CalendarCheck,
  TrendingUp,
  Clock,
  Sparkles,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import { PlacementKPIStats } from "@/lib/validations/placement";
import {
  COURSE_CATEGORIES,
  COURSE_CATALOGUE_BY_CATEGORY,
  ALL_COURSES,
} from "@/lib/courses";

interface PlacementKPIsProps {
  stats: PlacementKPIStats;
  selectedCourse?: string;
  onCourseFilterChange?: (course: string) => void;
  courses?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function PlacementKPIs({
  stats,
  selectedCourse = "All",
  onCourseFilterChange,
  courses = [],
  activeTab,
  onTabChange,
}: PlacementKPIsProps) {
  const kpiItems = [
    {
      id: "eligible",
      label: "Total Eligible Students",
      value: stats.totalEligibleStudents,
      subtext: "≥75% Attendance required",
      icon: Users,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
      borderAccent: "border-l-4 border-l-[#078783]",
      targetTab: "profiles",
    },
    {
      id: "placed",
      label: "Students Placed",
      value: stats.studentsPlaced,
      subtext: `${stats.totalOffersExtended} total offers rolled out`,
      icon: Award,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderAccent: "border-l-4 border-l-emerald-600",
      targetTab: "offers",
    },
    {
      id: "seeking",
      label: "Seeking Placement",
      value: stats.studentsSeekingPlacement,
      subtext: "Active in interview prep",
      icon: Clock,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderAccent: "border-l-4 border-l-amber-500",
      targetTab: "profiles",
    },
    {
      id: "companies",
      label: "Companies Registered",
      value: stats.companiesRegistered,
      subtext: "Active MOU & hiring partners",
      icon: Building2,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderAccent: "border-l-4 border-l-blue-600",
      targetTab: "companies",
    },
    {
      id: "jobs",
      label: "Active Job Drives",
      value: stats.activeJobOpportunities,
      subtext: "Open campus & off-campus drives",
      icon: Briefcase,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderAccent: "border-l-4 border-l-indigo-600",
      targetTab: "jobs",
    },
    {
      id: "interviews",
      label: "Interviews Scheduled",
      value: stats.interviewsScheduled,
      subtext: "Rounds in progress",
      icon: CalendarCheck,
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderAccent: "border-l-4 border-l-purple-600",
      targetTab: "applications",
    },
    {
      id: "successRate",
      label: "Placement Success Rate",
      value: `${stats.placementSuccessRate}%`,
      subtext: "Placed vs Eligible pool",
      icon: TrendingUp,
      color: "text-[#078783]",
      bgColor: "bg-teal-50",
      borderAccent: "border-l-4 border-l-[#078783]",
      targetTab: "offers",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Bar with Filter & Salary Highlight Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-[#192C34] to-[#254450] text-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm text-[#38B2AC]">
            <Sparkles className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-white">
              Placement Cell Highlights · AY 2026-27
            </h3>
            <p className="text-xs text-slate-300">
              Real-time recruitment tracking, student eligibility & verified hiring partner network
            </p>
          </div>
        </div>

        {/* Salary stats badge pill */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
            <span className="text-slate-300">Highest Package:</span>
            <span className="font-bold text-amber-300 flex items-center">
              ₹{stats.highestSalaryLPA.toFixed(1)} LPA
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
            <span className="text-slate-300">Average Package:</span>
            <span className="font-bold text-emerald-300 flex items-center">
              ₹{stats.averageSalaryLPA.toFixed(1)} LPA
            </span>
          </div>

          {courses.length > 0 && onCourseFilterChange && (
            <div className="flex items-center gap-1.5 text-xs bg-black/20 px-2 py-1 rounded-lg">
              <span className="text-slate-300">Course:</span>
              <select
                value={selectedCourse}
                onChange={(e) => onCourseFilterChange(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="All" className="bg-[#192C34] text-white">
                  All Courses ({ALL_COURSES.length})
                </option>
                {COURSE_CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={`── ${cat} (${COURSE_CATALOGUE_BY_CATEGORY[cat].length}) ──`} className="bg-[#192C34] text-[#8A9EA5] font-semibold">
                    {COURSE_CATALOGUE_BY_CATEGORY[cat].map((course) => (
                      <option key={course} value={course} className="bg-[#192C34] text-white">
                        {course}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 7 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpiItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.targetTab;

          return (
            <Card
              key={item.id}
              onClick={() => onTabChange && onTabChange(item.targetTab)}
              className={`p-3.5 bg-white border border-[#E2ECEB] rounded-xl hover:shadow-md transition-all duration-150 cursor-pointer ${
                item.borderAccent
              } ${isActive ? "ring-2 ring-[#078783] bg-teal-50/20" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg ${item.bgColor}`}>
                  <IconComponent className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
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
