"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CounsellingSessionRecord,
  CounsellingKPIStats,
  sessionStatusEnum,
  sessionTypeEnum,
} from "@/lib/validations/counselling";
import { CounsellingKPIs } from "@/components/counselling/counselling-kpis";
import { CounsellingCalendar } from "@/components/counselling/counselling-calendar";
import { ScheduleCounsellingModal } from "@/components/counselling/schedule-counselling-modal";
import { CompleteSessionModal } from "@/components/counselling/complete-session-modal";
import { CounsellingDetailModal } from "@/components/counselling/counselling-detail-modal";
import { CounsellingHistoryModal } from "@/components/counselling/counselling-history-modal";
import { CounsellingReportModal } from "@/components/counselling/counselling-report-modal";
import { RescheduleCounsellingModal } from "@/components/counselling/reschedule-counselling-modal";
import { CancelSessionModal } from "@/components/counselling/cancel-session-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  Phone,
  Video,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  ExternalLink,
  History,
  FileText,
  RotateCcw,
  LayoutGrid,
  List,
  Award,
  HeartHandshake,
  X,
} from "lucide-react";

export default function CounsellingPage() {
  const [sessions, setSessions] = useState<CounsellingSessionRecord[]>([]);
  const [stats, setStats] = useState<CounsellingKPIStats>({
    totalSessions: 0,
    todaySessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    noShowSessions: 0,
    convertedCount: 0,
    conversionRate: 0,
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // View Mode: "calendar" vs "directory"
  const [activeView, setActiveView] = useState<"calendar" | "directory">("calendar");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounsellor, setSelectedCounsellor] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSessionType, setSelectedSessionType] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [specificDate, setSpecificDate] = useState("2026-11-18");
  const [sortBy, setSortBy] = useState<"date" | "name" | "counsellor" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination for Directory table
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState<CounsellingSessionRecord | null>(null);
  const [sessionForCompleteNotes, setSessionForCompleteNotes] = useState<CounsellingSessionRecord | null>(null);
  const [sessionToReschedule, setSessionToReschedule] = useState<CounsellingSessionRecord | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<CounsellingSessionRecord | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<CounsellingSessionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // History modal
  const [historyPerson, setHistoryPerson] = useState<{ name: string; phone?: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Load auxiliary options from CRM modules
  const loadAuxiliaryData = async () => {
    try {
      const [leadsRes, enquiriesRes, studentsRes, coursesRes] = await Promise.all([
        fetch("/api/leads").then((r) => r.json()).catch(() => ({ leads: [] })),
        fetch("/api/enquiries").then((r) => r.json()).catch(() => ({ enquiries: [] })),
        fetch("/api/students").then((r) => r.json()).catch(() => ({ students: [] })),
        fetch("/api/courses").then((r) => r.json()).catch(() => ({ courses: [] })),
      ]);

      if (leadsRes.leads) setLeads(leadsRes.leads);
      if (enquiriesRes.enquiries) setEnquiries(enquiriesRes.enquiries);
      if (studentsRes.students) setStudents(studentsRes.students);
      if (coursesRes.courses) setCourses(coursesRes.courses.map((c: any) => c.courseName));
    } catch (e) {
      console.error("Failed to load auxiliary data:", e);
    }
  };

  // Fetch Counselling Sessions & KPIs
  const fetchSessions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (selectedCounsellor !== "All") params.set("counsellor", selectedCounsellor);
      if (selectedStatus !== "All") params.set("status", selectedStatus);
      if (selectedSessionType !== "All") params.set("sessionType", selectedSessionType);
      if (dateRange !== "All") params.set("dateRange", dateRange);
      if (specificDate && specificDate !== "2026-11-18") params.set("date", specificDate);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("includeStats", "true");

      const res = await fetch(`/api/counselling?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch counselling sessions");
      }

      setSessions(data.sessions || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      console.error("Fetch counselling error:", err);
      showNotification("error", err.message || "Failed to load counselling sessions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [selectedCounsellor, selectedStatus, selectedSessionType, dateRange, specificDate, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSessions();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCounsellor, selectedStatus, selectedSessionType, dateRange, specificDate]);

  // Pagination calculation
  const totalPages = Math.ceil(sessions.length / pageSize) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sessions.slice(start, start + pageSize);
  }, [sessions, currentPage]);

  // Counsellors list
  const counsellorList = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(s.assignedCounsellor));
    return Array.from(set);
  }, [sessions]);

  // Delete session
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/counselling/${encodeURIComponent(sessionToDelete.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete session");
      }

      showNotification("success", "Counselling session deleted");
      setSessionToDelete(null);
      fetchSessions(true);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete session");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCounsellor !== "All") params.set("counsellor", selectedCounsellor);
    if (selectedStatus !== "All") params.set("status", selectedStatus);
    if (selectedSessionType !== "All") params.set("sessionType", selectedSessionType);
    if (dateRange !== "All") params.set("dateRange", dateRange);

    window.open(`/api/counselling/export?${params.toString()}`, "_blank");
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
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Counselling Management
                </h1>
                <p className="text-xs md:text-sm text-slate-500">
                  Career guidance, discussion notes, calendar scheduling, and admission conversion tracking
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Calendar vs Directory */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-[#E2ECEB] shadow-2xs mr-1">
              <button
                type="button"
                onClick={() => setActiveView("calendar")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeView === "calendar"
                    ? "bg-[#078783] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("directory")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeView === "directory"
                    ? "bg-[#078783] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Directory</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchSessions(true)}
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
              Conversion Report
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
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-[#078783] hover:bg-[#066f6c] text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Schedule Session
            </Button>
          </div>
        </div>

        {/* 6 KPI Cards with Counsellor Filter */}
        <CounsellingKPIs
          stats={stats}
          activeStatusFilter={selectedStatus}
          onStatusFilterSelect={(status) => setSelectedStatus(status)}
          selectedCounsellor={selectedCounsellor}
          onCounsellorFilterSelect={(c) => setSelectedCounsellor(c)}
          counsellors={counsellorList}
          selectedDate={specificDate}
          onDateChange={(d) => setSpecificDate(d)}
        />

        {/* Calendar View vs Directory View */}
        {activeView === "calendar" ? (
          <CounsellingCalendar
            sessions={sessions}
            onSelectSession={(s) => setSelectedSessionForDetail(s)}
            onRescheduleSession={(s) => setSessionToReschedule(s)}
            onCancelSession={(s) => setSessionToCancel(s)}
          />
        ) : (
          /* Directory View Card with Filters and Records Table */
          <div className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-[#E2ECEB] space-y-3.5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate, phone, counsellor, or course..."
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
                  {["All", ...sessionStatusEnum].map((st) => {
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

              {/* Dropdowns Row */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                {/* Counsellor */}
                <select
                  value={selectedCounsellor}
                  onChange={(e) => setSelectedCounsellor(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Counsellors</option>
                  {counsellorList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Session Type */}
                <select
                  value={selectedSessionType}
                  onChange={(e) => setSelectedSessionType(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Session Types</option>
                  {sessionTypeEnum.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Date Range */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-white text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>

                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-slate-500 text-xs">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="h-8.5 px-2.5 rounded-lg border border-[#E2ECEB] bg-slate-50 text-slate-700 font-medium text-xs focus:outline-none"
                  >
                    <option value="date">Date & Time</option>
                    <option value="name">Candidate Name</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="status">Status</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                    className="w-8.5 h-8.5 rounded-lg border border-[#E2ECEB] bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                    title={sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Directory Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
                  <p className="text-sm font-medium">Loading counselling directory...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No counselling sessions found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your filters or schedule a new counselling session.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="bg-[#078783] hover:bg-[#066f6c] text-white text-xs mt-2"
                  >
                    Schedule Session Now
                  </Button>
                </div>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/80 border-b border-[#E2ECEB] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Candidate</th>
                      <th className="px-4 py-3.5">Date & Time</th>
                      <th className="px-4 py-3.5">Type & Location</th>
                      <th className="px-4 py-3.5">Assigned Counsellor</th>
                      <th className="px-4 py-3.5">Purpose & Course</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Conversion</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2ECEB]">
                    {paginatedSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Candidate */}
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSessionForDetail(s)}
                            className="font-bold text-slate-900 hover:text-[#078783] hover:underline text-left"
                          >
                            {s.personName}
                          </button>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {s.sessionCode} · {s.participantType}
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{s.counsellingDate}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-[#078783]" />
                            <span>{s.startTime} - {s.endTime}</span>
                          </div>
                        </td>

                        {/* Type & Location */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            {s.sessionType === "Video Call" ? (
                              <Video className="w-3.5 h-3.5 text-blue-600" />
                            ) : s.sessionType === "Phone" ? (
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-[#078783]" />
                            )}
                            <span>{s.sessionType}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={s.meetingLocationOrLink}>
                            {s.meetingLocationOrLink}
                          </div>
                        </td>

                        {/* Counsellor */}
                        <td className="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                          {s.assignedCounsellor}
                        </td>

                        {/* Purpose & Course */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 truncate max-w-[180px]" title={s.purpose}>
                            {s.purpose}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]" title={s.interestedCourse}>
                            {s.interestedCourse}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Badge
                            className={`text-xs font-semibold ${
                              s.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : s.status === "Confirmed"
                                ? "bg-teal-50 text-teal-700 border-teal-300"
                                : s.status === "Cancelled"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : s.status === "No Show"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {s.status}
                          </Badge>
                        </td>

                        {/* Conversion */}
                        <td className="px-4 py-3.5">
                          {s.isConvertedToAdmission ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                              <Award className="w-3 h-3 text-emerald-600" />
                              <span>{s.admissionCode || "Admitted"}</span>
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-slate-400">In Pipeline</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedSessionForDetail(s)}
                              title="View Details"
                              className="p-1.5 text-slate-500 hover:text-[#078783] hover:bg-teal-50 rounded-md transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSessionForCompleteNotes(s)}
                              title="Discussion Notes"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {s.status !== "Cancelled" && s.status !== "Completed" && (
                              <button
                                type="button"
                                onClick={() => setSessionToReschedule(s)}
                                title="Reschedule"
                                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSessionToDelete(s)}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && sessions.length > 0 && (
              <div className="px-5 py-3.5 bg-slate-50 border-t border-[#E2ECEB] flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                <div>
                  Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                  <strong>{Math.min(currentPage * pageSize, sessions.length)}</strong> of{" "}
                  <strong>{sessions.length}</strong> sessions
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
        )}
      </div>

      {/* Schedule Counselling Modal */}
      <ScheduleCounsellingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        leads={leads}
        enquiries={enquiries}
        students={students}
        courses={courses}
        onSuccess={(session) => {
          showNotification(
            "success",
            `Counselling session ${session.sessionCode} scheduled successfully for ${session.personName}`
          );
          fetchSessions(true);
        }}
      />

      {/* Complete Session / Record Notes Modal */}
      <CompleteSessionModal
        isOpen={sessionForCompleteNotes !== null}
        onClose={() => setSessionForCompleteNotes(null)}
        session={sessionForCompleteNotes}
        courses={courses}
        onSuccess={(updated, followUpId) => {
          showNotification(
            "success",
            `Discussion notes saved for ${updated.personName}${
              followUpId ? " · Linked follow-up reminder created" : ""
            }`
          );
          fetchSessions(true);
        }}
      />

      {/* Counselling Detail Modal */}
      <CounsellingDetailModal
        isOpen={selectedSessionForDetail !== null}
        onClose={() => setSelectedSessionForDetail(null)}
        session={selectedSessionForDetail}
        onOpenCompleteNotes={(s) => {
          setSelectedSessionForDetail(null);
          setSessionForCompleteNotes(s);
        }}
        onOpenReschedule={(s) => {
          setSelectedSessionForDetail(null);
          setSessionToReschedule(s);
        }}
        onOpenCancel={(s) => {
          setSelectedSessionForDetail(null);
          setSessionToCancel(s);
        }}
        onOpenHistory={(name, phone) => {
          setSelectedSessionForDetail(null);
          setHistoryPerson({ name, phone });
        }}
      />

      {/* Reschedule Modal */}
      <RescheduleCounsellingModal
        isOpen={sessionToReschedule !== null}
        onClose={() => setSessionToReschedule(null)}
        session={sessionToReschedule}
        onSuccess={(updated) => {
          showNotification(
            "success",
            `Rescheduled ${updated.sessionCode} to ${updated.counsellingDate} (${updated.startTime})`
          );
          fetchSessions(true);
        }}
      />

      {/* Cancel Session Modal */}
      <CancelSessionModal
        isOpen={sessionToCancel !== null}
        onClose={() => setSessionToCancel(null)}
        session={sessionToCancel}
        onSuccess={(updated) => {
          showNotification("success", `Counselling session ${updated.sessionCode} cancelled`);
          fetchSessions(true);
        }}
      />

      {/* Counselling History Modal */}
      <CounsellingHistoryModal
        isOpen={historyPerson !== null}
        onClose={() => setHistoryPerson(null)}
        personName={historyPerson?.name || null}
        contactNumber={historyPerson?.phone}
        onScheduleNext={(name, phone) => {
          setIsScheduleModalOpen(true);
        }}
      />

      {/* Performance & Conversion Report Modal */}
      <CounsellingReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        sessions={sessions}
      />

      {/* Delete Confirmation Dialog */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E2ECEB] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Counselling Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete counselling session{" "}
                <strong className="text-slate-800">{sessionToDelete.sessionCode}</strong> with{" "}
                <strong className="text-slate-800">{sessionToDelete.personName}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
                className="text-slate-600 border-[#E2ECEB]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeleteSession}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Session</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
