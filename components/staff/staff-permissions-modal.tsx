"use client";

import React, { useState, useEffect } from "react";
import {
  StaffRecord,
  StaffPermissions,
  CrmModule,
  crmModules,
  defaultPermissionsForRole,
} from "@/lib/validations/staff";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  ShieldCheck,
  CheckSquare,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

interface StaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff: StaffRecord) => void;
  staff: StaffRecord | null;
}

const moduleLabels: Record<CrmModule, string> = {
  leads: "Leads Management",
  enquiries: "Enquiries Management",
  follow_ups: "Follow-up Management",
  students: "Student Management",
  courses: "Course Management",
  batches: "Batch Management",
  admissions: "Admissions Management",
  payments: "Payment & Fee Management",
  attendance: "Attendance Management",
  counselling: "Counselling Management",
  placements: "Placement Management",
  staff: "Staff Management",
  reports: "Reports & Analytics",
  settings: "Settings & System Config",
};

export function StaffPermissionsModal({
  isOpen,
  onClose,
  onSuccess,
  staff,
}: StaffPermissionsModalProps) {
  const [permissions, setPermissions] = useState<StaffPermissions>(
    staff?.permissions || ({} as StaffPermissions)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setPermissions(staff.permissions || defaultPermissionsForRole(staff.role));
      setErrorMsg(null);
    }
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  const handleToggle = (module: CrmModule, action: "view" | "create" | "edit" | "delete" | "export") => {
    setPermissions((prev) => {
      const current = prev[module] || { view: false, create: false, edit: false, delete: false, export: false };
      return {
        ...prev,
        [module]: {
          ...current,
          [action]: !current[action],
        },
      };
    });
  };

  const handleToggleRow = (module: CrmModule, enable: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        view: enable,
        create: enable,
        edit: enable,
        delete: enable,
        export: enable,
      },
    }));
  };

  const handleLoadRoleDefaults = () => {
    setPermissions(defaultPermissionsForRole(staff.role));
  };

  const handleSelectAll = (enable: boolean) => {
    const next: Partial<StaffPermissions> = {};
    crmModules.forEach((m) => {
      next[m] = {
        view: enable,
        create: enable,
        edit: enable,
        delete: enable,
        export: enable,
      };
    });
    setPermissions(next as StaffPermissions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/staff/${staff.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update permissions");
      }

      onSuccess(data.staff);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Role-Based Access Control (RBAC)
                </h3>
                <Badge className="bg-[#192C34] text-white text-[10px]">
                  {staff.role}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Configure module-level permissions for {staff.fullName} ({staff.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadRoleDefaults}
              className="text-xs h-7 px-2.5 rounded-lg border-slate-300 flex items-center gap-1 text-slate-700 hover:bg-white"
            >
              <RotateCcw className="w-3 h-3 text-[#078783]" />
              Reset to Role Defaults
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSelectAll(true)}
              className="text-xs h-7 px-2 text-teal-700 hover:bg-teal-50"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSelectAll(false)}
              className="text-xs h-7 px-2 text-slate-500 hover:bg-slate-200"
            >
              Clear All
            </Button>
          </div>
          <span className="text-[11px] text-slate-400">
            Enforced server-side across all API routes
          </span>
        </div>

        {/* Permissions Matrix */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F9FBFA] text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">CRM Module</th>
                  <th className="py-2.5 px-2 text-center">View</th>
                  <th className="py-2.5 px-2 text-center">Create</th>
                  <th className="py-2.5 px-2 text-center">Edit</th>
                  <th className="py-2.5 px-2 text-center">Delete</th>
                  <th className="py-2.5 px-2 text-center">Export</th>
                  <th className="py-2.5 px-3 text-right">Row Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {crmModules.map((mod) => {
                  const perm = permissions[mod] || {
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                    export: false,
                  };
                  const allActive =
                    perm.view && perm.create && perm.edit && perm.delete && perm.export;

                  return (
                    <tr key={mod} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {moduleLabels[mod]}
                      </td>

                      {/* View */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.view}
                          onChange={() => handleToggle(mod, "view")}
                          className="w-4 h-4 accent-[#078783] cursor-pointer rounded"
                        />
                      </td>

                      {/* Create */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.create}
                          onChange={() => handleToggle(mod, "create")}
                          className="w-4 h-4 accent-[#078783] cursor-pointer rounded"
                        />
                      </td>

                      {/* Edit */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.edit}
                          onChange={() => handleToggle(mod, "edit")}
                          className="w-4 h-4 accent-[#078783] cursor-pointer rounded"
                        />
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.delete}
                          onChange={() => handleToggle(mod, "delete")}
                          className="w-4 h-4 accent-rose-600 cursor-pointer rounded"
                        />
                      </td>

                      {/* Export */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.export}
                          onChange={() => handleToggle(mod, "export")}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                        />
                      </td>

                      {/* Row Toggle button */}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(mod, !allActive)}
                          className="text-[10px] text-slate-500 hover:text-slate-900 underline font-medium"
                        >
                          {allActive ? "Revoke Row" : "Grant Row"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-xl px-5 font-semibold text-xs shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Apply Permissions
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
