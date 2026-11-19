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
import { ChartDataPoint } from "@/lib/validations/report";
import { Award, ArrowUpRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface AdmissionsAnalyticsTabProps {
  admissionsByCourse: ChartDataPoint[];
  admissionsByMonth: ChartDataPoint[];
  admissionsByBatch: ChartDataPoint[];
  admissionStatusDistribution: { name: string; value: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Enrolled: "#10B981",
  Approved: "#078783",
  "Under Review": "#F59E0B",
  "Application Received": "#3B82F6",
  "Documents Pending": "#8B5CF6",
  Rejected: "#EF4444",
  Cancelled: "#6B7280",
};

const DEFAULT_COLORS = [
  "#078783",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

export function AdmissionsAnalyticsTab({
  admissionsByCourse,
  admissionsByMonth,
  admissionsByBatch,
  admissionStatusDistribution,
}: AdmissionsAnalyticsTabProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalAdmissions = admissionStatusDistribution.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="space-y-6">
      {/* Top Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course-wise Admissions & Fee Value */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#11232B]">
                  Course-wise Enrolments & Fee Billing
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Admissions count per academic track
                </CardDescription>
              </div>
              <Link
                href="/admissions"
                className="text-xs text-[#078783] hover:underline flex items-center font-medium"
              >
                Go to Admissions <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {admissionsByCourse.length === 0 ? (
              <div className="h-72 w-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <span>No admissions data available yet</span>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={admissionsByCourse}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#6B7280" }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E5E7EB",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === "Total Fee Value") return [formatCurrency(Number(value)), name];
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }} />
                    <Bar
                      dataKey="admissions"
                      name="Admissions Count"
                      fill="#078783"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admission Status Distribution */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#11232B]">
              Admission Status Pipeline
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Total {totalAdmissions} admission applications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {admissionStatusDistribution.length === 0 ? (
              <div className="h-52 w-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <span>No admission status data available yet</span>
              </div>
            ) : (
              <>
                <div className="h-52 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={admissionStatusDistribution}
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {admissionStatusDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              STATUS_COLORS[entry.name] ||
                              DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                            }
                          />
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
                <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                  {admissionStatusDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              STATUS_COLORS[item.name] ||
                              DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                          }}
                        />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch-wise Enrolments & Seat Occupancy */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#11232B]">
                Batch Occupancy & Seat Utilization
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Current enrolments vs max batch capacity
              </CardDescription>
            </div>
            <Link
              href="/batches"
              className="text-xs text-[#078783] hover:underline font-medium flex items-center"
            >
              Manage Batches <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Batch Name & Code</th>
                  <th className="py-3 px-4 text-center">Enrolled Students</th>
                  <th className="py-3 px-4 text-center">Max Capacity</th>
                  <th className="py-3 px-4">Capacity Utilization</th>
                  <th className="py-3 px-4 text-center">Available Seats</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admissionsByBatch.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No batch admission records found.
                    </td>
                  </tr>
                ) : (
                  admissionsByBatch.map((b: any, idx) => {
                    const admissionsCount = Number(b.admissions) || 0;
                    const capacity = Number(b.capacity) || 25;
                    const fillPercent = Math.min(
                      Math.round((admissionsCount / capacity) * 100),
                      100
                    );
                    const available = Math.max(0, capacity - admissionsCount);

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {b.name}
                          <span className="block text-[11px] font-normal text-gray-500">
                            {b.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                          {admissionsCount}
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-600">
                          {capacity}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  fillPercent >= 90
                                    ? "bg-rose-500"
                                    : fillPercent >= 70
                                    ? "bg-[#078783]"
                                    : "bg-blue-500"
                                }`}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-800 text-[11px]">
                              {fillPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-emerald-700">
                          {available} seats
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              fillPercent >= 100
                                ? "bg-rose-100 text-rose-800"
                                : fillPercent >= 75
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {fillPercent >= 100
                              ? "Full"
                              : fillPercent >= 75
                              ? "Filling Fast"
                              : "Open"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
