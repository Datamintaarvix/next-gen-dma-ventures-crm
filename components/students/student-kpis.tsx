import React from "react";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, GraduationCap, ArrowUpRight } from "lucide-react";

interface StudentStats {
  total: number;
  active: number;
  newlyAdmitted: number;
  completed: number;
  avgAttendance: number;
}

interface StudentKPIsProps {
  stats: StudentStats;
  activeFilter?: string;
  onFilterSelect?: (filter: string) => void;
}

export function StudentKPIs({
  stats,
  activeFilter = "All",
  onFilterSelect,
}: StudentKPIsProps) {
  const kpiItems = [
    {
      label: "Total Students",
      value: stats.total,
      subtext: `${stats.avgAttendance}% avg. attendance`,
      filterKey: "All",
      icon: Users,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "Active Students",
      value: stats.active,
      subtext: "Currently attending batches",
      filterKey: "Active",
      icon: UserCheck,
      color: "text-[#2563EB]",
      bgColor: "bg-[#EFF6FF]",
    },
    {
      label: "Newly Admitted",
      value: stats.newlyAdmitted,
      subtext: "Admitted in last 30 days",
      filterKey: "newly_admitted",
      icon: UserPlus,
      color: "text-[#7C3AED]",
      bgColor: "bg-[#F5F3FF]",
    },
    {
      label: "Completed Students",
      value: stats.completed,
      subtext: "Graduated / Placed alumni",
      filterKey: "Completed",
      icon: GraduationCap,
      color: "text-[#059669]",
      bgColor: "bg-[#ECFDF5]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
