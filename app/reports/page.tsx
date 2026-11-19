"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Award,
  IndianRupee,
  Calendar,
  Briefcase,
  GraduationCap,
  Layers,
  BarChart2,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportsKPIs } from "@/components/reports/reports-kpis";
import { LeadAnalyticsTab } from "@/components/reports/lead-analytics-tab";
import { AdmissionsAnalyticsTab } from "@/components/reports/admissions-analytics-tab";
import { FinancialAnalyticsTab } from "@/components/reports/financial-analytics-tab";
import { StudentAttendanceTab } from "@/components/reports/student-attendance-tab";
import { CounsellingPlacementTab } from "@/components/reports/counselling-placement-tab";
import { StaffPerformanceTab } from "@/components/reports/staff-performance-tab";
import { PrintableReportModal } from "@/components/reports/printable-report-modal";
import { FullAnalyticsPayload, ReportPeriod } from "@/lib/validations/report";

type TabKey =
  | "leads"
  | "admissions"
  | "financials"
  | "attendance"
  | "counselling-placement"
  | "staff";

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("all");
  const [startDate, setStartDate] = useState<string>("2026-09-01");
  const [endDate, setEndDate] = useState<string>("2026-11-30");
  const [activeTab, setActiveTab] = useState<TabKey>("leads");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<FullAnalyticsPayload | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        period,
      });
      if (period === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }

      const res = await fetch(`/api/reports/analytics?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setAnalyticsData(json.data);
      } else {
        throw new Error(json.error || "Failed to load report analytics");
      }
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams({ period });
    if (period === "custom") {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }
    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "leads", label: "Leads & Enquiries", icon: Users },
    { key: "admissions", label: "Admissions & Batches", icon: Award },
    { key: "financials", label: "Revenue & Finance", icon: IndianRupee },
    { key: "attendance", label: "Student & Attendance", icon: GraduationCap },
    { key: "counselling-placement", label: "Counselling & Placements", icon: Briefcase },
    { key: "staff", label: "Staff Performance", icon: BarChart2 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-widest text-[#078783] uppercase flex items-center gap-2">
            <span>NEXT GEN DMA VENTURES</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500 font-medium">REPORTS & ANALYTICS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#11232B] tracking-tight">
            Institutional Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7178]">
            Comprehensive executive metrics across student admissions, fee realizations, cohorts, attendance, and placements
          </p>
        </div>
      </div>

      {/* Loading Skeleton / Error State / KPIs */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            className="text-xs border-rose-300 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {analyticsData && (
        <>
          {/* Top KPIs & Date Range Filter Toolbar */}
          <ReportsKPIs
            kpis={analyticsData.kpis}
            period={period}
            dateRangeDisplay={analyticsData.dateRangeDisplay}
            startDate={startDate}
            endDate={endDate}
            isLoading={isLoading}
            onPeriodChange={handlePeriodChange}
            onCustomDateChange={handleCustomDateChange}
            onRefresh={fetchAnalytics}
            onExportCsv={handleExportCsv}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
          />

          {/* Module Section Navigation Tabs */}
          <div className="border-b border-gray-200 bg-white rounded-t-xl px-2 pt-2 shadow-sm">
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-[#078783] text-[#078783] bg-teal-50/50 rounded-t-lg"
                        : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#078783]" : "text-gray-400"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Tab View */}
          <div className="pt-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
                <Loader2 className="w-8 h-8 text-[#078783] animate-spin mb-3" />
                <p className="text-xs text-gray-500 font-medium">
                  Aggregating institutional data for {analyticsData.dateRangeDisplay}...
                </p>
              </div>
            ) : (
              <>
                {activeTab === "leads" && (
                  <LeadAnalyticsTab
                    leadTrends={analyticsData.leadTrends}
                    leadSourceDistribution={analyticsData.leadSourceDistribution}
                    leadStatusDistribution={analyticsData.leadStatusDistribution}
                    counsellorPerformance={analyticsData.counsellorPerformance}
                    followUpMetrics={analyticsData.followUpMetrics}
                  />
                )}

                {activeTab === "admissions" && (
                  <AdmissionsAnalyticsTab
                    admissionsByCourse={analyticsData.admissionsByCourse}
                    admissionsByMonth={analyticsData.admissionsByMonth}
                    admissionsByBatch={analyticsData.admissionsByBatch}
                    admissionStatusDistribution={analyticsData.admissionStatusDistribution}
                  />
                )}

                {activeTab === "financials" && (
                  <FinancialAnalyticsTab
                    financials={analyticsData.financials}
                    revenueTrends={analyticsData.revenueTrends}
                    courseRevenueBreakdown={analyticsData.courseRevenueBreakdown}
                  />
                )}

                {activeTab === "attendance" && (
                  <StudentAttendanceTab
                    attendance={analyticsData.attendance}
                    totalStudents={analyticsData.kpis.totalStudents}
                  />
                )}

                {activeTab === "counselling-placement" && (
                  <CounsellingPlacementTab
                    counsellingStats={analyticsData.counsellingStats}
                    placements={analyticsData.placements}
                  />
                )}

                {activeTab === "staff" && (
                  <StaffPerformanceTab
                    staffPerformance={analyticsData.staffPerformance}
                  />
                )}
              </>
            )}
          </div>

          {/* Printable Executive Report Modal */}
          <PrintableReportModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            data={analyticsData}
          />
        </>
      )}

      {/* Initial Page Loading Spinner if no data yet */}
      {!analyticsData && isLoading && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
          <Loader2 className="w-10 h-10 text-[#078783] animate-spin mb-4" />
          <h3 className="text-base font-bold text-gray-900">
            Initializing NEXT GEN DMA VENTURES Analytics Engine
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Loading admissions, leads, finance, attendance, and staff data stores...
          </p>
        </div>
      )}
    </div>
  );
}
