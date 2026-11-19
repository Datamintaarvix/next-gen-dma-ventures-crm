import React from "react";
import { Card } from "@/components/ui/card";
import { Layers, CheckCircle2, Clock, CheckCheck, Users, ArrowUpRight } from "lucide-react";

interface BatchStats {
  totalBatches: number;
  activeBatches: number;
  upcomingBatches: number;
  completedBatches: number;
  totalAvailableSeats: number;
  totalEnrolledStudents: number;
}

interface BatchKPIsProps {
  stats: BatchStats;
  activeFilter?: string;
  onFilterSelect?: (filter: string) => void;
}

export function BatchKPIs({
  stats,
  activeFilter = "All",
  onFilterSelect,
}: BatchKPIsProps) {
  const kpiItems = [
    {
      label: "Total Batches",
      value: stats.totalBatches,
      subtext: `${stats.totalEnrolledStudents} active learners`,
      filterKey: "All",
      icon: Layers,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "Active Batches",
      value: stats.activeBatches,
      subtext: "Currently in session",
      filterKey: "Active",
      icon: CheckCircle2,
      color: "text-[#059669]",
      bgColor: "bg-[#ECFDF5]",
    },
    {
      label: "Upcoming Batches",
      value: stats.upcomingBatches,
      subtext: "Starting soon",
      filterKey: "Upcoming",
      icon: Clock,
      color: "text-[#2563EB]",
      bgColor: "bg-[#EFF6FF]",
    },
    {
      label: "Completed Batches",
      value: stats.completedBatches,
      subtext: "Graduated cohorts",
      filterKey: "Completed",
      icon: CheckCheck,
      color: "text-[#64748B]",
      bgColor: "bg-[#F1F5F9]",
    },
    {
      label: "Available Seats",
      value: stats.totalAvailableSeats,
      subtext: "Open admission capacity",
      filterKey: "has_seats",
      icon: Users,
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {kpiItems.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.filterKey;

        return (
          <Card
            key={kpi.label}
            onClick={() => onFilterSelect && onFilterSelect(kpi.filterKey)}
            className={`p-4 bg-white border cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? "border-[#078783] ring-1 ring-[#078783] bg-[#FAFCFB]"
                : "border-[#E2ECEB]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-9 h-9 rounded-lg ${kpi.bgColor} flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <ArrowUpRight
                className={`w-4 h-4 transition-colors ${
                  isSelected ? "text-[#078783]" : "text-[#7B939B]"
                }`}
              />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#11232B]">{kpi.value}</div>
              <div className="text-xs font-semibold text-[#5A7178] mt-0.5">
                {kpi.label}
              </div>
              <div className="text-[11px] text-[#7B939B] mt-1">{kpi.subtext}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
