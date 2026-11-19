"use client";

import React, { useState, useEffect } from "react";
import {
  JobOpportunityRecord,
  JobOpportunityFormData,
  CompanyRecord,
  opportunityStatusEnum,
  OpportunityStatus,
  jobTypeEnum,
  JobType,
} from "@/lib/validations/placement";
import {
  COURSE_CATEGORIES,
  COURSE_CATALOGUE_BY_CATEGORY,
  ALL_COURSES,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  IndianRupee,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface JobOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (job: JobOpportunityRecord) => void;
  companies: CompanyRecord[];
  courses: string[];
  initialData?: JobOpportunityRecord | null;
}

const commonSkills = [
  "SEO",
  "Google Ads",
  "Meta Ads",
  "Content Marketing",
  "React.js",
  "Next.js",
  "Node.js",
  "TypeScript",
  "Python",
  "SQL",
  "Machine Learning",
  "Deep Learning",
  "Power BI",
  "Figma",
  "UI/UX Design",
  "AWS",
  "Docker",
  "Communication",
];

export function JobOpportunityModal({
  isOpen,
  onClose,
  onSuccess,
  companies = [],
  courses = [],
  initialData,
}: JobOpportunityModalProps) {
  const isEditing = !!initialData;

  const [companyId, setCompanyId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobType, setJobType] = useState<JobType>("Full-time");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [minAttendancePercentage, setMinAttendancePercentage] = useState<number>(75);
  const [targetCourses, setTargetCourses] = useState<string[]>([]);
  const [openings, setOpenings] = useState<number>(2);
  const [salaryMinLPA, setSalaryMinLPA] = useState<number>(4.5);
  const [salaryMaxLPA, setSalaryMaxLPA] = useState<number>(6.5);
  const [jobLocation, setJobLocation] = useState("Bengaluru (Hybrid)");
  const [applicationDeadline, setApplicationDeadline] = useState("2026-12-15");
  const [status, setStatus] = useState<OpportunityStatus>("Open");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCompanyId(initialData.companyId);
      setJobTitle(initialData.jobTitle);
      setJobType(initialData.jobType || "Full-time");
      setJobDescription(initialData.jobDescription);
      setRequiredSkills(initialData.requiredSkills || []);
      setMinAttendancePercentage(initialData.minAttendancePercentage ?? 75);
      setTargetCourses(initialData.targetCourses || []);
      setOpenings(initialData.openings);
      setSalaryMinLPA(initialData.salaryMinLPA);
      setSalaryMaxLPA(initialData.salaryMaxLPA);
      setJobLocation(initialData.jobLocation);
      setApplicationDeadline(initialData.applicationDeadline);
      setStatus(initialData.status);
    } else {
      setCompanyId(companies[0]?.id || "");
      setJobTitle("");
      setJobType("Full-time");
      setJobDescription(
        "Responsible for end-to-end execution, collaborating with senior mentors, and delivering high quality results on real-world projects."
      );
      setRequiredSkills(["Communication", "Problem Solving"]);
      setMinAttendancePercentage(75);
      setTargetCourses(courses.length > 0 ? [courses[0]] : ["Digital Marketing"]);
      setOpenings(2);
      setSalaryMinLPA(4.5);
      setSalaryMaxLPA(6.5);
      setJobLocation("Bengaluru (Hybrid)");
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 30);
      setApplicationDeadline(defaultDeadline.toISOString().split("T")[0]);
      setStatus("Open");
    }
    setErrorMsg(null);
  }, [initialData, isOpen, companies, courses]);

  if (!isOpen) return null;

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skillToRemove));
  };

  const handleToggleCourse = (course: string) => {
    if (targetCourses.includes(course)) {
      if (targetCourses.length > 1) {
        setTargetCourses(targetCourses.filter((c) => c !== course));
      }
    } else {
      setTargetCourses([...targetCourses, course]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const selectedCompany = companies.find((c) => c.id === companyId);
    if (!selectedCompany) {
      setErrorMsg("Please select a valid partner company.");
      return;
    }
    if (!jobTitle.trim()) {
      setErrorMsg("Job title is required.");
      return;
    }
    if (jobDescription.length < 10) {
      setErrorMsg("Job description must be at least 10 characters.");
      return;
    }
    if (requiredSkills.length === 0) {
      setErrorMsg("Please specify at least one required skill.");
      return;
    }
    if (targetCourses.length === 0) {
      setErrorMsg("Please select at least one eligible target course.");
      return;
    }
    if (salaryMaxLPA < salaryMinLPA) {
      setErrorMsg("Maximum salary cannot be less than minimum salary.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: JobOpportunityFormData = {
        companyId,
        companyName: selectedCompany.name,
        jobTitle: jobTitle.trim(),
        jobType,
        jobDescription: jobDescription.trim(),
        requiredSkills,
        minAttendancePercentage: Number(minAttendancePercentage),
        targetCourses,
        openings: Number(openings),
        salaryMinLPA: Number(salaryMinLPA),
        salaryMaxLPA: Number(salaryMaxLPA),
        jobLocation: jobLocation.trim(),
        applicationDeadline,
        status,
      };

      const url = isEditing
        ? `/api/placements/jobs/${initialData.id}`
        : "/api/placements/jobs";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save job opportunity");
      }

      onSuccess(data.job);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? `Edit Job Opportunity · ${initialData?.id}` : "Post New Job Opportunity / Drive"}
              </h3>
              <p className="text-xs text-slate-500">
                Define hiring criteria, minimum attendance requirements, eligible courses & compensation
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

          {/* Company & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#078783]" />
                Hiring Partner Company <span className="text-red-500">*</span>
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
              >
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.industry})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#078783]" />
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SEO Specialist / Junior Full Stack Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>
          </div>

          {/* Job Type, Openings & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Employment Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white"
              >
                {jobTypeEnum.map((jt) => (
                  <option key={jt} value={jt}>
                    {jt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Number of Openings</label>
              <input
                type="number"
                min={1}
                max={50}
                value={openings}
                onChange={(e) => setOpenings(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru (Hybrid)"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>
          </div>

          {/* Salary Package (LPA) & Minimum Attendance */}
          <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-[#078783]" />
                  Min Salary (₹ LPA)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={salaryMinLPA}
                  onChange={(e) => setSalaryMinLPA(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-[#078783]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-[#078783]" />
                  Max Salary (₹ LPA)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={salaryMaxLPA}
                  onChange={(e) => setSalaryMaxLPA(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-[#078783]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Min Attendance Req.</span>
                  <span className="text-[#078783] font-bold">{minAttendancePercentage}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={minAttendancePercentage}
                  onChange={(e) => setMinAttendancePercentage(Number(e.target.value))}
                  className="w-full accent-[#078783] cursor-pointer mt-2"
                />
                <p className="text-[10px] text-slate-500">
                  Instituted policy: 75% standard for placement eligibility
                </p>
              </div>
            </div>
          </div>

          {/* Target Courses Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 text-xs">
                Target Eligible Courses ({targetCourses.length} selected) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetCourses([...ALL_COURSES])}
                  className="text-[11px] text-[#078783] hover:underline font-medium"
                >
                  Select All ({ALL_COURSES.length})
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setTargetCourses([])}
                  className="text-[11px] text-slate-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
              {COURSE_CATEGORIES.map((cat) => {
                const catCourses = COURSE_CATALOGUE_BY_CATEGORY[cat];
                const allSelected = catCourses.every((c) => targetCourses.includes(c));
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        {cat} ({catCourses.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (allSelected) {
                            setTargetCourses(targetCourses.filter((c) => !catCourses.includes(c)));
                          } else {
                            const newSet = new Set([...targetCourses, ...catCourses]);
                            setTargetCourses(Array.from(newSet));
                          }
                        }}
                        className="text-[10px] text-[#078783] font-medium hover:underline"
                      >
                        {allSelected ? "Deselect Category" : "Select Category"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {catCourses.map((course) => {
                        const isSelected = targetCourses.includes(course);
                        return (
                          <button
                            type="button"
                            key={course}
                            onClick={() => handleToggleCourse(course)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                              isSelected
                                ? "bg-[#078783] text-white border-[#078783] shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {course} {isSelected && "✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Required Skills (Tag Adder) */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">
              Required Skills & Technologies <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type skill & press Enter (e.g. SEO, Python, React)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill(skillInput);
                  }
                }}
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#078783]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddSkill(skillInput)}
                className="text-xs rounded-xl border-slate-300 text-slate-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* Quick Skill suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
              {commonSkills.slice(0, 10).map((skill) => (
                <button
                  type="button"
                  key={skill}
                  onClick={() => handleAddSkill(skill)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                >
                  +{skill}
                </button>
              ))}
            </div>

            {/* Active Tag list */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {requiredSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Job Description & Responsibilities</label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none resize-none text-xs"
            />
          </div>

          {/* Deadline & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Application Deadline
              </label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Drive Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
              >
                {opportunityStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
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
              ) : isEditing ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Update Drive
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" />
                  Post Job Drive
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
