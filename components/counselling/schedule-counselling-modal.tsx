"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ScheduleCounsellingFormData,
  sessionTypeEnum,
  sessionPriorityEnum,
  participantTypeEnum,
  counsellingPurposeList,
  SessionType,
  SessionPriority,
  ParticipantType,
  CounsellingSessionRecord,
} from "@/lib/validations/counselling";
import { leadCounselorList } from "@/lib/validations/lead";
import { CourseSelect } from "@/components/courses/course-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  BookOpen,
  MapPin,
  Video,
  Building2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  Sparkles,
} from "lucide-react";

interface ScheduleCounsellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: CounsellingSessionRecord) => void;
  leads?: any[];
  enquiries?: any[];
  students?: any[];
  courses?: string[];
  initialCounsellor?: string;
  initialDate?: string;
}

export function ScheduleCounsellingModal({
  isOpen,
  onClose,
  onSuccess,
  leads = [],
  enquiries = [],
  students = [],
  courses = [],
  initialCounsellor,
  initialDate,
}: ScheduleCounsellingModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [participantType, setParticipantType] = useState<ParticipantType>("Lead");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [personSearch, setPersonSearch] = useState<string>("");

  const [personName, setPersonName] = useState<string>("");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [interestedCourse, setInterestedCourse] = useState<string>("");
  const [assignedCounsellor, setAssignedCounsellor] = useState<string>(
    initialCounsellor || leadCounselorList[0]
  );
  const [counsellingDate, setCounsellingDate] = useState<string>(initialDate || "2026-11-18");
  const [startTime, setStartTime] = useState<string>("10:00 AM");
  const [endTime, setEndTime] = useState<string>("10:45 AM");
  const [sessionType, setSessionType] = useState<SessionType>("In-person");
  const [purpose, setPurpose] = useState<string>(counsellingPurposeList[0]);
  const [meetingLocationOrLink, setMeetingLocationOrLink] = useState<string>(
    "Counselling Room 102 · Bellandur Campus"
  );
  const [priority, setPriority] = useState<SessionPriority>("Medium");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      if (initialCounsellor) setAssignedCounsellor(initialCounsellor);
      if (initialDate) setCounsellingDate(initialDate);
    }
  }, [isOpen, initialCounsellor, initialDate]);

  // Adjust meeting location default based on session type
  const handleSessionTypeChange = (type: SessionType) => {
    setSessionType(type);
    if (type === "In-person") {
      setMeetingLocationOrLink("Counselling Room 102 · Bellandur Campus");
    } else if (type === "Video Call") {
      setMeetingLocationOrLink(`https://meet.google.com/dma-counsel-${Math.floor(100 + Math.random() * 900)}`);
    } else if (type === "Phone") {
      setMeetingLocationOrLink(`Direct Phone Consultation (${contactNumber || "Candidate Phone"})`);
    }
  };

  // Filter selectable entities based on participantType and search
  const selectableEntities = useMemo(() => {
    let list: any[] = [];
    if (participantType === "Lead") list = leads;
    else if (participantType === "Enquiry") list = enquiries;
    else if (participantType === "Student") list = students;

    if (!personSearch.trim()) return list.slice(0, 8);

    const q = personSearch.toLowerCase();
    return list.filter((item) => {
      const name = (item.fullName || item.studentName || "").toLowerCase();
      const phone = (item.phoneNumber || "").toLowerCase();
      const mail = (item.email || "").toLowerCase();
      const code = (item.leadCode || item.enquiryCode || item.studentCode || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || mail.includes(q) || code.includes(q);
    });
  }, [participantType, leads, enquiries, students, personSearch]);

  // Auto-populate when selecting entity
  const handleSelectEntity = (item: any) => {
    setSelectedEntityId(item.id);
    const name = item.fullName || item.studentName || "";
    setPersonName(name);
    setContactNumber(item.phoneNumber || "");
    setEmail(item.email || "");
    setInterestedCourse(item.course || item.interestedCourse || (courses.length > 0 ? courses[0] : ""));

    const counsellor = item.assignedCounselor || item.assignedCounsellor || item.counsellor;
    if (counsellor && leadCounselorList.includes(counsellor as any)) {
      setAssignedCounsellor(counsellor);
    }

    if (sessionType === "Phone" && item.phoneNumber) {
      setMeetingLocationOrLink(`Direct Phone Consultation (${item.phoneNumber})`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!personName.trim()) {
      setFormError("Person name is required");
      return;
    }
    if (!contactNumber.trim() || contactNumber.length < 10) {
      setFormError("Valid contact number (at least 10 digits) is required");
      return;
    }
    if (!interestedCourse.trim()) {
      setFormError("Interested course is required");
      return;
    }
    if (!counsellingDate) {
      setFormError("Counselling date is required");
      return;
    }
    if (!meetingLocationOrLink.trim()) {
      setFormError("Meeting location or Google Meet URL is required");
      return;
    }

    const payload: ScheduleCounsellingFormData = {
      participantType,
      participantId: selectedEntityId || undefined,
      personName: personName.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim() || "",
      interestedCourse: interestedCourse.trim(),
      assignedCounsellor,
      counsellingDate,
      startTime,
      endTime,
      sessionType,
      purpose,
      meetingLocationOrLink: meetingLocationOrLink.trim(),
      priority,
      status: "Scheduled",
      additionalNotes: additionalNotes.trim() || null,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/counselling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule counselling session");
      }

      onSuccess(data.session);
      onClose();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E2ECEB] bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5F4] border border-[#078783]/20 flex items-center justify-center text-[#078783]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Schedule Counselling Session</h2>
              <p className="text-xs text-slate-500">
                Book in-person, phone, or video career guidance with automatic conflict detection
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Integration: Select Existing Lead/Enquiry/Student Card */}
          <div className="p-4 bg-slate-50/70 border border-[#E2ECEB] rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#078783]" />
                Select Participant from Records
              </span>

              {/* Type pills */}
              <div className="flex items-center gap-1">
                {participantTypeEnum.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setParticipantType(type);
                      setSelectedEntityId("");
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      participantType === type
                        ? "bg-[#078783] text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-[#E2ECEB] hover:bg-slate-100"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick search input */}
            {participantType !== "Direct Applicant" && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={`Search ${participantType} by name, phone, or ID...`}
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                  className="w-full h-8.5 px-3 text-xs bg-white border border-[#E2ECEB] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />

                {/* Candidate list */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectableEntities.map((item) => {
                    const name = item.fullName || item.studentName;
                    const code = item.leadCode || item.enquiryCode || item.studentCode;
                    const isSelected = selectedEntityId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectEntity(item)}
                        className={`px-2.5 py-1 text-xs rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-[#E6F5F4] border-[#078783] text-[#078783] font-bold"
                            : "bg-white border-[#E2ECEB] text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{name}</span>
                        {code && <span className="opacity-60 ml-1 text-[10px]">({code})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Participant Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Person / Student Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Full Name"
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Course, Counsellor & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interested Course <span className="text-rose-500">*</span>
              </label>
              <CourseSelect
                value={interestedCourse}
                onChange={(val) => setInterestedCourse(val)}
                placeholder="Select or search course..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Staff <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mithun K"
                value={assignedCounsellor}
                onChange={(e) => setAssignedCounsellor(e.target.value)}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium placeholder-[#8A9EA5] focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SessionPriority)}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                {sessionPriorityEnum.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Start Time, End Time & Session Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Counselling Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={counsellingDate}
                onChange={(e) => setCounsellingDate(e.target.value)}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  // Auto set end time 45 mins later
                  const times = [
                    "09:00 AM", "09:45 AM", "10:00 AM", "10:45 AM",
                    "11:00 AM", "11:45 AM", "02:00 PM", "02:45 PM",
                    "03:00 PM", "03:45 PM", "04:30 PM", "05:15 PM"
                  ];
                  const idx = times.indexOf(e.target.value);
                  if (idx !== -1 && idx + 1 < times.length) {
                    setEndTime(times[idx + 1]);
                  }
                }}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Time <span className="text-rose-500">*</span>
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                <option value="09:45 AM">09:45 AM</option>
                <option value="10:45 AM">10:45 AM</option>
                <option value="11:45 AM">11:45 AM</option>
                <option value="12:15 PM">12:15 PM</option>
                <option value="02:45 PM">02:45 PM</option>
                <option value="03:45 PM">03:45 PM</option>
                <option value="04:45 PM">04:45 PM</option>
                <option value="05:15 PM">05:15 PM</option>
                <option value="05:45 PM">05:45 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Session Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={sessionType}
                onChange={(e) => handleSessionTypeChange(e.target.value as SessionType)}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                {sessionTypeEnum.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose & Meeting Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Counselling Purpose <span className="text-rose-500">*</span>
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
              >
                {counsellingPurposeList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meeting Location or Link <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={meetingLocationOrLink}
                onChange={(e) => setMeetingLocationOrLink(e.target.value)}
                placeholder="e.g. Room 102 or Google Meet URL"
                className="w-full h-9 px-3 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pre-Session Notes & Context
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Candidate is switching career from sales to digital marketing; interested in weekend batch options."
              className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-[#E2ECEB] bg-white text-slate-800 focus:ring-2 focus:ring-[#078783]/30 focus:outline-none resize-none"
            />
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
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Schedule Session</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
