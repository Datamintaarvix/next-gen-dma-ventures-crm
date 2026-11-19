"use client";

import React, { useState, useEffect } from "react";
import {
  StaffRecord,
  crmModules,
} from "@/lib/validations/staff";
import { StaffCrossModuleDetails } from "@/lib/storage/staff-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  ShieldCheck,
  Calendar,
  HeartHandshake,
  Users,
  Layers,
  GraduationCap,
  CalendarCheck,
  Award,
  History,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  Sparkles,
  Loader2,
} from "lucide-react";

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffRecord | null;
  onEditStaff?: (staff: StaffRecord) => void;
  onEditPermissions?: (staff: StaffRecord) => void;
}

export function StaffProfileModal({
  isOpen,
  onClose,
  staff,
  onEditStaff,
  onEditPermissions,
}: StaffProfileModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "assignments" | "permissions" | "audit"
  >("overview");
  const [activity, setActivity] = useState<StaffCrossModuleDetails>({
    leads: [],
    enquiries: [],
    counsellingSessions: [],
    followUps: [],
    batches: [],
    attendanceSessions: [],
    placements: [],
  });
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    if (staff && isOpen) {
      setIsLoadingActivity(true);
      fetch(`/api/staff/${staff.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.activity) setActivity(data.activity);
        })
        .catch((err) => console.error("Error fetching staff activity", err))
        .finally(() => setIsLoadingActivity(false));
    }
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  const totalAssignedActivities =
    activity.leads.length +
    activity.counsellingSessions.length +
    activity.followUps.length +
    activity.batches.length +
    activity.attendanceSessions.length +
    activity.placements.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#192C34] to-[#254450] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-300/30 flex items-center justify-center text-teal-300 font-extrabold text-xl shrink-0">
                {staff.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">{staff.fullName}</h2>
                  <span className="text-xs bg-white/20 text-teal-200 px-2 py-0.5 rounded-full font-mono">
                    {staff.id}
                  </span>
                  <Badge
                    className={`text-[10px] font-bold ${
                      staff.employmentStatus === "Active"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {staff.employmentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {staff.designation} · {staff.department}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-teal-200 mt-2">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {staff.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {staff.phoneNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onEditStaff && (
                <Button
                  type="button"
                  onClick={() => onEditStaff(staff)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs h-8 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              )}
              {onEditPermissions && (
                <Button
                  type="button"
                  onClick={() => onEditPermissions(staff)}
                  className="bg-[#078783] hover:bg-[#066f6c] text-white text-xs h-8 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Permissions
                </Button>
              )}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-white/10 pb-0 overflow-x-auto">
            {[
              { id: "overview", label: "Profile Overview", icon: User },
              {
                id: "assignments",
                label: "Assigned Records",
                count: totalAssignedActivities,
                icon: Layers,
              },
              { id: "permissions", label: "RBAC Permissions", icon: ShieldCheck },
              {
                id: "audit",
                label: "Audit History",
                count: staff.auditHistory?.length || 0,
                icon: History,
              },
            ].map((t) => {
              const TabIcon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? "border-[#38B2AC] text-white"
                      : "border-transparent text-slate-300 hover:text-white"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-700">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employment Info */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#078783]" />
                    Employment & Governance
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">System Role:</span>
                      <span className="font-bold text-slate-800">{staff.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Employment Type:</span>
                      <span className="font-semibold text-slate-800">{staff.employmentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Reporting Manager:</span>
                      <span className="font-semibold text-slate-800">{staff.reportingManager}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date of Joining:</span>
                      <span className="font-semibold text-slate-800">{staff.joiningDate}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-rose-600" />
                    Verified Emergency Contact
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Contact Person: </span>
                      <span className="font-bold text-slate-800">
                        {staff.emergencyContact?.name} ({staff.emergencyContact?.relation})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Emergency Phone: </span>
                      <span className="font-mono font-bold text-slate-800">
                        {staff.emergencyContact?.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address & Bio */}
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Residential Address
                  </span>
                  <div className="text-xs font-medium text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    {staff.address}
                  </div>
                </div>

                {staff.notes && (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Professional Bio & Credentials
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">{staff.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNED RECORDS ACROSS MODULES */}
          {activeTab === "assignments" && (
            <div className="space-y-4">
              {isLoadingActivity ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#078783]" />
                  Loading assigned records from CRM databases...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Leads & Enquiries */}
                  {activity.leads.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#078783]" />
                        Assigned Leads ({activity.leads.length})
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#F9FBFA] text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Lead ID & Name</th>
                              <th className="py-2 px-3">Interested Course</th>
                              <th className="py-2 px-2 text-center">Status</th>
                              <th className="py-2 px-3 text-right">Contact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activity.leads.slice(0, 5).map((l: any) => (
                              <tr key={l.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {l.fullName} <span className="text-slate-400 font-mono">({l.id})</span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{l.course}</td>
                                <td className="py-2 px-2 text-center">
                                  <Badge className="text-[10px] bg-teal-50 text-teal-800 border-teal-200">
                                    {l.status}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">
                                  {l.phone}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. Counselling Sessions */}
                  {activity.counsellingSessions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-[#078783]" />
                        Assigned Counselling Appointments ({activity.counsellingSessions.length})
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#F9FBFA] text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Session & Candidate</th>
                              <th className="py-2 px-3">Date & Time</th>
                              <th className="py-2 px-2 text-center">Type</th>
                              <th className="py-2 px-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activity.counsellingSessions.slice(0, 5).map((cs: any) => (
                              <tr key={cs.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {cs.personName} <span className="text-slate-400">({cs.id})</span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">
                                  {cs.counsellingDate} at {cs.startTime}
                                </td>
                                <td className="py-2 px-2 text-center text-slate-700">{cs.sessionType}</td>
                                <td className="py-2 px-2 text-center">
                                  <Badge
                                    className={`text-[10px] ${
                                      cs.status === "Completed"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {cs.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3. Batches Instructed */}
                  {activity.batches.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#078783]" />
                        Instructed Batches ({activity.batches.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activity.batches.map((b: any) => (
                          <div
                            key={b.id || b.batchCode}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                          >
                            <div className="font-bold text-slate-900 flex items-center justify-between">
                              <span>{b.batchName}</span>
                              <Badge className="bg-teal-50 text-teal-800 text-[10px]">
                                {b.status}
                              </Badge>
                            </div>
                            <div className="text-slate-600">{b.courseName}</div>
                            <div className="text-[11px] text-slate-500">
                              Schedule: {b.classTimings} ({b.classDays}) · Enrolled: {b.studentCount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalAssignedActivities === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No active module records currently assigned to this staff member.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERMISSIONS */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Configured Module Privileges
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Active permissions verified across system routes
                  </p>
                </div>
                {onEditPermissions && (
                  <Button
                    type="button"
                    onClick={() => onEditPermissions(staff)}
                    className="bg-[#078783] text-white text-xs h-7 px-3 rounded-lg"
                  >
                    Edit Matrix
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {crmModules.map((m) => {
                  const p = staff.permissions?.[m] || {
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                    export: false,
                  };
                  return (
                    <div
                      key={m}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800 capitalize">
                        {m.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className={p.view ? "text-emerald-700 font-bold" : "text-slate-300"}>
                          V
                        </span>
                        <span className={p.create ? "text-emerald-700 font-bold" : "text-slate-300"}>
                          C
                        </span>
                        <span className={p.edit ? "text-emerald-700 font-bold" : "text-slate-300"}>
                          E
                        </span>
                        <span className={p.delete ? "text-rose-600 font-bold" : "text-slate-300"}>
                          D
                        </span>
                        <span className={p.export ? "text-teal-700 font-bold" : "text-slate-300"}>
                          X
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY */}
          {activeTab === "audit" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Staff Governance Audit Log
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {(staff.auditHistory || []).map((log, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          by {log.changedBy}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
