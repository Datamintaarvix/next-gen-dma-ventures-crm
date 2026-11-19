"use client";

import React, { useState, useEffect } from "react";
import { CounsellingSessionRecord } from "@/lib/validations/counselling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Calendar,
  Clock,
  User,
  History,
  FileText,
  Award,
  Plus,
  AlertTriangle,
} from "lucide-react";

interface CounsellingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string | null;
  contactNumber?: string | null;
  onScheduleNext: (name: string, phone?: string) => void;
}

export function CounsellingHistoryModal({
  isOpen,
  onClose,
  personName,
  contactNumber,
  onScheduleNext,
}: CounsellingHistoryModalProps) {
  const [history, setHistory] = useState<CounsellingSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !personName) {
      setHistory([]);
      return;
    }

    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("personName", personName);
        if (contactNumber) params.set("contactNumber", contactNumber);

        const res = await fetch(`/api/counselling/history?${params.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load counselling history");
        }

        setHistory(data.history || []);
      } catch (err: any) {
        if (isMounted) setError(err.message || "An error occurred");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, personName, contactNumber]);

  if (!isOpen || !personName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Counselling History</h2>
              <p className="text-xs text-slate-500">
                All consultations, notes, and recommendations for {personName}
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
              <p className="text-sm font-medium">Loading history...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No previous counselling sessions recorded for this person.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-[#E2ECEB] bg-white hover:border-[#078783]/50 transition-all space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2ECEB]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{s.sessionCode}</span>
                      <Badge
                        className={`text-xs ${
                          s.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : s.status === "Confirmed"
                            ? "bg-teal-50 text-teal-700 border-teal-300"
                            : s.status === "Cancelled"
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {s.status}
                      </Badge>
                    </div>

                    <div className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#078783]" />
                      <span>{s.counsellingDate} · {s.startTime}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      Counsellor: <strong className="text-slate-800">{s.assignedCounsellor}</strong>
                    </div>
                    <div>
                      Course: <strong className="text-slate-800">{s.interestedCourse}</strong>
                    </div>
                    <div>
                      Type: <strong className="text-slate-800">{s.sessionType}</strong>
                    </div>
                    <div>
                      Purpose: <span className="text-slate-700">{s.purpose}</span>
                    </div>
                  </div>

                  {s.discussionNotes && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-[#E2ECEB] space-y-1">
                      <div className="font-semibold text-slate-700">Discussion Notes:</div>
                      <p className="text-slate-800">{s.discussionNotes}</p>
                    </div>
                  )}

                  {s.courseRecommendations && (
                    <div className="text-emerald-800">
                      Recommended: <strong>{s.courseRecommendations}</strong>
                    </div>
                  )}

                  {s.nextAction && (
                    <div className="text-slate-700">
                      Next Action: <strong>{s.nextAction}</strong>
                      {s.recommendedFollowUpDate && (
                        <span className="text-slate-500 ml-2">(Follow-up: {s.recommendedFollowUpDate})</span>
                      )}
                    </div>
                  )}

                  {s.isConvertedToAdmission && (
                    <div className="pt-1 flex items-center gap-1 text-emerald-700 font-bold">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Enrolled into Admission {s.admissionCode}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2ECEB] bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-slate-600 border-[#E2ECEB] hover:bg-slate-100"
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={() => {
              onClose();
              onScheduleNext(personName, contactNumber || undefined);
            }}
            className="bg-[#078783] hover:bg-[#066f6c] text-white flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Another Session</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
