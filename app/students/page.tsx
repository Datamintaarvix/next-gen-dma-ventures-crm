"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  StudentRecord,
  StudentStatus,
  studentBatchList,
  studentStatusEnum,
} from "@/lib/validations/student";
import { COURSE_CATEGORIES, COURSE_CATALOGUE_BY_CATEGORY } from "@/lib/courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentKPIs } from "@/components/students/student-kpis";
import { StudentModal } from "@/components/students/student-modal";
import { StudentProfileModal } from "@/components/students/student-profile-modal";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import { DemoNotice } from "@/components/dashboard/demo-notice";
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Loader2,
  Trash2,
  Edit,
  Eye,
  Phone,
  Mail,
  ChevronDown,
  X,
  GraduationCap,
  Calendar,
  Filter,
} from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newlyAdmitted: 0,
    completed: 0,
    avgAttendance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedJoiningDate, setSelectedJoiningDate] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "attendance" | "fee">("newest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentRecord | null>(null);
  const [studentToView, setStudentToView] = useState<StudentRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);

  // Fetch students from API
  const fetchStudents = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/students");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load students");
      }
      setStudents(result.data);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStudents(false);
  };

  // Quick status change
  const handleStatusChange = async (id: string, newStatus: StudentStatus) => {
    try {
      const res = await fetch(`/api/students/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      // Update state locally
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      if (studentToView && studentToView.id === id) {
        setStudentToView((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      // Refresh stats
      fetchStudents(false);
    } catch (err: any) {
      alert("Failed to change status: " + err.message);
    }
  };

  // Delete student
  const handleDeleteConfirm = async (id: string) => {
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete student");
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    fetchStudents(false);
  };

  // Export to CSV
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams();
      if (selectedCourse !== "All") query.set("course", selectedCourse);
      if (selectedStatus !== "All") query.set("status", selectedStatus);

      const res = await fetch(`/api/students/export?${query.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Error exporting CSV: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search: name, phone, email, student ID
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const cleanQ = searchTerm.replace(/[^0-9]/g, "");
        const match =
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.phoneNumber.includes(q) ||
          (cleanQ.length >= 4 && s.phoneNumber.replace(/[^0-9]/g, "").includes(cleanQ)) ||
          s.email.toLowerCase().includes(q) ||
          (s.batchName && s.batchName.toLowerCase().includes(q)) ||
          (s.course && s.course.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Course
      if (selectedCourse !== "All" && s.course !== selectedCourse) {
        return false;
      }

      // Batch
      if (selectedBatch !== "All" && s.batchCode !== selectedBatch) {
        return false;
      }

      // Status
      if (selectedStatus === "newly_admitted") {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const adm = new Date(s.admissionDate);
        if (adm < thirtyDaysAgo) return false;
      } else if (selectedStatus !== "All" && s.status !== selectedStatus) {
        return false;
      }

      // Joining date
      if (selectedJoiningDate && s.joiningDate !== selectedJoiningDate) {
        return false;
      }

      return true;
    });
  }, [students, searchTerm, selectedCourse, selectedBatch, selectedStatus, selectedJoiningDate]);

  // Sort students
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.fullName.localeCompare(b.fullName)
          : b.fullName.localeCompare(a.fullName);
      }
      if (sortBy === "attendance") {
        const diff = (a.attendancePercentage || 0) - (b.attendancePercentage || 0);
        return sortOrder === "asc" ? diff : -diff;
      }
      if (sortBy === "fee") {
        const diff = (a.pendingAmount || 0) - (b.pendingAmount || 0);
        return sortOrder === "asc" ? diff : -diff;
      }
      // default: newest admission date
      const aTime = new Date(a.admissionDate || a.createdAt).getTime();
      const bTime = new Date(b.admissionDate || b.createdAt).getTime();
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [filteredStudents, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage]);

  const handleKPIFilterSelect = (filterKey: string) => {
    if (filterKey === "All") {
      setSelectedStatus("All");
    } else {
      setSelectedStatus(filterKey);
    }
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (st: StudentStatus) => {
    switch (st) {
      case "Active":
        return "active";
      case "Completed":
        return "completed";
      case "Inactive":
        return "inactive";
      case "Dropped":
        return "dropped";
      default:
        return "default";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCourse("All");
    setSelectedBatch("All");
    setSelectedStatus("All");
    setSelectedJoiningDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCourse !== "All" ||
    selectedBatch !== "All" ||
    selectedStatus !== "All" ||
    selectedJoiningDate;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-[#078783] uppercase mb-1">
            Next Gen / Demo Workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#11232B]">
            Student Management
          </h1>
          <p className="text-xs text-[#5A7178] mt-0.5">
            Directory of enrolled students, course batches, fee records, and academic progress
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting || students.length === 0}
            className="h-9 text-xs border-[#D5E2E0] text-[#11232B] hover:bg-white"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5 text-[#078783]" />
            )}
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setStudentToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="h-9 text-xs bg-[#078783] hover:bg-[#066e6b] text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Student
          </Button>
        </div>
      </div>

      {/* Demo Notice */}
      <DemoNotice message="Student records persist locally in the CRM database. Edits, enrollments, and status updates persist across sessions." />

      {/* KPI Cards */}
      <StudentKPIs
        stats={stats}
        activeFilter={selectedStatus}
        onFilterSelect={handleKPIFilterSelect}
      />

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-[#E2ECEB] bg-[#FAFCFB] space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B939B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search students by name, phone, email, or student ID..."
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-[#D5E2E0] text-xs text-[#11232B] placeholder:text-[#7B939B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Course Filter */}
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 pr-7 rounded-lg bg-white border border-[#D5E2E0] text-xs text-[#11232B] appearance-none focus:outline-none focus:border-[#078783] cursor-pointer"
                >
                  <option value="All">All Courses (44)</option>
                  {COURSE_CATEGORIES.map((cat) => (
                    <optgroup key={cat} label={`${cat} (${COURSE_CATALOGUE_BY_CATEGORY[cat].length})`}>
                      {COURSE_CATALOGUE_BY_CATEGORY[cat].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B939B] pointer-events-none" />
              </div>

              {/* Batch Filter */}
              <div className="relative">
                <select
                  value={selectedBatch}
                  onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 pr-7 rounded-lg bg-white border border-[#D5E2E0] text-xs text-[#11232B] appearance-none focus:outline-none focus:border-[#078783] cursor-pointer max-w-[170px] truncate"
                >
                  <option value="All">All Batches</option>
                  {studentBatchList.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} ({b.course})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B939B] pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 pr-7 rounded-lg bg-white border border-[#D5E2E0] text-xs text-[#11232B] appearance-none focus:outline-none focus:border-[#078783] cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  {studentStatusEnum.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B939B] pointer-events-none" />
              </div>

              {/* Joining Date Filter */}
              <input
                type="date"
                value={selectedJoiningDate}
                onChange={(e) => {
                  setSelectedJoiningDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-2.5 rounded-lg bg-white border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
                title="Filter by Joining Date"
              />

              {/* Reset Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 text-xs text-[#DC2626] hover:bg-red-50 hover:text-red-700 px-2.5"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reset
                </Button>
              )}

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9 p-0 border-[#D5E2E0] text-[#5A7178]"
                title="Refresh Table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#078783]" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-7 h-7 text-[#078783] animate-spin mb-2" />
            <span className="text-xs text-[#5A7178]">Loading registered students...</span>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E6F5F4] text-[#078783] flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-[#11232B]">No students found</div>
            <p className="text-xs text-[#7B939B] max-w-sm mx-auto">
              {hasActiveFilters
                ? "No student records matched your search or filters. Try adjusting your filter parameters."
                : "No students registered yet. Click 'Add New Student' to register your first student."}
            </p>
            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2ECEB] bg-[#FAFCFB] text-[#5A7178]">
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Course & Batch</th>
                  <th className="py-3 px-4 font-semibold">Admission / Joining</th>
                  <th className="py-3 px-4 font-semibold">Attendance</th>
                  <th className="py-3 px-4 font-semibold">Fee Status</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEB]">
                {paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-[#F8FBFA] transition-colors group"
                  >
                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: student.avatarColor || "#078783" }}
                        >
                          {getInitials(student.fullName)}
                        </div>
                        <div>
                          <div
                            onClick={() => setStudentToView(student)}
                            className="font-bold text-[#11232B] hover:text-[#078783] cursor-pointer transition-colors"
                          >
                            {student.fullName}
                          </div>
                          <span className="font-mono text-[10px] text-[#7B939B]">
                            {student.studentCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-[#5A7178]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-[#11232B] font-medium">
                          <Phone className="w-3 h-3 text-[#7B939B]" />
                          <span>{student.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#7B939B]">
                          <Mail className="w-3 h-3 text-[#7B939B]" />
                          <span className="truncate max-w-[150px]">{student.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Course & Batch */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-[#11232B] text-xs">
                          {student.course}
                        </div>
                        <div className="text-[11px] text-[#7B939B] truncate max-w-[180px]">
                          {student.batchCode}
                        </div>
                      </div>
                    </td>

                    {/* Admission & Joining */}
                    <td className="py-3 px-4 text-[11px]">
                      <div className="space-y-0.5">
                        <div className="text-[#11232B] font-medium">
                          Adm: {student.admissionDate}
                        </div>
                        <div className="text-[#7B939B]">Join: {student.joiningDate}</div>
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            student.attendancePercentage >= 85
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : student.attendancePercentage >= 70
                              ? "bg-[#E6F5F4] text-[#078783] border border-[#BDE7E5]"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {student.attendancePercentage}%
                        </div>
                      </div>
                    </td>

                    {/* Fee Status */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <Badge
                          variant={student.paymentStatus === "Paid" ? "paid" : "partial"}
                          className="text-[10px]"
                        >
                          {student.paymentStatus}
                        </Badge>
                        <div className="text-[10px] text-[#7B939B]">
                          ₹{student.paidAmount.toLocaleString("en-IN")} / ₹
                          {student.totalFee.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </td>

                    {/* Status with Quick Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={student.status}
                        onChange={(e) =>
                          handleStatusChange(student.id, e.target.value as StudentStatus)
                        }
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                          student.status === "Active"
                            ? "bg-[#E6F5F4] text-[#078783] border-[#BDE7E5]"
                            : student.status === "Completed"
                            ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
                            : student.status === "Inactive"
                            ? "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]"
                            : "bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]"
                        }`}
                      >
                        {studentStatusEnum.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStudentToView(student)}
                          className="h-8 w-8 p-0 text-[#078783] hover:bg-[#E6F5F4]"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setStudentToEdit(student);
                            setIsCreateModalOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-[#2563EB] hover:bg-[#EFF6FF]"
                          title="Edit Student"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStudentToDelete(student)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Summary Footer */}
        <div className="p-4 border-t border-[#E2ECEB] bg-[#FAFCFB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5A7178]">
          <div>
            Showing{" "}
            <span className="font-bold text-[#11232B]">
              {sortedStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-[#11232B]">
              {Math.min(currentPage * pageSize, sortedStudents.length)}
            </span>{" "}
            of <span className="font-bold text-[#11232B]">{sortedStudents.length}</span>{" "}
            students (Page {currentPage} of {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs px-3 border-[#D5E2E0]"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 text-xs px-3 border-[#D5E2E0]"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setStudentToEdit(null);
        }}
        onSuccess={() => {
          fetchStudents(false);
        }}
        studentToEdit={studentToEdit}
      />

      <StudentProfileModal
        isOpen={Boolean(studentToView)}
        onClose={() => setStudentToView(null)}
        student={studentToView}
        onEdit={(student) => {
          setStudentToEdit(student);
          setIsCreateModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
      />

      <DeleteStudentDialog
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        student={studentToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
