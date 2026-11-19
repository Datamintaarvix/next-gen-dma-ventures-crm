"use client";

import React, { useState, useEffect } from "react";
import {
  CounsellingSessionRecord,
  CompleteSessionFormData,
} from "@/lib/validations/counselling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Calendar,
  AlertCircle,
  HelpCircle,
  Clock,
  User,
  GraduationCap,
} from "lucide-react";

interface CompleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CounsellingSessionRecord | null;
  onSuccess: (updated: CounsellingSessionRecord, followUpCreated?: string) => void;
  courses?: string[];
}

export function CompleteSessionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
  courses = [],
}: CompleteSessionModalProps) {
  const [status, setStatus] = useState<"Completed" | "Cancelled" | "No Show">("Completed");
  const [discussionNotes, setDiscussionNotes] = useState<string>("");
  const [studentRequirements, setStudentRequirements] = useState<string>("");
  const [courseRecommendations, setCourseRecommendations] = useState<string>("");
  const [studentInterests, setStudentInterests] = useState<string>("");
  const [concernsOrObjections, setConcernsOrObjections] = useState<string>("");
  const [nextAction, setNextAction] = useState<string>("");
  const [recommendedFollowUpDate, setRecommendedFollowUpDate] = useState<string>("");
  const [createFollowUp, setCreateFollowUp] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setStatus("Completed");
      setDiscussionNotes(session.discussionNotes || "");
      setStudentRequirements(session.studentRequirements || "");
      setCourseRecommendations(session.courseRecommendations || session.interestedCourse || "");
      setStudentInterests(session.studentInterests || "");
      setConcernsOrObjections(session.concernsOrObjections || "");
      setNextAction(session.nextAction || "");

      // Default follow-up date 5 days later
      if (session.recommendedFollowUpDate) {
        setRecommendedFollowUpDate(session.recommendedFollowUpDate);
      } else {
        const d = new Date(session.counsellingDate);
        d.setDate(d.getDate() + 5);
        setRecommendedFollowUpDate(d.toISOString().split("T")[0]);
      }

      setCreateFollowUp(true);
      setError(null);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!discussionNotes.trim()) {
      setError("Discussion notes are required");
      return;
    }
    if (!courseRecommendations.trim()) {
      setError("Recommended course is required");
      return;
    }
    if (!nextAction.trim()) {
      setError("Next action is required");
      return;
    }

    const payload: CompleteSessionFormData = {
      status,
      discussionNotes: discussionNotes.trim(),
      studentRequirements: studentRequirements.trim() || null,
      courseRecommendations: courseRecommendations.trim(),
      studentInterests: studentInterests.trim() || null,
      concernsOrObjections: concernsOrObjections.trim() || null,
      nextAction: nextAction.trim(),
      recommendedFollowUpDate: recommendedFollowUpDate || null,
      createFollowUp,
      counsellorName: session.assignedCounsellor,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/counselling/${encodeURIComponent(session.id)}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save discussion notes");
      }

      onSuccess(data.session, data.createdFollowUpId);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Record Discussion Notes</h2>
                <Badge variant="outline" className="border-[#E2ECEB] text-slate-600 bg-white">
                  {session.sessionCode}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Log candidate discussion, recommendations, concerns, and follow-up actions
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Session Overview Pill */}
          <div className="p-3.5 bg-slate-50 border border-[#E2ECEB] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <span>{session.personName}</span>
                <span className="text-slate-400 font-normal">({session.participantType})</span>
              </div>
              <div className="text-slate-500 mt-0.5">
                {session.contactNumber} · {session.email || "No email"}
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold text-slate-800">
                {session.counsellingDate} · {session.startTime}
              </div>
              <div className="text-slate-500">
                Counsellor: <strong className="text-slate-700">{session.assignedCounsellor}</strong>
              </div>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session Outcome Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "Completed", label: "Completed (Notes Recorded)", color: "bg-emerald-600 text-white" },
                { val: "No Show", label: "No Show (Did Not Attend)", color: "bg-rose-600 text-white" },
                { val: "Cancelled", label: "Cancelled", color: "bg-slate-700 text-white" },
              ].map((st) => (
                <button
                  key={st.val}
                  type="button"
                  onClick={() => setStatus(st.val as any)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    status === st.val
                      ? st.color
                      : "bg-white text-slate-700 border-[#E2ECEB] hover:bg-slate-50"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discussion Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Discussion Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              placeholder="e.g. Conducted technical skill evaluation. Candidate has good logical thinking but needs foundational frontend training..."
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Student Requirements & Interests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Requirements & Goals
              </label>
              <textarea
                rows={2}
                value={studentRequirements}
                onChange={(e) => setStudentRequirements(e.target.value)}
                placeholder="e.g. Seeking weekend batch, looking for placement support in Bengaluru tech startups."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Modules & Interests
              </label>
              <textarea
                rows={2}
                value={studentInterests}
                onChange={(e) => setStudentInterests(e.target.value)}
                placeholder="e.g. Meta Ads, Performance Marketing, SEO, AI workflows."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Course Recommendation & Objections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Recommendation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={courseRecommendations}
                onChange={(e) => setCourseRecommendations(e.target.value)}
                placeholder="e.g. Digital Marketing Professional Program"
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Concerns / Objections Raised
              </label>
              <input
                type="text"
                value={concernsOrObjections}
                onChange={(e) => setConcernsOrObjections(e.target.value)}
                placeholder="e.g. Budget constraints, inquiring about installment plan."
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Next Action & Follow-up Integration */}
          <div className="p-4 bg-teal-50/40 border border-[#078783]/20 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#078783] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Next Step & Follow-up Integration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Action Required <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="e.g. Send scholarship form & follow up on Friday"
                  className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recommended Follow-up Date
                </label>
                <input
                  type="date"
                  value={recommendedFollowUpDate}
                  onChange={(e) => setRecommendedFollowUpDate(e.target.value)}
                  className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox: Auto Create Follow-up */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="create-followup-checkbox"
                checked={createFollowUp}
                onChange={(e) => setCreateFollowUp(e.target.checked)}
                className="w-4 h-4 rounded text-[#078783] focus:ring-[#078783]"
              />
              <label htmlFor="create-followup-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                Automatically add reminder to <strong>Follow-up Management</strong> on recommended date
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2ECEB] bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-600 border-[#E2ECEB] hover:bg-slate-100"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#078783] hover:bg-[#066f6c] text-white font-medium px-5 flex items-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Notes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Discussion Notes</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
