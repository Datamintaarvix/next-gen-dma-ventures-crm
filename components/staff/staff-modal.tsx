"use client";

import React, { useState, useEffect } from "react";
import {
  StaffRecord,
  StaffFormData,
  staffRoleEnum,
  staffDepartmentEnum,
  employmentTypeEnum,
  employmentStatusEnum,
  StaffRole,
  StaffDepartment,
  EmploymentType,
  EmploymentStatus,
} from "@/lib/validations/staff";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  Users,
} from "lucide-react";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff: StaffRecord) => void;
  initialData?: StaffRecord | null;
  existingStaffList?: StaffRecord[];
}

export function StaffModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  existingStaffList = [],
}: StaffModalProps) {
  const isEditing = !!initialData;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState("Indiranagar, Bengaluru, Karnataka");
  const [department, setDepartment] = useState<StaffDepartment>("Admissions & Counselling");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState<StaffRole>("Counsellor");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("Full-time");
  const [joiningDate, setJoiningDate] = useState("2026-11-18");
  const [reportingManager, setReportingManager] = useState("Rajesh Khanna");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("Active");

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("Family");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName);
      setEmail(initialData.email);
      setPhoneNumber(initialData.phoneNumber);
      setAvatarUrl(initialData.avatarUrl || "");
      setAddress(initialData.address);
      setDepartment(initialData.department);
      setDesignation(initialData.designation);
      setRole(initialData.role);
      setEmploymentType(initialData.employmentType);
      setJoiningDate(initialData.joiningDate);
      setReportingManager(initialData.reportingManager);
      setEmploymentStatus(initialData.employmentStatus);
      setEmergencyName(initialData.emergencyContact?.name || "");
      setEmergencyRelation(initialData.emergencyContact?.relation || "Family");
      setEmergencyPhone(initialData.emergencyContact?.phone || "");
      setNotes(initialData.notes || "");
    } else {
      setFullName("");
      setEmail("");
      setPhoneNumber("+91 ");
      setAvatarUrl("");
      setAddress("Indiranagar, Bengaluru, Karnataka");
      setDepartment("Admissions & Counselling");
      setDesignation("Admissions Counsellor");
      setRole("Counsellor");
      setEmploymentType("Full-time");
      setJoiningDate(new Date().toISOString().split("T")[0]);
      setReportingManager("Rajesh Khanna");
      setEmploymentStatus("Active");
      setEmergencyName("");
      setEmergencyRelation("Family");
      setEmergencyPhone("");
      setNotes("");
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid official email address.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!designation.trim()) {
      setErrorMsg("Designation is required.");
      return;
    }
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      setErrorMsg("Emergency contact name and phone number are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: StaffFormData = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        address: address.trim(),
        department,
        designation: designation.trim(),
        role,
        employmentType,
        joiningDate,
        reportingManager: reportingManager.trim(),
        employmentStatus,
        emergencyContact: {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
        },
        notes: notes.trim() || undefined,
      };

      const url = isEditing ? `/api/staff/${initialData.id}` : "/api/staff";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save staff record");
      }

      onSuccess(data.staff);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Potential managers list
  const potentialManagers = existingStaffList.filter(
    (s) => s.role === "Super Admin" || s.role === "Admin" || s.role === "Manager" || s.id === "STF-102"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? `Edit Staff Member · ${initialData?.id}` : "Register New Staff Member"}
              </h3>
              <p className="text-xs text-slate-500">
                Institutional profile, role configuration & emergency contact verification
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#078783]" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Nair"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-500" />
                Job Title / Designation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Academic Counsellor"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none transition"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="name@nextgendma.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-500" />
                Mobile Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98801 20002"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none transition"
              />
            </div>
          </div>

          {/* Department, Role & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as StaffDepartment)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#078783] outline-none bg-white font-medium text-xs"
              >
                {staffDepartmentEnum.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#078783]" />
                System Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#078783] outline-none bg-white font-semibold text-xs"
              >
                {staffRoleEnum.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#078783] outline-none bg-white text-xs"
              >
                {employmentTypeEnum.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Joining Date, Reporting Manager & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#078783] outline-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">Reporting Manager</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Khanna"
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#078783] outline-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">Employment Status</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#078783] outline-none bg-white font-medium text-xs"
              >
                {employmentStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Residential Address */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
              <MapPin className="w-4 h-4 text-slate-500" />
              Residential Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 12/B HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none text-xs"
            />
          </div>

          {/* Emergency Contact Block */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              Emergency Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kishore Nair"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#078783]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Father / Spouse"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#078783]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Emergency Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98801 20092"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#078783]"
                />
              </div>
            </div>
          </div>

          {/* Profile Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 text-xs">Staff Bio & Certifications</label>
            <textarea
              rows={2}
              placeholder="e.g. Certified Google Marketing Specialist. 5+ years experience in vocational career counselling."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none resize-none text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 hover:bg-slate-50 text-xs"
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
              ) : isEditing ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Update Profile
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Register Staff
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
