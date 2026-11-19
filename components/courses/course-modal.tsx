"use client";

import React, { useState, useEffect } from "react";
import {
  CourseRecord,
  CourseFormData,
  courseCategoryList,
  courseLevelEnum,
  courseModeEnum,
  courseStatusEnum,
  courseInstructorList,
} from "@/lib/validations/course";
import { Button } from "@/components/ui/button";
import { X, Loader2, BookOpen, Clock, DollarSign, UserCheck, Layers, FileText } from "lucide-react";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (course: CourseRecord) => void;
  courseToEdit?: CourseRecord | null;
}

export function CourseModal({
  isOpen,
  onClose,
  onSuccess,
  courseToEdit,
}: CourseModalProps) {
  const isEdit = Boolean(courseToEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CourseFormData>({
    courseName: "",
    category: "Digital Marketing",
    description: "",
    duration: "12 Weeks (120 Hours)",
    durationWeeks: 12,
    fees: 45000,
    syllabus: [
      "Core Foundations & Industry Introduction",
      "Practical Hands-on Tool Implementation",
      "Live Industry Projects & Case Studies",
      "Capstone Project & Portfolio Packaging",
    ],
    instructor: "Karan Verma",
    instructorBio: "",
    status: "Active",
    level: "All Levels",
    mode: "Classroom & Online",
    maxBatchCapacity: 25,
    imageUrl: null,
  });

  const [syllabusText, setSyllabusText] = useState("");

  useEffect(() => {
    if (courseToEdit) {
      setFormData({
        courseName: courseToEdit.courseName,
        category: courseToEdit.category,
        description: courseToEdit.description,
        duration: courseToEdit.duration,
        durationWeeks: courseToEdit.durationWeeks,
        fees: courseToEdit.fees,
        syllabus: courseToEdit.syllabus,
        instructor: courseToEdit.instructor,
        instructorBio: courseToEdit.instructorBio || "",
        status: courseToEdit.status,
        level: courseToEdit.level,
        mode: courseToEdit.mode,
        maxBatchCapacity: courseToEdit.maxBatchCapacity || 25,
        imageUrl: courseToEdit.imageUrl,
      });
      setSyllabusText(courseToEdit.syllabus.join("\n"));
    } else {
      const defaultSyllabus = [
        "Module 1: Foundations & Core Concepts",
        "Module 2: Practical Tool Workflows & Labs",
        "Module 3: Advanced Topics & Real-world Scenarios",
        "Module 4: Capstone Project & Portfolio Review",
      ];
      setFormData({
        courseName: "",
        category: "Digital Marketing",
        description: "",
        duration: "12 Weeks (120 Hours)",
        durationWeeks: 12,
        fees: 45000,
        syllabus: defaultSyllabus,
        instructor: "Karan Verma",
        instructorBio: "",
        status: "Active",
        level: "All Levels",
        mode: "Classroom & Online",
        maxBatchCapacity: 25,
        imageUrl: null,
      });
      setSyllabusText(defaultSyllabus.join("\n"));
    }
    setError(null);
  }, [courseToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Parse syllabus text into array
    const syllabusList = syllabusText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (syllabusList.length === 0) {
      setError("Please add at least one syllabus topic or module");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      syllabus: syllabusList,
    };

    try {
      const url = isEdit ? `/api/courses/${courseToEdit!.id}` : "/api/courses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save course");
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white rounded-2xl shadow-xl border border-[#E2ECEB] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2ECEB] bg-[#FAFCFB]">
          <div>
            <h2 className="text-lg font-bold text-[#11232B]">
              {isEdit ? `Edit Course (${courseToEdit?.courseCode})` : "Create New Course"}
            </h2>
            <p className="text-xs text-[#5A7178] mt-0.5">
              {isEdit
                ? "Update curriculum, fee structures, syllabus, and instructor details"
                : "Fill out the course specifications to launch a new curriculum"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7B939B] hover:text-[#11232B] hover:bg-[#F3F8F7] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Course Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                placeholder="e.g. Digital Marketing Masterclass"
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              >
                {courseCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Description */}
          <div>
            <label className="block text-xs font-medium text-[#11232B] mb-1">
              Course Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a comprehensive summary of learning goals, target audience, and job outcomes..."
              className="w-full p-2.5 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
            />
          </div>

          {/* Duration, Fees & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Duration Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 12 Weeks (120 Hours)"
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Duration in Weeks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={52}
                value={formData.durationWeeks}
                onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Course Fees (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
            </div>
          </div>

          {/* Level, Mode & Max Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Target Level <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              >
                {courseLevelEnum.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Delivery Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              >
                {courseModeEnum.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Max Batch Size
              </label>
              <input
                type="number"
                min={5}
                max={50}
                value={formData.maxBatchCapacity}
                onChange={(e) => setFormData({ ...formData, maxBatchCapacity: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>
          </div>

          {/* Instructor & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Lead Instructor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="e.g. Karan Verma"
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Course Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              >
                {courseStatusEnum.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Instructor Bio */}
          <div>
            <label className="block text-xs font-medium text-[#11232B] mb-1">
              Instructor Biography & Credentials
            </label>
            <input
              type="text"
              value={formData.instructorBio || ""}
              onChange={(e) => setFormData({ ...formData, instructorBio: e.target.value })}
              placeholder="e.g. Senior Architect with 8+ years experience in Fortune 500 tech..."
              className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
            />
          </div>

          {/* Syllabus Modules */}
          <div>
            <label className="block text-xs font-medium text-[#11232B] mb-1">
              Course Syllabus / Modules (one per line) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Enter each module or core topic on a separate line..."
              className="w-full p-2.5 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783] font-mono leading-relaxed"
            />
            <p className="text-[11px] text-[#7B939B] mt-1">
              Each line is rendered as an independent curriculum chapter in student view.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E2ECEB] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Course"
              ) : (
                "Create Course"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
