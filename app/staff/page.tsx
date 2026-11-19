"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  StaffRecord,
  StaffKPIStats,
  staffRoleEnum,
  staffDepartmentEnum,
  employmentStatusEnum,
  StaffRole,
  StaffDepartment,
  EmploymentStatus,
} from "@/lib/validations/staff";
import { StaffKPIs } from "@/components/staff/staff-kpis";
import { StaffModal } from "@/components/staff/staff-modal";
import { StaffPermissionsModal } from "@/components/staff/staff-permissions-modal";
import { StaffProfileModal } from "@/components/staff/staff-profile-modal";
import { StaffPerformanceModal } from "@/components/staff/staff-performance-modal";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  UsersRound,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  Search,
  Filter,
  ShieldCheck,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Lock,
} from "lucide-react";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [kpis, setKpis] = useState<StaffKPIStats>({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    counsellors: 0,
    trainers: 0,
    administrators: 0,
    departmentCounts: {
      "Admissions & Counselling": 0,
      "Academics & Training": 0,
      "Corporate Relations & Placements": 0,
      "Finance & Accounts": 0,
      "Front Desk & Operations": 0,
      "Administration & Leadership": 0,
    },
    employmentTypeCounts: {
      "Full-time": 0,
      "Part-time": 0,
      Contract: 0,
      "Visiting Faculty": 0,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Sorting
  const [sortField, setSortField] = useState<"name" | "joiningDate" | "department" | "role">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffRecord | null>(null);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [staffForPermissions, setStaffForPermissions] = useState<StaffRecord | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [staffForProfile, setStaffForProfile] = useState<StaffRecord | null>(null);

  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load Staff Data
  const fetchStaffData = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load staff list");

      if (data.staff) setStaffList(data.staff);
      if (data.kpis) setKpis(data.kpis);
    } catch (err: any) {
      console.error("Error fetching staff records:", err);
      setNotification({
        type: "error",
        message: err.message || "Failed to load staff records",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // Filtered & Sorted Staff List
  const filteredStaff = useMemo(() => {
    let result = staffList.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phoneNumber.includes(searchTerm);

      const matchDept = selectedDepartment === "All" || s.department === selectedDepartment;
      const matchRole = selectedRole === "All" || s.role === selectedRole;
      const matchStatus = selectedStatus === "All" || s.employmentStatus === selectedStatus;

      return matchSearch && matchDept && matchRole && matchStatus;
    });

    result.sort((a, b) => {
      let comp = 0;
      if (sortField === "name") comp = a.fullName.localeCompare(b.fullName);
      else if (sortField === "joiningDate") comp = a.joiningDate.localeCompare(b.joiningDate);
      else if (sortField === "department") comp = a.department.localeCompare(b.department);
      else if (sortField === "role") comp = a.role.localeCompare(b.role);

      return sortDirection === "asc" ? comp : -comp;
    });

    return result;
  }, [staffList, searchTerm, selectedDepartment, selectedRole, selectedStatus, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage]);

  const toggleSort = (field: "name" | "joiningDate" | "department" | "role") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // CSV Export action
  const handleExportCSV = () => {
    window.open("/api/staff/export", "_blank");
  };

  // Deactivate Staff
  const handleDeactivate = async (staff: StaffRecord) => {
    if (!confirm(`Are you sure you want to mark ${staff.fullName} (${staff.id}) as Inactive?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/staff/${staff.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deactivate staff member");

      setNotification({
        type: "success",
        message: `${staff.fullName} has been marked as Inactive.`,
      });
      fetchStaffData(true);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to update staff status.",
      });
    }
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
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#078783] text-white rounded-xl shadow-sm">
                <UsersRound className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#192C34] tracking-tight">
                  Staff Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Institutional governance, role-based access control, departmental assignments & faculty records
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchStaffData(true)}
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
              onClick={() => setIsPerformanceModalOpen(true)}
              className="rounded-xl border-[#078783]/40 text-[#078783] hover:bg-teal-50 text-xs h-9 flex items-center gap-1.5 font-semibold"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Performance Scorecard
            </Button>

            <Button
              type="button"
              onClick={() => {
                setStaffToEdit(null);
                setIsAddEditModalOpen(true);
              }}
              className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-xl text-xs h-9 px-3.5 font-semibold shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* 6 KPI Highlights & Filter Ribbon */}
        <StaffKPIs
          stats={kpis}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={(d) => {
            setSelectedDepartment(d);
            setCurrentPage(1);
          }}
          selectedStatus={selectedStatus}
          onStatusChange={(s) => {
            setSelectedStatus(s);
            setCurrentPage(1);
          }}
          onResetFilters={() => {
            setSelectedDepartment("All");
            setSelectedStatus("All");
            setSelectedRole("All");
            setSearchTerm("");
            setCurrentPage(1);
          }}
        />

        {/* Search & Role Filter Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E2ECEB] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by full name, ID, email, designation, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
            {/* Role Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-medium">System Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Roles</option>
                {staffRoleEnum.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400 font-medium px-2">
              Showing {filteredStaff.length} staff
            </div>
          </div>
        </div>

        {/* Staff Directory Table */}
        <div className="bg-white border border-[#E2ECEB] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F9FBFA] text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => toggleSort("name")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Staff Member</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Contact</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => toggleSort("department")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Department</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Designation</th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => toggleSort("role")}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>System Role</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => toggleSort("joiningDate")}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Joined</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStaff.map((staff) => {
                  const initials = staff.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#078783] font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-[#078783] cursor-pointer"
                              onClick={() => {
                                setStaffForProfile(staff);
                                setIsProfileModalOpen(true);
                              }}
                            >
                              {staff.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{staff.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{staff.email}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{staff.phoneNumber}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {staff.department}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {staff.designation}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
                            staff.role === "Super Admin"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : staff.role === "Admin" || staff.role === "Manager"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                              : staff.role === "Counsellor"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : staff.role === "Trainer"
                              ? "bg-teal-100 text-teal-800 border-teal-200"
                              : staff.role === "Placement Officer"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {staff.role}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            staff.employmentStatus === "Active"
                              ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                              : staff.employmentStatus === "On Leave"
                              ? "border-amber-500 text-amber-700 bg-amber-50"
                              : "border-slate-300 text-slate-500 bg-slate-50"
                          }`}
                        >
                          {staff.employmentStatus}
                        </Badge>
                      </td>

                      {/* Joining Date */}
                      <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px]">
                        {staff.joiningDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setStaffForProfile(staff);
                              setIsProfileModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-[#078783]"
                            title="View Profile & Assignments"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setStaffForPermissions(staff);
                              setIsPermissionsModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                            title="RBAC Permissions Matrix"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setStaffToEdit(staff);
                              setIsAddEditModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleDeactivate(staff)}
                            disabled={staff.role === "Super Admin"}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                            title="Deactivate Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No staff members match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-[#F9FBFA]">
              <div>
                Page <span className="font-bold text-slate-800">{currentPage}</span> of{" "}
                <span className="font-bold text-slate-800">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2.5 rounded-lg border-slate-300"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                      currentPage === idx + 1
                        ? "bg-[#078783] text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2.5 rounded-lg border-slate-300"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Add / Edit Staff Modal */}
      <StaffModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setStaffToEdit(null);
        }}
        onSuccess={(saved) => {
          setNotification({
            type: "success",
            message: `Staff member "${saved.fullName}" (${saved.id}) saved successfully!`,
          });
          fetchStaffData(true);
        }}
        initialData={staffToEdit}
        existingStaffList={staffList}
      />

      {/* 2. RBAC Permissions Matrix Modal */}
      <StaffPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setStaffForPermissions(null);
        }}
        onSuccess={(updated) => {
          setNotification({
            type: "success",
            message: `Role permissions updated for "${updated.fullName}"!`,
          });
          fetchStaffData(true);
        }}
        staff={staffForPermissions}
      />

      {/* 3. Detailed Staff Profile Modal */}
      <StaffProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setStaffForProfile(null);
        }}
        staff={staffForProfile}
        onEditStaff={(s) => {
          setIsProfileModalOpen(false);
          setStaffToEdit(s);
          setIsAddEditModalOpen(true);
        }}
        onEditPermissions={(s) => {
          setIsProfileModalOpen(false);
          setStaffForPermissions(s);
          setIsPermissionsModalOpen(true);
        }}
      />

      {/* 4. Performance Scorecard Modal */}
      <StaffPerformanceModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
      />
    </div>
  );
}
