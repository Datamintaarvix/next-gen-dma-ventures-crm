"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartDataPoint,
  CounsellorPerformanceMetric,
} from "@/lib/validations/report";
import { Users, PhoneCall, TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";

interface LeadAnalyticsTabProps {
  leadTrends: ChartDataPoint[];
  leadSourceDistribution: { name: string; value: number }[];
  leadStatusDistribution: { name: string; value: number }[];
  counsellorPerformance: CounsellorPerformanceMetric[];
  followUpMetrics: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
}

const COLORS = [
  "#078783",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
  "#64748B",
];

export function LeadAnalyticsTab({
  leadTrends,
  leadSourceDistribution,
  leadStatusDistribution,
  counsellorPerformance,
  followUpMetrics,
}: LeadAnalyticsTabProps) {
  const totalLeads = leadStatusDistribution.reduce((acc, s) => acc + s.value, 0);
  const convertedLeads =
    leadStatusDistribution.find((s) => s.name === "Converted")?.value || 0;
  const overallConversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Lead Conversion Rate</p>
              <h3 className="text-2xl font-bold text-[#078783] mt-0.5">
                {totalLeads > 0 ? `${overallConversionRate}%` : "No data"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                {convertedLeads} converted of {totalLeads} total leads
              </p>
            </div>
            <div className="p-2.5 bg-teal-50 text-[#078783] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Follow-Up Completion</p>
              <h3 className="text-2xl font-bold text-blue-700 mt-0.5">
                {followUpMetrics.total > 0 ? `${followUpMetrics.completionRate}%` : "No data"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                {followUpMetrics.completed} of {followUpMetrics.total} tasks completed
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <PhoneCall className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Follow-ups</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-0.5">
                {followUpMetrics.pending}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Scheduled for upcoming touchpoints</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Overdue Follow-ups</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-0.5">
                {followUpMetrics.overdue}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Requires immediate counsellor action</p>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts: Trends & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend: Leads vs Enquiries vs Admissions */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#11232B]">
                  Lead, Enquiry & Admission Inflow Over Time
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Monthly volume progression across acquisition stages
                </CardDescription>
              </div>
              <Link
                href="/leads"
                className="text-xs text-[#078783] hover:underline flex items-center font-medium"
              >
                View Leads <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {leadTrends.length === 0 ? (
              <div className="h-72 w-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <span>No lead or enquiry activity recorded yet</span>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={leadTrends}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E5E7EB",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="leads" name="Leads" fill="#078783" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="enquiries" name="Enquiries" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="admissions" name="Admissions" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Source Breakdown (Donut/Pie) */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#11232B]">
              Lead Channels & Sources
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Contribution by marketing channel
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {leadSourceDistribution.length === 0 ? (
              <div className="h-56 w-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <span>No lead source data available yet</span>
              </div>
            ) : (
              <>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSourceDistribution}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {leadSourceDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E5E7EB",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Source legend with counts */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                  {leadSourceDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-gray-600 truncate">{item.name}:</span>
                      <span className="font-semibold text-gray-800 ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Counsellor Conversion Leaderboard */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#11232B]">
                Counsellor Lead Conversion & Revenue Leaderboard
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Staff-wise leads handled, conversion efficacy, and total fee receipts generated
              </CardDescription>
            </div>
            <Link
              href="/counselling"
              className="text-xs text-[#078783] hover:underline font-medium flex items-center"
            >
              Counselling Sessions <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Counsellor</th>
                  <th className="py-3 px-4 text-center">Leads Assigned</th>
                  <th className="py-3 px-4 text-center">Leads Converted</th>
                  <th className="py-3 px-4">Conversion Rate</th>
                  <th className="py-3 px-4 text-center">Admissions Closed</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {counsellorPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No counsellor performance data available for this range.
                    </td>
                  </tr>
                ) : (
                  counsellorPerformance.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {c.counsellorName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-gray-700">
                        {c.leadsAssigned}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                        {c.leadsConverted}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#078783] h-2 rounded-full"
                              style={{ width: `${Math.min(c.conversionRate, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-800 text-[11px]">
                            {c.conversionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                        {c.admissionsCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#078783]">
                        {formatCurrency(c.revenueGenerated)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
