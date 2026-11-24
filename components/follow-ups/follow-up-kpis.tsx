import React from "react";
import { Card } from "@/components/ui/card";
import { FollowUpRecord } from "@/lib/validations/follow-up";
import { getIndiaTodayStr } from "@/lib/utils";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  Layers,
} from "lucide-react";

interface FollowUpKPIsProps {
  followUps: FollowUpRecord[];
  activeFilter?: string;
  onFilterSelect?: (filter: string) => void;
}

export function FollowUpKPIs({
  followUps,
  activeFilter = "All",
  onFilterSelect,
}: FollowUpKPIsProps) {
  // Respect India Standard Time (Asia/Kolkata)
  const todayStr = getIndiaTodayStr();

  const totalCount = followUps.length;

  const todayCount = followUps.filter(
    (f) => f.followUpDate === todayStr && f.status !== "Completed" && f.status !== "Cancelled"
  ).length;

  const upcomingCount = followUps.filter(
    (f) => f.followUpDate > todayStr && f.status !== "Completed" && f.status !== "Cancelled"
  ).length;

  const overdueCount = followUps.filter(
    (f) => f.followUpDate < todayStr && f.status !== "Completed" && f.status !== "Cancelled"
  ).length;

  const completedCount = followUps.filter((f) => f.status === "Completed").length;

  const pendingCount = followUps.filter((f) => f.status === "Pending").length;

  const kpis = [
    {
      label: "Total Follow-ups",
      count: totalCount,
      filterKey: "All",
      icon: Layers,
      color: "text-[#11232B]",
      bgColor: "bg-[#F3F8F7]",
    },
    {
      label: "Today's Follow-ups",
      count: todayCount,
      filterKey: "today",
      icon: Calendar,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "Upcoming Follow-ups",
      count: upcomingCount,
      filterKey: "upcoming",
      icon: Clock,
      color: "text-[#2563EB]",
      bgColor: "bg-[#EFF6FF]",
    },
    {
      label: "Overdue Follow-ups",
      count: overdueCount,
      filterKey: "overdue",
      icon: AlertCircle,
      color: "text-[#DC2626]",
      bgColor: "bg-[#FEF2F2]",
    },
    {
      label: "Completed Follow-ups",
      count: completedCount,
      filterKey: "completed",
      icon: CheckCircle2,
      color: "text-[#059669]",
      bgColor: "bg-[#ECFDF5]",
    },
    {
      label: "Pending Follow-ups",
      count: pendingCount,
      filterKey: "pending",
      icon: ListFilter,
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.filterKey;

        return (
          <Card
            key={kpi.label}
            onClick={() => onFilterSelect && onFilterSelect(kpi.filterKey)}
            className={`p-3.5 sm:p-4 bg-white border cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? "border-[#078783] ring-1 ring-[#078783] bg-[#FAFCFB]"
                : "border-[#E2ECEB]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#5A7178] font-medium leading-tight truncate">
                {kpi.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg ${kpi.bgColor} ${kpi.color} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#11232B] tracking-tight">
              {kpi.count}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
