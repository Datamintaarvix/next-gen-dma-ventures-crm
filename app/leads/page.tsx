"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LeadRecord } from "@/lib/validations/lead";
import { COURSE_CATEGORIES, COURSE_CATALOGUE_BY_CATEGORY } from "@/lib/courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/dashboard/demo-notice";
import { LeadModal } from "@/components/leads/lead-modal";
import { LeadViewModal } from "@/components/leads/lead-view-modal";
import { DeleteConfirmDialog } from "@/components/leads/delete-confirm-dialog";
import {
  Search,
  Plus,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  Filter,
} from "lucide-react";

type SortField =
  | "leadCode"
  | "studentName"
  | "phoneNumber"
  | "interestedCourse"
  | "leadSource"
  | "assignedCounselor"
  | "followUpDate"
  | "status";

type SortOrder = "asc" | "desc";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("leadCode");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<LeadRecord | null>(null);
  const [selectedLeadForView, setSelectedLeadForView] = useState<LeadRecord | null>(null);
  const [selectedLeadForDelete, setSelectedLeadForDelete] = useState<LeadRecord | null>(null);

  // Fetch leads from backend
  const fetchLeads = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/leads");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load leads");
      }
      setLeads(result.data);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeads(false);
  };

  // Status badge styling helper
  const getStatusBadgeVariant = (status: LeadRecord["status"]) => {
    switch (status) {
      case "New":
        return "new";
      case "Contacted":
        return "contacted";
      case "Interested":
        return "interested";
      case "Follow-up":
        return "followup";
      case "Converted":
        return "converted";
      case "Lost":
        return "lost";
      default:
        return "default";
    }
  };

  // Handle column header sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted leads
  const filteredAndSortedLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const matchesSearch =
          lead.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.interestedCourse.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.assignedCounselor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.leadCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          statusFilter === "All" || lead.status === statusFilter;

        const matchesCourse =
          courseFilter === "All" || lead.interestedCourse === courseFilter;

        return matchesSearch && matchesStatus && matchesCourse;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [leads, searchTerm, statusFilter, courseFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = filteredAndSortedLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLeads.slice(start, start + pageSize);
  }, [filteredAndSortedLeads, currentPage, pageSize]);

  // Adjust page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Callback after lead created or updated
  const handleLeadSaved = (savedLead: LeadRecord) => {
    setLeads((prev) => {
      const index = prev.findIndex((l) => l.id === savedLead.id);
      if (index !== -1) {
        const copy = [...prev];
        copy[index] = savedLead;
        return copy;
      }
      return [savedLead, ...prev];
    });
  };

  // Callback after lead deleted
  const handleLeadDeleted = (deletedId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== deletedId));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-widest text-[#078783] uppercase">
            NEXT GEN / DEMO WORKSPACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#11232B] tracking-tight">
            Leads Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7178]">
            Find, review, and update sample leads
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 border-[#E2ECEB]"
            title="Refresh leads list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      <DemoNotice message="These leads are persisted in the CRM backend. Edits, additions, and deletions are saved to storage." />

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-[#E2ECEB] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8A9EA5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search leads, courses, counselors..."
              className="w-full pl-9 pr-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
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
                    {COURSE_CATALOGUE_BY_CATEGORY[cat].map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => fetchLeads()}
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
                <th
                  onClick={() => handleSort("leadCode")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Lead ID
                    {sortField === "leadCode" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("studentName")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Student Name
                    {sortField === "studentName" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("phoneNumber")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Phone Number
                    {sortField === "phoneNumber" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("interestedCourse")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Interested Course
                    {sortField === "interestedCourse" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("leadSource")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Lead Source
                    {sortField === "leadSource" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("assignedCounselor")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Assigned Counselor
                    {sortField === "assignedCounselor" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("followUpDate")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Follow-up Date
                    {sortField === "followUpDate" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="py-3 px-4 cursor-pointer hover:text-[#11232B] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Lead Status
                    {sortField === "status" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#078783]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#078783]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#8A9EA5]" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2ECEB]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#5A7178]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-[#078783] animate-spin" />
                      <span>Loading leads records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#F8FBFA] transition-colors group">
                    <td className="py-3.5 px-4 font-semibold text-[#11232B]">
                      {lead.leadCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#11232B]">
                      <div>{lead.studentName}</div>
                      {lead.email && (
                        <div className="text-[10px] text-[#8A9EA5] truncate max-w-[140px]">
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A7178]">{lead.phoneNumber}</td>
                    <td className="py-3.5 px-4 text-[#11232B]">{lead.interestedCourse}</td>
                    <td className="py-3.5 px-4 text-[#5A7178]">{lead.leadSource}</td>
                    <td className="py-3.5 px-4 text-[#11232B]">{lead.assignedCounselor}</td>
                    <td className="py-3.5 px-4 text-[#5A7178]">{lead.followUpDate}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedLeadForView(lead)}
                          className="text-[#078783] hover:underline font-semibold text-xs"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setSelectedLeadForEdit(lead)}
                          className="text-[#5A7178] hover:text-[#11232B] text-xs font-medium"
                          title="Edit Lead"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSelectedLeadForDelete(lead)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors ml-1"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#5A7178]">
                    <div className="space-y-1">
                      <p className="font-semibold text-[#11232B]">No leads found</p>
                      <p className="text-xs text-[#8A9EA5]">
                        {searchTerm || statusFilter !== "All" || courseFilter !== "All"
                          ? "Try adjusting your search query or filters"
                          : "Click '+ Add New Lead' to create your first record."}
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
            <span className="font-medium text-[#11232B]">{totalItems}</span> demo leads · Page{" "}
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

      {/* Lead Create / Edit Modal */}
      <LeadModal
        isOpen={isCreateModalOpen || Boolean(selectedLeadForEdit)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSaved={handleLeadSaved}
        initialData={selectedLeadForEdit}
      />

      {/* Lead View Details Modal */}
      <LeadViewModal
        lead={selectedLeadForView}
        isOpen={Boolean(selectedLeadForView)}
        onClose={() => setSelectedLeadForView(null)}
        onEdit={(lead) => setSelectedLeadForEdit(lead)}
        onDelete={(lead) => setSelectedLeadForDelete(lead)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        lead={selectedLeadForDelete}
        isOpen={Boolean(selectedLeadForDelete)}
        onClose={() => setSelectedLeadForDelete(null)}
        onDeleted={handleLeadDeleted}
      />
    </div>
  );
}
