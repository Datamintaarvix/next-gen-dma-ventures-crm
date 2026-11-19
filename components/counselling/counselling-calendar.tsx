"use client";

import React, { useState, useMemo } from "react";
import { CounsellingSessionRecord } from "@/lib/validations/counselling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Video,
  MapPin,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  UserX,
  ExternalLink,
  Edit2,
  RotateCcw,
} from "lucide-react";

interface CounsellingCalendarProps {
  sessions: CounsellingSessionRecord[];
  onSelectSession: (session: CounsellingSessionRecord) => void;
  onRescheduleSession: (session: CounsellingSessionRecord) => void;
  onCancelSession: (session: CounsellingSessionRecord) => void;
}

type CalendarViewMode = "daily" | "weekly" | "monthly";

export function CounsellingCalendar({
  sessions,
  onSelectSession,
  onRescheduleSession,
  onCancelSession,
}: CounsellingCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("weekly");
  // Reference date: 2026-11-18
  const [currentDate, setCurrentDate] = useState(new Date("2026-11-18T00:00:00"));

  const todayStr = "2026-11-18";

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
      case "Confirmed":
        return "bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100";
      case "Scheduled":
        return "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100";
      case "Cancelled":
        return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
      case "No Show":
        return "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "Video Call":
        return <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case "Phone":
        return <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case "In-person":
      default:
        return <Building2 className="w-3.5 h-3.5 text-[#078783] shrink-0" />;
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
    setCurrentDate(new Date("2026-11-18T00:00:00"));
  };

  // Week view dates calculation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(d.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  // Month view dates calculation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0
    const totalDays = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split("T")[0],
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: d.toISOString().split("T")[0],
      });
    }

    // Next month padding to fill complete weeks (up to 35 or 42)
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          date: d,
          isCurrentMonth: false,
          dateStr: d.toISOString().split("T")[0],
        });
      }
    }

    return days;
  }, [currentDate]);

  const formatDateHeader = () => {
    if (viewMode === "daily") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (viewMode === "weekly") {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xs overflow-hidden">
      {/* Calendar Header Navigation */}
      <div className="p-4 sm:p-5 border-b border-[#E2ECEB] flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="h-8.5 w-8.5 p-0 border-[#E2ECEB] hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="h-8.5 w-8.5 p-0 border-[#E2ECEB] hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8.5 text-xs font-semibold border-[#E2ECEB] text-slate-700 hover:bg-slate-100"
          >
            Today
          </Button>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 ml-2">
            {formatDateHeader()}
          </h2>
        </div>

        {/* View Mode Toggle: Day / Week / Month */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-[#E2ECEB]">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "daily"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Day View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "weekly"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Week View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "monthly"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* Calendar Grid Views */}
      <div className="p-4 sm:p-5">
        {/* 1. DAILY VIEW */}
        {viewMode === "daily" && (
          <div className="space-y-4">
            {(() => {
              const dateStr = currentDate.toISOString().split("T")[0];
              const daySessions = sessions.filter((s) => s.counsellingDate === dateStr);

              if (daySessions.length === 0) {
                return (
                  <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-[#E2ECEB]">
                    <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No counselling sessions scheduled for this day.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl border border-[#E2ECEB] bg-white hover:border-[#078783] hover:shadow-md transition-all space-y-3 cursor-pointer"
                      onClick={() => onSelectSession(s)}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-xs border-[#E2ECEB] text-slate-600">
                          {s.sessionCode}
                        </Badge>
                        <Badge className={`text-xs ${getStatusBadgeStyle(s.status)}`}>
                          {s.status}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 hover:text-[#078783]">
                          {s.personName}
                        </h4>
                        <p className="text-xs text-slate-500">{s.interestedCourse}</p>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-[#E2ECEB]/60">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#078783]" />
                          <span>{s.startTime} - {s.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getSessionTypeIcon(s.sessionType)}
                          <span>{s.sessionType} · {s.assignedCounsellor}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={s.purpose}>
                          Purpose: {s.purpose}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-slate-400">{s.meetingLocationOrLink}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRescheduleSession(s);
                            }}
                            className="p-1 text-slate-500 hover:text-[#078783] hover:bg-slate-100 rounded"
                            title="Reschedule"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancelSession(s);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Cancel"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* 2. WEEKLY VIEW */}
        {viewMode === "weekly" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5">
            {weekDays.map((day) => {
              const dateStr = day.toISOString().split("T")[0];
              const isToday = dateStr === todayStr;
              const daySessions = sessions.filter((s) => s.counsellingDate === dateStr);

              return (
                <div
                  key={dateStr}
                  className={`min-h-[260px] rounded-xl border flex flex-col p-2.5 transition-all ${
                    isToday
                      ? "bg-teal-50/30 border-[#078783] ring-1 ring-[#078783]"
                      : "bg-slate-50/50 border-[#E2ECEB]"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2ECEB] mb-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase text-slate-500">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className={`text-base font-bold ${isToday ? "text-[#078783]" : "text-slate-900"}`}>
                        {day.getDate()}
                      </div>
                    </div>
                    {daySessions.length > 0 && (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {daySessions.length}
                      </span>
                    )}
                  </div>

                  {/* Day appointments */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px]">
                    {daySessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 text-center py-6">
                        No sessions
                      </div>
                    ) : (
                      daySessions.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onSelectSession(s)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-xs space-y-1 ${getStatusBadgeStyle(
                            s.status
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold truncate text-[11px]">{s.personName}</span>
                            {getSessionTypeIcon(s.sessionType)}
                          </div>
                          <div className="text-[10px] flex items-center gap-1 font-medium opacity-90">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>{s.startTime}</span>
                          </div>
                          <div className="text-[10px] truncate opacity-80">
                            {s.assignedCounsellor}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. MONTHLY VIEW */}
        {viewMode === "monthly" && (
          <div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 uppercase pb-2 border-b border-[#E2ECEB]">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {monthDays.map((item) => {
                const isToday = item.dateStr === todayStr;
                const daySessions = sessions.filter((s) => s.counsellingDate === item.dateStr);

                return (
                  <div
                    key={item.dateStr}
                    className={`min-h-[90px] p-1.5 rounded-lg border flex flex-col transition-all ${
                      !item.isCurrentMonth
                        ? "opacity-40 bg-slate-100/50 border-slate-200"
                        : isToday
                        ? "bg-teal-50/40 border-[#078783] ring-1 ring-[#078783]"
                        : "bg-white border-[#E2ECEB] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={isToday ? "text-[#078783]" : "text-slate-700"}>
                        {item.date.getDate()}
                      </span>
                      {daySessions.length > 0 && (
                        <span className="text-[10px] px-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {daySessions.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 mt-1 overflow-hidden">
                      {daySessions.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onSelectSession(s)}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium border cursor-pointer ${getStatusBadgeStyle(
                            s.status
                          )}`}
                          title={`${s.startTime}: ${s.personName} (${s.status})`}
                        >
                          {s.startTime} {s.personName}
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <div
                          onClick={() => {
                            setCurrentDate(item.date);
                            setViewMode("daily");
                          }}
                          className="text-[10px] text-[#078783] font-bold text-center cursor-pointer hover:underline"
                        >
                          +{daySessions.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
