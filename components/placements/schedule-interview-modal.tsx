"use client";

import React, { useState, useEffect } from "react";
import {
  PlacementApplicationRecord,
  PlacementInterviewRecord,
  ScheduleInterviewFormData,
  interviewRoundEnum,
  InterviewRound,
  interviewModeEnum,
  InterviewMode,
} from "@/lib/validations/placement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  CalendarCheck,
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  Star,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (interview: PlacementInterviewRecord) => void;
  application: PlacementApplicationRecord | null;
  interviewToFeedback?: PlacementInterviewRecord | null; // If feedback mode
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSuccess,
  application,
  interviewToFeedback,
}: ScheduleInterviewModalProps) {
  const isFeedbackMode = !!interviewToFeedback;

  // Schedule fields
  const [roundName, setRoundName] = useState<InterviewRound>(interviewRoundEnum[0]);
  const [interviewDate, setInterviewDate] = useState("2026-11-25");
  const [interviewTime, setInterviewTime] = useState("11:30 AM");
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("Virtual (Google Meet)");
  const [locationOrMeetingLink, setLocationOrMeetingLink] = useState(
    "https://meet.google.com/dma-interview"
  );
  const [interviewerName, setInterviewerName] = useState("Recruitment Panel");
  const [notes, setNotes] = useState("");

  // Feedback fields
  const [result, setResult] = useState<"Scheduled" | "Passed" | "Pending Feedback" | "Failed">("Passed");
  const [rating, setRating] = useState<number>(4);
  const [feedback, setFeedback] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (interviewToFeedback) {
      setResult(interviewToFeedback.result || "Passed");
      setRating(interviewToFeedback.rating || 4);
      setFeedback(interviewToFeedback.feedback || "");
    } else {
      setRoundName(interviewRoundEnum[0]);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setInterviewDate(defaultDate.toISOString().split("T")[0]);
      setInterviewTime("11:30 AM");
      setInterviewMode("Virtual (Google Meet)");
      setLocationOrMeetingLink("https://meet.google.com/dma-drive");
      setInterviewerName("Technical Hiring Team");
      setNotes("");
    }
    setErrorMsg(null);
  }, [isOpen, interviewToFeedback]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isFeedbackMode && interviewToFeedback) {
        // Submit feedback update
        const res = await fetch(`/api/placements/interviews/${interviewToFeedback.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback: feedback.trim() || undefined,
            rating: Number(rating),
            result,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update interview feedback");

        onSuccess(data.interview);
        onClose();
      } else if (application) {
        // Schedule new interview round
        const payload: ScheduleInterviewFormData = {
          applicationId: application.id,
          roundName,
          interviewDate,
          interviewTime,
          interviewMode,
          locationOrMeetingLink: locationOrMeetingLink.trim(),
          interviewerName: interviewerName.trim(),
          notes: notes.trim() || undefined,
        };

        const res = await fetch("/api/placements/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to schedule interview round");

        onSuccess(data.interview);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentName = interviewToFeedback
    ? interviewToFeedback.studentName
    : application?.studentName;
  const companyName = interviewToFeedback
    ? interviewToFeedback.companyName
    : application?.companyName;
  const jobTitle = interviewToFeedback
    ? interviewToFeedback.jobTitle
    : application?.jobTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isFeedbackMode ? "Record Interview Evaluation" : "Schedule Interview Round"}
              </h3>
              <p className="text-xs text-slate-500">
                {studentName} · {companyName} ({jobTitle})
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

          {isFeedbackMode ? (
            /* FEEDBACK MODE */
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-slate-800">{interviewToFeedback?.roundName}</div>
                <div className="text-slate-600">
                  Conducted on {interviewToFeedback?.interviewDate} at {interviewToFeedback?.interviewTime} by{" "}
                  <span className="font-medium">{interviewToFeedback?.interviewerName}</span>
                </div>
              </div>

              {/* Result Status */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Interview Result</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Passed", "Pending Feedback", "Failed", "Scheduled"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResult(r)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        result === r
                          ? r === "Passed"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : r === "Failed"
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-[#078783] text-white border-[#078783]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 1 to 5 Stars */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Candidate Rating (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 stroke-1"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-500 font-medium ml-2">
                    {rating} out of 5 stars
                  </span>
                </div>
              </div>

              {/* Feedback text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Interviewer Assessment & Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Detail candidate's domain knowledge, problem-solving ability, communication, and recommendation for next round."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none text-xs resize-none"
                />
              </div>
            </div>
          ) : (
            /* SCHEDULE MODE */
            <div className="space-y-4">
              {/* Round Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Interview Round</label>
                <select
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value as InterviewRound)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
                >
                  {interviewRoundEnum.map((rnd) => (
                    <option key={rnd} value={rnd}>
                      {rnd}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Interview Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
                  />
                </div>
              </div>

              {/* Mode & Location/Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Interview Mode</label>
                  <select
                    value={interviewMode}
                    onChange={(e) => setInterviewMode(e.target.value as InterviewMode)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white"
                  >
                    {interviewModeEnum.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-slate-500" />
                    Meeting Link or Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google Meet URL / Campus Room 2"
                    value={locationOrMeetingLink}
                    onChange={(e) => setLocationOrMeetingLink(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
                  />
                </div>
              </div>

              {/* Interviewer */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  Interviewer / Panel Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shalini Nair (HR Head) & Tech Lead"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Instructions / Preparation Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Carry portfolio laptop and digital certificate copies."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none resize-none text-xs"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-xl px-5 font-semibold shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isFeedbackMode ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Evaluation
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  Confirm Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
