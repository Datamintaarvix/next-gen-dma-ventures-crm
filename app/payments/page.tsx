"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PaymentTransactionRecord,
  TransactionStatus,
  transactionStatusEnum,
  paymentMethodList,
} from "@/lib/validations/payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentKPIs, PaymentStats } from "@/components/payments/payment-kpis";
import { PaymentModal } from "@/components/payments/payment-modal";
import { PaymentReceiptModal } from "@/components/payments/payment-receipt-modal";
import { InstallmentDrawer } from "@/components/payments/installment-drawer";
import { RefundModal } from "@/components/payments/refund-modal";
import { DemoNotice } from "@/components/dashboard/demo-notice";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Receipt,
  Printer,
  CalendarClock,
  RotateCcw,
  Calendar,
  BookOpen,
  User,
  CreditCard,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  BarChart3,
  Phone,
} from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentTransactionRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalFees: 0,
    totalCollected: 0,
    outstandingAmount: 0,
    todayCollected: 0,
    pendingCount: 0,
    overdueCount: 0,
    courseBreakdown: [],
  });
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
  const [selectedMethod, setSelectedMethod] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name" | "balance">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Show course breakdown toggle
  const [showCourseBreakdown, setShowCourseBreakdown] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [preSelectedAdmissionId, setPreSelectedAdmissionId] = useState<string | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<PaymentTransactionRecord | null>(null);
  const [installmentAdmissionId, setInstallmentAdmissionId] = useState<string | null>(null);
  const [refundPayment, setRefundPayment] = useState<PaymentTransactionRecord | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch payments & statistics
  const fetchPayments = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/payments");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load payments");
      }
      setPayments(result.data);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPayments(false);
  };

  // Dynamic courses list for filter
  const courseList = useMemo(() => {
    const set = new Set(payments.map((p) => p.courseName));
    return Array.from(set);
  }, [payments]);

  // Filtering
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const cleanPhone = searchTerm.replace(/[^0-9]/g, "");
        const match =
          p.id.toLowerCase().includes(q) ||
          p.receiptNo.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q) ||
          p.admissionCode.toLowerCase().includes(q) ||
          p.courseName.toLowerCase().includes(q) ||
          p.batchCode.toLowerCase().includes(q) ||
          p.transactionRef?.toLowerCase().includes(q) ||
          (cleanPhone.length >= 4 && p.studentPhone.replace(/[^0-9]/g, "").includes(cleanPhone));
        if (!match) return false;
      }

      if (selectedCourse !== "All" && p.courseName !== selectedCourse) {
        return false;
      }

      if (selectedMethod !== "All" && p.paymentMethod !== selectedMethod) {
        return false;
      }

      if (selectedStatus !== "All" && p.status !== selectedStatus) {
        return false;
      }

      if (dateRange !== "All") {
        const today = new Date().toISOString().split("T")[0];
        if (dateRange === "today" && p.paymentDate !== today) {
          return false;
        }
        if (dateRange === "month") {
          const currentMonth = today.substring(0, 7);
          if (!p.paymentDate.startsWith(currentMonth)) return false;
        }
      }

      return true;
    });
  }, [payments, searchTerm, selectedCourse, selectedMethod, selectedStatus, dateRange]);

  // Sorting
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.paymentDate).getTime();
        const dateB = new Date(b.paymentDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.studentName.localeCompare(b.studentName)
          : b.studentName.localeCompare(a.studentName);
      }
      if (sortBy === "balance") {
        return sortOrder === "asc"
          ? a.outstandingBalance - b.outstandingBalance
          : b.outstandingBalance - a.outstandingBalance;
      }
      return 0;
    });
  }, [filteredPayments, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPayments.slice(start, start + pageSize);
  }, [sortedPayments, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCourse, selectedMethod, selectedStatus, dateRange]);

  const handleKPIFilterSelect = (filterKey: string) => {
    if (filterKey === "All") {
      setSelectedStatus("All");
      setDateRange("All");
    } else if (filterKey === "today") {
      setDateRange("today");
      setSelectedStatus("All");
    } else {
      setSelectedStatus(filterKey);
      setDateRange("All");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCourse("All");
    setSelectedMethod("All");
    setSelectedStatus("All");
    setDateRange("All");
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCourse !== "All" ||
    selectedMethod !== "All" ||
    selectedStatus !== "All" ||
    dateRange !== "All";

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case "Paid":
        return <Badge variant="converted">Paid</Badge>;
      case "Partially Paid":
        return <Badge variant="duesoon">Partial</Badge>;
      case "Overdue":
        return <Badge variant="missed">Overdue</Badge>;
      case "Refunded":
        return <Badge variant="lost">Refunded</Badge>;
      case "Pending":
      default:
        return <Badge variant="outline">Pending</Badge>;
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
            Payment Management
          </h1>
          <p className="text-xs text-[#5A7178] mt-0.5">
            Track tuition revenue, record installments, issue fee receipts, and monitor overdue accounts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => {
              setPreSelectedAdmissionId(null);
              setIsCreateModalOpen(true);
            }}
            className="h-9 text-xs bg-[#078783] hover:bg-[#066e6b] text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Demo Notice */}
      <DemoNotice message="Tuition fee ledger. Permanent financial transactions with real-time balance reconciliation. Receipts are issued with official NEXT GEN DMA VENTURES authentication." />

      {/* Dashboard KPI Statistics */}
      <PaymentKPIs
        stats={stats}
        activeFilter={selectedStatus !== "All" ? selectedStatus : dateRange === "today" ? "today" : "All"}
        onFilterSelect={handleKPIFilterSelect}
      />

      {/* Course-Wise Revenue Toggle */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] p-4 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowCourseBreakdown(!showCourseBreakdown)}
          className="w-full flex items-center justify-between text-xs font-bold text-[#11232B] hover:text-[#078783] transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#078783]" />
            <span>Course-Wise Tuition Fee Collections & Progress</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#5A7178]">
            <span>{showCourseBreakdown ? "Hide Breakdown" : "View Breakdown"}</span>
            {showCourseBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showCourseBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-[#F0F5F4]">
            {stats.courseBreakdown.map((c) => {
              const pct = c.totalFee > 0 ? Math.round((c.collected / c.totalFee) * 100) : 0;
              return (
                <div key={c.courseName} className="p-3 bg-[#F8FBFA] rounded-lg border border-[#E2ECEB] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-[#11232B] truncate">{c.courseName}</strong>
                    <span className="text-[10px] text-[#5A7178] font-medium">{c.studentCount} students</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#078783] font-semibold">₹{c.collected.toLocaleString("en-IN")}</span>
                    <span className="text-[#5A7178]">₹{c.totalFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full bg-[#E2ECEB] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#078783] rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#5A7178]">
                    <span>{pct}% Collected</span>
                    <span className="text-amber-700">Due: ₹{c.pending.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2ECEB] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A7178] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by receipt no (REC-2026-077), student name, code, admission ID, UTR..."
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

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Payment Methods</option>
                {paymentMethodList.map((m) => (
                  <option key={m} value={m}>
                    {m}
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
                {transactionStatusEnum.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Dates</option>
                <option value="today">Today</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-") as [
                    "date" | "amount" | "name" | "balance",
                    "asc" | "desc"
                  ];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="balance-desc">Balance Due (High to Low)</option>
                <option value="name-asc">Student Name (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset */}
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
              title="Refresh ledger"
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
            Showing <strong className="text-[#11232B]">{sortedPayments.length}</strong> of{" "}
            <strong className="text-[#11232B]">{payments.length}</strong> transactions
            {hasActiveFilters && " (filtered)"}
          </div>
          <div className="flex items-center gap-3">
            <span>
              Transactions Total:{" "}
              <strong className="text-[#078783]">
                ₹{sortedPayments.reduce((acc, p) => acc + (p.amount > 0 ? p.amount : 0), 0).toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Payments Directory Table */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#5A7178] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
            <p className="text-xs font-medium">Loading payments ledger...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 flex flex-col items-center justify-center text-red-600 gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-xs font-medium">{errorMessage}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchPayments()}
              className="text-xs mt-1"
            >
              Try Again
            </Button>
          </div>
        ) : sortedPayments.length === 0 ? (
          <div className="py-16 text-center text-[#5A7178] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F3F8F7] flex items-center justify-center mx-auto text-[#078783]">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#11232B]">No Payment Records Found</h3>
            <p className="text-xs max-w-sm mx-auto">
              {hasActiveFilters
                ? "No transactions matched your current filters. Try resetting the filters or modifying search keywords."
                : "No tuition fee transactions recorded yet. Click 'Record Payment' above to log receipts."}
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
                Record First Payment
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2ECEB] bg-[#F8FBFA] text-[11px] font-semibold text-[#5A7178] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Receipt & Txn ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Admission & Cohort</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Net Program Fee</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Outstanding Balance</th>
                  <th className="py-3.5 px-4">Date & Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEB] text-xs">
                {paginatedPayments.map((payment) => {
                  const isRefund = payment.type === "Refund";

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-[#F3F8F7]/60 transition-colors group"
                    >
                      {/* Receipt & Txn */}
                      <td className="py-3.5 px-4 font-mono font-medium text-[#11232B] whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setReceiptPayment(payment)}
                          className="font-bold text-[#078783] hover:underline flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{payment.receiptNo}</span>
                        </button>
                        <div className="text-[10px] text-[#5A7178] font-mono mt-0.5">
                          {payment.id}
                        </div>
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#11232B]">
                          {payment.studentName}
                        </div>
                        <div className="text-[11px] text-[#5A7178] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[#078783] font-bold">{payment.studentCode}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#5A7178]" />
                            {payment.studentPhone}
                          </span>
                        </div>
                      </td>

                      {/* Admission ID & Batch */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-[#EAEAEA] text-[#333] px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                          {payment.admissionCode}
                        </span>
                        <div className="text-[10px] text-[#5A7178] font-mono mt-0.5">
                          {payment.batchCode}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[#11232B] font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-[#078783] shrink-0" />
                          <span>{payment.courseName}</span>
                        </div>
                      </td>

                      {/* Total Course Fee */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[#5A7178]">
                        ₹{payment.finalFee.toLocaleString("en-IN")}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-mono font-bold ${
                            isRefund ? "text-red-600" : "text-[#078783]"
                          }`}
                        >
                          {isRefund ? "-" : "+"}₹{Math.abs(payment.amount).toLocaleString("en-IN")}
                        </span>
                        {payment.installmentNumber && (
                          <div className="text-[10px] text-[#5A7178]">
                            Inst. #{payment.installmentNumber}
                          </div>
                        )}
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <span
                          className={`font-semibold ${
                            payment.outstandingBalance > 0 ? "text-amber-700" : "text-emerald-700"
                          }`}
                        >
                          ₹{payment.outstandingBalance.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Date & Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#5A7178]">
                        <div className="flex items-center gap-1 text-[11px] text-[#11232B]">
                          <Calendar className="w-3.5 h-3.5 text-[#078783]" />
                          <span>
                            {new Date(payment.paymentDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#5A7178] flex items-center gap-1 mt-0.5">
                          <CreditCard className="w-3 h-3 text-[#5A7178]" />
                          <span>{payment.paymentMethod}</span>
                          {payment.transactionRef && (
                            <span className="font-mono text-[9px] text-[#8B9E9E]">
                              ({payment.transactionRef.substring(0, 14)})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print receipt */}
                          <button
                            type="button"
                            onClick={() => setReceiptPayment(payment)}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors"
                            title="Print / View Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Installments schedule */}
                          <button
                            type="button"
                            onClick={() => setInstallmentAdmissionId(payment.admissionId)}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors"
                            title="View Installment Schedule"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>

                          {/* Refund */}
                          {!isRefund && (
                            <button
                              type="button"
                              onClick={() => setRefundPayment(payment)}
                              className="p-1.5 rounded-lg text-[#5A7178] hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Process Refund"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && sortedPayments.length > 0 && (
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

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPreSelectedAdmissionId(null);
        }}
        preSelectedAdmissionId={preSelectedAdmissionId}
        onSuccess={(newPayment) => {
          showNotification(
            "success",
            `Payment receipt ${newPayment.receiptNo} of ₹${newPayment.amount.toLocaleString("en-IN")} recorded successfully`
          );
          fetchPayments(false);
          // Open receipt view
          setReceiptPayment(newPayment);
        }}
      />

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />

      {/* Installment Drawer */}
      <InstallmentDrawer
        isOpen={Boolean(installmentAdmissionId)}
        onClose={() => setInstallmentAdmissionId(null)}
        admissionId={installmentAdmissionId}
        onOpenRecordPayment={(admId) => {
          setPreSelectedAdmissionId(admId);
          setIsCreateModalOpen(true);
        }}
        onSuccess={() => {
          fetchPayments(false);
        }}
      />

      {/* Refund Modal */}
      <RefundModal
        isOpen={Boolean(refundPayment)}
        onClose={() => setRefundPayment(null)}
        payment={refundPayment}
        onSuccess={() => {
          showNotification("success", "Auditable refund processed successfully");
          fetchPayments(false);
        }}
      />
    </div>
  );
}
