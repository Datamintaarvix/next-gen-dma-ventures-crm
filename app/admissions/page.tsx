"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AdmissionRecord,
  AdmissionStatus,
  admissionStatusEnum,
  paymentStatusEnum,
} from "@/lib/validations/admission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdmissionKPIs, AdmissionStats } from "@/components/admissions/admission-kpis";
import { AdmissionModal } from "@/components/admissions/admission-modal";
import { AdmissionDetailsModal } from "@/components/admissions/admission-details-modal";
import { RecordPaymentModal } from "@/components/admissions/record-payment-modal";
import { DeleteAdmissionDialog } from "@/components/admissions/delete-admission-dialog";
import { DemoNotice } from "@/components/dashboard/demo-notice";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Edit,
  Eye,
  CreditCard,
  Calendar,
  BookOpen,
  Layers,
  User,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
} from "lucide-react";

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [stats, setStats] = useState<AdmissionStats>({
    totalAdmissions: 0,
    newApplications: 0,
    pendingApplications: 0,
    approvedAdmissions: 0,
    enrolledStudents: 0,
    rejectedApplications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("All");
  const [selectedCounsellor, setSelectedCounsellor] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "name" | "fee" | "pending">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [admissionToEdit, setAdmissionToEdit] = useState<AdmissionRecord | null>(null);
  const [admissionToView, setAdmissionToView] = useState<AdmissionRecord | null>(null);
  const [admissionForPayment, setAdmissionForPayment] = useState<AdmissionRecord | null>(null);
  const [admissionToDelete, setAdmissionToDelete] = useState<AdmissionRecord | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch admissions
  const fetchAdmissions = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admissions");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load admissions");
      }
      setAdmissions(result.data);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (err: any) {
      console.error("Error fetching admissions:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAdmissions(false);
  };

  // Quick Status Change
  const handleStatusChange = async (id: string, newStatus: AdmissionStatus, remarks?: string) => {
    try {
      const res = await fetch(`/api/admissions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, remarks, staffName: "Admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update admission status");
      }

      setAdmissions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      if (admissionToView && admissionToView.id === id) {
        setAdmissionToView(data.data);
      }

      showNotification("success", `Admission status updated to "${newStatus}"`);
      fetchAdmissions(false);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update status");
      throw err;
    }
  };

  // Delete admission
  const handleDeleteConfirm = async (id: string) => {
    const res = await fetch(`/api/admissions/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete admission");
    }
    setAdmissions((prev) => prev.filter((a) => a.id !== id));
    showNotification("success", "Admission record deleted successfully");
    fetchAdmissions(false);
  };

  // Dynamic lists for filters
  const courseList = useMemo(() => {
    const set = new Set(admissions.map((a) => a.courseName));
    return Array.from(set);
  }, [admissions]);

  const batchList = useMemo(() => {
    const set = new Set(admissions.map((a) => a.batchCode));
    return Array.from(set);
  }, [admissions]);

  const counsellorList = useMemo(() => {
    const set = new Set(admissions.map((a) => a.counsellor));
    return Array.from(set);
  }, [admissions]);

  // Filtering
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((a) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const cleanPhone = searchTerm.replace(/[^0-9]/g, "");
        const match =
          a.admissionCode.toLowerCase().includes(q) ||
          a.studentName.toLowerCase().includes(q) ||
          a.studentCode.toLowerCase().includes(q) ||
          a.courseName.toLowerCase().includes(q) ||
          a.batchCode.toLowerCase().includes(q) ||
          a.counsellor.toLowerCase().includes(q) ||
          a.studentEmail.toLowerCase().includes(q) ||
          a.studentPhone.toLowerCase().includes(q) ||
          (cleanPhone.length >= 4 && a.studentPhone.replace(/[^0-9]/g, "").includes(cleanPhone));
        if (!match) return false;
      }

      if (selectedCourse !== "All" && a.courseName !== selectedCourse) {
        return false;
      }

      if (selectedBatch !== "All" && a.batchCode !== selectedBatch) {
        return false;
      }

      if (selectedStatus === "pending_applications") {
        if (a.status !== "Documents Pending" && a.status !== "Under Review") return false;
      } else if (selectedStatus !== "All" && a.status !== selectedStatus) {
        return false;
      }

      if (selectedPaymentStatus !== "All" && a.paymentStatus !== selectedPaymentStatus) {
        return false;
      }

      if (selectedCounsellor !== "All" && a.counsellor !== selectedCounsellor) {
        return false;
      }

      return true;
    });
  }, [
    admissions,
    searchTerm,
    selectedCourse,
    selectedBatch,
    selectedStatus,
    selectedPaymentStatus,
    selectedCounsellor,
  ]);

  // Sorting
  const sortedAdmissions = useMemo(() => {
    return [...filteredAdmissions].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.admissionDate).getTime();
        const dateB = new Date(b.admissionDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.studentName.localeCompare(b.studentName)
          : b.studentName.localeCompare(a.studentName);
      }
      if (sortBy === "fee") {
        return sortOrder === "asc" ? a.finalFee - b.finalFee : b.finalFee - a.finalFee;
      }
      if (sortBy === "pending") {
        return sortOrder === "asc"
          ? a.pendingAmount - b.pendingAmount
          : b.pendingAmount - a.pendingAmount;
      }
      return 0;
    });
  }, [filteredAdmissions, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedAdmissions.length / pageSize) || 1;
  const paginatedAdmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAdmissions.slice(start, start + pageSize);
  }, [sortedAdmissions, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCourse, selectedBatch, selectedStatus, selectedPaymentStatus, selectedCounsellor]);

  const handleKPIFilterSelect = (filterKey: string) => {
    if (filterKey === "All") {
      setSelectedStatus("All");
    } else {
      setSelectedStatus(filterKey);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCourse("All");
    setSelectedBatch("All");
    setSelectedStatus("All");
    setSelectedPaymentStatus("All");
    setSelectedCounsellor("All");
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCourse !== "All" ||
    selectedBatch !== "All" ||
    selectedStatus !== "All" ||
    selectedPaymentStatus !== "All" ||
    selectedCounsellor !== "All";

  const getStatusBadge = (status: AdmissionStatus) => {
    switch (status) {
      case "Enrolled":
        return <Badge variant="converted">Enrolled</Badge>;
      case "Approved":
        return <Badge variant="active">Approved</Badge>;
      case "Application Received":
        return <Badge variant="received">Application Received</Badge>;
      case "Documents Pending":
        return <Badge variant="duesoon">Documents Pending</Badge>;
      case "Under Review":
        return <Badge variant="inprogress">Under Review</Badge>;
      case "Rejected":
        return <Badge variant="lost">Rejected</Badge>;
      case "Cancelled":
        return <Badge variant="cancelled">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge variant="converted">Paid</Badge>;
      case "Partial":
        return <Badge variant="duesoon">Partial</Badge>;
      case "Pending":
        return <Badge variant="missed">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-top-2 duration-200 ${
            notification.type === "success"
              ? "bg-[#078783] text-white border-[#066e6b]"
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-[#078783] uppercase mb-1">
            Next Gen / Demo Workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#11232B]">
            Admissions Management
          </h1>
          <p className="text-xs text-[#5A7178] mt-0.5">
            Manage academic enrollments, fee structures, application workflows, and compliance verifications
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => {
              setAdmissionToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="h-9 text-xs bg-[#078783] hover:bg-[#066e6b] text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Admission
          </Button>
        </div>
      </div>

      {/* Demo Notice */}
      <DemoNotice message="Admissions management workspace. Seamlessly connected with Student Directory, Academic Courses, and Batch Cohorts. All admissions and fee records persist in the CRM database." />

      {/* Dashboard KPI Statistics */}
      <AdmissionKPIs
        stats={stats}
        activeFilter={selectedStatus}
        onFilterSelect={handleKPIFilterSelect}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2ECEB] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A7178] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate name, admission ID (AD-401), student ID, phone, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-[#E2ECEB] bg-[#F8FBFA] focus:outline-none focus:border-[#078783] focus:bg-white text-[#11232B] placeholder-[#8B9E9E] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B9E9E] hover:text-[#11232B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Course Filter */}
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Courses</option>
                {courseList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Batch Filter */}
            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Batches</option>
                {batchList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {admissionStatusEnum.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Payment Status Filter */}
            <div className="relative">
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Payments</option>
                {paymentStatusEnum.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Counsellor Filter */}
            <div className="relative">
              <select
                value={selectedCounsellor}
                onChange={(e) => setSelectedCounsellor(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Counsellors</option>
                {counsellorList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-") as [
                    "date" | "name" | "fee" | "pending",
                    "asc" | "desc"
                  ];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="name-asc">Student Name (A-Z)</option>
                <option value="fee-desc">Tuition Fee (High to Low)</option>
                <option value="pending-desc">Pending Balance (Highest)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs text-[#5A7178] hover:text-[#11232B]"
              >
                <X className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 text-xs text-[#5A7178] ml-auto border-[#E2ECEB]"
              title="Refresh admissions"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#078783]" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-[11px] text-[#5A7178] pt-1 border-t border-[#F0F5F4]">
          <div>
            Showing <strong className="text-[#11232B]">{sortedAdmissions.length}</strong> of{" "}
            <strong className="text-[#11232B]">{admissions.length}</strong> admissions
            {hasActiveFilters && " (filtered)"}
          </div>
          <div className="flex items-center gap-3">
            <span>
              Total Fees:{" "}
              <strong className="text-[#11232B]">
                ₹{sortedAdmissions.reduce((acc, a) => acc + a.finalFee, 0).toLocaleString("en-IN")}
              </strong>
            </span>
            <span>
              Collected:{" "}
              <strong className="text-[#078783]">
                ₹{sortedAdmissions.reduce((acc, a) => acc + a.paidAmount, 0).toLocaleString("en-IN")}
              </strong>
            </span>
            <span>
              Pending:{" "}
              <strong className="text-amber-600">
                ₹{sortedAdmissions.reduce((acc, a) => acc + a.pendingAmount, 0).toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Admissions Directory Table */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#5A7178] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
            <p className="text-xs font-medium">Loading admissions directory...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 flex flex-col items-center justify-center text-red-600 gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-xs font-medium">{errorMessage}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchAdmissions()}
              className="text-xs mt-1"
            >
              Try Again
            </Button>
          </div>
        ) : sortedAdmissions.length === 0 ? (
          <div className="py-16 text-center text-[#5A7178] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F3F8F7] flex items-center justify-center mx-auto text-[#078783]">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#11232B]">No Admissions Found</h3>
            <p className="text-xs max-w-sm mx-auto">
              {hasActiveFilters
                ? "No applications matched your current search filters. Try resetting the filters or modifying search keywords."
                : "No admissions created yet. Click 'Create Admission' above to register candidate applications."}
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Register First Admission
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2ECEB] bg-[#F8FBFA] text-[11px] font-semibold text-[#5A7178] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Admission ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Course & Cohort</th>
                  <th className="py-3.5 px-4">Admission Date</th>
                  <th className="py-3.5 px-4">Counsellor</th>
                  <th className="py-3.5 px-4">Tuition Fee & Status</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEB] text-xs">
                {paginatedAdmissions.map((admission) => {
                  return (
                    <tr
                      key={admission.id}
                      className="hover:bg-[#F3F8F7]/60 transition-colors group"
                    >
                      {/* Admission ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-[#11232B] whitespace-nowrap">
                        <span className="bg-[#EAEAEA] text-[#333] px-2 py-0.5 rounded text-[11px] font-bold">
                          {admission.admissionCode}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setAdmissionToView(admission)}
                          className="font-semibold text-[#11232B] hover:text-[#078783] text-left transition-colors flex flex-col"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{admission.studentName}</span>
                            <span className="font-mono text-[10px] text-[#078783] font-bold">
                              ({admission.studentCode})
                            </span>
                          </div>
                          <div className="text-[11px] font-normal text-[#5A7178] flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#078783]" />
                              {admission.studentPhone}
                            </span>
                          </div>
                        </button>
                      </td>

                      {/* Course & Batch */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[#11232B] font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-[#078783] shrink-0" />
                          <span>{admission.courseName}</span>
                        </div>
                        <div className="text-[11px] text-[#5A7178] font-mono mt-0.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#5A7178]" />
                          <span>{admission.batchCode}</span>
                        </div>
                      </td>

                      {/* Admission Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#5A7178]">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-[#078783] shrink-0" />
                          <span>
                            {new Date(admission.admissionDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Counsellor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[#5A7178]">
                          <User className="w-3.5 h-3.5 text-[#5A7178] shrink-0" />
                          <span className="text-[#11232B]">{admission.counsellor}</span>
                        </div>
                      </td>

                      {/* Fee & Payment Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#11232B]">
                            ₹{admission.paidAmount.toLocaleString("en-IN")} / ₹{admission.finalFee.toLocaleString("en-IN")}
                          </span>
                          {getPaymentBadge(admission.paymentStatus)}
                        </div>
                        {admission.pendingAmount > 0 && (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                            Due: ₹{admission.pendingAmount.toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>

                      {/* Workflow Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(admission.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setAdmissionToView(admission)}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors"
                            title="View admission profile, fee breakdown & timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Record payment */}
                          <button
                            type="button"
                            onClick={() => setAdmissionForPayment(admission)}
                            disabled={admission.pendingAmount <= 0}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Record tuition installment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Edit admission */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdmissionToEdit(admission);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors"
                            title="Edit admission"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete admission */}
                          <button
                            type="button"
                            onClick={() => setAdmissionToDelete(admission)}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete admission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && sortedAdmissions.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2ECEB] bg-[#F8FBFA] text-xs text-[#5A7178]">
            <div>
              Page <strong className="text-[#11232B]">{currentPage}</strong> of{" "}
              <strong className="text-[#11232B]">{totalPages}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-8 text-xs px-2.5 border-[#E2ECEB]"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 text-xs px-2.5 border-[#E2ECEB]"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Admission Modal */}
      <AdmissionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setAdmissionToEdit(null);
        }}
        onSuccess={(saved) => {
          showNotification(
            "success",
            admissionToEdit
              ? `Admission ${saved.admissionCode} updated successfully`
              : `Admission ${saved.admissionCode} created for ${saved.studentName}`
          );
          fetchAdmissions(false);
        }}
        admissionToEdit={admissionToEdit}
      />

      {/* Admission Details Drawer / Modal */}
      <AdmissionDetailsModal
        isOpen={Boolean(admissionToView)}
        onClose={() => setAdmissionToView(null)}
        admission={admissionToView}
        onEdit={(adm) => {
          setAdmissionToView(null);
          setAdmissionToEdit(adm);
          setIsCreateModalOpen(true);
        }}
        onOpenRecordPayment={(adm) => {
          setAdmissionForPayment(adm);
        }}
        onStatusChange={handleStatusChange}
        onRefresh={() => {
          fetchAdmissions(false);
        }}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(admissionForPayment)}
        onClose={() => setAdmissionForPayment(null)}
        admission={admissionForPayment}
        onSuccess={() => {
          showNotification("success", "Tuition installment payment recorded successfully");
          fetchAdmissions(false);
          if (admissionToView && admissionForPayment && admissionToView.id === admissionForPayment.id) {
            // Re-fetch details to sync view
            fetch(`/api/admissions/${admissionToView.id}`)
              .then((r) => r.json())
              .then((data) => {
                if (data.success) setAdmissionToView(data.data);
              })
              .catch(console.error);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteAdmissionDialog
        isOpen={Boolean(admissionToDelete)}
        onClose={() => setAdmissionToDelete(null)}
        admission={admissionToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
