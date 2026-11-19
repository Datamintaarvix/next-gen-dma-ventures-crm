"use client";

import React from "react";
import { CounsellingSessionRecord } from "@/lib/validations/counselling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  BookOpen,
  MapPin,
  Video,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  XCircle,
  History,
  ExternalLink,
  Award,
} from "lucide-react";

interface CounsellingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CounsellingSessionRecord | null;
  onOpenCompleteNotes: (session: CounsellingSessionRecord) => void;
  onOpenReschedule: (session: CounsellingSessionRecord) => void;
  onOpenCancel: (session: CounsellingSessionRecord) => void;
  onOpenHistory: (personName: string, phone?: string) => void;
}

export function CounsellingDetailModal({
  isOpen,
  onClose,
  session,
  onOpenCompleteNotes,
  onOpenReschedule,
  onOpenCancel,
  onOpenHistory,
}: CounsellingDetailModalProps) {
  if (!isOpen || !session) return null;

  const isCompleted = session.status === "Completed";
  const isCancelled = session.status === "Cancelled";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{session.personName}</h2>
                <Badge variant="outline" className="border-[#E2ECEB] text-slate-600 bg-white font-mono text-xs">
                  {session.sessionCode}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {session.participantType} · Interested in {session.interestedCourse}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm">
          {/* Status & Converted Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-[#E2ECEB]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Status:</span>
              <Badge
                className={`text-xs font-semibold ${
                  session.status === "Completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : session.status === "Confirmed"
                    ? "bg-teal-50 text-teal-700 border-teal-300"
                    : session.status === "Cancelled"
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : session.status === "No Show"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {session.status}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  session.priority === "Urgent" || session.priority === "High"
                    ? "border-amber-300 text-amber-700 bg-amber-50"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {session.priority} Priority
              </Badge>
            </div>

            {session.isConvertedToAdmission && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admitted ({session.admissionCode || "Admission Confirmed"})</span>
              </Badge>
            )}
          </div>

          {/* Session Schedule & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50/70 rounded-xl border border-[#E2ECEB] text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-[#078783]" />
                <span>Date: <strong className="text-slate-900">{session.counsellingDate}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-[#078783]" />
                <span>Time Slot: <strong className="text-slate-900">{session.startTime} - {session.endTime}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3.5 h-3.5 text-[#078783]" />
                <span>Counsellor: <strong className="text-slate-900">{session.assignedCounsellor}</strong></span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                {session.sessionType === "Video Call" ? (
                  <Video className="w-3.5 h-3.5 text-blue-600" />
                ) : session.sessionType === "Phone" ? (
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-[#078783]" />
                )}
                <span>Type: <strong className="text-slate-900">{session.sessionType}</strong></span>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-[#078783]" />
                <span>Location / Link:</span>
              </div>
              <div className="pl-5 text-slate-800 font-medium break-all">
                {session.meetingLocationOrLink.startsWith("http") ? (
                  <a
                    href={session.meetingLocationOrLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#078783] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>{session.meetingLocationOrLink}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  session.meetingLocationOrLink
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3 bg-white border border-[#E2ECEB] rounded-xl text-xs space-y-1">
            <div className="font-semibold text-slate-700">Contact Information:</div>
            <div className="flex flex-wrap items-center gap-4 text-slate-600">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {session.contactNumber}
              </span>
              {session.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {session.email}
                </span>
              )}
            </div>
          </div>

          {/* Pre-Session Context & Purpose */}
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-slate-700">Purpose:</span>
            <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-[#E2ECEB]">
              {session.purpose}
            </p>
            {session.additionalNotes && (
              <p className="text-slate-500 italic mt-1 pl-1">
                Note: {session.additionalNotes}
              </p>
            )}
          </div>

          {/* Discussion Notes (if recorded) */}
          {session.discussionNotes && (
            <div className="p-4 bg-[#E6F5F4]/40 border border-[#078783]/20 rounded-xl space-y-2.5 text-xs">
              <h4 className="font-bold text-[#078783] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Counselling Discussion & Assessment
              </h4>

              <div>
                <span className="font-semibold text-slate-700">Discussion Notes:</span>
                <p className="text-slate-800 mt-0.5">{session.discussionNotes}</p>
              </div>

              {session.courseRecommendations && (
                <div>
                  <span className="font-semibold text-slate-700">Recommended Program:</span>
                  <p className="text-emerald-800 font-bold mt-0.5">{session.courseRecommendations}</p>
                </div>
              )}

              {session.studentRequirements && (
                <div>
                  <span className="font-semibold text-slate-700">Student Requirements & Goals:</span>
                  <p className="text-slate-700 mt-0.5">{session.studentRequirements}</p>
                </div>
              )}

              {session.studentInterests && (
                <div>
                  <span className="font-semibold text-slate-700">Specific Interests / Tools:</span>
                  <p className="text-slate-700 mt-0.5">{session.studentInterests}</p>
                </div>
              )}

              {session.concernsOrObjections && (
                <div>
                  <span className="font-semibold text-slate-700">Concerns or Objections:</span>
                  <p className="text-slate-700 mt-0.5">{session.concernsOrObjections}</p>
                </div>
              )}

              {session.nextAction && (
                <div className="pt-1.5 border-t border-[#078783]/15 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-700">Next Action:</span>
                    <strong className="text-slate-900 ml-1.5">{session.nextAction}</strong>
                  </div>
                  {session.recommendedFollowUpDate && (
                    <Badge className="bg-white border-[#078783]/30 text-[#078783] text-[11px]">
                      Follow-up: {session.recommendedFollowUpDate}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cancellation Reason if cancelled */}
          {session.cancellationReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <strong>Cancellation Reason:</strong> {session.cancellationReason}
            </div>
          )}

          {/* Audit Trail */}
          {session.auditTrail && session.auditTrail.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#E2ECEB]">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Audit Trail & History
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {session.auditTrail.map((entry, idx) => (
                  <div key={idx} className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-mono text-slate-400">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                    <strong className="text-slate-700">{entry.action}</strong>
                    <span>by {entry.performedBy}</span>
                    {entry.notes && <span className="text-slate-400 truncate">({entry.notes})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-[#E2ECEB] bg-slate-50 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenHistory(session.personName, session.contactNumber)}
            className="text-xs text-slate-700 border-[#E2ECEB] hover:bg-slate-100 flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#078783]" />
            <span>Full Person History</span>
          </Button>

          <div className="flex items-center gap-2">
            {!isCancelled && !isCompleted && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenCancel(session)}
                  className="text-xs text-slate-600 border-[#E2ECEB] hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenReschedule(session)}
                  className="text-xs text-slate-700 border-[#E2ECEB] hover:bg-slate-100 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#078783]" />
                  <span>Reschedule</span>
                </Button>
              </>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => onOpenCompleteNotes(session)}
              className="text-xs bg-[#078783] hover:bg-[#066f6c] text-white flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isCompleted ? "Edit Discussion Notes" : "Record Discussion Notes"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
