"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  GraduationCap,
  XCircle,
  FileText,
  ArrowUpRight,
} from "lucide-react";

export interface AdmissionStats {
  totalAdmissions: number;
  newApplications: number;
  pendingApplications: number;
  approvedAdmissions: number;
  enrolledStudents: number;
  rejectedApplications: number;
}

interface AdmissionKPIsProps {
  stats: AdmissionStats;
  activeFilter?: string;
  onFilterSelect?: (filter: string) => void;
}

export function AdmissionKPIs({
  stats,
  activeFilter = "All",
  onFilterSelect,
}: AdmissionKPIsProps) {
  const kpiItems = [
    {
      label: "Total Admissions",
      value: stats.totalAdmissions,
      subtext: "All applications to date",
      filterKey: "All",
      icon: FileCheck2,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "New Applications",
      value: stats.newApplications,
      subtext: "Application received",
      filterKey: "Application Received",
      icon: FileText,
      color: "text-[#2563EB]",
      bgColor: "bg-[#EFF6FF]",
    },
    {
      label: "Pending Review",
      value: stats.pendingApplications,
      subtext: "Documents & review pending",
      filterKey: "pending_applications",
      icon: Clock,
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]",
    },
    {
      label: "Approved Admissions",
      value: stats.approvedAdmissions,
      subtext: "Awaiting final enrollment",
      filterKey: "Approved",
      icon: CheckCircle2,
      color: "text-[#0D9488]",
      bgColor: "bg-[#E0F7F6]",
    },
    {
      label: "Enrolled Students",
      value: stats.enrolledStudents,
      subtext: "Cohort seat secured",
      filterKey: "Enrolled",
      icon: GraduationCap,
      color: "text-[#059669]",
      bgColor: "bg-[#ECFDF5]",
    },
    {
      label: "Rejected / Cancelled",
      value: stats.rejectedApplications,
      subtext: "Not qualified or dropped",
      filterKey: "Rejected",
      icon: XCircle,
      color: "text-[#DC2626]",
      bgColor: "bg-[#FEF2F2]",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {kpiItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeFilter === item.filterKey;

        return (
          <Card
            key={item.label}
            onClick={() => onFilterSelect && onFilterSelect(item.filterKey)}
            className={`p-3.5 bg-white rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md ${
              isActive
                ? "border-[#078783] ring-2 ring-[#078783]/20 shadow-sm"
                : "border-[#E2ECEB] hover:border-[#078783]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bgColor} ${item.color} transition-transform group-hover:scale-105`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <ArrowUpRight
                className={`w-3.5 h-3.5 transition-colors ${
                  isActive ? "text-[#078783]" : "text-[#A0B0B5] group-hover:text-[#078783]"
                }`}
              />
            </div>

            <div className="mt-2.5">
              <div className="text-[11px] font-medium text-[#5A7178] truncate">
                {item.label}
              </div>
              <div className="text-xl font-bold tracking-tight text-[#11232B] mt-0.5">
                {item.value}
              </div>
              <div className="text-[10px] text-[#8B9E9E] mt-0.5 truncate">
                {item.subtext}
              </div>
            </div>

            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#078783]" />
            )}
          </Card>
        );
      })}
    </div>
  );
}
