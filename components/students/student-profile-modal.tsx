"use client";

import React, { useState, useEffect } from "react";
import { StudentRecord, StudentStatus, studentStatusEnum } from "@/lib/validations/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  DollarSign,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  FileText,
  ExternalLink,
  Edit,
  GraduationCap,
  Users,
  ShieldCheck,
  Check,
} from "lucide-react";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
  onEdit: (student: StudentRecord) => void;
  onStatusChange: (id: string, newStatus: StudentStatus) => Promise<void>;
}

type TabKey = "overview" | "academics" | "payments" | "attendance" | "history";

export function StudentProfileModal({
  isOpen,
  onClose,
  student,
  onEdit,
  onStatusChange,
}: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch linked follow-ups for this student
  useEffect(() => {
    if (student && isOpen) {
      setLoadingHistory(true);
      fetch(`/api/follow-ups?search=${encodeURIComponent(student.fullName)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setFollowUps(data.data);
          }
        })
        .catch((e) => console.error("Error fetching student follow-ups:", e))
        .finally(() => setLoadingHistory(false));
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleStatusSelect = async (newStatus: StudentStatus) => {
    if (newStatus === student.status) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(student.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadgeVariant = (st: StudentStatus) => {
    switch (st) {
      case "Active":
        return "active";
      case "Completed":
        return "completed";
      case "Inactive":
        return "inactive";
      case "Dropped":
        return "dropped";
      default:
        return "default";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E2ECEB] bg-[#FAFCFB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Student Avatar */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
              style={{ backgroundColor: student.avatarColor || "#078783" }}
            >
              {getInitials(student.fullName)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#11232B]">{student.fullName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-medium border border-[#E2ECEB]">
                  {student.studentCode}
                </span>
                <Badge variant={getStatusBadgeVariant(student.status)} className="capitalize">
                  {student.status}
                </Badge>
              </div>
              <p className="text-xs text-[#5A7178] mt-0.5">
                {student.course} · {student.batchName}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Quick Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F3F8F7] px-2.5 py-1 rounded-lg border border-[#D5E2E0]">
              <span className="text-[11px] font-medium text-[#5A7178]">Status:</span>
              <select
                disabled={isUpdatingStatus}
                value={student.status}
                onChange={(e) => handleStatusSelect(e.target.value as StudentStatus)}
                className="bg-transparent text-xs font-semibold text-[#11232B] focus:outline-none cursor-pointer"
              >
                {studentStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="h-8 text-xs gap-1.5"
            >
              <Edit className="w-3.5 h-3.5 text-[#078783]" />
              Edit
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#7B939B] hover:text-[#11232B] hover:bg-[#F3F8F7] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-5 border-b border-[#E2ECEB] bg-white gap-2 sm:gap-6 overflow-x-auto scrollbar-none text-xs font-medium text-[#5A7178]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#078783] text-[#078783] font-semibold"
                : "border-transparent hover:text-[#11232B]"
            }`}
          >
            Personal & Guardian
          </button>
          <button
            onClick={() => setActiveTab("academics")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "academics"
                ? "border-[#078783] text-[#078783] font-semibold"
                : "border-transparent hover:text-[#11232B]"
            }`}
          >
            Course & Batch
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "payments"
                ? "border-[#078783] text-[#078783] font-semibold"
                : "border-transparent hover:text-[#11232B]"
            }`}
          >
            Payment History ({student.payments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "attendance"
                ? "border-[#078783] text-[#078783] font-semibold"
                : "border-transparent hover:text-[#11232B]"
            }`}
          >
            Attendance ({student.attendancePercentage}%)
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "history"
                ? "border-[#078783] text-[#078783] font-semibold"
                : "border-transparent hover:text-[#11232B]"
            }`}
          >
            CRM History & Follow-ups
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#F9FBFA]">
          {/* TAB 1: OVERVIEW & GUARDIAN */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Contact shortcuts banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={`tel:${student.phoneNumber}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E2ECEB] hover:border-[#078783] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#E6F5F4] text-[#078783] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#7B939B]">Student Contact</div>
                    <div className="text-xs font-semibold text-[#11232B] truncate">
                      {student.phoneNumber}
                    </div>
                  </div>
                </a>

                <a
                  href={`mailto:${student.email}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E2ECEB] hover:border-[#078783] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#7B939B]">Email Address</div>
                    <div className="text-xs font-semibold text-[#11232B] truncate">
                      {student.email}
                    </div>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${student.phoneNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E2ECEB] hover:border-[#16A34A] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#7B939B]">WhatsApp Chat</div>
                    <div className="text-xs font-semibold text-[#16A34A] truncate">
                      Send Instant Message
                    </div>
                  </div>
                </a>
              </div>

              {/* Personal Details Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2ECEB] space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#078783]" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.dateOfBirth}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Gender</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.gender}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Admission Date</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.admissionDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Batch Joining Date</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.joiningDate}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9]">
                  <span className="text-[#7B939B] block text-[11px] mb-1">Residential Address</span>
                  <div className="flex items-start gap-1.5 text-xs text-[#11232B] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#078783] shrink-0 mt-0.5" />
                    <span>{student.address}</span>
                  </div>
                </div>
              </div>

              {/* Parent / Guardian Details Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2ECEB] space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#078783]" />
                  Parent / Guardian Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Guardian Name</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.guardianName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Relationship</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.guardianRelation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Guardian Phone</span>
                    <a
                      href={`tel:${student.guardianPhone}`}
                      className="font-semibold text-[#078783] hover:underline mt-0.5 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {student.guardianPhone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {student.notes && (
                <div className="bg-white p-4 rounded-xl border border-[#E2ECEB] space-y-2 shadow-sm">
                  <span className="text-[11px] font-bold text-[#5A7178] uppercase tracking-wider">
                    Counsellor & Academic Notes
                  </span>
                  <p className="text-xs text-[#11232B] whitespace-pre-line leading-relaxed">
                    {student.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACADEMICS & BATCH */}
          {activeTab === "academics" && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-[#E2ECEB] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#11232B]">{student.course}</h3>
                    <p className="text-xs text-[#5A7178]">{student.batchName}</p>
                  </div>
                  <Badge variant="active" className="text-xs">
                    Batch Code: {student.batchCode}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Curriculum Duration</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">14 Weeks</span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Batch Status</span>
                    <span className="font-semibold text-emerald-700 mt-0.5 block">In Progress</span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Admission Date</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.admissionDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7B939B] block text-[11px]">Joining Date</span>
                    <span className="font-semibold text-[#11232B] mt-0.5 block">
                      {student.joiningDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capstone & Placement Readiness */}
              <div className="bg-white p-5 rounded-xl border border-[#E2ECEB] shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider">
                  Placement & Capstone Progress
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-[#11232B]">
                    <span>Curriculum Completion</span>
                    <span>72%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E2ECEB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#078783] rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>
                <p className="text-[11px] text-[#5A7178]">
                  Student is eligible for mock interviews and portfolio review upon reaching 85% attendance and capstone submission.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === "payments" && (
            <div className="space-y-5">
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
                  <div className="text-[11px] font-medium text-[#7B939B]">Total Course Fee</div>
                  <div className="text-base sm:text-lg font-bold text-[#11232B] mt-0.5">
                    ₹{student.totalFee.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-sm">
                  <div className="text-[11px] font-medium text-emerald-800">Total Amount Paid</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5">
                    ₹{student.paidAmount.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 shadow-sm">
                  <div className="text-[11px] font-medium text-amber-800">Pending Balance</div>
                  <div className="text-base sm:text-lg font-bold text-amber-700 mt-0.5">
                    ₹{student.pendingAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Payment Transactions Table */}
              <div className="bg-white rounded-xl border border-[#E2ECEB] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#E2ECEB] bg-[#FAFCFB] flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider">
                    Payment Receipts & Invoices
                  </h4>
                  <Badge variant={student.paymentStatus === "Paid" ? "paid" : "partial"}>
                    Status: {student.paymentStatus}
                  </Badge>
                </div>

                {student.payments && student.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFCFB] text-[#7B939B] border-b border-[#E2ECEB]">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Receipt No</th>
                          <th className="py-2.5 px-4 font-semibold">Date</th>
                          <th className="py-2.5 px-4 font-semibold">Method</th>
                          <th className="py-2.5 px-4 font-semibold">Amount</th>
                          <th className="py-2.5 px-4 font-semibold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2ECEB]">
                        {student.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F9FBFA]">
                            <td className="py-2.5 px-4 font-mono font-medium text-[#11232B]">
                              {p.receiptNo}
                            </td>
                            <td className="py-2.5 px-4 text-[#5A7178]">{p.date}</td>
                            <td className="py-2.5 px-4 text-[#11232B]">{p.paymentMethod}</td>
                            <td className="py-2.5 px-4 font-bold text-emerald-700">
                              ₹{p.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-4 text-[#5A7178]">{p.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#7B939B]">
                    No payment transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-xl border border-[#E2ECEB] shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E6F5F4] text-[#078783] flex items-center justify-center font-bold text-base shrink-0">
                    {student.attendancePercentage}%
                  </div>
                  <div>
                    <div className="text-[11px] text-[#7B939B]">Overall Attendance</div>
                    <div className="text-xs font-bold text-[#11232B] mt-0.5">
                      {student.attendancePercentage >= 85
                        ? "Excellent (On Track)"
                        : student.attendancePercentage >= 70
                        ? "Satisfactory"
                        : "Critical Attention"}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2ECEB] shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[#7B939B]">Total Classes Conducted</div>
                    <div className="text-lg font-bold text-[#11232B] mt-0.5">
                      {student.totalClasses} Sessions
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2ECEB] shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[#7B939B]">Classes Attended</div>
                    <div className="text-lg font-bold text-emerald-700 mt-0.5">
                      {student.attendedClasses} Sessions
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white rounded-xl border border-[#E2ECEB] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#E2ECEB] bg-[#FAFCFB]">
                  <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider">
                    Recent Classroom Attendance Log
                  </h4>
                </div>

                {student.recentAttendance && student.recentAttendance.length > 0 ? (
                  <div className="divide-y divide-[#E2ECEB]">
                    {student.recentAttendance.map((att) => (
                      <div
                        key={att.id}
                        className="p-3.5 flex items-center justify-between hover:bg-[#F9FBFA] transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-[#11232B]">
                            {att.sessionTitle}
                          </div>
                          <div className="text-[11px] text-[#7B939B]">{att.date}</div>
                        </div>
                        <Badge
                          variant={
                            att.status === "Present"
                              ? "completed"
                              : att.status === "Late"
                              ? "pending"
                              : "missed"
                          }
                        >
                          {att.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#7B939B]">
                    Attendance logs will update as live class sessions are conducted.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY & FOLLOW-UPS */}
          {activeTab === "history" && (
            <div className="space-y-5">
              {/* Linked Lead / Enquiry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-[#E2ECEB] shadow-sm space-y-1.5">
                  <span className="text-[11px] text-[#7B939B] block font-medium">
                    Originating Lead
                  </span>
                  {student.linkedLeadCode ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#078783]">
                        {student.linkedLeadCode}
                      </span>
                      <span className="text-xs text-[#5A7178]">— Converted to Student</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#7B939B]">Direct walk-in / admission</span>
                  )}
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2ECEB] shadow-sm space-y-1.5">
                  <span className="text-[11px] text-[#7B939B] block font-medium">
                    Originating Enquiry
                  </span>
                  {student.linkedEnquiryCode ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#2563EB]">
                        {student.linkedEnquiryCode}
                      </span>
                      <span className="text-xs text-[#5A7178]">— Converted Enquiry</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#7B939B]">No connected prior enquiry</span>
                  )}
                </div>
              </div>

              {/* Follow-up Timeline */}
              <div className="bg-white p-5 rounded-xl border border-[#E2ECEB] shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#078783]" />
                  Follow-up & Counselling History
                </h4>

                {loadingHistory ? (
                  <div className="p-4 text-center text-xs text-[#7B939B]">
                    Loading follow-up records...
                  </div>
                ) : followUps.length > 0 ? (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E2ECEB]">
                    {followUps.map((f) => (
                      <div key={f.id} className="relative flex items-start gap-3 pl-1">
                        <div className="w-5 h-5 rounded-full bg-[#078783] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 z-10">
                          <Check className="w-3 h-3" />
                        </div>
                        <div className="bg-[#F8FBFA] p-3 rounded-xl border border-[#E2ECEB] flex-1 text-xs space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="font-bold text-[#11232B]">
                              {f.type} · {f.followUpCode}
                            </span>
                            <Badge variant={f.status === "Completed" ? "completed" : "pending"}>
                              {f.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-[#5A7178]">
                            Date: {f.followUpDate} at {f.followUpTime} · Counsellor:{" "}
                            {f.assignedCounsellor}
                          </div>
                          {f.notes && (
                            <p className="text-[11px] text-[#11232B] pt-1">{f.notes}</p>
                          )}
                          {f.completionNotes && (
                            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 mt-1">
                              <strong>Completion Note:</strong> {f.completionNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-[#7B939B]">
                    No past follow-ups logged for this student.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
