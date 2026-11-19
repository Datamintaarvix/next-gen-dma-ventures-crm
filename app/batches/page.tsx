"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BatchRecord,
  BatchStatus,
  batchStatusEnum,
  batchTrainerList,
} from "@/lib/validations/batch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BatchKPIs } from "@/components/batches/batch-kpis";
import { BatchModal } from "@/components/batches/batch-modal";
import { BatchDetailsModal } from "@/components/batches/batch-details-modal";
import { AssignStudentModal } from "@/components/batches/assign-student-modal";
import { DeleteBatchDialog } from "@/components/batches/delete-batch-dialog";
import { DemoNotice } from "@/components/dashboard/demo-notice";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Edit,
  Eye,
  UserPlus,
  Calendar,
  Clock,
  User,
  BookOpen,
  Users,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Layers,
} from "lucide-react";

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    upcomingBatches: 0,
    completedBatches: 0,
    totalAvailableSeats: 0,
    totalEnrolledStudents: 0,
  });
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedTrainer, setSelectedTrainer] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"startDate" | "batchName" | "enrolled" | "seats">("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<BatchRecord | null>(null);
  const [batchToView, setBatchToView] = useState<BatchRecord | null>(null);
  const [batchToAssign, setBatchToAssign] = useState<BatchRecord | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<BatchRecord | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch batches & stats from API
  const fetchBatches = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/batches");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load batches");
      }
      setBatches(result.data);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (err: any) {
      console.error("Error fetching batches:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch courses list for filtering
  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAvailableCourses(data.data.map((c: any) => c.courseName));
        }
      })
      .catch((err) => console.error("Error loading courses for filter:", err));
  }, []);

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBatches(false);
  };

  // Quick status change
  const handleStatusChange = async (id: string, newStatus: BatchStatus) => {
    try {
      const res = await fetch(`/api/batches/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      setBatches((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      if (batchToView && batchToView.id === id) {
        setBatchToView((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      showNotification("success", `Batch status changed to ${newStatus}`);
      fetchBatches(false);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update status");
      throw err;
    }
  };

  // Delete batch with dependency check
  const handleDeleteConfirm = async (id: string, force: boolean) => {
    const res = await fetch(`/api/batches/${id}${force ? "?force=true" : ""}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete batch");
    }
    setBatches((prev) => prev.filter((b) => b.id !== id));
    showNotification("success", data.message || "Batch deleted successfully");
    fetchBatches(false);
  };

  // Cancel batch instead of deleting
  const handleCancelBatchInstead = async (id: string) => {
    await handleStatusChange(id, "Cancelled");
  };

  // Filtering
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          b.batchName.toLowerCase().includes(q) ||
          b.batchCode.toLowerCase().includes(q) ||
          b.courseName.toLowerCase().includes(q) ||
          b.trainer.toLowerCase().includes(q) ||
          (b.classroom && b.classroom.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (selectedCourse !== "All" && b.courseName !== selectedCourse) {
        return false;
      }

      if (selectedTrainer !== "All" && b.trainer !== selectedTrainer) {
        return false;
      }

      if (selectedStatus === "available_seats") {
        if (b.availableSeats <= 0) return false;
      } else if (selectedStatus !== "All" && b.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [batches, searchTerm, selectedCourse, selectedTrainer, selectedStatus]);

  // Sorting
  const sortedBatches = useMemo(() => {
    return [...filteredBatches].sort((a, b) => {
      if (sortBy === "startDate") {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === "enrolled") {
        const diff = a.enrolledCount - b.enrolledCount;
        return sortOrder === "asc" ? diff : -diff;
      }
      if (sortBy === "seats") {
        const diff = a.availableSeats - b.availableSeats;
        return sortOrder === "asc" ? diff : -diff;
      }
      return sortOrder === "asc"
        ? a.batchName.localeCompare(b.batchName)
        : b.batchName.localeCompare(a.batchName);
    });
  }, [filteredBatches, sortBy, sortOrder]);

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
    setSelectedTrainer("All");
    setSelectedStatus("All");
  };

  const hasActiveFilters =
    searchTerm || selectedCourse !== "All" || selectedTrainer !== "All" || selectedStatus !== "All";

  const getStatusBadge = (status: BatchStatus) => {
    switch (status) {
      case "Active":
        return <Badge variant="active">Active</Badge>;
      case "Upcoming":
        return <Badge variant="upcoming">Upcoming</Badge>;
      case "Completed":
        return <Badge variant="completed">Completed</Badge>;
      case "Cancelled":
        return <Badge variant="cancelled">Cancelled</Badge>;
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
            Batch Management
          </h1>
          <p className="text-xs text-[#5A7178] mt-0.5">
            Coordinate academic cohorts, scheduling, classroom assignments, and student seat capacity
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => {
              setBatchToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="h-9 text-xs bg-[#078783] hover:bg-[#066e6b] text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Batch
          </Button>
        </div>
      </div>

      {/* Demo Notice */}
      <DemoNotice message="Batch management workspace. Real-time correlation with Course Management and Student Directory. Seat capacity and enrollments persist in CRM data storage." />

      {/* Dashboard KPI Statistics */}
      <BatchKPIs
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
              placeholder="Search by batch name, code, course, trainer, classroom..."
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
                {availableCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Trainer Filter */}
            <div className="relative">
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Trainers</option>
                {batchTrainerList.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                {batchStatusEnum.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="available_seats">Has Available Seats</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-") as [
                    "startDate" | "batchName" | "enrolled" | "seats",
                    "asc" | "desc"
                  ];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="appearance-none text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 pr-7 text-[#11232B] focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="startDate-asc">Start Date (Earliest)</option>
                <option value="startDate-desc">Start Date (Latest)</option>
                <option value="batchName-asc">Batch Name (A-Z)</option>
                <option value="enrolled-desc">Most Enrolled</option>
                <option value="seats-desc">Most Seats Available</option>
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
              title="Refresh batches"
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
            Showing <strong className="text-[#11232B]">{sortedBatches.length}</strong> of{" "}
            <strong className="text-[#11232B]">{batches.length}</strong> batches
            {hasActiveFilters && " (filtered)"}
          </div>
          <div className="flex items-center gap-3">
            <span>
              Total Seats:{" "}
              <strong className="text-[#11232B]">
                {sortedBatches.reduce((acc, b) => acc + b.maxCapacity, 0)}
              </strong>
            </span>
            <span>
              Enrolled:{" "}
              <strong className="text-[#078783]">
                {sortedBatches.reduce((acc, b) => acc + b.enrolledCount, 0)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Batches Table Directory */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#5A7178] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
            <p className="text-xs font-medium">Loading batch records...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 flex flex-col items-center justify-center text-red-600 gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-xs font-medium">{errorMessage}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchBatches()}
              className="text-xs mt-1"
            >
              Try Again
            </Button>
          </div>
        ) : sortedBatches.length === 0 ? (
          <div className="py-16 text-center text-[#5A7178] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F3F8F7] flex items-center justify-center mx-auto text-[#078783]">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#11232B]">No Batches Found</h3>
            <p className="text-xs max-w-sm mx-auto">
              {hasActiveFilters
                ? "No batches matched your current filters. Try resetting the filters or modifying search keywords."
                : "No academic cohorts created yet. Click 'Add New Batch' above to launch your first batch."}
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
                Create First Batch
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2ECEB] bg-[#F8FBFA] text-[11px] font-semibold text-[#5A7178] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Batch ID & Code</th>
                  <th className="py-3.5 px-4">Batch Name</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Trainer</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Schedule & Timings</th>
                  <th className="py-3.5 px-4">Enrolled / Capacity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEB] text-xs">
                {sortedBatches.map((batch) => {
                  const pct = Math.round((batch.enrolledCount / batch.maxCapacity) * 100);
                  const isFull = batch.availableSeats <= 0;

                  return (
                    <tr
                      key={batch.id}
                      className="hover:bg-[#F3F8F7]/60 transition-colors group"
                    >
                      {/* Batch Code */}
                      <td className="py-3.5 px-4 font-mono font-medium text-[#11232B] whitespace-nowrap">
                        <span className="bg-[#EAEAEA] text-[#333] px-2 py-0.5 rounded text-[11px] font-bold">
                          {batch.batchCode}
                        </span>
                      </td>

                      {/* Batch Name */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setBatchToView(batch)}
                          className="font-semibold text-[#11232B] hover:text-[#078783] text-left transition-colors flex flex-col"
                        >
                          <span>{batch.batchName}</span>
                          {batch.classroom && (
                            <span className="text-[11px] font-normal text-[#5A7178] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#078783]" />
                              {batch.classroom}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[#11232B] font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-[#078783] shrink-0" />
                          <span>{batch.courseName}</span>
                        </div>
                      </td>

                      {/* Trainer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[#5A7178]">
                          <User className="w-3.5 h-3.5 text-[#5A7178] shrink-0" />
                          <span className="text-[#11232B]">{batch.trainer}</span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#5A7178]">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-[#078783] shrink-0" />
                          <span>
                            {new Date(batch.startDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            –{" "}
                            {new Date(batch.endDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[11px] text-[#11232B] font-medium">
                          {batch.classDays}
                        </div>
                        <div className="text-[10px] text-[#5A7178] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#078783]" />
                          {batch.classTimings}
                        </div>
                      </td>

                      {/* Capacity & Progress */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#11232B]">
                              {batch.enrolledCount} / {batch.maxCapacity}
                            </span>
                            <span
                              className={`font-medium ${
                                isFull
                                  ? "text-red-600 font-bold"
                                  : batch.availableSeats <= 3
                                  ? "text-amber-600"
                                  : "text-[#5A7178]"
                              }`}
                            >
                              {isFull ? "Full" : `${batch.availableSeats} left`}
                            </span>
                          </div>
                          <div className="w-full bg-[#E8EFEF] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull
                                  ? "bg-red-500"
                                  : pct >= 80
                                  ? "bg-amber-500"
                                  : "bg-[#078783]"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getStatusBadge(batch.status)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setBatchToView(batch)}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors"
                            title="View batch details & roster"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Assign student */}
                          <button
                            type="button"
                            onClick={() => setBatchToAssign(batch)}
                            disabled={batch.status === "Cancelled" || batch.status === "Completed"}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Assign or transfer student"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>

                          {/* Edit batch */}
                          <button
                            type="button"
                            onClick={() => {
                              setBatchToEdit(batch);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#078783] hover:bg-[#F0F5F4] transition-colors"
                            title="Edit batch"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete batch */}
                          <button
                            type="button"
                            onClick={() => setBatchToDelete(batch)}
                            className="p-1.5 rounded-lg text-[#5A7178] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete batch"
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
      </div>

      {/* Create / Edit Batch Modal */}
      <BatchModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBatchToEdit(null);
        }}
        onSuccess={(savedBatch) => {
          showNotification(
            "success",
            batchToEdit
              ? `Batch ${savedBatch.batchName} updated successfully`
              : `Batch ${savedBatch.batchName} created with ID ${savedBatch.batchCode}`
          );
          fetchBatches(false);
        }}
        batchToEdit={batchToEdit}
      />

      {/* Batch Details Drawer / Modal */}
      <BatchDetailsModal
        isOpen={Boolean(batchToView)}
        onClose={() => setBatchToView(null)}
        batch={batchToView}
        onEdit={(batch) => {
          setBatchToView(null);
          setBatchToEdit(batch);
          setIsCreateModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
        onOpenAssignModal={(batch) => {
          setBatchToAssign(batch);
        }}
        onRefresh={() => {
          fetchBatches(false);
        }}
      />

      {/* Assign / Transfer Student Modal */}
      <AssignStudentModal
        isOpen={Boolean(batchToAssign)}
        onClose={() => setBatchToAssign(null)}
        batch={batchToAssign}
        onSuccess={() => {
          showNotification("success", "Student enrolled in batch successfully");
          fetchBatches(false);
          // If viewing details for same batch, reload details
          if (batchToView && batchToAssign && batchToView.id === batchToAssign.id) {
            setBatchToView({ ...batchToView });
          }
        }}
      />

      {/* Delete Batch Confirmation Dialog */}
      <DeleteBatchDialog
        isOpen={Boolean(batchToDelete)}
        onClose={() => setBatchToDelete(null)}
        batch={batchToDelete}
        onConfirm={handleDeleteConfirm}
        onCancelBatch={handleCancelBatchInstead}
      />
    </div>
  );
}
