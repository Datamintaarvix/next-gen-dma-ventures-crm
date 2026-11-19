"use client";

import React, { useState, useEffect } from "react";
import {
  StudentPlacementProfile,
  StudentPlacementProfileFormData,
  placementStatusEnum,
  PlacementStatus,
  placementEligibilityEnum,
  PlacementEligibility,
} from "@/lib/validations/placement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  User,
  GraduationCap,
  CalendarCheck,
  FileText,
  Globe,
  Linkedin,
  Github,
  IndianRupee,
  Award,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Briefcase,
  ExternalLink,
} from "lucide-react";

interface StudentPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: StudentPlacementProfile) => void;
  profile: StudentPlacementProfile | null;
}

const skillSuggestions = [
  "SEO",
  "Google Analytics 4",
  "Meta Ads",
  "HTML5/CSS3",
  "JavaScript",
  "React.js",
  "Next.js",
  "Node.js",
  "Python",
  "SQL",
  "Figma",
  "Tableau",
  "Power BI",
  "Git & GitHub",
  "Express.js",
  "MongoDB",
];

export function StudentPlacementModal({
  isOpen,
  onClose,
  onSuccess,
  profile,
}: StudentPlacementModalProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [expectedSalaryLPA, setExpectedSalaryLPA] = useState<number | string>("");
  const [placementStatus, setPlacementStatus] = useState<PlacementStatus>("Seeking Placement");
  const [placementEligibility, setPlacementEligibility] = useState<PlacementEligibility>("Eligible");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills || []);
      setResumeUrl(profile.resumeUrl || "");
      setPortfolioUrl(profile.portfolioUrl || "");
      setLinkedinUrl(profile.linkedinUrl || "");
      setGithubUrl(profile.githubUrl || "");
      setExpectedSalaryLPA(profile.expectedSalaryLPA ?? "");
      setPlacementStatus(profile.placementStatus || "Seeking Placement");
      setPlacementEligibility(profile.placementEligibility || "Eligible");
      setNotes(profile.notes || "");
    }
    setErrorMsg(null);
  }, [profile, isOpen]);

  if (!isOpen || !profile) return null;

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: StudentPlacementProfileFormData = {
        skills,
        resumeUrl: resumeUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        expectedSalaryLPA: expectedSalaryLPA ? Number(expectedSalaryLPA) : null,
        placementStatus,
        placementEligibility,
        notes: notes.trim() || undefined,
      };

      const res = await fetch(`/api/placements/profiles/${profile.studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update placement profile");
      }

      onSuccess(data.profile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAttendanceEligible = profile.attendancePercentage >= 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">{profile.studentName}</h3>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                  {profile.studentCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {profile.courseName} · Batch {profile.batchCode}
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
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Academic & Eligibility Ribbon */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <CalendarCheck className="w-4 h-4 text-[#078783]" />
                Institutional Attendance Record
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{profile.attendancePercentage}%</span>
                {isAttendanceEligible ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                    ✓ Threshold Met (≥75%)
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold">
                    ⚠ Attendance Deficit (&lt;75%)
                  </Badge>
                )}
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  isAttendanceEligible ? "bg-[#078783]" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(profile.attendancePercentage, 100)}%` }}
              />
            </div>

            {!isAttendanceEligible && (
              <p className="text-[11px] text-amber-700 italic">
                Notice: Institute policy requires ≥75% attendance to unlock premium campus placement drives.
              </p>
            )}
          </div>

          {/* Placed Banner if student already placed */}
          {profile.placedCompany && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-xs">
                    Placed at {profile.placedCompany} ({profile.placedJobTitle})
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Package: ₹{profile.placedSalaryLPA?.toFixed(1)} LPA · Joined {profile.placedDate}
                  </div>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white font-bold">Placed</Badge>
            </div>
          )}

          {/* Placement Status & Eligibility Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Placement Status</label>
              <select
                value={placementStatus}
                onChange={(e) => setPlacementStatus(e.target.value as PlacementStatus)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
              >
                {placementStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Eligibility Classification</label>
              <select
                value={placementEligibility}
                onChange={(e) => setPlacementEligibility(e.target.value as PlacementEligibility)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
              >
                {placementEligibilityEnum.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expected Salary & Resume URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-slate-500" />
                Target Salary Expectation (₹ LPA)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 6.0"
                value={expectedSalaryLPA}
                onChange={(e) => setExpectedSalaryLPA(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Resume Link (PDF / Drive)
                </span>
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#078783] hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>
          </div>

          {/* Portfolio & LinkedIn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-500" />
                Portfolio / Live Website
              </label>
              <input
                type="url"
                placeholder="https://behance.net/..."
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Linkedin className="w-4 h-4 text-slate-500" />
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>
          </div>

          {/* GitHub URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Github className="w-4 h-4 text-slate-500" />
              GitHub Profile (for Coding & Data Tech)
            </label>
            <input
              type="url"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
            />
          </div>

          {/* Skills Management */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">Student Skills & Endorsements</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. SEO, SQL, React)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill(skillInput);
                  }
                }}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#078783]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddSkill(skillInput)}
                className="text-xs rounded-xl border-slate-300"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Suggestions:</span>
              {skillSuggestions.slice(0, 8).map((sk) => (
                <button
                  type="button"
                  key={sk}
                  onClick={() => handleAddSkill(sk)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded"
                >
                  +{sk}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Placement Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Placement Officer / Mentor Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared internal mock interviews with distinction. Strong communication skills."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none resize-none text-xs"
            />
          </div>

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
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
