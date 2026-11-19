"use client";

import React, { useState } from "react";
import { FollowUpRecord } from "@/lib/validations/follow-up";
import { Bell, AlertCircle, Info, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface ReminderBannerProps {
  followUps: FollowUpRecord[];
  selectedCounsellor?: string;
  onSelectFollowUp?: (followUp: FollowUpRecord) => void;
}

export function ReminderBanner({
  followUps,
  selectedCounsellor,
  onSelectFollowUp,
}: ReminderBannerProps) {
  const [showArchInfo, setShowArchInfo] = useState(false);
  const todayStr = "2026-11-17";

  // Filter based on counsellor if selected
  const activeFollowUps = selectedCounsellor && selectedCounsellor !== "All"
    ? followUps.filter((f) => f.assignedCounsellor === selectedCounsellor)
    : followUps;

  const overdueList = activeFollowUps.filter(
    (f) => f.followUpDate < todayStr && f.status !== "Completed" && f.status !== "Cancelled"
  );

  const todayPendingList = activeFollowUps.filter(
    (f) => f.followUpDate === todayStr && f.status === "Pending"
  );

  if (overdueList.length === 0 && todayPendingList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Active Reminder Alerts */}
      <div className="bg-white border border-[#E2ECEB] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#11232B]">
                Follow-up Reminders & Alerts
                {selectedCounsellor && selectedCounsellor !== "All" && (
                  <span className="text-[#078783] font-medium ml-1">
                    ({selectedCounsellor})
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-[#5A7178]">
                {overdueList.length > 0 && (
                  <span className="text-red-600 font-semibold mr-2">
                    {overdueList.length} Overdue
                  </span>
                )}
                {todayPendingList.length > 0 && (
                  <span className="text-[#078783] font-semibold">
                    {todayPendingList.length} Scheduled for Today
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowArchInfo(!showArchInfo)}
            className="flex items-center gap-1 text-[11px] text-[#5A7178] hover:text-[#11232B] font-medium px-2 py-1 rounded hover:bg-[#F3F8F7]"
          >
            <Info className="w-3.5 h-3.5 text-[#078783]" />
            <span className="hidden sm:inline">Reminder System Status</span>
            {showArchInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Actionable Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {overdueList.slice(0, 3).map((f) => (
            <div
              key={f.id}
              onClick={() => onSelectFollowUp && onSelectFollowUp(f)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] cursor-pointer hover:bg-red-100 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="font-semibold">{f.studentName}</span>
              <span className="text-red-600 font-mono">({f.followUpDate} · {f.followUpTime})</span>
              <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.2 rounded font-medium">
                {f.type}
              </span>
            </div>
          ))}

          {todayPendingList.slice(0, 3).map((f) => (
            <div
              key={f.id}
              onClick={() => onSelectFollowUp && onSelectFollowUp(f)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#E6F5F4] border border-[#BDE7E5] text-[#078783] text-[11px] cursor-pointer hover:bg-[#D5EFEF] transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#078783] shrink-0" />
              <span className="font-semibold">{f.studentName}</span>
              <span className="font-mono">({f.followUpTime})</span>
              <span className="text-[10px] bg-white text-[#078783] border border-[#078783]/30 px-1.5 py-0.2 rounded font-medium">
                {f.type}
              </span>
            </div>
          ))}
        </div>

        {/* Transparent reminder architecture explanation (Requirement 7) */}
        {showArchInfo && (
          <div className="p-3 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] text-xs text-[#5A7178] space-y-1.5 animate-in fade-in duration-100">
            <div className="font-semibold text-[#11232B] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#078783]" />
              <span>Reminder System Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              <strong>In-App Reminders:</strong> Active. Notifications, overdue badges, and counsellor-specific alerts are computed in real time from database schedules.
            </p>
            <p className="text-[11px] leading-relaxed">
              <strong>External Background Reminders (WhatsApp/SMS/Email when offline):</strong> Automated background dispatch requires a server-side cron runner (e.g. Vercel Cron or Node job worker) connected to a messaging provider (Twilio or WhatsApp Business Cloud API).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

