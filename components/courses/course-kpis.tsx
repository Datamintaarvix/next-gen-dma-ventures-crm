import React from "react";
import { Card } from "@/components/ui/card";
import { BookOpen, CheckCircle2, PauseCircle, Users, ArrowUpRight } from "lucide-react";

interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
  totalEnrolledStudents: number;
  courseEnrolmentStats: {
    courseName: string;
    courseCode: string;
    enrolledCount: number;
    fees: number;
    status: string;
  }[];
}

interface CourseKPIsProps {
  stats: CourseStats;
  activeFilter?: string;
  onFilterSelect?: (filter: string) => void;
}

export function CourseKPIs({
  stats,
  activeFilter = "All",
  onFilterSelect,
}: CourseKPIsProps) {
  const kpiItems = [
    {
      label: "Total Courses",
      value: stats.totalCourses,
      subtext: "Across all academic departments",
      filterKey: "All",
      icon: BookOpen,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "Active Courses",
      value: stats.activeCourses,
      subtext: "Live batches accepting enrollments",
      filterKey: "Active",
      icon: CheckCircle2,
      color: "text-[#059669]",
      bgColor: "bg-[#ECFDF5]",
    },
    {
      label: "Inactive / Draft",
      value: stats.inactiveCourses,
      subtext: "Paused or upcoming curriculum",
      filterKey: "Inactive",
      icon: PauseCircle,
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]",
    },
    {
      label: "Total Enrolled Students",
      value: stats.totalEnrolledStudents,
      subtext: "Active student community",
      filterKey: "has_students",
      icon: Users,
      color: "text-[#2563EB]",
      bgColor: "bg-[#EFF6FF]",
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
