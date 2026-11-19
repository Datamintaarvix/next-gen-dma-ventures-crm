"use client";

import React from "react";
import { LeadRecord } from "@/lib/validations/lead";
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
} from "lucide-react";

interface LeadViewModalProps {
  lead: LeadRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
}

export function LeadViewModal({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: LeadViewModalProps) {
  if (!isOpen || !lead) return null;

  const getStatusBadgeVariant = (status: LeadRecord["status"]) => {
    switch (status) {
      case "New":
        return "new";
      case "Contacted":
        return "contacted";
      case "Interested":
        return "interested";
      case "Follow-up":
        return "followup";
      case "Converted":
        return "converted";
      case "Lost":
        return "lost";
      default:
        return "default";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2ECEB] flex items-center justify-between bg-[#FAFCFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] text-[#078783] flex items-center justify-center font-bold text-sm">
              {lead.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#11232B]">{lead.studentName}</h2>
                <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
              </div>
              <p className="text-xs text-[#5A7178] font-mono font-medium">{lead.leadCode}</p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`tel:${lead.phoneNumber}`}
              className="p-3 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] hover:border-[#078783] transition-colors flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#078783] shadow-xs">
                <Phone className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-[#5A7178] uppercase font-semibold">Phone</div>
                <div className="text-xs font-semibold text-[#11232B] truncate group-hover:text-[#078783]">
                  {lead.phoneNumber}
                </div>
              </div>
            </a>

            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="p-3 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] hover:border-[#078783] transition-colors flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#078783] shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-[#5A7178] uppercase font-semibold">Email</div>
                  <div className="text-xs font-semibold text-[#11232B] truncate group-hover:text-[#078783]">
                    {lead.email}
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

          {/* Details Grid */}
          <div className="bg-[#FAFCFB] rounded-xl border border-[#E2ECEB] p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Interested Course</span>
                  <span className="font-semibold text-[#11232B]">{lead.interestedCourse}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Enquiry Source</span>
                  <span className="font-semibold text-[#11232B]">{lead.leadSource}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2ECEB] pt-3 grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Assigned Staff</span>
                  <span className="font-semibold text-[#11232B]">{lead.assignedCounselor}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Follow-up Date</span>
                  <span className="font-semibold text-[#11232B]">{lead.followUpDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <h3 className="text-xs font-semibold text-[#11232B] mb-1.5 flex items-center gap-1.5">
              <span>Counselor Notes</span>
            </h3>
            <div className="p-3 bg-white rounded-xl border border-[#E2ECEB] text-xs text-[#3E555C] leading-relaxed">
              {lead.notes || <span className="italic text-[#8A9EA5]">No notes recorded yet.</span>}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-[#8A9EA5] pt-2 border-t border-[#E2ECEB]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Added {new Date(lead.createdAt).toLocaleDateString()}
            </span>
            <span>Last updated {new Date(lead.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2ECEB] bg-[#FAFCFB] flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onClose();
              onDelete(lead);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Lead</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose();
                onEdit(lead);
              }}
              className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Lead</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
