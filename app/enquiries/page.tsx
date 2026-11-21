"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  EnquiryRecord,
  enquirySourceList,
  enquiryStatusEnum,
} from "@/lib/validations/enquiry";
import { COURSE_CATEGORIES, COURSE_CATALOGUE_BY_CATEGORY } from "@/lib/courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnquiryDashboardKPIs } from "@/components/enquiries/enquiry-dashboard-kpis";
import { EnquiryModal } from "@/components/enquiries/enquiry-modal";
import { EnquiryDetailModal } from "@/components/enquiries/enquiry-detail-modal";
import { DeleteEnquiryDialog } from "@/components/enquiries/delete-enquiry-dialog";
import {
  Search,
  Plus,
  ChevronDown,
  RefreshCw,
  Loader2,
  Trash2,
  Calendar,
  UserPlus,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEnquiryForEdit, setSelectedEnquiryForEdit] = useState<EnquiryRecord | null>(null);
  const [selectedEnquiryForView, setSelectedEnquiryForView] = useState<EnquiryRecord | null>(null);
  const [selectedEnquiryForDelete, setSelectedEnquiryForDelete] = useState<EnquiryRecord | null>(null);

  // Fetch enquiries from backend
  const fetchEnquiries = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/enquiries");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load enquiries");
      }
      setEnquiries(result.data);
    } catch (err: any) {
      console.error("Error fetching enquiries:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEnquiries(false);
  };

  // Status badge styling helper
  const getStatusBadgeVariant = (status: EnquiryRecord["status"]) => {
    switch (status) {
      case "New":
        return "new";
      case "Pending":
        return "pending";
      case "In Progress":
        return "inprogress";
      case "Responded":
        return "responded";
      case "Converted":
        return "converted";
      case "Closed":
        return "closed";
      default:
        return "default";
    }
  };

  // Filtered & Sorted enquiries
  const filteredAndSortedEnquiries = useMemo(() => {
    return enquiries
      .filter((e) => {
        const matchesSearch =
          e.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          e.interestedCourse.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.assignedCounsellor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.enquiryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.enquiryMessage.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "All" || e.status === statusFilter;

        const matchesCourse =
          courseFilter === "All" || e.interestedCourse === courseFilter;

        const matchesSource =
          sourceFilter === "All" || e.enquirySource === sourceFilter;

        const matchesDate = !dateFilter || e.enquiryDate === dateFilter;

        return matchesSearch && matchesStatus && matchesCourse && matchesSource && matchesDate;
      })
      .sort((a, b) => {
        const aTime = new Date(a.enquiryDate || a.createdAt).getTime();
        const bTime = new Date(b.enquiryDate || b.createdAt).getTime();
        return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [enquiries, searchTerm, statusFilter, courseFilter, sourceFilter, dateFilter, sortOrder]);

  // Pagination calculation
  const totalItems = filteredAndSortedEnquiries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedEnquiries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedEnquiries.slice(start, start + pageSize);
  }, [filteredAndSortedEnquiries, currentPage, pageSize]);

  // Adjust page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Lead Conversion handler from table
  const handleDirectConvertToLead = async (enquiry: EnquiryRecord) => {
    if (enquiry.convertedToLeadId) return;

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}/convert`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to convert enquiry");
      }

      handleEnquiryUpdated(result.data.enquiry);
    } catch (err: any) {
      alert(err.message || "Failed to convert enquiry to lead");
    }
  };

  // Callback after enquiry created or updated
  const handleEnquirySaved = (saved: EnquiryRecord) => {
    setEnquiries((prev) => {
      const index = prev.findIndex((e) => e.id === saved.id);
      if (index !== -1) {
        const copy = [...prev];
        copy[index] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleEnquiryUpdated = (updated: EnquiryRecord) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    if (selectedEnquiryForView?.id === updated.id) {
      setSelectedEnquiryForView(updated);
    }
  };

  // Callback after enquiry deleted
  const handleEnquiryDeleted = (deletedId: string) => {
    setEnquiries((prev) => prev.filter((e) => e.id !== deletedId));
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
            Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7178]">
            Review student enquiries, log counselling discussions, and convert to leads
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 border-[#E2ECEB]"
            title="Refresh enquiries list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Enquiry</span>
          </Button>
        </div>
      </div>

      {/* 6 Enquiry Dashboard KPIs */}
      <EnquiryDashboardKPIs
        enquiries={enquiries}
        onFilterStatus={(st) => {
          setStatusFilter(st);
          setCurrentPage(1);
        }}
        activeStatusFilter={statusFilter}
      />

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-[#E2ECEB] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8A9EA5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student, message, course, phone..."
              className="w-full pl-9 pr-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white transition-all"
            />
          </div>

          {/* Filters & Sorting */}
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
                {enquiryStatusEnum.options.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Course Filter */}
            <div className="relative">
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
              >
                <option value="All">All courses (44)</option>
                {COURSE_CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={`${cat} (${COURSE_CATALOGUE_BY_CATEGORY[cat].length})`}>
                    {COURSE_CATALOGUE_BY_CATEGORY[cat].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Source Filter */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
              >
                <option value="All">All sources</option>
                {enquirySourceList.map((src) => (
                  <option key={src} value={src}>
                    {src}
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
                title="Filter by enquiry date"
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

            {/* Sort Order */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="appearance-none bg-white border border-[#E2ECEB] text-xs font-medium text-[#11232B] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#078783] cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => fetchEnquiries()}
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
                <th className="py-3 px-4">Enquiry Code</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Interested Course</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Enquiry Date</th>
                <th className="py-3 px-4">Counsellor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Lead Integration</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2ECEB]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#5A7178]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-[#078783] animate-spin" />
                      <span>Loading enquiry records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEnquiries.length > 0 ? (
                paginatedEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-[#F8FBFA] transition-colors group">
                    <td className="py-3.5 px-4 font-semibold text-[#11232B]">
                      {enquiry.enquiryCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#11232B]">
                      <div>{enquiry.studentName}</div>
                      {enquiry.email && (
                        <div className="text-[10px] text-[#8A9EA5] truncate max-w-[130px]">
                          {enquiry.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A7178]">{enquiry.phoneNumber}</td>
                    <td className="py-3.5 px-4 text-[#11232B]">{enquiry.interestedCourse}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F8F7] text-[#5A7178] border border-[#E2ECEB]">
                        {enquiry.enquirySource}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#5A7178]">{enquiry.enquiryDate}</td>
                    <td className="py-3.5 px-4 text-[#11232B]">{enquiry.assignedCounsellor}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(enquiry.status)}>
                        {enquiry.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {enquiry.convertedToLeadId ? (
                        <Link
                          href="/leads"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#078783] hover:underline"
                          title="View in Leads Management"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                          <span>{enquiry.convertedLeadCode || "Lead Linked"}</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleDirectConvertToLead(enquiry)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#078783] hover:text-[#056E6B] bg-[#E6F5F4] hover:bg-[#D5EFEF] px-2 py-1 rounded-md transition-colors"
                          title="Convert this enquiry to a lead"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Convert to Lead</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedEnquiryForView(enquiry)}
                          className="text-[#078783] hover:underline font-semibold text-xs"
                          title="View Details & Communication"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setSelectedEnquiryForEdit(enquiry)}
                          className="text-[#5A7178] hover:text-[#11232B] text-xs font-medium"
                          title="Edit Enquiry"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSelectedEnquiryForDelete(enquiry)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors ml-1"
                          title="Delete Enquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#5A7178]">
                    <div className="space-y-1">
                      <p className="font-semibold text-[#11232B]">No enquiries found</p>
                      <p className="text-xs text-[#8A9EA5]">
                        {searchTerm || statusFilter !== "All" || courseFilter !== "All" || sourceFilter !== "All" || dateFilter
                          ? "Try adjusting your search query or filters"
                          : "Click '+ Add New Enquiry' to record a new student enquiry."}
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
            <span className="font-medium text-[#11232B]">{totalItems}</span> enquiries · Page{" "}
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

      {/* Enquiry Create / Edit Modal */}
      <EnquiryModal
        isOpen={isCreateModalOpen || Boolean(selectedEnquiryForEdit)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedEnquiryForEdit(null);
        }}
        onSaved={handleEnquirySaved}
        initialData={selectedEnquiryForEdit}
      />

      {/* Enquiry Detail & Communication Modal */}
      <EnquiryDetailModal
        enquiry={selectedEnquiryForView}
        isOpen={Boolean(selectedEnquiryForView)}
        onClose={() => setSelectedEnquiryForView(null)}
        onEdit={(enquiry) => setSelectedEnquiryForEdit(enquiry)}
        onDelete={(enquiry) => setSelectedEnquiryForDelete(enquiry)}
        onUpdated={handleEnquiryUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteEnquiryDialog
        enquiry={selectedEnquiryForDelete}
        isOpen={Boolean(selectedEnquiryForDelete)}
        onClose={() => setSelectedEnquiryForDelete(null)}
        onDeleted={handleEnquiryDeleted}
      />
    </div>
  );
}
