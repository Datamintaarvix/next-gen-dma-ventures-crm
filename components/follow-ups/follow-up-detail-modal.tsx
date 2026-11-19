"use client";

import React from "react";
import { FollowUpRecord } from "@/lib/validations/follow-up";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  UserCheck,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface FollowUpDetailModalProps {
  followUp: FollowUpRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (followUp: FollowUpRecord) => void;
  onDelete: (followUp: FollowUpRecord) => void;
  onOpenComplete: (followUp: FollowUpRecord) => void;
  onOpenReschedule: (followUp: FollowUpRecord) => void;
}

export function FollowUpDetailModal({
  followUp,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onOpenComplete,
  onOpenReschedule,
}: FollowUpDetailModalProps) {
  if (!isOpen || !followUp) return null;

  const getStatusBadgeVariant = (status: FollowUpRecord["status"]) => {
    switch (status) {
      case "Pending":
        return "pending";
      case "Completed":
        return "completed";
      case "Rescheduled":
        return "rescheduled";
      case "Missed":
        return "missed";
      case "Cancelled":
        return "cancelled";
      default:
        return "default";
    }
  };

  const cleanPhone = followUp.contactNumber.replace(/[^0-9]/g, "");

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
              {followUp.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#11232B]">
                  {followUp.studentName}
                </h2>
                <Badge variant={getStatusBadgeVariant(followUp.status)}>
                  {followUp.status}
                </Badge>
                <Badge
                  variant={
                    followUp.priority === "High"
                      ? "high"
                      : followUp.priority === "Medium"
                      ? "medium"
                      : "low"
                  }
                >
                  {followUp.priority} Priority
                </Badge>
              </div>
              <p className="text-xs text-[#5A7178] font-mono font-medium">
                {followUp.followUpCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A9EA5] hover:text-[#11232B] hover:bg-[#F3F8F7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {/* Quick Communication Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${followUp.contactNumber}`}
              className="p-3 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] hover:border-[#078783] transition-colors flex items-center gap-2.5 text-[#11232B] font-semibold"
            >
              <div className="w-7 h-7 rounded-lg bg-white text-[#078783] flex items-center justify-center">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-[#5A7178] font-normal">Call Student</div>
                <div className="truncate">{followUp.contactNumber}</div>
              </div>
            </a>

            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] hover:border-emerald-500 transition-colors flex items-center gap-2.5 text-[#11232B] font-semibold"
            >
              <div className="w-7 h-7 rounded-lg bg-white text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-[#5A7178] font-normal">WhatsApp</div>
                <div className="text-emerald-700">Open Chat</div>
              </div>
            </a>
          </div>

          {/* Related Lead or Enquiry banner */}
          {followUp.relatedType && followUp.relatedType !== "General" && (
            <div className="p-3 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#5A7178] block">
                  Connected CRM Record
                </span>
                <span className="font-semibold text-xs text-[#11232B]">
                  {followUp.relatedType}: {followUp.relatedCode || followUp.relatedId}
                </span>
              </div>
              <Link
                href={followUp.relatedType === "Lead" ? "/leads" : "/enquiries"}
                className="text-[11px] font-bold text-[#078783] hover:underline flex items-center gap-1"
              >
                <span>View {followUp.relatedType}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Follow-up Details Overview */}
          <div className="bg-[#FAFCFB] rounded-xl border border-[#E2ECEB] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Scheduled Date</span>
                  <span className="font-semibold text-[#11232B]">
                    {followUp.followUpDate} at {followUp.followUpTime}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Communication Type</span>
                  <span className="font-semibold text-[#11232B]">{followUp.type}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2ECEB] pt-3 grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Assigned Counsellor</span>
                  <span className="font-semibold text-[#11232B]">
                    {followUp.assignedCounsellor}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#078783] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[#5A7178] text-[11px] block">Priority</span>
                  <span className="font-semibold text-[#11232B]">{followUp.priority}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Agenda */}
          <div>
            <h4 className="text-xs font-semibold text-[#11232B] mb-1">Follow-up Agenda / Notes</h4>
            <div className="p-3 bg-white rounded-xl border border-[#E2ECEB] text-[#3E555C] leading-relaxed whitespace-pre-wrap">
              {followUp.notes || <span className="italic text-[#8A9EA5]">No notes provided.</span>}
            </div>
          </div>

          {/* Completed Notes if completed */}
          {followUp.status === "Completed" && followUp.completionNotes && (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Completion Summary</span>
              </div>
              <p className="text-emerald-800 text-xs leading-relaxed">
                {followUp.completionNotes}
              </p>
              {followUp.completedAt && (
                <div className="text-[10px] text-emerald-700 pt-1">
                  Completed on {new Date(followUp.completedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2ECEB] bg-[#FAFCFB] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                onDelete(followUp);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8 px-2"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Delete</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(followUp);
              }}
              className="text-xs h-8 px-2.5"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {followUp.status !== "Completed" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenReschedule(followUp);
                  }}
                  className="text-xs h-8 gap-1"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Reschedule</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenComplete(followUp);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Complete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
