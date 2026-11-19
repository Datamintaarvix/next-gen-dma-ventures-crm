"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Bell,
  BellRing,
  Star,
  CheckCheck,
  Archive,
  AlertTriangle,
  Sparkles,
  Filter,
} from "lucide-react";
import { NotificationKPIStats } from "@/lib/validations/notification";

interface NotificationKPIsProps {
  stats: NotificationKPIStats;
  activeStatusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onMarkAllAsRead: () => void;
  isMarkingAllRead: boolean;
}

export function NotificationKPIs({
  stats,
  activeStatusFilter,
  onStatusFilterChange,
  onMarkAllAsRead,
  isMarkingAllRead,
}: NotificationKPIsProps) {
  const kpiItems = [
    {
      id: "All",
      label: "Total Notifications",
      value: stats.total,
      subtext: "Active CRM events",
      icon: Bell,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
      borderAccent: "border-l-4 border-l-[#078783]",
    },
    {
      id: "Unread",
      label: "Unread Notifications",
      value: stats.unread,
      subtext: "Require team action",
      icon: BellRing,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderAccent: "border-l-4 border-l-amber-500",
    },
    {
      id: "Urgent",
      label: "Urgent Action Required",
      value: stats.urgent,
      subtext: "Overdue & attendance alerts",
      icon: AlertTriangle,
      color: "text-rose-700",
      bgColor: "bg-rose-50",
      borderAccent: "border-l-4 border-l-rose-500",
    },
    {
      id: "Important",
      label: "Flagged Important",
      value: stats.important,
      subtext: "High-priority items",
      icon: Star,
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderAccent: "border-l-4 border-l-yellow-500",
    },
    {
      id: "Read",
      label: "Read / Reviewed",
      value: stats.read,
      subtext: "Processed alerts",
      icon: CheckCheck,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderAccent: "border-l-4 border-l-emerald-600",
    },
    {
      id: "Archived",
      label: "Archived Records",
      value: stats.archived,
      subtext: "Historical logs",
      icon: Archive,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      borderAccent: "border-l-4 border-l-slate-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#192C34] to-[#254450] text-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm text-[#38B2AC]">
            <Sparkles className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">
              Institutional Notification & Alert Dispatch
            </h3>
            <p className="text-xs text-slate-300">
              Real-time synchronization across leads, counselling, payments, batches, attendance & placements
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {stats.unread > 0 && (
            <button
              onClick={onMarkAllAsRead}
              disabled={isMarkingAllRead}
              className="bg-[#078783] hover:bg-[#066f6c] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read ({stats.unread})</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiItems.map((item) => {
          const IconComponent = item.icon;
          const isSelected = activeStatusFilter === item.id;
          return (
            <Card
              key={item.id}
              onClick={() => onStatusFilterChange(item.id)}
              className={`p-3.5 bg-white border border-[#E2ECEB] rounded-xl hover:shadow-md transition-all duration-150 cursor-pointer ${
                item.borderAccent
              } ${isSelected ? "ring-2 ring-[#078783] bg-teal-50/20 shadow-xs" : ""}`}
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
