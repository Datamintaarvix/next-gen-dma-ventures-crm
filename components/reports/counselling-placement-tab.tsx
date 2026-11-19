"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlacementAnalyticsReport } from "@/lib/validations/report";
import {
  Briefcase,
  Users,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface CounsellingPlacementTabProps {
  counsellingStats: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    noShow: number;
    conversionRate: number;
    typeDistribution: { type: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    counsellorDistribution: { counsellor: string; sessions: number }[];
  };
  placements: PlacementAnalyticsReport;
}

export function CounsellingPlacementTab({
  counsellingStats,
  placements,
}: CounsellingPlacementTabProps) {
  return (
    <div className="space-y-8">
      {/* SECTION 1: COUNSELLING ANALYTICS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#11232B] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#078783]" />
              Academic Counselling & Advisory Performance
            </h2>
            <p className="text-xs text-gray-500">
              Session engagement, delivery modes, and student advisory throughput
            </p>
          </div>
          <Link
            href="/counselling"
            className="text-xs text-[#078783] hover:underline font-medium flex items-center"
          >
            Manage Sessions <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {/* Counselling Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Total Sessions</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {counsellingStats.total}
              </h3>
              <p className="text-[10px] text-gray-400">Total appointments</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Completed</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">
                {counsellingStats.completed}
              </h3>
              <p className="text-[10px] text-emerald-600 font-semibold">
                {counsellingStats.total > 0
                  ? `${counsellingStats.conversionRate}% completion`
                  : "No data"}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Scheduled</p>
              <h3 className="text-xl font-bold text-blue-700 mt-0.5">
                {counsellingStats.scheduled}
              </h3>
              <p className="text-[10px] text-blue-600">Upcoming slots</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Cancelled</p>
              <h3 className="text-xl font-bold text-gray-600 mt-0.5">
                {counsellingStats.cancelled}
              </h3>
              <p className="text-[10px] text-gray-400">Caller dropped</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">No-Show</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">
                {counsellingStats.noShow}
              </h3>
              <p className="text-[10px] text-rose-500">Candidate missed</p>
            </CardContent>
          </Card>
        </div>

        {/* Counselling Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-gray-200 shadow-sm bg-white p-4">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Session Delivery Channels
            </h4>
            <div className="space-y-2">
              {counsellingStats.typeDistribution.length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center">
                  No counselling sessions recorded yet.
                </p>
              ) : (
                counsellingStats.typeDistribution.map((t, idx) => {
                  const total = counsellingStats.total || 1;
                  const percent = Math.round((t.count / total) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700 font-medium">{t.type}</span>
                        <span className="font-semibold text-gray-900">
                          {t.count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#078783] h-1.5 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white p-4">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Counsellor Workload Distribution
            </h4>
            <div className="space-y-2">
              {counsellingStats.counsellorDistribution.length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center">
                  No counsellor activity recorded yet.
                </p>
              ) : (
                counsellingStats.counsellorDistribution.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-800">{c.counsellor}</span>
                    <span className="px-2 py-0.5 bg-teal-50 text-[#078783] font-bold rounded">
                      {c.sessions} sessions
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 2: PLACEMENT & RECRUITER ANALYTICS */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#11232B] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              Placement & Corporate Relations Analytics
            </h2>
            <p className="text-xs text-gray-500">
              Institutional hiring metrics, packages, and recruiter performance
            </p>
          </div>
          <Link
            href="/placement"
            className="text-xs text-emerald-700 hover:underline font-medium flex items-center"
          >
            Placement Drive <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {/* Placement Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Eligible Candidates</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {placements.totalEligible}
              </h3>
              <p className="text-[10px] text-gray-400">Meeting attendance & test criteria</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Placed Candidates</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">
                {placements.totalPlaced}
              </h3>
              <p className="text-[10px] text-emerald-600">Offers secured</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Placement Rate</p>
              <h3 className="text-xl font-bold text-[#078783] mt-0.5">
                {placements.totalEligible > 0 ? `${placements.placementRate}%` : "No data"}
              </h3>
              <p className="text-[10px] text-[#078783] font-semibold">Institutional success</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Highest Package</p>
              <h3 className="text-xl font-bold text-indigo-700 mt-0.5">
                {placements.highestSalaryLPA > 0
                  ? `₹${placements.highestSalaryLPA} LPA`
                  : "No data"}
              </h3>
              <p className="text-[10px] text-indigo-600 font-semibold">Top offer record</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-3.5">
              <p className="text-[11px] text-gray-500 font-medium">Average Package</p>
              <h3 className="text-xl font-bold text-blue-700 mt-0.5">
                {placements.averageSalaryLPA > 0
                  ? `₹${placements.averageSalaryLPA} LPA`
                  : "No data"}
              </h3>
              <p className="text-[10px] text-blue-600">Batch average</p>
            </CardContent>
          </Card>
        </div>

        {/* Corporate Recruiters Table */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-[#11232B]">
              Top Recruiting Partners & Industry Placements
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Corporate hiring track record and profiles offered
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Partner Company</th>
                    <th className="py-2.5 px-4">Industry Sector</th>
                    <th className="py-2.5 px-4 text-center">Hired Count</th>
                    <th className="py-2.5 px-4">Recruited Roles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {placements.companyHires.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No recruiter placement records available.
                      </td>
                    </tr>
                  ) : (
                    placements.companyHires.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                          {comp.companyName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{comp.industry}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                            {comp.hiredCount} Candidates
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {comp.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {comp.roles.map((r, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Software Engineers</span>
                          )}
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
