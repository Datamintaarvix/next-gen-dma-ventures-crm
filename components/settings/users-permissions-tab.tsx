"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  StaffRecord,
  StaffRole,
  crmModules,
  CrmModule,
  StaffPermissions,
  ModulePermission,
  defaultPermissionsForRole,
} from "@/lib/validations/staff";
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Unlock,
  KeyRound,
  Loader2,
  UserPlus,
  RotateCcw,
  Mail,
  Phone,
  Briefcase,
  Building2,
} from "lucide-react";

interface UsersPermissionsTabProps {
  onAuditAction?: (action: string, category: any, details: string) => void;
}

export function UsersPermissionsTab({ onAuditAction }: UsersPermissionsTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected User for Permissions Modal
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<StaffRecord | null>(null);
  const [customPerms, setCustomPerms] = useState<StaffPermissions | null>(null);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Modal for New Employee Invitation / Creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "+91 98",
    role: "Counsellor" as StaffRole,
    department: "Admissions & Counselling",
    designation: "Academic Counsellor",
    temporaryPassword: "NextGen@2026!",
  });

  // Modal for Password Reset
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<StaffRecord | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success && Array.isArray(json.users)) {
        setUsers(json.users);
      } else {
        // Fallback to /api/staff
        const fallbackRes = await fetch("/api/staff");
        const fallbackJson = await fallbackRes.json();
        if (fallbackJson.success && Array.isArray(fallbackJson.staff || fallbackJson.data)) {
          setUsers(fallbackJson.staff || fallbackJson.data);
        }
      }
    } catch (err: any) {
      setErrorMsg("Failed to load users directory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: StaffRecord) => {
    if (user.id === "STF-101" || user.role === "Super Admin") {
      alert("Security Violation: The primary Super Admin account (STF-101) is protected against deactivation or lockout.");
      return;
    }

    const newStatus = user.employmentStatus === "Active" ? "Inactive" : "Active";
    const confirmMsg = `Are you sure you want to mark ${user.fullName} (${user.id}) as ${newStatus}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employmentStatus: newStatus,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update account status.");
      }

      setSuccessMsg(`Account status for ${user.fullName} changed to ${newStatus}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const handleRoleChange = async (user: StaffRecord, newRole: StaffRole) => {
    if (user.id === "STF-101" && newRole !== "Super Admin") {
      alert("Security Violation: Cannot demote the primary Super Admin account (STF-101).");
      return;
    }

    try {
      const newPerms = defaultPermissionsForRole(newRole);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          permissions: newPerms,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update user role.");
      }

      setSuccessMsg(`Role for ${user.fullName} updated to ${newRole}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const openPermsModal = (user: StaffRecord) => {
    setSelectedUserForPerms(user);
    setCustomPerms(JSON.parse(JSON.stringify(user.permissions || defaultPermissionsForRole(user.role))));
  };

  const toggleModulePerm = (moduleKey: CrmModule, permKey: keyof ModulePermission) => {
    if (!customPerms) return;
    setCustomPerms((prev: any) => {
      const currentMod = prev[moduleKey] || { view: false, create: false, edit: false, delete: false, export: false };
      return {
        ...prev,
        [moduleKey]: {
          ...currentMod,
          [permKey]: !currentMod[permKey],
        },
      };
    });
  };

  const saveCustomPerms = async () => {
    if (!selectedUserForPerms || !customPerms) return;
    setIsSavingPerms(true);
    try {
      const res = await fetch(`/api/staff/${selectedUserForPerms.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: customPerms,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save permissions.");
      }

      setSuccessMsg(`Custom module permissions updated for ${selectedUserForPerms.fullName}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setSelectedUserForPerms(null);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.fullName.trim() || !newUserData.email.trim()) {
      setErrorMsg("Full name and email are required.");
      return;
    }

    setIsCreatingUser(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create employee account.");
      }

      setSuccessMsg(`Employee account created for ${newUserData.fullName} with temporary password "${newUserData.temporaryPassword}".`);
      setShowAddModal(false);
      setNewUserData({
        fullName: "",
        email: "",
        phoneNumber: "+91 98",
        role: "Counsellor",
        department: "Admissions & Counselling",
        designation: "Academic Counsellor",
        temporaryPassword: "NextGen@2026!",
      });
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    setIsResettingPassword(true);
    setErrorMsg(null);
    setGeneratedResetLink(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserForPassword.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: newPasswordInput.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to reset password.");
      }

      if (json.actionLink) {
        setGeneratedResetLink(json.actionLink);
      } else {
        setSuccessMsg(json.message || "Password updated successfully.");
        setTimeout(() => setSuccessMsg(null), 4000);
        setSelectedUserForPassword(null);
        setNewPasswordInput("");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Super Admin Protection Banner */}
      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900">
              Super Admin Account Protection Active
            </h4>
            <p className="text-amber-700 mt-0.5">
              The primary administrator account (Super Admin) cannot be deactivated, demoted, or deleted. The system enforces at least one active administrator at all times.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-amber-200/70 text-amber-900 font-bold rounded text-[10px] uppercase tracking-wider shrink-0">
          Enforced Policy
        </span>
      </div>

      {/* User Directory Card */}
      <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-[#11232B]">
                Registered CRM Accounts & Module Privileges
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Manage operator account activation, role assignment, credential provisioning, and granular permissions
              </CardDescription>
            </div>

            {/* Actions & Filters */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783] w-40 sm:w-48"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Counsellor">Counsellor</option>
                <option value="Trainer">Trainer</option>
                <option value="Placement Officer">Placement Officer</option>
                <option value="Finance Staff">Finance Staff</option>
                <option value="Receptionist">Receptionist</option>
              </select>

              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#078783] hover:bg-[#066F6C] text-white text-xs gap-1.5 h-8 px-3 rounded-lg shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Employee</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Operator / Email</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Assigned Role</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">Security & Password</th>
                  <th className="py-2.5 px-4 text-center">Module Access</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 text-[#078783] animate-spin mx-auto mb-2" />
                      Loading users directory...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSuperAdmin = user.id === "STF-101" || user.role === "Super Admin";
                    const isActive = user.employmentStatus === "Active";

                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 block">
                              {user.fullName}
                            </span>
                            {isSuperAdmin && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                Super Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 block">
                            {user.email} • {user.id}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-gray-600">{user.department}</td>

                        <td className="py-3 px-4">
                          {isSuperAdmin ? (
                            <span className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" />
                              Super Admin
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user, e.target.value as StaffRole)}
                              className="text-[11px] px-2 py-1 bg-white border border-gray-200 rounded font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Manager">Manager</option>
                              <option value="Counsellor">Counsellor</option>
                              <option value="Trainer">Trainer</option>
                              <option value="Placement Officer">Placement Officer</option>
                              <option value="Finance Staff">Finance Staff</option>
                              <option value="Receptionist">Receptionist</option>
                            </select>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {user.employmentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForPassword(user);
                              setNewPasswordInput("");
                              setGeneratedResetLink(null);
                            }}
                            className="text-[11px] h-7 px-2 text-[#5A7178] hover:text-[#078783] hover:bg-[#F3F8F7]"
                            title="Reset password or generate recovery link"
                          >
                            <KeyRound className="w-3 h-3 mr-1 text-[#078783]" />
                            Reset Password
                          </Button>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermsModal(user)}
                            className="text-[11px] h-7 px-2.5 border-gray-200 hover:border-[#078783] text-gray-700"
                          >
                            <Shield className="w-3 h-3 mr-1 text-[#078783]" />
                            Permissions
                          </Button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isSuperAdmin ? (
                            <span className="text-[11px] text-gray-400 italic">Protected</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                              className={`text-[11px] h-7 px-2 ${
                                isActive
                                  ? "text-rose-600 hover:bg-rose-50"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite / Create Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#078783]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Invite New Employee</h3>
                  <p className="text-xs text-gray-500">Create staff profile and provision Supabase Auth credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@nextgendma.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUserData.phoneNumber}
                    onChange={(e) => setNewUserData({ ...newUserData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Assigned Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as StaffRole })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783] bg-white"
                  >
                    <option value="Counsellor">Counsellor</option>
                    <option value="Manager">Manager</option>
                    <option value="Trainer">Trainer</option>
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="Finance Staff">Finance Staff</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Department</label>
                  <select
                    value={newUserData.department}
                    onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783] bg-white"
                  >
                    <option value="Admissions & Counselling">Admissions & Counselling</option>
                    <option value="Academics & Training">Academics & Training</option>
                    <option value="Placement Cell">Placement Cell</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Front Desk & Operations">Front Desk & Operations</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  value={newUserData.designation}
                  onChange={(e) => setNewUserData({ ...newUserData, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Temporary Initial Password</label>
                <input
                  type="text"
                  value={newUserData.temporaryPassword}
                  onChange={(e) => setNewUserData({ ...newUserData, temporaryPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783] font-mono text-xs"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Employee can use this password to sign in immediately and update it in their profile.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingUser}
                  className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5"
                >
                  {isCreatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create & Provision Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#078783]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Reset Password: {selectedUserForPassword.fullName}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedUserForPassword.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPassword(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Set New Temporary Password</label>
                <input
                  type="text"
                  placeholder="Leave blank to generate recovery link instead"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783] font-mono text-xs"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  If entered, password is set immediately. If left blank, a secure one-time password recovery link is generated.
                </p>
              </div>

              {generatedResetLink && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-1">
                  <span className="font-semibold text-[#078783] block">Recovery Action Link:</span>
                  <input
                    type="text"
                    readOnly
                    value={generatedResetLink}
                    className="w-full p-1.5 bg-white border border-teal-200 rounded text-[10px] font-mono text-gray-800 select-all"
                  />
                  <p className="text-[10px] text-gray-600">
                    Copy and share this link directly with {selectedUserForPassword.fullName} to reset their password.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedUserForPassword(null)}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={isResettingPassword}
                  className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5"
                >
                  {isResettingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {newPasswordInput.trim() ? "Update Password" : "Generate Link"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Granular Module Permissions Modal */}
      {selectedUserForPerms && customPerms && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#078783]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Granular Access Permissions: {selectedUserForPerms.fullName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Role: {selectedUserForPerms.role} • {selectedUserForPerms.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPerms(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-gray-600">
                Configure module-level CRUD privileges for this user. Ticking permissions grants direct operational capability.
              </p>

              <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">CRM Module</th>
                    <th className="py-2.5 px-3 text-center">View</th>
                    <th className="py-2.5 px-3 text-center">Create</th>
                    <th className="py-2.5 px-3 text-center">Edit</th>
                    <th className="py-2.5 px-3 text-center">Delete</th>
                    <th className="py-2.5 px-3 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {crmModules.map((m) => {
                    const modPerm = customPerms[m] || {
                      view: false,
                      create: false,
                      edit: false,
                      delete: false,
                      export: false,
                    };
                    const moduleTitle = m.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

                    return (
                      <tr key={m} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-semibold text-gray-800">
                          {moduleTitle}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={modPerm.view}
                            onChange={() => toggleModulePerm(m, "view")}
                            className="rounded text-[#078783] focus:ring-[#078783]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={modPerm.create}
                            onChange={() => toggleModulePerm(m, "create")}
                            className="rounded text-[#078783] focus:ring-[#078783]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={modPerm.edit}
                            onChange={() => toggleModulePerm(m, "edit")}
                            className="rounded text-[#078783] focus:ring-[#078783]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={modPerm.delete}
                            onChange={() => toggleModulePerm(m, "delete")}
                            className="rounded text-[#078783] focus:ring-[#078783]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={modPerm.export}
                            onChange={() => toggleModulePerm(m, "export")}
                            className="rounded text-[#078783] focus:ring-[#078783]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserForPerms(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveCustomPerms}
                disabled={isSavingPerms}
                className="bg-[#078783] hover:bg-[#066F6C] text-white text-xs gap-1.5"
              >
                {isSavingPerms && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
