"use client";

import React, { useState } from "react";
import {
  EnquiryRecord,
  InteractionType,
  interactionTypeEnum,
} from "@/lib/validations/enquiry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  UserCheck,
  Tag,
  Clock,
  Edit2,
  Trash2,
  UserPlus,
  MessageSquare,
  FileText,
  PhoneCall,
  HeartHandshake,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface EnquiryDetailModalProps {
  enquiry: EnquiryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (enquiry: EnquiryRecord) => void;
  onDelete: (enquiry: EnquiryRecord) => void;
  onUpdated: (enquiry: EnquiryRecord) => void;
}

export function EnquiryDetailModal({
  enquiry,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdated,
}: EnquiryDetailModalProps) {
  // New interaction form state
  const [interactionType, setInteractionType] = useState<InteractionType>("Phone Call");
  const [interactionSummary, setInteractionSummary] = useState("");
  const [interactionStaff, setInteractionStaff] = useState("");
  const [isLoggingInteraction, setIsLoggingInteraction] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccessMessage, setConversionSuccessMessage] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Reassign state
  const [isReassigning, setIsReassigning] = useState(false);

  if (!isOpen || !enquiry) return null;

  const getStatusBadgeVariant = (status: EnquiryRecord["status"]) => {
    switch (status) {
      case "New":
        return "new";
      case "Pending":
        return "pending";
      case "In Progress":
        return "inprogress";
      case "Responded":
        return "responded";
      case "Converted":
        return "converted";
      case "Closed":
        return "closed";
      default:
        return "default";
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "Phone Call":
        return <PhoneCall className="w-3.5 h-3.5 text-blue-600" />;
      case "WhatsApp":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case "Email":
        return <Mail className="w-3.5 h-3.5 text-purple-600" />;
      case "Counselling":
        return <HeartHandshake className="w-3.5 h-3.5 text-[#078783]" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  // Log new interaction
  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionSummary.trim()) {
      setInteractionError("Please write a summary of the interaction");
      return;
    }

    setIsLoggingInteraction(true);
    setInteractionError(null);

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: interactionType,
          staffName: interactionStaff || enquiry.assignedCounsellor,
          summary: interactionSummary.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to log interaction");
      }

      onUpdated(result.data);
      setInteractionSummary("");
    } catch (err: any) {
      setInteractionError(err.message || "Failed to log interaction");
    } finally {
      setIsLoggingInteraction(false);
    }
  };

  // Reassign counsellor
  const handleReassign = async (newCounsellor: string) => {
    if (newCounsellor === enquiry.assignedCounsellor) return;
    setIsReassigning(true);

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...enquiry,
          assignedCounsellor: newCounsellor,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        onUpdated(result.data);
      }
    } catch (err) {
      console.error("Reassign error:", err);
    } finally {
      setIsReassigning(false);
    }
  };

  // Convert Enquiry to Lead
  const handleConvertToLead = async () => {
    if (enquiry.convertedToLeadId) return;

    setIsConverting(true);
    setConversionError(null);
    setConversionSuccessMessage(null);

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}/convert`, {
        method: "POST",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to convert enquiry to lead");
      }

      onUpdated(result.data.enquiry);
      setConversionSuccessMessage(
        `Successfully converted to Lead record: ${result.data.lead.leadCode}`
      );
    } catch (err: any) {
      setConversionError(err.message || "Failed to convert to lead");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2ECEB] flex items-center justify-between bg-[#FAFCFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] text-[#078783] flex items-center justify-center font-bold text-sm">
              {enquiry.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#11232B]">
                  {enquiry.studentName}
                </h2>
                <Badge variant={getStatusBadgeVariant(enquiry.status)}>
                  {enquiry.status}
                </Badge>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F3F8F7] text-[#5A7178] border border-[#E2ECEB]">
                  via {enquiry.enquirySource}
                </span>
              </div>
              <p className="text-xs text-[#5A7178] font-mono font-medium">
                {enquiry.enquiryCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A9EA5] hover:text-[#11232B] hover:bg-[#F3F8F7] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Conversion Action Banner */}
        <div className="px-5 py-3 bg-[#F8FBFA] border-b border-[#E2ECEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {enquiry.convertedToLeadId ? (
            <div className="flex items-center gap-2 text-xs text-[#059669]">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>
                Converted into Lead:{" "}
                <Link
                  href="/leads"
                  className="font-bold underline text-[#078783] hover:text-[#056E6B]"
                >
                  {enquiry.convertedLeadCode || enquiry.convertedToLeadId}
                </Link>{" "}
                ({new Date(enquiry.convertedAt || "").toLocaleDateString()})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#5A7178]">
              <UserPlus className="w-4 h-4 text-[#078783]" />
              <span>Interested student? Convert directly into Leads Management pipeline.</span>
            </div>
          )}

          {!enquiry.convertedToLeadId ? (
            <Button
              onClick={handleConvertToLead}
              disabled={isConverting}
              size="sm"
              className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5 text-xs shadow-xs"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Convert to Lead</span>
                </>
              )}
            </Button>
          ) : (
            <Link href="/leads">
              <Button size="sm" variant="outline" className="text-xs gap-1">
                <span>View in Leads</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>

        {conversionSuccessMessage && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs">
            {conversionSuccessMessage}
          </div>
        )}

        {conversionError && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs">
            {conversionError}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Contact & Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`tel:${enquiry.phoneNumber}`}
              className="p-3 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] hover:border-[#078783] transition-colors flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#078783] shadow-xs">
                <Phone className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-[#5A7178] uppercase font-semibold">Phone</div>
                <div className="text-xs font-semibold text-[#11232B] truncate group-hover:text-[#078783]">
                  {enquiry.phoneNumber}
                </div>
              </div>
            </a>

            {enquiry.email ? (
              <a
                href={`mailto:${enquiry.email}`}
                className="p-3 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] hover:border-[#078783] transition-colors flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#078783] shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-[#5A7178] uppercase font-semibold">Email</div>
                  <div className="text-xs font-semibold text-[#11232B] truncate group-hover:text-[#078783]">
                    {enquiry.email}
                  </div>
                </div>
              </a>
            ) : (
              <div className="p-3 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#8A9EA5]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#5A7178] uppercase font-semibold">Email</div>
                  <div className="text-xs text-[#8A9EA5]">No email provided</div>
                </div>
              </div>
            )}
          </div>

          {/* Details Overview Box */}
          <div className="bg-[#FAFCFB] rounded-xl border border-[#E2ECEB] p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Interested Course</span>
                  <span className="font-semibold text-[#11232B]">
                    {enquiry.interestedCourse}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Enquiry Date</span>
                  <span className="font-semibold text-[#11232B]">{enquiry.enquiryDate}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2ECEB] pt-3 grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Next Follow-up</span>
                  <span className="font-semibold text-[#11232B]">
                    {enquiry.nextFollowUpDate}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div className="w-full">
                  <span className="text-[#5A7178] text-[11px] block mb-0.5">
                    Assigned Counsellor
                  </span>
                  <input
                    type="text"
                    defaultValue={enquiry.assignedCounsellor}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val && val !== enquiry.assignedCounsellor) {
                        handleReassign(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && val !== enquiry.assignedCounsellor) {
                          handleReassign(val);
                        }
                      }
                    }}
                    disabled={isReassigning}
                    className="w-full bg-white border border-[#E2ECEB] rounded px-2 py-1 text-xs font-semibold text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                    placeholder="e.g. Mithun K"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enquiry Message / Inquiry Text */}
          <div>
            <h3 className="text-xs font-semibold text-[#11232B] mb-1.5">Student Inquiry</h3>
            <div className="p-3 bg-white rounded-xl border border-[#E2ECEB] text-xs text-[#3E555C] leading-relaxed">
              &ldquo;{enquiry.enquiryMessage}&rdquo;
            </div>
          </div>

          {/* Communication History Section */}
          <div className="space-y-3 pt-2 border-t border-[#E2ECEB]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#078783]" />
                <span>Communication History ({enquiry.interactions.length})</span>
              </h3>
            </div>

            {/* Quick Log Interaction Box */}
            <form
              onSubmit={handleAddInteraction}
              className="p-3 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] space-y-2 text-xs"
            >
              <div className="text-[11px] font-semibold text-[#11232B]">
                Record Communication / Discussion
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value as InteractionType)}
                  className="px-2.5 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                >
                  {interactionTypeEnum.options.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder={`Staff Name (e.g. ${enquiry.assignedCounsellor || "Mithun K"})`}
                  value={interactionStaff}
                  onChange={(e) => setInteractionStaff(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <textarea
                rows={2}
                value={interactionSummary}
                onChange={(e) => setInteractionSummary(e.target.value)}
                placeholder="Log call outcome, WhatsApp discussion, or counselling notes..."
                className="w-full px-3 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] resize-none"
              />

              {interactionError && (
                <p className="text-[11px] text-red-500">{interactionError}</p>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoggingInteraction}
                  className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5 text-xs h-7 px-3"
                >
                  {isLoggingInteraction ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Log Note</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Timeline of interactions */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {enquiry.interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="p-3 bg-white rounded-lg border border-[#E2ECEB] text-xs space-y-1 hover:border-[#078783]/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#11232B]">
                      <span className="p-1 rounded bg-[#F3F8F7]">
                        {getInteractionIcon(interaction.type)}
                      </span>
                      <span>{interaction.type}</span>
                      <span className="text-[#8A9EA5] font-normal">· by {interaction.staffName}</span>
                    </div>
                    <span className="text-[#8A9EA5]">
                      {new Date(interaction.date).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[#3E555C] pl-6 text-xs leading-relaxed">
                    {interaction.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2ECEB] bg-[#FAFCFB] flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onClose();
              onDelete(enquiry);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose();
                onEdit(enquiry);
              }}
              className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
