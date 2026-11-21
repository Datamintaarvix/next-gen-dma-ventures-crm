"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FollowUpRecord,
  followUpTypeEnum,
  followUpStatusEnum,
  followUpPriorityEnum,
} from "@/lib/validations/follow-up";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowUpKPIs } from "@/components/follow-ups/follow-up-kpis";
import { ReminderBanner } from "@/components/follow-ups/reminder-banner";
import { FollowUpCalendar } from "@/components/follow-ups/follow-up-calendar";
import { FollowUpModal } from "@/components/follow-ups/follow-up-modal";
import { FollowUpDetailModal } from "@/components/follow-ups/follow-up-detail-modal";
import { CompleteFollowUpModal } from "@/components/follow-ups/complete-follow-up-modal";
import { RescheduleModal } from "@/components/follow-ups/reschedule-modal";
import { DeleteFollowUpDialog } from "@/components/follow-ups/delete-follow-up-dialog";
import {
  Search,
  Plus,
  ChevronDown,
  RefreshCw,
  Loader2,
  Trash2,
  CheckCircle2,
  CalendarClock,
  List,
  Calendar as CalendarIcon,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode: 'list' | 'calendar'
  const [activeTab, setActiveTab] = useState<"list" | "calendar">("list");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [kpiFilter, setKpiFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [counsellorFilter, setCounsellorFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<FollowUpRecord | null>(null);
  const [selectedForView, setSelectedForView] = useState<FollowUpRecord | null>(null);
  const [selectedForComplete, setSelectedForComplete] = useState<FollowUpRecord | null>(null);
  const [selectedForReschedule, setSelectedForReschedule] = useState<FollowUpRecord | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<FollowUpRecord | null>(null);

  const todayStr = "2026-11-17";

  // Fetch follow-ups from backend
  const fetchFollowUps = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/follow-ups");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load follow-ups");
      }
      setFollowUps(result.data);
    } catch (err: any) {
      console.error("Error fetching follow-ups:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFollowUps(false);
  };

  const availableStaff = useMemo(
    () => Array.from(new Set(followUps.map((f) => f.assignedCounsellor).filter(Boolean))),
    [followUps]
  );

  // Status badge variant
  const getStatusBadgeVariant = (status: FollowUpRecord["status"]) => {
    switch (status) {
      case "Pending":
        return "pending";
      case "Completed":
        return "completed";
      case "Rescheduled":
        return "rescheduled";
      case "Missed":
        return "missed";
      case "Cancelled":
        return "cancelled";
      default:
        return "default";
    }
  };

  // Filtered & Sorted list
  const filteredAndSortedFollowUps = useMemo(() => {
    return followUps
      .filter((f) => {
        // KPI fast-filter
        if (kpiFilter === "today") {
          if (f.followUpDate !== todayStr || f.status === "Completed" || f.status === "Cancelled") {
            return false;
          }
        } else if (kpiFilter === "upcoming") {
          if (f.followUpDate <= todayStr || f.status === "Completed" || f.status === "Cancelled") {
            return false;
          }
        } else if (kpiFilter === "overdue") {
          if (f.followUpDate >= todayStr || f.status === "Completed" || f.status === "Cancelled") {
            return false;
          }
        } else if (kpiFilter === "completed") {
          if (f.status !== "Completed") return false;
        } else if (kpiFilter === "missed") {
          if (f.status !== "Missed" && !(f.followUpDate < todayStr && f.status === "Pending")) {
            return false;
          }
        }

        // Search match
        const matchesSearch =
          f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.contactNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.followUpCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.assignedCounsellor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (f.relatedCode && f.relatedCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (f.notes && f.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        // Status match
        const matchesStatus = statusFilter === "All" || f.status === statusFilter;

        // Priority match
        const matchesPriority = priorityFilter === "All" || f.priority === priorityFilter;

        // Counsellor match
        const matchesCounsellor =
          counsellorFilter === "All" || f.assignedCounsellor === counsellorFilter;

        // Type match
        const matchesType = typeFilter === "All" || f.type === typeFilter;

        // Date match
        const matchesDate = !dateFilter || f.followUpDate === dateFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesCounsellor &&
          matchesType &&
          matchesDate
        );
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const weights: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
          const diff = weights[b.priority] - weights[a.priority];
          return sortOrder === "desc" ? -diff : diff;
        }
        // Default sort by date + time
        const aKey = `${a.followUpDate}T${a.followUpTime}`;
        const bKey = `${b.followUpDate}T${b.followUpTime}`;
        if (aKey < bKey) return sortOrder === "asc" ? -1 : 1;
        if (aKey > bKey) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [
    followUps,
    kpiFilter,
    searchTerm,
    statusFilter,
    priorityFilter,
    counsellorFilter,
    typeFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  // Pagination calculation
  const totalItems = filteredAndSortedFollowUps.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedFollowUps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedFollowUps.slice(start, start + pageSize);
  }, [filteredAndSortedFollowUps, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Callbacks
  const handleFollowUpSaved = (saved: FollowUpRecord) => {
    setFollowUps((prev) => {
      const index = prev.findIndex((f) => f.id === saved.id);
      if (index !== -1) {
        const copy = [...prev];
        copy[index] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleFollowUpCompleted = (result: {
    completed: FollowUpRecord;
    nextFollowUp?: FollowUpRecord;
  }) => {
    setFollowUps((prev) => {
      let copy = prev.map((f) => (f.id === result.completed.id ? result.completed : f));
      if (result.nextFollowUp) {
        copy = [result.nextFollowUp, ...copy];
      }
      return copy;
    });
    if (selectedForView?.id === result.completed.id) {
      setSelectedForView(result.completed);
    }
  };

  const handleFollowUpRescheduled = (updated: FollowUpRecord) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
    if (selectedForView?.id === updated.id) {
      setSelectedForView(updated);
    }
  };

  const handleFollowUpDeleted = (deletedId: string) => {
    setFollowUps((prev) => prev.filter((f) => f.id !== deletedId));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-widest text-[#078783] uppercase">
            NEXT GEN / LIVE WORKSPACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#11232B] tracking-tight">
            Follow-up Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7178]">
            Track, schedule, and execute student counselling communications
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* View toggle tabs */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-[#E2ECEB] text-xs font-medium">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === "list"
                  ? "bg-[#078783] text-white shadow-xs font-semibold"
                  : "text-[#5A7178] hover:text-[#11232B]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === "calendar"
                  ? "bg-[#078783] text-white shadow-xs font-semibold"
                  : "text-[#5A7178] hover:text-[#11232B]"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 border-[#E2ECEB] h-9"
            title="Refresh follow-ups list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5 shadow-sm text-xs h-9"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </Button>
        </div>
      </div>

      {/* Reminder Alerts Banner */}
      <ReminderBanner
        followUps={followUps}
        selectedCounsellor={counsellorFilter}
        onSelectFollowUp={(f) => setSelectedForView(f)}
      />

      {/* 5 Follow-up Dashboard KPIs */}
      <FollowUpKPIs
        followUps={followUps}
        activeFilter={kpiFilter}
        onFilterSelect={(kpi) => {
          setKpiFilter(kpi === kpiFilter ? "All" : kpi);
          setCurrentPage(1);
        }}
      />

      {/* VIEW 1: CALENDAR VIEW */}
      {activeTab === "calendar" && (
        <FollowUpCalendar
          followUps={filteredAndSortedFollowUps}
          onSelectFollowUp={(f) => setSelectedForView(f)}
        />
      )}

      {/* VIEW 2: LIST VIEW */}
      {activeTab === "list" && (
        <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-[#E2ECEB] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A9EA5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by student, phone, counsellor, notes..."
                className="w-full pl-9 pr-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
                >
                  <option value="All">All statuses</option>
                  {followUpStatusEnum.options.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
                >
                  <option value="All">All priorities</option>
                  {followUpPriorityEnum.options.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Counsellor Filter */}
              <div className="relative">
                <select
                  value={counsellorFilter}
                  onChange={(e) => {
                    setCounsellorFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
                >
                  <option value="All">All staff</option>
                  {availableStaff.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
                >
                  <option value="All">All types</option>
                  {followUpTypeEnum.options.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Date Filter */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-[#E2ECEB] text-xs text-[#11232B] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  title="Filter by date"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter("")}
                    className="ml-1 text-[#8A9EA5] hover:text-[#11232B]"
                    title="Clear date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split("-") as ["date" | "priority", "asc" | "desc"];
                    setSortBy(sb);
                    setSortOrder(so);
                  }}
                  className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
                >
                  <option value="date-asc">Date: Soonest first</option>
                  <option value="date-desc">Date: Latest first</option>
                  <option value="priority-asc">Priority: High to Low</option>
                  <option value="priority-desc">Priority: Low to High</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {kpiFilter !== "All" && (
            <div className="px-4 py-2 bg-[#F8FBFA] border-b border-[#E2ECEB] flex items-center justify-between text-xs text-[#5A7178]">
              <div className="flex items-center gap-1.5">
                <span>Active quick filter:</span>
                <span className="font-bold text-[#078783] capitalize">{kpiFilter} follow-ups</span>
              </div>
              <button
                onClick={() => setKpiFilter("All")}
                className="text-[#078783] hover:underline font-semibold"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => fetchFollowUps()}
                className="underline font-semibold hover:text-red-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2ECEB] bg-[#FAFCFB] text-[#5A7178] font-medium select-none">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Scheduled Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Counsellor</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Connected Module</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEB]">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#5A7178]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 text-[#078783] animate-spin" />
                        <span>Loading follow-up schedules...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedFollowUps.length > 0 ? (
                  paginatedFollowUps.map((f) => {
                    const isToday = f.followUpDate === todayStr;
                    const isOverdue =
                      f.followUpDate < todayStr &&
                      f.status !== "Completed" &&
                      f.status !== "Cancelled";

                    return (
                      <tr
                        key={f.id}
                        className={`hover:bg-[#F8FBFA] transition-colors ${
                          isOverdue ? "bg-red-50/20" : isToday ? "bg-[#F3F8F7]/30" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-[#11232B]">
                          {f.followUpCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#11232B]">
                          {f.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-[#5A7178]">{f.contactNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span
                              className={
                                isOverdue
                                  ? "text-red-600 font-bold"
                                  : isToday
                                  ? "text-[#078783] font-bold"
                                  : "text-[#11232B]"
                              }
                            >
                              {f.followUpDate}
                            </span>
                            <span className="text-[#8A9EA5]">at {f.followUpTime}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F8F7] text-[#5A7178] border border-[#E2ECEB]">
                            {f.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#11232B]">{f.assignedCounsellor}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              f.priority === "High"
                                ? "high"
                                : f.priority === "Medium"
                                ? "medium"
                                : "low"
                            }
                          >
                            {f.priority}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {f.relatedType && f.relatedType !== "General" ? (
                            <Link
                              href={f.relatedType === "Lead" ? "/leads" : "/enquiries"}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#078783] hover:underline"
                            >
                              <span>{f.relatedCode || f.relatedType}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          ) : (
                            <span className="text-[#A0B2B8] text-[11px]">General</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getStatusBadgeVariant(f.status)}>{f.status}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {f.status !== "Completed" && (
                              <button
                                onClick={() => setSelectedForComplete(f)}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Mark Completed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {f.status !== "Completed" && (
                              <button
                                onClick={() => setSelectedForReschedule(f)}
                                className="p-1 rounded text-[#2563EB] hover:bg-blue-50 transition-colors"
                                title="Reschedule Follow-up"
                              >
                                <CalendarClock className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedForView(f)}
                              className="text-[#078783] hover:underline font-semibold text-xs px-1"
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setSelectedForEdit(f)}
                              className="text-[#5A7178] hover:text-[#11232B] text-xs px-1"
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setSelectedForDelete(f)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#5A7178]">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#11232B]">No follow-ups found</p>
                        <p className="text-xs text-[#8A9EA5]">
                          {searchTerm || statusFilter !== "All" || kpiFilter !== "All"
                            ? "Try adjusting your filters or search query"
                            : "Click '+ Schedule Follow-up' to create a new task."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#E2ECEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5A7178] bg-[#FAFCFB]">
            <div>
              <span className="font-medium text-[#11232B]">{totalItems}</span> follow-ups · Page{" "}
              <span className="font-medium text-[#11232B]">{currentPage}</span> of{" "}
              <span className="font-medium text-[#11232B]">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className={`px-3 py-1.5 rounded-lg border border-[#E2ECEB] transition-colors ${
                  currentPage <= 1
                    ? "text-[#A0B2B8] bg-[#F8FBFA] cursor-not-allowed"
                    : "text-[#11232B] bg-white hover:bg-[#F3F8F7]"
                }`}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      currentPage === page
                        ? "bg-[#078783] text-white font-bold"
                        : "text-[#5A7178] hover:bg-[#F3F8F7] hover:text-[#11232B]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className={`px-3 py-1.5 rounded-lg border border-[#E2ECEB] transition-colors ${
                  currentPage >= totalPages
                    ? "text-[#A0B2B8] bg-[#F8FBFA] cursor-not-allowed"
                    : "text-[#11232B] bg-white hover:bg-[#F3F8F7]"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Edit Modal */}
      <FollowUpModal
        isOpen={isCreateModalOpen || Boolean(selectedForEdit)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedForEdit(null);
        }}
        onSaved={handleFollowUpSaved}
        initialData={selectedForEdit}
      />

      {/* View Detail Modal */}
      <FollowUpDetailModal
        followUp={selectedForView}
        isOpen={Boolean(selectedForView)}
        onClose={() => setSelectedForView(null)}
        onEdit={(f) => setSelectedForEdit(f)}
        onDelete={(f) => setSelectedForDelete(f)}
        onOpenComplete={(f) => setSelectedForComplete(f)}
        onOpenReschedule={(f) => setSelectedForReschedule(f)}
      />

      {/* Complete Follow-up Modal */}
      <CompleteFollowUpModal
        followUp={selectedForComplete}
        isOpen={Boolean(selectedForComplete)}
        onClose={() => setSelectedForComplete(null)}
        onCompleted={handleFollowUpCompleted}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        followUp={selectedForReschedule}
        isOpen={Boolean(selectedForReschedule)}
        onClose={() => setSelectedForReschedule(null)}
        onRescheduled={handleFollowUpRescheduled}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteFollowUpDialog
        followUp={selectedForDelete}
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onDeleted={handleFollowUpDeleted}
      />
    </div>
  );
}
