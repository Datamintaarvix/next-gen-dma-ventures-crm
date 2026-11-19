"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StaffPerformanceReportItem } from "@/lib/validations/report";
import { Users, Award, IndianRupee, ArrowUpRight, TrendingUp } from "lucide-react";

interface StaffPerformanceTabProps {
  staffPerformance: StaffPerformanceReportItem[];
}

export function StaffPerformanceTab({ staffPerformance }: StaffPerformanceTabProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalRevenue = staffPerformance.reduce((acc, s) => acc + s.revenueGenerated, 0);
  const totalAdmissions = staffPerformance.reduce((acc, s) => acc + s.admissionsClosed, 0);

  return (
    <div className="space-y-6">
      {/* Top Staff Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Active CRM Operators</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                {staffPerformance.length} Members
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Counsellors, faculty & administrators</p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Team Admissions Closed</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">
                {totalAdmissions}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Total student enrolments secured</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Team Realized Revenue</p>
              <h3 className="text-2xl font-bold text-[#078783] mt-0.5">
                {formatCurrency(totalRevenue)}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Collected tuition & admission fees</p>
            </div>
            <div className="p-2.5 bg-teal-50 text-[#078783] rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Comparison Matrix Table */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#11232B]">
                Staff Performance & Productivity Matrix
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Cross-module metrics comparing student lead conversion, counselling sessions, and revenue contribution
              </CardDescription>
            </div>
            <Link
              href="/staff"
              className="text-xs text-[#078783] hover:underline font-medium flex items-center"
            >
              Staff Directory <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Dept</th>
                  <th className="py-3 px-4 text-center">Leads Handled</th>
                  <th className="py-3 px-4 text-center">Counselling Sessions</th>
                  <th className="py-3 px-4 text-center">Follow-ups Done</th>
                  <th className="py-3 px-4 text-center">Admissions Closed</th>
                  <th className="py-3 px-4">Conversion Rate</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No staff records found.
                    </td>
                  </tr>
                ) : (
                  staffPerformance.map((st, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {st.staffName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800 block">{st.role}</span>
                        <span className="text-[10px] text-gray-500">{st.department}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-gray-700">
                        {st.leadsHandled}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-blue-700">
                        {st.counsellingSessions}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-purple-700">
                        {st.followUpsDone}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {st.admissionsClosed}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#078783] h-2 rounded-full"
                              style={{ width: `${Math.min(st.conversionRate, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-800 text-[11px]">
                            {st.conversionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#078783]">
                        {formatCurrency(st.revenueGenerated)}
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
