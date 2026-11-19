"use client";

import React from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
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
  FinancialSummaryReport,
  ChartDataPoint,
} from "@/lib/validations/report";
import {
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  CreditCard,
  Clock,
} from "lucide-react";

interface FinancialAnalyticsTabProps {
  financials: FinancialSummaryReport;
  revenueTrends: ChartDataPoint[];
  courseRevenueBreakdown: ChartDataPoint[];
}

const METHOD_COLORS = [
  "#078783",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

export function FinancialAnalyticsTab({
  financials,
  revenueTrends,
  courseRevenueBreakdown,
}: FinancialAnalyticsTabProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Billed Fees</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                {formatCurrency(financials.totalBilled)}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Aggregated academic fee commitments</p>
            </div>
            <div className="p-2.5 bg-gray-100 text-gray-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Revenue Collected</p>
              <h3 className="text-2xl font-bold text-[#078783] mt-0.5">
                {formatCurrency(financials.totalCollected)}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Realized bank and cash inflow</p>
            </div>
            <div className="p-2.5 bg-teal-50 text-[#078783] rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Outstanding Receivables</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-0.5">
                {formatCurrency(financials.totalOutstanding)}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Pending student balances</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Collection Realization Rate</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">
                {financials.totalBilled > 0 ? `${financials.collectionRate}%` : "No data"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Percentage of billed fees collected</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collections Trend */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#11232B]">
                  Revenue Inflow Trend
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Monthly fee collection trajectory (INR)
                </CardDescription>
              </div>
              <Link
                href="/payments"
                className="text-xs text-[#078783] hover:underline flex items-center font-medium"
              >
                Go to Payments <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {revenueTrends.length === 0 ? (
              <div className="h-72 w-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <span>No revenue inflow recorded yet</span>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueTrends}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#078783" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#078783" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E5E7EB",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), "Collected"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      name="Collected"
                      stroke="#078783"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#11232B]">
              Payment Modes
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Collection share by transaction mode
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {financials.paymentMethodDistribution.length === 0 ? (
              <div className="h-52 w-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <span>No payment transactions recorded yet</span>
              </div>
            ) : (
              <>
                <div className="h-52 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financials.paymentMethodDistribution}
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {financials.paymentMethodDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={METHOD_COLORS[index % METHOD_COLORS.length]}
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
                        formatter={(val: any) => [formatCurrency(Number(val)), "Amount"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                  {financials.paymentMethodDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: METHOD_COLORS[idx % METHOD_COLORS.length],
                          }}
                        />
                        <span className="text-gray-700">{item.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900 block">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="text-[10px] text-gray-500">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid: Recent Collections & Pending Installments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Collections */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Recent Financial Receipts
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Latest 10 fee transactions recorded
                </CardDescription>
              </div>
              <Link
                href="/payments"
                className="text-xs text-[#078783] hover:underline font-medium flex items-center"
              >
                All Receipts <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Receipt / Student</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {financials.recentCollections.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    financials.recentCollections.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-gray-900 block">
                            {p.studentName}
                          </span>
                          <span className="text-[10px] text-gray-500">{p.paymentId}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 truncate max-w-[120px]">
                          {p.course}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#078783]">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                            {p.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pending & Overdue Installments */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Upcoming & Overdue Installments
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Scheduled payment milestone alerts
                </CardDescription>
              </div>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-semibold">
                {financials.pendingInstallments.length} Pending
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {financials.pendingInstallments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No pending installments. All fees up to date!
                      </td>
                    </tr>
                  ) : (
                    financials.pendingInstallments.map((inst, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {inst.studentName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                          {formatCurrency(inst.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {inst.dueDate}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              inst.status === "Overdue"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {inst.status}
                          </span>
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
    </div>
  );
}
