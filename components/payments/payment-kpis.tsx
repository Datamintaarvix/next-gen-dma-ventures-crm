"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  CreditCard,
  IndianRupee,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  CalendarCheck,
} from "lucide-react";

export interface PaymentStats {
  totalFees: number;
  totalCollected: number;
  outstandingAmount: number;
  todayCollected: number;
  pendingCount: number;
  overdueCount: number;
  courseBreakdown: {
    courseName: string;
    totalFee: number;
    collected: number;
    pending: number;
    studentCount: number;
  }[];
}

interface PaymentKPIsProps {
  stats: PaymentStats;
  activeFilter?: string;
  onFilterSelect?: (filter: string) => void;
}

export function PaymentKPIs({
  stats,
  activeFilter = "All",
  onFilterSelect,
}: PaymentKPIsProps) {
  const collectionPercentage =
    stats.totalFees > 0 ? Math.round((stats.totalCollected / stats.totalFees) * 100) : 0;

  const kpiItems = [
    {
      label: "Total Fees Committed",
      value: `₹${(stats.totalFees / 100000).toFixed(1)}L`,
      numericValue: stats.totalFees,
      subtext: `${collectionPercentage}% collected to date`,
      filterKey: "All",
      icon: CreditCard,
      color: "text-[#078783]",
      bgColor: "bg-[#E6F5F4]",
    },
    {
      label: "Total Collected",
      value: `₹${(stats.totalCollected / 100000).toFixed(1)}L`,
      numericValue: stats.totalCollected,
      subtext: "Gross verified tuition fees",
      filterKey: "Paid",
      icon: CheckCircle2,
      color: "text-[#059669]",
      bgColor: "bg-[#ECFDF5]",
    },
    {
      label: "Outstanding Balance",
      value: `₹${(stats.outstandingAmount / 100000).toFixed(1)}L`,
      numericValue: stats.outstandingAmount,
      subtext: "Pending across cohorts",
      filterKey: "Partially Paid",
      icon: IndianRupee,
      color: "text-[#D97706]",
      bgColor: "bg-[#FEF3C7]",
    },
    {
      label: "Collected Today",
      value: stats.todayCollected > 0 ? `₹${stats.todayCollected.toLocaleString("en-IN")}` : "₹0",
      numericValue: stats.todayCollected,
      subtext: "Cleared payments today",
      filterKey: "today",
      icon: TrendingUp,
      color: "text-[#2563EB]",
      bgColor: "bg-[#EFF6FF]",
    },
    {
      label: "Pending Accounts",
      value: `${stats.pendingCount} students`,
      numericValue: stats.pendingCount,
      subtext: "Have balance payment due",
      filterKey: "Pending",
      icon: Clock,
      color: "text-[#7C3AED]",
      bgColor: "bg-[#F3E8FF]",
    },
    {
      label: "Overdue Installments",
      value: `${stats.overdueCount} payments`,
      numericValue: stats.overdueCount,
      subtext: "Past scheduled due date",
      filterKey: "Overdue",
      icon: AlertCircle,
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
