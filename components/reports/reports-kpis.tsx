"use client";

import React from "react";
import {
  Users,
  MessageSquare,
  GraduationCap,
  Award,
  IndianRupee,
  AlertCircle,
  Layers,
  Briefcase,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsKPIs, ReportPeriod } from "@/lib/validations/report";

interface ReportsKPIsProps {
  kpis: AnalyticsKPIs;
  period: ReportPeriod;
  dateRangeDisplay: string;
  startDate?: string;
  endDate?: string;
  isLoading: boolean;
  onPeriodChange: (period: ReportPeriod) => void;
  onCustomDateChange: (start: string, end: string) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  onOpenPrintModal: () => void;
}

export function ReportsKPIs({
  kpis,
  period,
  dateRangeDisplay,
  startDate,
  endDate,
  isLoading,
  onPeriodChange,
  onCustomDateChange,
  onRefresh,
  onExportCsv,
  onOpenPrintModal,
}: ReportsKPIsProps) {
  const periods: { key: ReportPeriod; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "today", label: "Today" },
    { key: "this-week", label: "This Week" },
    { key: "this-month", label: "This Month" },
    { key: "last-month", label: "Last Month" },
    { key: "this-quarter", label: "This Quarter" },
    { key: "this-year", label: "This Year" },
    { key: "custom", label: "Custom Range" },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const kpiCards = [
    {
      title: "Total Leads",
      value: kpis.totalLeads.toLocaleString(),
      subtitle: "Prospects captured",
      icon: Users,
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
      borderColor: "border-teal-200",
      iconColor: "text-teal-600",
    },
    {
      title: "Total Enquiries",
      value: kpis.totalEnquiries.toLocaleString(),
      subtitle: "Inbound requests",
      icon: MessageSquare,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Students",
      value: kpis.totalStudents.toLocaleString(),
      subtitle: "Currently studying",
      icon: GraduationCap,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Admissions",
      value: kpis.totalAdmissions.toLocaleString(),
      subtitle: "Enrolled candidates",
      icon: Award,
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
      iconColor: "text-indigo-600",
    },
    {
      title: "Revenue Collected",
      value: formatCurrency(kpis.totalRevenueCollected),
      subtitle: `Out of ${formatCurrency(kpis.totalExpectedRevenue)}`,
      icon: IndianRupee,
      bgColor: "bg-teal-50",
      textColor: "text-[#078783]",
      borderColor: "border-[#078783]/30",
      iconColor: "text-[#078783]",
    },
    {
      title: "Outstanding Fees",
      value: formatCurrency(kpis.totalOutstandingFees),
      subtitle: "Receivables pending",
      icon: AlertCircle,
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      title: "Active Batches",
      value: kpis.activeBatches.toLocaleString(),
      subtitle: "Running & upcoming cohorts",
      icon: Layers,
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-700",
      borderColor: "border-cyan-200",
      iconColor: "text-cyan-600",
    },
    {
      title: "Placement Rate",
      value: kpis.totalStudents > 0 ? `${kpis.placementSuccessRate}%` : "No data",
      subtitle: kpis.totalStudents > 0 ? "Placed of eligible students" : "No eligible students",
      icon: Briefcase,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-800",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Action Bar & Date Filter Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {periods.map((p) => {
            const isActive = period === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onPeriodChange(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#078783] text-white shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs h-8 border-gray-300 hover:border-[#078783] text-gray-700"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-[#078783]" : ""}`}
            />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="text-xs h-8 border-gray-300 hover:border-emerald-600 text-gray-700 hover:text-emerald-700"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={onOpenPrintModal}
            className="text-xs h-8 bg-[#192C34] hover:bg-[#11232B] text-white"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Custom Date Pickers (if Custom Period is selected) */}
      {period === "custom" && (
        <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-lg flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-amber-900">Custom Date Filter:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-600 font-medium">Start:</label>
            <input
              type="date"
              defaultValue={startDate || "2026-09-01"}
              onChange={(e) => onCustomDateChange(e.target.value, endDate || "2026-11-30")}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#078783]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-600 font-medium">End:</label>
            <input
              type="date"
              defaultValue={endDate || "2026-11-30"}
              onChange={(e) => onCustomDateChange(startDate || "2026-09-01", e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#078783]"
            />
          </div>
          <span className="text-xs text-amber-800 ml-auto italic">
            Currently displaying: {dateRangeDisplay}
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={i}
              className="border border-gray-200/80 hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className={`text-xl sm:text-2xl font-bold tracking-tight ${card.textColor}`}>
                    {card.value}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
