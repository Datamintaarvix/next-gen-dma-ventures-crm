"use client";

import React, { useState } from "react";
import {
  AdmissionRecord,
  AdmissionStatus,
  admissionStatusEnum,
} from "@/lib/validations/admission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  FileCheck2,
  User,
  Phone,
  Mail,
  BookOpen,
  Layers,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  FileText,
  Edit,
  ShieldCheck,
  Loader2,
  Receipt,
  Check,
} from "lucide-react";

interface AdmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionRecord | null;
  onEdit: (admission: AdmissionRecord) => void;
  onOpenRecordPayment: (admission: AdmissionRecord) => void;
  onStatusChange: (id: string, newStatus: AdmissionStatus, remarks?: string) => Promise<void>;
  onRefresh: () => void;
}

export function AdmissionDetailsModal({
  isOpen,
  onClose,
  admission,
  onEdit,
  onOpenRecordPayment,
  onStatusChange,
  onRefresh,
}: AdmissionDetailsModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AdmissionStatus | null>(null);
  const [statusRemarks, setStatusRemarks] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "documents" | "timeline">("overview");

  if (!isOpen || !admission) return null;

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(admission.id, selectedStatus, statusRemarks);
      setSelectedStatus(null);
      setStatusRemarks("");
      onRefresh();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: AdmissionStatus) => {
    switch (status) {
      case "Enrolled":
        return <Badge variant="converted">Enrolled</Badge>;
      case "Approved":
        return <Badge variant="active">Approved</Badge>;
      case "Application Received":
        return <Badge variant="received">Application Received</Badge>;
      case "Documents Pending":
        return <Badge variant="duesoon">Documents Pending</Badge>;
      case "Under Review":
        return <Badge variant="inprogress">Under Review</Badge>;
      case "Rejected":
        return <Badge variant="lost">Rejected</Badge>;
      case "Cancelled":
        return <Badge variant="cancelled">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "Paid":
        return <Badge variant="converted">Paid</Badge>;
      case "Partial":
        return <Badge variant="duesoon">Partial</Badge>;
      case "Pending":
        return <Badge variant="missed">Pending</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const paidPct = admission.finalFee > 0 ? Math.round((admission.paidAmount / admission.finalFee) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden my-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-[#E2ECEB] bg-[#F8FBFA] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] flex items-center justify-center text-[#078783] shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-[#EAEAEA] text-[#333] px-2 py-0.5 rounded">
                  {admission.admissionCode}
                </span>
                <h2 className="text-base font-bold text-[#11232B]">{admission.studentName}</h2>
                {getStatusBadge(admission.status)}
                {getPaymentBadge(admission.paymentStatus)}
              </div>
              <p className="text-xs text-[#5A7178] mt-0.5">
                {admission.courseName} · {admission.batchName} ({admission.batchCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(admission)}
              className="h-8 text-xs text-[#11232B] border-[#E2ECEB]"
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenRecordPayment(admission)}
              disabled={admission.pendingAmount <= 0}
              className="h-8 text-xs bg-[#078783] hover:bg-[#066e6b] text-white disabled:opacity-40"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Record Payment
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#EAEAEA] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2ECEB] px-6 bg-white gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-[#078783] text-[#078783] font-bold"
                : "border-transparent text-[#5A7178] hover:text-[#11232B]"
            }`}
          >
            Overview & Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("financials")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "financials"
                ? "border-[#078783] text-[#078783] font-bold"
                : "border-transparent text-[#5A7178] hover:text-[#11232B]"
            }`}
          >
            Financials & Payments
            <span className="text-[10px] px-1.5 py-0.2 bg-[#F0F5F4] text-[#078783] rounded-full">
              ₹{admission.paidAmount.toLocaleString("en-IN")} / ₹{admission.finalFee.toLocaleString("en-IN")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "documents"
                ? "border-[#078783] text-[#078783] font-bold"
                : "border-transparent text-[#5A7178] hover:text-[#11232B]"
            }`}
          >
            Documents Verification
            <span className="text-[10px] px-1.5 py-0.2 bg-[#F0F5F4] text-[#078783] rounded-full">
              {(admission.documents || []).filter((d) => d.verified).length}/{(admission.documents || []).length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "timeline"
                ? "border-[#078783] text-[#078783] font-bold"
                : "border-transparent text-[#5A7178] hover:text-[#11232B]"
            }`}
          >
            Activity Timeline
            <span className="text-[10px] px-1.5 py-0.2 bg-[#F0F5F4] text-[#078783] rounded-full">
              {(admission.timeline || []).length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Info Card */}
                <div className="p-4 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA] space-y-3">
                  <div className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#078783]" />
                    Student Profile
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Full Name:</span>
                      <span className="font-semibold text-[#11232B]">{admission.studentName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Student ID:</span>
                      <span className="font-mono text-[#078783] font-bold">{admission.studentCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Phone Number:</span>
                      <a href={`tel:${admission.studentPhone}`} className="text-[#11232B] hover:text-[#078783] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#078783]" />
                        {admission.studentPhone}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Email:</span>
                      <a href={`mailto:${admission.studentEmail}`} className="text-[#11232B] hover:text-[#078783] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#078783]" />
                        {admission.studentEmail}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Academic Assignment Card */}
                <div className="p-4 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA] space-y-3">
                  <div className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#078783]" />
                    Academic Cohort
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Course:</span>
                      <span className="font-semibold text-[#11232B]">{admission.courseName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Assigned Batch:</span>
                      <span className="font-mono text-[#11232B] font-semibold">{admission.batchName} ({admission.batchCode})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Admission Date:</span>
                      <span className="text-[#11232B]">
                        {new Date(admission.admissionDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A7178]">Assigned Counsellor:</span>
                      <span className="text-[#11232B] font-medium">{admission.counsellor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Strip */}
              <div className="p-4 rounded-xl border border-[#E2ECEB] bg-white space-y-3">
                <div className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#078783]" />
                  Update Workflow Status
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select
                    value={selectedStatus || admission.status}
                    onChange={(e) => setSelectedStatus(e.target.value as AdmissionStatus)}
                    className="text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                  >
                    {admissionStatusEnum.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Status update remark or approval notes..."
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                    className="flex-1 text-xs bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus || !selectedStatus || selectedStatus === admission.status}
                    className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white shrink-0"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Apply Status"
                    )}
                  </Button>
                </div>
              </div>

              {/* Notes */}
              {admission.notes && (
                <div className="p-4 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA]">
                  <div className="text-xs font-bold text-[#11232B] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#078783]" />
                    Counselor Notes
                  </div>
                  <p className="text-xs text-[#5A7178] leading-relaxed">{admission.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINANCIALS */}
          {activeTab === "financials" && (
            <div className="space-y-6">
              {/* Fee Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA]">
                  <div className="text-[11px] text-[#5A7178]">Base Course Fee</div>
                  <div className="text-lg font-bold font-mono text-[#11232B] mt-0.5">
                    ₹{admission.totalFee.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA]">
                  <div className="text-[11px] text-[#5A7178]">Scholarship / Discount</div>
                  <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                    -₹{admission.discountAmount.toLocaleString("en-IN")}
                  </div>
                  {admission.discountReason && (
                    <div className="text-[10px] text-[#5A7178] truncate mt-0.5" title={admission.discountReason}>
                      {admission.discountReason}
                    </div>
                  )}
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2ECEB] bg-[#E6F5F4]">
                  <div className="text-[11px] text-[#078783] font-medium">Final Payable Fee</div>
                  <div className="text-lg font-bold font-mono text-[#078783] mt-0.5">
                    ₹{admission.finalFee.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA]">
                  <div className="text-[11px] text-[#5A7178]">Pending Balance</div>
                  <div className="text-lg font-bold font-mono text-amber-600 mt-0.5">
                    ₹{admission.pendingAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Payment Progress */}
              <div className="p-4 rounded-xl border border-[#E2ECEB] bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#11232B]">
                    Payment Progress: ₹{admission.paidAmount.toLocaleString("en-IN")} of ₹{admission.finalFee.toLocaleString("en-IN")}
                  </span>
                  <span className="font-bold text-[#078783]">{paidPct}% Cleared</span>
                </div>
                <div className="w-full bg-[#E8EFEF] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      paidPct >= 100 ? "bg-emerald-500" : "bg-[#078783]"
                    }`}
                    style={{ width: `${Math.min(paidPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Transactions History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#078783]" />
                    Receipts & Payment History
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => onOpenRecordPayment(admission)}
                    disabled={admission.pendingAmount <= 0}
                    className="h-7 text-xs bg-[#078783] hover:bg-[#066e6b] text-white disabled:opacity-40"
                  >
                    + Record Installment
                  </Button>
                </div>

                {(admission.paymentHistory || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5A7178] bg-[#F8FBFA] rounded-xl border border-[#E2ECEB]">
                    No payments recorded yet for this admission. Click "Record Installment" above to register an advance or fee payment.
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E2ECEB] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FBFA] border-b border-[#E2ECEB] text-[11px] font-semibold text-[#5A7178]">
                        <tr>
                          <th className="py-2.5 px-3">Receipt No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Transaction Ref</th>
                          <th className="py-2.5 px-3">Remarks</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2ECEB]">
                        {(admission.paymentHistory || []).map((pay) => (
                          <tr key={pay.id} className="hover:bg-[#F3F8F7]/50">
                            <td className="py-2.5 px-3 font-mono font-medium text-[#11232B]">{pay.receiptNo}</td>
                            <td className="py-2.5 px-3 text-[#5A7178]">{pay.date}</td>
                            <td className="py-2.5 px-3 text-[#11232B] font-medium">{pay.paymentMethod}</td>
                            <td className="py-2.5 px-3 font-mono text-[#5A7178]">{pay.transactionRef || "—"}</td>
                            <td className="py-2.5 px-3 text-[#5A7178]">{pay.remarks || "—"}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#078783]">
                              ₹{pay.amount.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#078783]" />
                    Document Checklist & Eligibility Verification
                  </h3>
                  <p className="text-[11px] text-[#5A7178] mt-0.5">
                    Verify compliance documents required before approving admission and issuing institute student credentials
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {(admission.documents || []).map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-3.5 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          doc.verified
                            ? "bg-emerald-100 text-emerald-700"
                            : doc.submitted
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {doc.verified ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#11232B]">{doc.name}</div>
                        {doc.documentNumber && (
                          <div className="text-[10px] font-mono text-[#5A7178] mt-0.5">
                            Doc ID: {doc.documentNumber}
                          </div>
                        )}
                        {doc.notes && (
                          <div className="text-[10px] text-amber-700 mt-0.5">{doc.notes}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.verified ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : doc.submitted ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          Submitted · Needs Verification
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          Pending Submission
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#078783]" />
                Admission Lifecycle Timeline
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2ECEB]">
                {(admission.timeline || []).map((item, idx) => (
                  <div key={item.id || idx} className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#078783] ring-2 ring-[#E6F5F4]" />
                    <div className="p-3.5 rounded-xl border border-[#E2ECEB] bg-[#F8FBFA] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#11232B]">{item.title}</span>
                        <span className="text-[11px] text-[#5A7178]">
                          {new Date(item.date).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A7178]">{item.description}</p>
                      <div className="text-[10px] text-[#8B9E9E] pt-1">
                        Recorded by: <strong className="text-[#11232B]">{item.performedBy}</strong>
                      </div>
                    </div>
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
