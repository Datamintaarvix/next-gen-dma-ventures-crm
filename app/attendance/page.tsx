"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AttendanceRecord,
  AttendanceKPIStats,
  AttendanceStatus,
  attendanceStatusEnum,
} from "@/lib/validations/attendance";
import { AttendanceKPIs } from "@/components/attendance/attendance-kpis";
import { MarkAttendanceModal } from "@/components/attendance/mark-attendance-modal";
import { StudentAttendanceModal } from "@/components/attendance/student-attendance-modal";
import { AttendanceReportModal } from "@/components/attendance/attendance-report-modal";
import { EditAttendanceRecordModal } from "@/components/attendance/edit-attendance-record-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  ExternalLink,
  Users,
  Filter,
  X,
  GraduationCap,
} from "lucide-react";

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceKPIStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateArrivals: 0,
    overallPercentage: 100,
    totalSessionsHeld: 0,
    activeBatchesCount: 0,
    lowAttendanceCount: 0,
  });

  const [courses, setCourses] = useState<string[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [specificDate, setSpecificDate] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "batch" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modals state
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<string | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<AttendanceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Load auxiliary data (Courses, Batches, Students)
  const loadAuxiliaryData = async () => {
    try {
      const [coursesRes, batchesRes, studentsRes] = await Promise.all([
        fetch("/api/courses").then((r) => r.json()).catch(() => ({ courses: [] })),
        fetch("/api/batches").then((r) => r.json()).catch(() => ({ batches: [] })),
        fetch("/api/students").then((r) => r.json()).catch(() => ({ students: [] })),
      ]);

      if (coursesRes.courses) {
        setCourses(coursesRes.courses.map((c: any) => c.courseName));
      }
      if (batchesRes.batches) {
        setBatches(batchesRes.batches);
      }
      if (studentsRes.students) {
        setStudents(studentsRes.students);
      }
    } catch (err) {
      console.error("Failed to load auxiliary options:", err);
    }
  };

  // Fetch Attendance Records and KPIs
  const fetchAttendance = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (selectedCourse !== "All") params.set("course", selectedCourse);
      if (selectedBatch !== "All") params.set("batch", selectedBatch);
      if (selectedStatus !== "All") params.set("status", selectedStatus);
      if (dateRange !== "All") params.set("dateRange", dateRange);
      if (specificDate) params.set("date", specificDate);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("includeStats", "true");

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch attendance data");
      }

      setRecords(data.records || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error("Fetch attendance error:", err);
      setErrorMessage(err.message || "Failed to load attendance records");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedCourse, selectedBatch, selectedStatus, dateRange, specificDate, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAttendance();
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCourse, selectedBatch, selectedStatus, dateRange, specificDate]);

  // Pagination slice
  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, currentPage]);

  // Handle Record Delete
  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/attendance/${encodeURIComponent(recordToDelete.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete record");
      }

      showNotification("success", "Attendance record deleted successfully");
      setRecordToDelete(null);
      fetchAttendance(true);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete attendance record");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCourse !== "All") params.set("course", selectedCourse);
    if (selectedBatch !== "All") params.set("batch", selectedBatch);
    if (selectedStatus !== "All") params.set("status", selectedStatus);
    if (dateRange !== "All") params.set("dateRange", dateRange);
    if (specificDate) params.set("date", specificDate);

    window.open(`/api/attendance/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F3F8F7] pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-top duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Page Title & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#078783] text-white flex items-center justify-center shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Attendance Management
                </h1>
                <p className="text-xs md:text-sm text-slate-500">
                  Track batch attendance sessions, student punctuality, and official compliance reports
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchAttendance(true)}
              disabled={isRefreshing}
              className="border-[#E2ECEB] bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              className="border-[#E2ECEB] bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#078783]" />
              Official Report
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="border-[#E2ECEB] bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export CSV
            </Button>

            <Button
              type="button"
              onClick={() => setIsMarkModalOpen(true)}
              className="bg-[#078783] hover:bg-[#066f6c] text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Take Attendance
            </Button>
          </div>
        </div>

        {/* Attendance Dashboard KPIs */}
        <AttendanceKPIs
          stats={stats}
          activeStatusFilter={selectedStatus}
          onStatusFilterSelect={(status) => setSelectedStatus(status)}
          selectedBatch={selectedBatch}
          onBatchFilterSelect={(batch) => setSelectedBatch(batch)}
          batches={batches}
          selectedDate={specificDate}
          onDateChange={(date) => setSpecificDate(date)}
        />

        {/* Directory Card with Search, Filter & Table */}
        <div className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 sm:p-5 border-b border-[#E2ECEB] space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name, ID, course, batch, or remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 text-xs md:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-[#E2ECEB] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078783]/30 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {["All", ...attendanceStatusEnum].map((st) => {
                  const isSelected = selectedStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        isSelected
                          ? "bg-[#078783] text-white border-[#078783] shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-[#E2ECEB] hover:bg-slate-100"
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropdown Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              {/* Course filter */}
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="h-8.5 px-3 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-700 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                <option value="All">All Courses</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Batch filter */}
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="h-8.5 px-3 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-700 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                <option value="All">All Batches</option>
                {batches.map((b) => (
                  <option key={b.batchCode} value={b.batchCode}>
                    {b.batchCode} · {b.batchName}
                  </option>
                ))}
              </select>

              {/* Date Range filter */}
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (e.target.value !== "All") setSpecificDate("");
                }}
                className="h-8.5 px-3 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-700 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-slate-500 text-xs">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8.5 px-2.5 rounded-lg border border-[#E2ECEB] bg-slate-50 text-slate-700 font-medium text-xs focus:outline-none"
                >
                  <option value="date">Date</option>
                  <option value="name">Student Name</option>
                  <option value="batch">Batch</option>
                  <option value="status">Status</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  className="w-8.5 h-8.5 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                  title={sortOrder === "asc" ? "Ascending order" : "Descending order"}
                >
                  {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Directory Records Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
                <p className="text-sm font-medium">Loading attendance directory...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No attendance records found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query, clearing active filters, or take attendance for a batch.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsMarkModalOpen(true)}
                  className="bg-[#078783] hover:bg-[#066f6c] text-white text-xs mt-2"
                >
                  Take Attendance Now
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-[#E2ECEB] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Batch & Course</th>
                    <th className="px-4 py-3.5">Date & Session</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Check-in</th>
                    <th className="px-4 py-3.5">Remarks</th>
                    <th className="px-4 py-3.5">Recorded By</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2ECEB]">
                  {paginatedRecords.map((r) => {
                    let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                    if (r.status === "Present") {
                      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (r.status === "Absent") {
                      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                    } else if (r.status === "Late") {
                      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                    } else if (r.status === "Excused") {
                      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                    }

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Student Column */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8.5 h-8.5 rounded-full bg-[#E6F5F4] text-[#078783] font-bold text-xs flex items-center justify-center shrink-0 border border-[#078783]/20">
                              {r.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForProfile(r.studentId)}
                                className="font-bold text-slate-900 hover:text-[#078783] hover:underline text-left"
                              >
                                {r.studentName}
                              </button>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {r.studentCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Batch & Course Column */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{r.batchCode}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]" title={r.courseName}>
                            {r.courseName}
                          </div>
                        </td>

                        {/* Date & Session Column */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 whitespace-nowrap">
                            {r.date}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={r.sessionTitle}>
                            {r.sessionTitle || "Standard Lecture"}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-3.5">
                          <Badge className={`text-xs font-semibold ${badgeStyle}`}>
                            {r.status}
                          </Badge>
                        </td>

                        {/* Check-in Time */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                          {r.checkInTime || "--"}
                        </td>

                        {/* Remarks */}
                        <td className="px-4 py-3.5 text-slate-500 text-xs max-w-[160px] truncate" title={r.remarks || ""}>
                          {r.remarks || "--"}
                        </td>

                        {/* Recorded By */}
                        <td className="px-4 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                          {r.recordedBy}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForProfile(r.studentId)}
                              title="View Student Profile"
                              className="p-1.5 text-slate-500 hover:text-[#078783] hover:bg-teal-50 rounded-md transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecordToEdit(r)}
                              title="Edit Record"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecordToDelete(r)}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Bar */}
          {!isLoading && records.length > 0 && (
            <div className="px-5 py-3.5 bg-slate-50 border-t border-[#E2ECEB] flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
              <div>
                Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                <strong>{Math.min(currentPage * pageSize, records.length)}</strong> of{" "}
                <strong>{records.length}</strong> records
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs border-[#E2ECEB] text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>

                <span className="font-medium text-slate-800 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs border-[#E2ECEB] text-slate-700 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        courses={courses}
        batches={batches}
        students={students}
        preSelectedBatchCode={selectedBatch !== "All" ? selectedBatch : null}
        onSuccess={(session, isNew) => {
          showNotification(
            "success",
            isNew
              ? `Attendance recorded for ${session.batchName} (${session.records.length} students)`
              : `Attendance updated for ${session.batchName}`
          );
          fetchAttendance(true);
        }}
      />

      {/* Student Attendance Profile Modal */}
      <StudentAttendanceModal
        isOpen={selectedStudentForProfile !== null}
        onClose={() => setSelectedStudentForProfile(null)}
        studentId={selectedStudentForProfile}
      />

      {/* Attendance Report Modal */}
      <AttendanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        records={records}
        batches={batches}
        selectedBatchCode={selectedBatch}
        dateRangeFilter={dateRange}
      />

      {/* Edit Attendance Record Modal */}
      <EditAttendanceRecordModal
        isOpen={recordToEdit !== null}
        onClose={() => setRecordToEdit(null)}
        record={recordToEdit}
        onSuccess={(updated) => {
          showNotification("success", `Updated attendance for ${updated.studentName}`);
          fetchAttendance(true);
        }}
      />

      {/* Delete Record Confirmation Dialog */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E2ECEB] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Attendance Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove the attendance record for{" "}
                <strong className="text-slate-800">{recordToDelete.studentName}</strong> on{" "}
                <strong>{recordToDelete.date}</strong>? This will recalculate the student's attendance metrics.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="text-slate-600 border-[#E2ECEB]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeleteRecord}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Record</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
