"use client";

import React, { useState } from "react";
import { FollowUpRecord } from "@/lib/validations/follow-up";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface FollowUpCalendarProps {
  followUps: FollowUpRecord[];
  onSelectFollowUp: (followUp: FollowUpRecord) => void;
}

type ViewMode = "daily" | "weekly" | "monthly";

export function FollowUpCalendar({
  followUps,
  onSelectFollowUp,
}: FollowUpCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  // Reference date (2026-11-17)
  const [currentDate, setCurrentDate] = useState(new Date("2026-11-17T00:00:00"));

  const todayStr = "2026-11-17";

  const getStatusStyle = (f: FollowUpRecord) => {
    if (f.status === "Completed") {
      return "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
    }
    if (f.followUpDate < todayStr && f.status !== "Cancelled") {
      return "bg-red-50 text-red-800 border-red-200 hover:bg-red-100";
    }
    if (f.status === "Rescheduled") {
      return "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100";
    }
    return "bg-[#E6F5F4] text-[#078783] border-[#BDE7E5] hover:bg-[#D5EFEF]";
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Phone Call":
        return <Phone className="w-3 h-3 shrink-0" />;
      case "WhatsApp":
        return <MessageSquare className="w-3 h-3 shrink-0 text-emerald-600" />;
      case "Email":
        return <Mail className="w-3 h-3 shrink-0" />;
      default:
        return <CalendarIcon className="w-3 h-3 shrink-0 text-[#078783]" />;
    }
  };

  // Navigate calendar
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "daily") d.setDate(d.getDate() - 1);
    else if (viewMode === "weekly") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "daily") d.setDate(d.getDate() + 1);
    else if (viewMode === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date("2026-11-17T00:00:00"));
  };

  // Helper for formatting YYYY-MM-DD
  const formatISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 1. DAILY VIEW
  const renderDailyView = () => {
    const dateStr = formatISO(currentDate);
    const dayFollowUps = followUps.filter((f) => f.followUpDate === dateStr);

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2ECEB]">
          <h3 className="font-bold text-sm text-[#11232B]">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>
          <span className="text-xs text-[#5A7178]">
            {dayFollowUps.length} follow-ups scheduled
          </span>
        </div>

        {dayFollowUps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dayFollowUps.map((f) => (
              <div
                key={f.id}
                onClick={() => onSelectFollowUp(f)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${getStatusStyle(
                  f
                )}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs truncate">{f.studentName}</span>
                  <span className="font-mono text-[11px] font-semibold">{f.followUpTime}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {getIcon(f.type)}
                  <span>{f.type}</span>
                  <span>· {f.assignedCounsellor}</span>
                  <span className="ml-auto font-semibold uppercase text-[10px]">
                    {f.status}
                  </span>
                </div>
                {f.notes && (
                  <p className="text-[11px] mt-2 pt-1 border-t border-black/5 line-clamp-2">
                    {f.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-[#8A9EA5] text-xs">
            No follow-ups scheduled for this day.
          </div>
        )}
      </div>
    );
  };

  // 2. WEEKLY VIEW
  const renderWeeklyView = () => {
    // Calculate week start (Sunday or Monday)
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1)); // Monday start

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-[#E2ECEB] min-h-[360px]">
        {weekDays.map((date) => {
          const dateStr = formatISO(date);
          const isToday = dateStr === todayStr;
          const items = followUps.filter((f) => f.followUpDate === dateStr);

          return (
            <div
              key={dateStr}
              className={`p-2.5 sm:p-2 space-y-2 flex flex-col ${isToday ? "bg-[#F3F8F7]/70" : "bg-white"
                }`}
            >
              {/* Day Header */}
              <div
                className={`text-center pb-1.5 border-b border-[#E2ECEB] ${isToday ? "font-bold text-[#078783]" : "text-[#5A7178]"
                  }`}
              >
                <div className="text-[10px] uppercase font-semibold">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={`text-xs inline-block rounded-full w-6 h-6 leading-6 text-center mt-0.5 ${isToday ? "bg-[#078783] text-white" : "text-[#11232B] font-semibold"
                    }`}
                >
                  {date.getDate()}
                </div>
              </div>

              {/* Day items */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-72">
                {items.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => onSelectFollowUp(f)}
                    className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all leading-tight ${getStatusStyle(
                      f
                    )}`}
                  >
                    <div className="font-semibold truncate">{f.studentName}</div>
                    <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                      <span>{f.followUpTime}</span>
                      <span>{f.type.split(" ")[0]}</span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-[#A0B2B8]">
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 3. MONTHLY VIEW
  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon index
    const totalDaysInMonth = lastDay.getDate();

    const daysArray: (Date | null)[] = [];
    for (let i = 0; i < startingDayIndex; i++) {
      daysArray.push(null);
    }
    for (let d = 1; d <= totalDaysInMonth; d++) {
      daysArray.push(new Date(year, month, d));
    }

    return (
      <div className="p-3">
        {/* Month Day Names */}
        <div className="grid grid-cols-7 text-center pb-2 border-b border-[#E2ECEB] text-[11px] font-bold text-[#5A7178]">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 border-b border-l border-[#E2ECEB]">
          {daysArray.map((date, idx) => {
            if (!date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-20 bg-[#FAFCFB] border-r border-t border-[#E2ECEB]"
                />
              );
            }

            const dateStr = formatISO(date);
            const isToday = dateStr === todayStr;
            const items = followUps.filter((f) => f.followUpDate === dateStr);

            return (
              <div
                key={dateStr}
                className={`h-20 p-1 border-r border-t border-[#E2ECEB] overflow-hidden flex flex-col ${isToday ? "bg-[#F3F8F7]" : "bg-white"
                  }`}
              >
                <div className="text-right">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block ${isToday ? "bg-[#078783] text-white" : "text-[#5A7178]"
                      }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
                <div className="space-y-1 flex-1 overflow-hidden mt-0.5">
                  {items.slice(0, 2).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onSelectFollowUp(f)}
                      className={`px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer font-medium border ${getStatusStyle(
                        f
                      )}`}
                    >
                      {f.followUpTime} {f.studentName}
                    </div>
                  ))}
                  {items.length > 2 && (
                    <div className="text-[9px] text-[#078783] font-bold px-1">
                      +{items.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
      {/* Calendar Navigation Header */}
      <div className="p-3.5 sm:p-4 border-b border-[#E2ECEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFCFB]">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrev}
            className="h-8 w-8 p-0"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToday}
            className="h-8 text-xs px-2.5"
          >
            Today
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            className="h-8 w-8 p-0"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <h2 className="text-sm font-bold text-[#11232B] ml-2">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F3F8F7] p-1 rounded-lg border border-[#E2ECEB] self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${viewMode === "daily"
              ? "bg-white text-[#078783] shadow-xs font-bold"
              : "text-[#5A7178] hover:text-[#11232B]"
              }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${viewMode === "weekly"
              ? "bg-white text-[#078783] shadow-xs font-bold"
              : "text-[#5A7178] hover:text-[#11232B]"
              }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${viewMode === "monthly"
              ? "bg-white text-[#078783] shadow-xs font-bold"
              : "text-[#5A7178] hover:text-[#11232B]"
              }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Calendar Body */}
      {viewMode === "daily" && renderDailyView()}
      {viewMode === "weekly" && renderWeeklyView()}
      {viewMode === "monthly" && renderMonthlyView()}

      {/* Color legend footer */}
      <div className="p-3 border-t border-[#E2ECEB] bg-[#FAFCFB] flex items-center justify-between flex-wrap gap-3 text-[11px] text-[#5A7178]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#078783]" />
            <span>Pending (Active)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            <span>Overdue / Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span>Rescheduled</span>
          </div>
        </div>
        <span className="italic text-[10px]">Click any event to view and manage</span>
      </div>
    </div>
  );
}

