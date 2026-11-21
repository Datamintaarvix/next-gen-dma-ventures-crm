"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CourseRecord,
  CourseStatus,
  courseCategoryList,
  courseStatusEnum,
} from "@/lib/validations/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseKPIs } from "@/components/courses/course-kpis";
import { CourseModal } from "@/components/courses/course-modal";
import { CourseDetailsModal } from "@/components/courses/course-details-modal";
import { DeleteCourseDialog } from "@/components/courses/delete-course-dialog";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Edit,
  Eye,
  ChevronDown,
  X,
  BookOpen,
  LayoutGrid,
  List,
  Clock,
  DollarSign,
  Users,
  User,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    inactiveCourses: 0,
    totalEnrolledStudents: 0,
    courseEnrolmentStats: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "duration" | "fees" | "enrolled">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<CourseRecord | null>(null);
  const [courseToView, setCourseToView] = useState<CourseRecord | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<CourseRecord | null>(null);

  // Fetch courses from API
  const fetchCourses = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/courses");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load courses");
      }
      setCourses(result.data);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      setErrorMessage(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCourses(false);
  };

  // Quick status change
  const handleStatusChange = async (id: string, newStatus: CourseStatus) => {
    try {
      const res = await fetch(`/api/courses/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      if (courseToView && courseToView.id === id) {
        setCourseToView((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      fetchCourses(false);
    } catch (err: any) {
      alert("Failed to update course status: " + err.message);
    }
  };

  // Delete course with dependency check
  const handleDeleteConfirm = async (id: string, force: boolean) => {
    const res = await fetch(`/api/courses/${id}${force ? "?force=true" : ""}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete course");
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
    fetchCourses(false);
  };

  // Archive course fallback
  const handleArchiveCourse = async (id: string) => {
    await handleStatusChange(id, "Archived");
  };

  // Filtering
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          c.courseName.toLowerCase().includes(q) ||
          c.courseCode.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (selectedCategory !== "All" && c.category !== selectedCategory) {
        return false;
      }

      if (selectedStatus === "has_students") {
        if ((c.enrolledStudentsCount || 0) === 0) return false;
      } else if (selectedStatus !== "All" && c.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [courses, searchTerm, selectedCategory, selectedStatus]);

  // Sorting
  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      if (sortBy === "duration") {
        const diff = a.durationWeeks - b.durationWeeks;
        return sortOrder === "asc" ? diff : -diff;
      }
      if (sortBy === "fees") {
        const diff = a.fees - b.fees;
        return sortOrder === "asc" ? diff : -diff;
      }
      if (sortBy === "enrolled") {
        const diff = (a.enrolledStudentsCount || 0) - (b.enrolledStudentsCount || 0);
        return sortOrder === "asc" ? diff : -diff;
      }
      return sortOrder === "asc"
        ? a.courseName.localeCompare(b.courseName)
        : b.courseName.localeCompare(a.courseName);
    });
  }, [filteredCourses, sortBy, sortOrder]);

  const handleKPIFilterSelect = (filterKey: string) => {
    if (filterKey === "All") {
      setSelectedStatus("All");
    } else {
      setSelectedStatus(filterKey);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedStatus("All");
  };

  const hasActiveFilters = searchTerm || selectedCategory !== "All" || selectedStatus !== "All";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-[#078783] uppercase mb-1">
            NEXT GEN / LIVE WORKSPACE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#11232B]">
            Course Management
          </h1>
          <p className="text-xs text-[#5A7178] mt-0.5">
            Manage academic programs, curriculum syllabus, instructors, and enrolled cohorts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => {
              setCourseToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="h-9 text-xs bg-[#078783] hover:bg-[#066e6b] text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Course
          </Button>
        </div>
      </div>

      {/* Dashboard KPI Statistics */}
      <CourseKPIs
        stats={stats}
        activeFilter={selectedStatus}
        onFilterSelect={handleKPIFilterSelect}
      />

      {/* Action & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2ECEB] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B939B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses by title, code, instructor, or category..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#FAFCFB] border border-[#D5E2E0] text-xs text-[#11232B] placeholder:text-[#7B939B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
            />
          </div>

          {/* Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-2.5 pr-7 rounded-lg bg-[#FAFCFB] border border-[#D5E2E0] text-xs text-[#11232B] appearance-none focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Categories</option>
                {courseCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B939B] pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 px-2.5 pr-7 rounded-lg bg-[#FAFCFB] border border-[#D5E2E0] text-xs text-[#11232B] appearance-none focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {courseStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B939B] pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-2.5 pr-7 rounded-lg bg-[#FAFCFB] border border-[#D5E2E0] text-xs text-[#11232B] appearance-none focus:outline-none focus:border-[#078783] cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="duration">Sort by Duration</option>
                <option value="fees">Sort by Fees</option>
                <option value="enrolled">Sort by Enrolled</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B939B] pointer-events-none" />
            </div>

            {/* Clear filters */}
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
              title="Refresh Courses"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#078783]" : ""}`} />
            </Button>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-lg border border-[#D5E2E0] bg-[#FAFCFB]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#078783] text-white shadow-xs"
                    : "text-[#7B939B] hover:text-[#11232B]"
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-[#078783] text-white shadow-xs"
                    : "text-[#7B939B] hover:text-[#11232B]"
                }`}
                title="Table Directory View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#078783] animate-spin mb-2" />
          <span className="text-xs text-[#5A7178]">Loading course catalog...</span>
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-xl border border-[#E2ECEB] p-8">
          <div className="w-12 h-12 rounded-full bg-[#E6F5F4] text-[#078783] flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-[#11232B]">No courses found</div>
          <p className="text-xs text-[#7B939B] max-w-sm mx-auto">
            {hasActiveFilters
              ? "No course records matched your search parameters. Try clearing your filters."
              : "No courses created yet. Click 'Add New Course' to launch a program."}
          </p>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs">
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW (Matching the visual styling of UI Screenshot Milestone 1) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCourses.map((course, idx) => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-[#E2ECEB] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Badge Index & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-semibold text-[#078783] tracking-wide">
                    {course.courseCode}
                  </span>
                  <Badge
                    variant={
                      course.status === "Active"
                        ? "active"
                        : course.status === "Draft"
                        ? "draft"
                        : "inactive"
                    }
                    className="capitalize text-[11px]"
                  >
                    {course.status}
                  </Badge>
                </div>

                {/* Course Name */}
                <h3
                  onClick={() => setCourseToView(course)}
                  className="text-base font-bold text-[#11232B] hover:text-[#078783] cursor-pointer transition-colors"
                >
                  {course.courseName}
                </h3>

                {/* Subtitle: Weeks & Enrolled */}
                <p className="text-xs text-[#5A7178] mt-1 font-medium">
                  {course.durationWeeks} weeks · {course.enrolledStudentsCount || 0} enrolled
                </p>

                {/* Description snippet */}
                <p className="text-xs text-[#7B939B] mt-2.5 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Meta details */}
                <div className="mt-4 pt-3 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#7B939B] block">Course Fees</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">
                      ₹{course.fees.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7B939B] block">Lead Instructor</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block truncate">
                      {course.instructor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Category Pill & Actions */}
              <div className="mt-4 pt-3 border-t border-[#E2ECEB] flex items-center justify-between">
                <span className="text-[11px] text-[#5A7178] font-medium">
                  {course.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCourseToView(course)}
                    className="h-8 w-8 p-0 text-[#078783] hover:bg-[#E6F5F4]"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCourseToEdit(course);
                      setIsCreateModalOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-[#2563EB] hover:bg-[#EFF6FF]"
                    title="Edit Course"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCourseToDelete(course)}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2ECEB] bg-[#FAFCFB] text-[#5A7178]">
                  <th className="py-3 px-4 font-semibold">Course</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Fees</th>
                  <th className="py-3 px-4 font-semibold">Instructor</th>
                  <th className="py-3 px-4 font-semibold">Enrolled</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEB]">
                {sortedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-[#F8FBFA] transition-colors">
                    {/* Course */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setCourseToView(course)}
                        className="font-bold text-[#11232B] hover:text-[#078783] cursor-pointer transition-colors"
                      >
                        {course.courseName}
                      </div>
                      <span className="font-mono text-[10px] text-[#7B939B]">
                        {course.courseCode}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-[#5A7178] font-medium">
                      {course.category}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-[#11232B]">
                      {course.duration}
                    </td>

                    {/* Fees */}
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹{course.fees.toLocaleString("en-IN")}
                    </td>

                    {/* Instructor */}
                    <td className="py-3 px-4 text-[#11232B] font-medium">
                      {course.instructor}
                    </td>

                    {/* Enrolled */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#2563EB]">
                        {course.enrolledStudentsCount || 0}
                      </span>{" "}
                      <span className="text-[#7B939B]">students</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <select
                        value={course.status}
                        onChange={(e) =>
                          handleStatusChange(course.id, e.target.value as CourseStatus)
                        }
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                          course.status === "Active"
                            ? "bg-[#E6F5F4] text-[#078783] border-[#BDE7E5]"
                            : course.status === "Draft"
                            ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                            : "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]"
                        }`}
                      >
                        {courseStatusEnum.map((st) => (
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
                          onClick={() => setCourseToView(course)}
                          className="h-8 w-8 p-0 text-[#078783] hover:bg-[#E6F5F4]"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCourseToEdit(course);
                            setIsCreateModalOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-[#2563EB] hover:bg-[#EFF6FF]"
                          title="Edit Course"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCourseToDelete(course)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Delete Course"
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
        </div>
      )}

      {/* Modals */}
      <CourseModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCourseToEdit(null);
        }}
        onSuccess={() => fetchCourses(false)}
        courseToEdit={courseToEdit}
      />

      <CourseDetailsModal
        isOpen={Boolean(courseToView)}
        onClose={() => setCourseToView(null)}
        course={courseToView}
        onEdit={(course) => {
          setCourseToEdit(course);
          setIsCreateModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
      />

      <DeleteCourseDialog
        isOpen={Boolean(courseToDelete)}
        onClose={() => setCourseToDelete(null)}
        course={courseToDelete}
        onConfirm={handleDeleteConfirm}
        onArchive={handleArchiveCourse}
      />
    </div>
  );
}
