"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AttendanceAnalyticsReport } from "@/lib/validations/report";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface StudentAttendanceTabProps {
  attendance: AttendanceAnalyticsReport;
  totalStudents: number;
}

export function StudentAttendanceTab({
  attendance,
  totalStudents,
}: StudentAttendanceTabProps) {
  const lowCount = attendance.lowAttendanceStudents.length;

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Overall Attendance Rate</p>
              <h3 className="text-2xl font-bold text-[#078783] mt-0.5">
                {totalStudents > 0 ? `${attendance.overallAttendanceRate}%` : "No data"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Institutional academic average</p>
            </div>
            <div className="p-2.5 bg-teal-50 text-[#078783] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Active Students</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalStudents}</h3>
              <p className="text-[11px] text-gray-400 mt-1">Under enrolled training cohorts</p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Class Sessions Logged</p>
              <h3 className="text-2xl font-bold text-indigo-700 mt-0.5">
                {attendance.totalSessionsHeld}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Recorded classroom registers</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Attendance Alert (&lt;75%)</p>
              <h3
                className={`text-2xl font-bold mt-0.5 ${
                  lowCount > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {lowCount} Students
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">At risk of examination debarment</p>
            </div>
            <div
              className={`p-2.5 rounded-xl ${
                lowCount > 0
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch-wise Attendance Overview */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Cohort Attendance Performance
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Batch-wise attendance consistency and faculty lead
                </CardDescription>
              </div>
              <Link
                href="/attendance"
                className="text-xs text-[#078783] hover:underline font-medium flex items-center"
              >
                Take Attendance <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Batch & Course</th>
                    <th className="py-2.5 px-3">Trainer</th>
                    <th className="py-2.5 px-3 text-center">Students</th>
                    <th className="py-2.5 px-3">Avg Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.batchWiseAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No batch attendance records.
                      </td>
                    </tr>
                  ) : (
                    attendance.batchWiseAttendance.map((b, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-900 block">
                            {b.batchName}
                          </span>
                          <span className="text-[10px] text-gray-500">{b.courseName}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-700">{b.trainer}</td>
                        <td className="py-3 px-3 text-center font-bold text-gray-800">
                          {b.studentCount}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  b.avgAttendance >= 85
                                    ? "bg-emerald-500"
                                    : b.avgAttendance >= 75
                                    ? "bg-[#078783]"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(b.avgAttendance, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-800 text-[11px]">
                              {b.avgAttendance}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Attendance Watchlist */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B] flex items-center gap-2">
                  <span>Low Attendance Watchlist</span>
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                    &lt; 75%
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Students needing immediate counselling and parent notification
                </CardDescription>
              </div>
              <Link
                href="/students"
                className="text-xs text-[#078783] hover:underline font-medium flex items-center"
              >
                View Students <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Course / Batch</th>
                    <th className="py-2.5 px-3 text-center">Attendance</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.lowAttendanceStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-emerald-600 font-medium">
                        ✓ All students currently maintain 75%+ attendance rate!
                      </td>
                    </tr>
                  ) : (
                    attendance.lowAttendanceStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/30">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-900 block">
                            {s.studentName}
                          </span>
                          <span className="text-[10px] text-gray-500">{s.studentCode}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-700">
                          <span className="block truncate max-w-[140px] font-medium">
                            {s.courseName}
                          </span>
                          <span className="text-[10px] text-gray-500">{s.batchCode}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            {s.attendancePercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Link
                            href={`/students?search=${encodeURIComponent(s.studentName)}`}
                            className="text-[11px] text-[#078783] hover:underline font-semibold"
                          >
                            Profile
                          </Link>
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
