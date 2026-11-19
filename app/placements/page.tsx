"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PlacementKPIStats,
  CompanyRecord,
  JobOpportunityRecord,
  StudentPlacementProfile,
  PlacementApplicationRecord,
  PlacementInterviewRecord,
  PlacementOfferRecord,
  partnershipStatusEnum,
  opportunityStatusEnum,
  placementStatusEnum,
  placementEligibilityEnum,
  applicationStatusEnum,
  offerStatusEnum,
} from "@/lib/validations/placement";
import {
  COURSE_CATEGORIES,
  COURSE_CATALOGUE_BY_CATEGORY,
  ALL_COURSES,
} from "@/lib/courses";
import { PlacementKPIs } from "@/components/placements/placement-kpis";
import { CompanyModal } from "@/components/placements/company-modal";
import { JobOpportunityModal } from "@/components/placements/job-opportunity-modal";
import { StudentPlacementModal } from "@/components/placements/student-placement-modal";
import { ApplyJobModal } from "@/components/placements/apply-job-modal";
import { ScheduleInterviewModal } from "@/components/placements/schedule-interview-modal";
import { RecordOfferModal } from "@/components/placements/record-offer-modal";
import { PlacementReportModal } from "@/components/placements/placement-report-modal";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Briefcase,
  Building2,
  Users,
  Award,
  CalendarCheck,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  Printer,
  ExternalLink,
  Edit2,
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  FileText,
  Star,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  Globe,
  Mail,
  Phone,
  LayoutGrid,
  List,
} from "lucide-react";

export default function PlacementsPage() {
  // Master data states
  const [kpis, setKpis] = useState<PlacementKPIStats>({
    totalEligibleStudents: 0,
    studentsPlaced: 0,
    studentsSeekingPlacement: 0,
    companiesRegistered: 0,
    activeJobOpportunities: 0,
    interviewsScheduled: 0,
    placementSuccessRate: 0,
    highestSalaryLPA: 0,
    averageSalaryLPA: 0,
    totalOffersExtended: 0,
  });

  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [jobs, setJobs] = useState<JobOpportunityRecord[]>([]);
  const [profiles, setProfiles] = useState<StudentPlacementProfile[]>([]);
  const [applications, setApplications] = useState<PlacementApplicationRecord[]>([]);
  const [offers, setOffers] = useState<PlacementOfferRecord[]>([]);
  const [courses, setCourses] = useState<string[]>([...ALL_COURSES]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Active Tab: "jobs" | "profiles" | "companies" | "applications" | "offers"
  const [activeTab, setActiveTab] = useState<
    "jobs" | "profiles" | "companies" | "applications" | "offers"
  >("jobs");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [selectedEligibilityFilter, setSelectedEligibilityFilter] = useState("All");
  const [jobViewLayout, setJobViewLayout] = useState<"grid" | "table">("grid");

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyRecord | null>(null);

  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobOpportunityRecord | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileToEdit, setSelectedProfileToEdit] = useState<StudentPlacementProfile | null>(null);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyInitialJobId, setApplyInitialJobId] = useState<string | undefined>();
  const [applyInitialStudentId, setApplyInitialStudentId] = useState<string | undefined>();

  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewApplication, setInterviewApplication] = useState<PlacementApplicationRecord | null>(null);
  const [interviewToFeedback, setInterviewToFeedback] = useState<PlacementInterviewRecord | null>(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerInitialAppId, setOfferInitialAppId] = useState<string | undefined>();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load all placements data
  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [kpiRes, compRes, jobsRes, profRes, appRes, offRes, coursesRes] =
        await Promise.all([
          fetch("/api/placements"),
          fetch("/api/placements/companies"),
          fetch("/api/placements/jobs"),
          fetch("/api/placements/profiles"),
          fetch("/api/placements/applications"),
          fetch("/api/placements/offers"),
          fetch("/api/courses").catch(() => null),
        ]);

      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        if (kpiData.kpis) setKpis(kpiData.kpis);
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData.companies) setCompanies(compData.companies);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (jobsData.jobs) setJobs(jobsData.jobs);
      }

      if (profRes.ok) {
        const profData = await profRes.json();
        if (profData.profiles) setProfiles(profData.profiles);
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        if (appData.applications) setApplications(appData.applications);
      }

      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.offers) setOffers(offData.offers);
      }

      if (coursesRes && coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const courseNames = Array.isArray(coursesData.courses)
          ? coursesData.courses.map((c: any) => (typeof c === "string" ? c : c.courseName || c.name))
          : [];
        if (courseNames.length > 0) setCourses(courseNames);
      } else {
        // Fallback default course list
        setCourses([
          "Digital Marketing Masterclass",
          "Full Stack Web Development",
          "Data Science & AI/ML",
          "UI/UX Design Specialist",
        ]);
      }
    } catch (err: any) {
      console.error("Error loading placement data:", err);
      setNotification({
        type: "error",
        message: "Failed to load placement data. Please retry.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Job Opportunities
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobLocation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        selectedStatusFilter === "All" || job.status === selectedStatusFilter;

      const matchCourse =
        selectedCourseFilter === "All" ||
        job.targetCourses.includes(selectedCourseFilter) ||
        job.targetCourses.some((c) =>
          selectedCourseFilter.toLowerCase().includes(c.toLowerCase())
        );

      return matchSearch && matchStatus && matchCourse;
    });
  }, [jobs, searchTerm, selectedStatusFilter, selectedCourseFilter]);

  // Filtered Student Placement Profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.skills.some((sk) => sk.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCourse =
        selectedCourseFilter === "All" || p.courseName === selectedCourseFilter;

      const matchStatus =
        selectedStatusFilter === "All" || p.placementStatus === selectedStatusFilter;

      const matchEligibility =
        selectedEligibilityFilter === "All" ||
        p.placementEligibility === selectedEligibilityFilter;

      return matchSearch && matchCourse && matchStatus && matchEligibility;
    });
  }, [profiles, searchTerm, selectedCourseFilter, selectedStatusFilter, selectedEligibilityFilter]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      const matchSearch =
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        selectedStatusFilter === "All" || comp.partnershipStatus === selectedStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [companies, searchTerm, selectedStatusFilter]);

  // Filtered Applications & Interviews
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        selectedStatusFilter === "All" || app.status === selectedStatusFilter;

      const matchCourse =
        selectedCourseFilter === "All" || app.courseName === selectedCourseFilter;

      return matchSearch && matchStatus && matchCourse;
    });
  }, [applications, searchTerm, selectedStatusFilter, selectedCourseFilter]);

  // Filtered Offers
  const filteredOffers = useMemo(() => {
    return offers.filter((off) => {
      const matchSearch =
        off.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        selectedStatusFilter === "All" || off.status === selectedStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [offers, searchTerm, selectedStatusFilter]);

  // Handle Offer Acceptance
  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to mark this offer as Accepted? This will update student status to 'Placed' and increment hired statistics.")) {
      return;
    }

    try {
      const res = await fetch(`/api/placements/offers/${offerId}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept offer");

      setNotification({
        type: "success",
        message: "Offer marked as Accepted! Student profile updated to Placed.",
      });
      fetchData(true);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Could not accept offer.",
      });
    }
  };

  // CSV Export action
  const handleExportCSV = () => {
    window.open("/api/placements/export", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F3F8F7] pb-16">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in slide-in-from-top duration-300">
          <div
            className={`p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 border ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span className="text-xs font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/10 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#078783] text-white rounded-xl shadow-sm">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#192C34] tracking-tight">
                  Placement Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Campus recruitment drives, corporate MOU partners, student readiness & salary analytics
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="rounded-xl border-slate-300 hover:bg-white text-xs h-9"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-[#078783]" : ""}`}
              />
              Refresh
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="rounded-xl border-slate-300 hover:bg-white text-xs h-9 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export CSV
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReportModalOpen(true)}
              className="rounded-xl border-[#078783]/40 text-[#078783] hover:bg-teal-50 text-xs h-9 flex items-center gap-1.5 font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Placement Report
            </Button>

            <Button
              type="button"
              onClick={() => {
                setCompanyToEdit(null);
                setIsCompanyModalOpen(true);
              }}
              variant="outline"
              className="rounded-xl border-slate-300 hover:bg-white text-xs h-9 flex items-center gap-1.5 text-slate-700"
            >
              <Building2 className="w-3.5 h-3.5 text-[#078783]" />
              Add Company
            </Button>

            <Button
              type="button"
              onClick={() => {
                setJobToEdit(null);
                setIsJobModalOpen(true);
              }}
              className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-xl text-xs h-9 px-3.5 font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Post Job Drive
            </Button>
          </div>
        </div>

        {/* 7 KPI Highlights Section */}
        <PlacementKPIs
          stats={kpis}
          selectedCourse={selectedCourseFilter}
          onCourseFilterChange={(c) => setSelectedCourseFilter(c)}
          courses={courses}
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (
              tab === "jobs" ||
              tab === "profiles" ||
              tab === "companies" ||
              tab === "applications" ||
              tab === "offers"
            ) {
              setActiveTab(tab);
            }
          }}
        />

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              {
                id: "jobs",
                label: "Job Drives & Vacancies",
                count: jobs.length,
                icon: Briefcase,
              },
              {
                id: "profiles",
                label: "Student Placement Profiles",
                count: profiles.length,
                icon: Users,
              },
              {
                id: "companies",
                label: "Hiring Partner Companies",
                count: companies.length,
                icon: Building2,
              },
              {
                id: "applications",
                label: "Applications & Interviews",
                count: applications.length,
                icon: CalendarCheck,
              },
              {
                id: "offers",
                label: "Offers & Hall of Fame",
                count: offers.length,
                icon: Award,
              },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedStatusFilter("All");
                    setSelectedEligibilityFilter("All");
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#192C34] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? "text-[#38B2AC]" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Search & Filter Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E2ECEB] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "jobs"
                  ? "Search by job title, partner company, location..."
                  : activeTab === "profiles"
                  ? "Search student name, student ID, skill tags..."
                  : activeTab === "companies"
                  ? "Search company name, industry, recruiter..."
                  : activeTab === "applications"
                  ? "Search application ID, student, company..."
                  : "Search candidate, company, offer letter ref..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#078783] transition"
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {activeTab === "jobs" &&
                  opportunityStatusEnum.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                {activeTab === "profiles" &&
                  placementStatusEnum.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                {activeTab === "companies" &&
                  partnershipStatusEnum.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                {activeTab === "applications" &&
                  applicationStatusEnum.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                {activeTab === "offers" &&
                  offerStatusEnum.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>

            {/* Profile specific: Eligibility Filter */}
            {activeTab === "profiles" && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500">Eligibility:</span>
                <select
                  value={selectedEligibilityFilter}
                  onChange={(e) => setSelectedEligibilityFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="All">All Eligibility</option>
                  {placementEligibilityEnum.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Jobs view toggle: Cards vs Table */}
            {activeTab === "jobs" && (
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-0.5">
                <button
                  onClick={() => setJobViewLayout("grid")}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    jobViewLayout === "grid"
                      ? "bg-white text-[#078783] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setJobViewLayout("table")}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    jobViewLayout === "table"
                      ? "bg-white text-[#078783] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Table view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab 1: Job Opportunities & Drives Content */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-[#E2ECEB] rounded-2xl">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Job Drives Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  No active recruitment drives match your search criteria. Post a new drive or reset filters.
                </p>
                <Button
                  onClick={() => {
                    setJobToEdit(null);
                    setIsJobModalOpen(true);
                  }}
                  className="bg-[#078783] text-white rounded-xl text-xs px-4"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Post New Job Drive
                </Button>
              </Card>
            ) : jobViewLayout === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobs.map((job) => {
                  const isClosed = job.status === "Closed";
                  return (
                    <Card
                      key={job.id}
                      className="p-5 bg-white border border-[#E2ECEB] rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Top bar: Company + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#078783] font-bold text-sm shrink-0">
                              {job.companyName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 line-clamp-1">
                                {job.companyName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{job.id}</div>
                            </div>
                          </div>
                          <Badge
                            className={`text-[10px] font-bold ${
                              job.status === "Open"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : job.status === "In Progress"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : job.status === "Closed"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {job.status}
                          </Badge>
                        </div>

                        {/* Title & Salary */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                            {job.jobTitle}
                          </h3>
                          <div className="text-xs font-semibold text-[#078783] mt-1 flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {job.salaryRangeDisplay} · {job.jobType}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 line-clamp-2">{job.jobDescription}</p>

                        {/* Badges: Min Attendance & Location */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {job.jobLocation}
                          </span>
                          <span className="flex items-center gap-1 bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-medium">
                            <CalendarCheck className="w-3 h-3 text-[#078783]" />
                            Min {job.minAttendancePercentage}% Attendance
                          </span>
                        </div>

                        {/* Required Skills tags */}
                        <div className="flex flex-wrap gap-1">
                          {job.requiredSkills.map((sk) => (
                            <span
                              key={sk}
                              className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer: Metrics & Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] text-slate-500">
                          <span className="font-bold text-slate-800">{job.totalApplications}</span>{" "}
                          applicants ·{" "}
                          <span className="font-bold text-emerald-700">
                            {job.filledOpenings}/{job.openings}
                          </span>{" "}
                          filled
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setJobToEdit(job);
                              setIsJobModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-800"
                            title="Edit Drive"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            disabled={isClosed}
                            onClick={() => {
                              setApplyInitialJobId(job.id);
                              setIsApplyModalOpen(true);
                            }}
                            className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-lg text-xs h-7 px-3 font-semibold"
                          >
                            Apply Student
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Table Layout */
              <div className="bg-white border border-[#E2ECEB] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F9FBFA] text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Drive ID & Title</th>
                      <th className="py-3 px-3">Company Partner</th>
                      <th className="py-3 px-3">Package (LPA)</th>
                      <th className="py-3 px-2 text-center">Min Attendance</th>
                      <th className="py-3 px-2 text-center">Openings</th>
                      <th className="py-3 px-2 text-center">Applicants</th>
                      <th className="py-3 px-3">Deadline</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{job.jobTitle}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{job.id}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {job.companyName}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#078783]">
                          {job.salaryRangeDisplay}
                        </td>
                        <td className="py-3 px-2 text-center font-semibold text-slate-700">
                          {job.minAttendancePercentage}%
                        </td>
                        <td className="py-3 px-2 text-center text-slate-700">
                          {job.filledOpenings} / {job.openings}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-900">
                          {job.totalApplications}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{job.applicationDeadline}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            className={`text-[10px] font-bold ${
                              job.status === "Open"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {job.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setJobToEdit(job);
                                setIsJobModalOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                setApplyInitialJobId(job.id);
                                setIsApplyModalOpen(true);
                              }}
                              className="bg-[#078783] text-white rounded-lg text-xs h-7 px-2.5 font-semibold"
                            >
                              Apply
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Student Placement Profiles Content */}
        {activeTab === "profiles" && (
          <div className="bg-white border border-[#E2ECEB] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FBFA] text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student Candidate</th>
                    <th className="py-3 px-3">Course & Batch</th>
                    <th className="py-3 px-3 text-center">Attendance Record</th>
                    <th className="py-3 px-3 text-center">Placement Eligibility</th>
                    <th className="py-3 px-3 text-center">Current Status</th>
                    <th className="py-3 px-3">Portfolio & Resume</th>
                    <th className="py-3 px-3">Skills / Placed Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.map((p) => {
                    const isAttEligible = p.attendancePercentage >= 75;
                    return (
                      <tr key={p.studentId} className="hover:bg-slate-50/70">
                        {/* Student Name & Code */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.studentCode} · {p.email}
                          </div>
                        </td>

                        {/* Course & Batch */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{p.courseName}</div>
                          <div className="text-[10px] text-slate-500">Batch {p.batchCode}</div>
                        </td>

                        {/* Attendance % */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-slate-900">{p.attendancePercentage}%</span>
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  isAttEligible ? "bg-[#078783]" : "bg-amber-500"
                                }`}
                                style={{ width: `${Math.min(p.attendancePercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Eligibility Badge */}
                        <td className="py-3 px-3 text-center">
                          <Badge
                            className={`text-[10px] font-bold ${
                              p.placementEligibility === "Eligible"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : p.placementEligibility === "Placed"
                                ? "bg-teal-100 text-teal-800 border-teal-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {p.placementEligibility}
                          </Badge>
                        </td>

                        {/* Placement Status */}
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              p.placementStatus === "Placed"
                                ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                                : p.placementStatus === "In Interview Process"
                                ? "border-blue-500 text-blue-700 bg-blue-50"
                                : "border-slate-300 text-slate-700"
                            }`}
                          >
                            {p.placementStatus}
                          </Badge>
                        </td>

                        {/* Resume & Portfolio Links */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {p.resumeUrl ? (
                              <a
                                href={p.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#078783] hover:underline font-semibold flex items-center gap-0.5"
                              >
                                Resume <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-300 italic">No resume</span>
                            )}
                            {p.portfolioUrl && (
                              <a
                                href={p.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-indigo-600 hover:underline font-semibold flex items-center gap-0.5"
                              >
                                Portfolio <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Skills / Placed details */}
                        <td className="py-3 px-3">
                          {p.placedCompany ? (
                            <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              {p.placedCompany} (₹{p.placedSalaryLPA} LPA)
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {p.skills.slice(0, 3).map((sk) => (
                                <span
                                  key={sk}
                                  className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                                >
                                  {sk}
                                </span>
                              ))}
                              {p.skills.length > 3 && (
                                <span className="text-[9px] text-slate-400">
                                  +{p.skills.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setSelectedProfileToEdit(p);
                                setIsProfileModalOpen(true);
                              }}
                              className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit Profile
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                setApplyInitialStudentId(p.studentId);
                                setIsApplyModalOpen(true);
                              }}
                              disabled={!isAttEligible || p.placementStatus === "Placed"}
                              className={`rounded-lg text-xs h-7 px-2.5 font-semibold text-white ${
                                isAttEligible && p.placementStatus !== "Placed"
                                  ? "bg-[#078783] hover:bg-[#066f6c]"
                                  : "bg-slate-300 cursor-not-allowed"
                              }`}
                            >
                              Apply
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No student placement profiles match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Hiring Partner Companies Content */}
        {activeTab === "companies" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((comp) => (
                <Card
                  key={comp.id}
                  className="p-5 bg-white border border-[#E2ECEB] rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-700">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {comp.name}
                          </h3>
                          <div className="text-[10px] text-slate-400 font-mono">{comp.id}</div>
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] font-bold ${
                          comp.partnershipStatus === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : comp.partnershipStatus === "MOU Signed"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {comp.partnershipStatus}
                      </Badge>
                    </div>

                    <div className="text-xs font-semibold text-slate-600">{comp.industry}</div>

                    {/* Contact Person Details */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {comp.contactPerson}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {comp.contactEmail}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {comp.contactNumber}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {comp.address}
                    </div>

                    {comp.website && (
                      <a
                        href={comp.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#078783] hover:underline flex items-center gap-1 font-medium"
                      >
                        <Globe className="w-3 h-3" />
                        Visit Website
                      </a>
                    )}
                  </div>

                  {/* Footer: Hired count and Edit */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-700">{comp.totalHiredCount}</span>{" "}
                      students hired
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCompanyToEdit(comp);
                        setIsCompanyModalOpen(true);
                      }}
                      className="rounded-lg text-xs h-7 px-3 border-slate-300 hover:bg-slate-50"
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {filteredCompanies.length === 0 && (
              <Card className="p-8 text-center bg-white border border-[#E2ECEB] rounded-2xl">
                <p className="text-xs text-slate-500">No partner companies match your search.</p>
              </Card>
            )}
          </div>
        )}

        {/* Tab 4: Applications & Interviews Content */}
        {activeTab === "applications" && (
          <div className="bg-white border border-[#E2ECEB] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FBFA] text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Application ID</th>
                    <th className="py-3 px-3">Student Candidate</th>
                    <th className="py-3 px-3">Company & Job Role</th>
                    <th className="py-3 px-2 text-center">Applied Date</th>
                    <th className="py-3 px-3 text-center">Current Status</th>
                    <th className="py-3 px-4">Interview Schedule & Feedback</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{app.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{app.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {app.studentCode} · {app.courseName}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{app.jobTitle}</div>
                        <div className="text-[10px] text-[#078783] font-medium">
                          {app.companyName}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">{app.appliedDate}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
                            app.status === "Selected"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : app.status === "Interview Scheduled"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : app.status === "Shortlisted"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : app.status === "Rejected"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {app.interviews.length > 0 ? (
                          <div className="space-y-1">
                            {app.interviews.map((iv) => (
                              <div
                                key={iv.id}
                                className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200"
                              >
                                <div>
                                  <span className="font-semibold text-slate-800">
                                    {iv.roundName.split(":")[0]}
                                  </span>{" "}
                                  · {iv.interviewDate} ({iv.result})
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInterviewToFeedback(iv);
                                    setInterviewApplication(null);
                                    setIsInterviewModalOpen(true);
                                  }}
                                  className="text-[10px] text-[#078783] hover:underline font-semibold"
                                >
                                  Feedback
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No interview round scheduled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setInterviewApplication(app);
                              setInterviewToFeedback(null);
                              setIsInterviewModalOpen(true);
                            }}
                            className="rounded-lg text-xs h-7 px-2.5 border-slate-300 hover:bg-slate-50"
                          >
                            <CalendarCheck className="w-3 h-3 mr-1 text-[#078783]" />
                            Schedule
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setOfferInitialAppId(app.id);
                              setIsOfferModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-7 px-2.5 font-semibold"
                          >
                            <Award className="w-3 h-3 mr-1" />
                            Offer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Offers & Hall of Fame Content */}
        {activeTab === "offers" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-300" />
                  Corporate Recruitment Hall of Fame
                </h3>
                <p className="text-xs text-emerald-100">
                  Verified candidate offers with official CTC salary packages & joining dates
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setOfferInitialAppId(undefined);
                  setIsOfferModalOpen(true);
                }}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-xs h-9 px-4 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Record New Offer
              </Button>
            </div>

            <div className="bg-white border border-[#E2ECEB] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F9FBFA] text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Offer Ref & Date</th>
                      <th className="py-3 px-3">Placed Student</th>
                      <th className="py-3 px-3">Hiring Company & Role</th>
                      <th className="py-3 px-3 text-right">Annual CTC Package</th>
                      <th className="py-3 px-3 text-center">Joining Date</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOffers.map((off) => {
                      const isAccepted = off.status === "Accepted";
                      return (
                        <tr key={off.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-800">{off.id}</div>
                            <div className="text-[10px] text-slate-400">
                              {off.offerLetterRef || off.offerDate}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{off.studentName}</div>
                            <div className="text-[10px] text-slate-500">
                              {off.studentCode} · {off.courseName}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#078783]">{off.companyName}</div>
                            <div className="text-[11px] text-slate-600">{off.jobTitle}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900 text-sm">
                            <span className="text-emerald-700">₹{off.offeredSalaryLPA} LPA</span>
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-slate-700">
                            {off.joiningDate}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              className={`text-[10px] font-bold ${
                                isAccepted
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : off.status === "Offer Extended"
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {off.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isAccepted ? (
                              <Button
                                type="button"
                                onClick={() => handleAcceptOffer(off.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-7 px-3 font-semibold shadow-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Accept Offer
                              </Button>
                            ) : (
                              <span className="text-emerald-700 font-bold text-xs flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Placed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredOffers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No offers recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Partner Company Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setCompanyToEdit(null);
        }}
        onSuccess={(savedComp) => {
          setNotification({
            type: "success",
            message: `Partner company "${savedComp.name}" saved successfully!`,
          });
          fetchData(true);
        }}
        initialData={companyToEdit}
      />

      {/* 2. Job Opportunity Modal */}
      <JobOpportunityModal
        isOpen={isJobModalOpen}
        onClose={() => {
          setIsJobModalOpen(false);
          setJobToEdit(null);
        }}
        onSuccess={(savedJob) => {
          setNotification({
            type: "success",
            message: `Job Drive "${savedJob.jobTitle}" posted successfully!`,
          });
          fetchData(true);
        }}
        companies={companies}
        courses={courses}
        initialData={jobToEdit}
      />

      {/* 3. Student Placement Profile Modal */}
      <StudentPlacementModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfileToEdit(null);
        }}
        onSuccess={(updatedProf) => {
          setNotification({
            type: "success",
            message: `Placement profile for "${updatedProf.studentName}" updated successfully!`,
          });
          fetchData(true);
        }}
        profile={selectedProfileToEdit}
      />

      {/* 4. Apply Job Modal */}
      <ApplyJobModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setApplyInitialJobId(undefined);
          setApplyInitialStudentId(undefined);
        }}
        onSuccess={(newApp) => {
          setNotification({
            type: "success",
            message: `Student "${newApp.studentName}" applied to "${newApp.jobTitle}"!`,
          });
          fetchData(true);
        }}
        jobs={jobs.filter((j) => j.status === "Open")}
        students={profiles}
        initialJobId={applyInitialJobId}
        initialStudentId={applyInitialStudentId}
      />

      {/* 5. Schedule Interview & Feedback Modal */}
      <ScheduleInterviewModal
        isOpen={isInterviewModalOpen}
        onClose={() => {
          setIsInterviewModalOpen(false);
          setInterviewApplication(null);
          setInterviewToFeedback(null);
        }}
        onSuccess={(iv) => {
          setNotification({
            type: "success",
            message: `Interview record updated for "${iv.studentName}"!`,
          });
          fetchData(true);
        }}
        application={interviewApplication}
        interviewToFeedback={interviewToFeedback}
      />

      {/* 6. Record Placement Offer Modal */}
      <RecordOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setOfferInitialAppId(undefined);
        }}
        onSuccess={(offer) => {
          setNotification({
            type: "success",
            message: `Offer of ₹${offer.offeredSalaryLPA} LPA recorded for "${offer.studentName}"!`,
          });
          fetchData(true);
        }}
        applications={applications}
        initialApplicationId={offerInitialAppId}
      />

      {/* 7. Printable Placement Report Modal */}
      <PlacementReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        kpis={kpis}
      />
    </div>
  );
}
