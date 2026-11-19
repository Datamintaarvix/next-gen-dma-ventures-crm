import React from "react";
import { Card } from "@/components/ui/card";
import { EnquiryRecord } from "@/lib/validations/enquiry";
import {
  Inbox,
  Sparkles,
  Clock,
  Activity,
  CheckCircle2,
  Archive,
} from "lucide-react";

interface EnquiryDashboardKPIsProps {
  enquiries: EnquiryRecord[];
  onFilterStatus?: (status: string) => void;
  activeStatusFilter?: string;
}

export function EnquiryDashboardKPIs({
  enquiries,
  onFilterStatus,
  activeStatusFilter = "All",
}: EnquiryDashboardKPIsProps) {
  const total = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === "New").length;
  const pendingCount = enquiries.filter((e) => e.status === "Pending").length;
  const inProgressCount = enquiries.filter((e) => e.status === "In Progress").length;
  const convertedCount = enquiries.filter((e) => e.status === "Converted").length;
  const closedCount = enquiries.filter((e) => e.status === "Closed").length;

  const kpis = [
    {
      label: "Total Enquiries",
      count: total,
      statusKey: "All",
      icon: Inbox,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "New Enquiries",
      count: newCount,
      statusKey: "New",
      icon: Sparkles,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "Pending Enquiries",
      count: pendingCount,
      statusKey: "Pending",
      icon: Clock,
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]",
    },
    {
      label: "In Progress",
      count: inProgressCount,
      statusKey: "In Progress",
      icon: Activity,
      color: "text-[#2563EB]",
      bgColor: "bg-[#EFF6FF]",
    },
    {
      label: "Converted Enquiries",
      count: convertedCount,
      statusKey: "Converted",
      icon: CheckCircle2,
      color: "text-[#059669]",
      bgColor: "bg-[#ECFDF5]",
    },
    {
      label: "Closed Enquiries",
      count: closedCount,
      statusKey: "Closed",
      icon: Archive,
      color: "text-[#64748B]",
      bgColor: "bg-[#F1F5F9]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeStatusFilter === kpi.statusKey;

        return (
          <Card
            key={kpi.label}
            onClick={() => onFilterStatus && onFilterStatus(kpi.statusKey)}
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
