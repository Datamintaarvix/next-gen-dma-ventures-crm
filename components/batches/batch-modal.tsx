"use client";

import React, { useState, useEffect } from "react";
import {
  BatchRecord,
  BatchFormData,
  batchStatusEnum,
  batchClassDaysList,
  batchTrainerList,
} from "@/lib/validations/batch";
import { Button } from "@/components/ui/button";
import { X, Loader2, Layers, Calendar, Clock, UserCheck, Users, MapPin } from "lucide-react";
import { CourseSelect } from "@/components/courses/course-select";
import { ALL_COURSES } from "@/lib/courses";

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (batch: BatchRecord) => void;
  batchToEdit?: BatchRecord | null;
}

export function BatchModal({
  isOpen,
  onClose,
  onSuccess,
  batchToEdit,
}: BatchModalProps) {
  const isEdit = Boolean(batchToEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseList, setCourseList] = useState<string[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<BatchFormData>({
    batchName: "",
    courseName: "Digital Marketing",
    trainer: "Karan Verma",
    startDate: todayStr,
    endDate: "2027-02-28",
    classDays: "Mon - Fri",
    classTimings: "09:00 AM - 11:00 AM",
    maxCapacity: 25,
    status: "Upcoming",
    classroom: "Lab 1 · Digital Studio",
    description: "",
  });

  // Fetch available courses from Course Management
  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const names = data.data.map((c: any) => c.courseName);
          setCourseList(names);
          if (names.length > 0 && !formData.courseName) {
            setFormData((prev) => ({ ...prev, courseName: names[0] }));
          }
        }
      })
      .catch((e) => console.error("Error loading courses for batch:", e));
  }, []);

  useEffect(() => {
    if (batchToEdit) {
      setFormData({
        batchName: batchToEdit.batchName,
        courseName: batchToEdit.courseName,
        trainer: batchToEdit.trainer,
        startDate: batchToEdit.startDate,
        endDate: batchToEdit.endDate,
        classDays: batchToEdit.classDays,
        classTimings: batchToEdit.classTimings,
        maxCapacity: batchToEdit.maxCapacity,
        status: batchToEdit.status,
        classroom: batchToEdit.classroom || "",
        description: batchToEdit.description || "",
      });
    } else {
      setFormData({
        batchName: "",
        courseName: courseList[0] || "Digital Marketing",
        trainer: "Karan Verma",
        startDate: todayStr,
        endDate: "2027-02-28",
        classDays: "Mon - Fri",
        classTimings: "09:00 AM - 11:00 AM",
        maxCapacity: 25,
        status: "Upcoming",
        classroom: "Lab 1 · Digital Studio",
        description: "",
      });
    }
    setError(null);
  }, [batchToEdit, isOpen, courseList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/batches/${batchToEdit!.id}` : "/api/batches";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save batch");
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
              {isEdit ? `Edit Batch (${batchToEdit?.batchCode})` : "Schedule New Batch"}
            </h2>
            <p className="text-xs text-[#5A7178] mt-0.5">
              {isEdit
                ? "Update batch timings, assigned trainer, classroom, and maximum capacity"
                : "Create and schedule a new student cohort connected to course curriculum"}
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
          {/* Batch Name & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.batchName}
                onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                placeholder="e.g. DM Morning Elite"
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Course Curriculum <span className="text-red-500">*</span>
              </label>
              <CourseSelect
                value={formData.courseName}
                onChange={(val) => setFormData({ ...formData, courseName: val })}
                placeholder="Select or search course curriculum..."
              />
            </div>
          </div>

          {/* Trainer & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Assigned Trainer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              >
                {batchTrainerList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Batch Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              >
                {batchStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Batch Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Estimated End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>
          </div>

          {/* Schedule: Days, Timings & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Class Days <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.classDays}
                onChange={(e) => setFormData({ ...formData, classDays: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              >
                {batchClassDaysList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Class Timings <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.classTimings}
                onChange={(e) => setFormData({ ...formData, classTimings: e.target.value })}
                placeholder="09:00 AM - 11:00 AM"
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Max Student Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={5}
                max={100}
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>
          </div>

          {/* Classroom / Location */}
          <div>
            <label className="block text-xs font-medium text-[#11232B] mb-1">
              Classroom / Room Details
            </label>
            <input
              type="text"
              value={formData.classroom || ""}
              onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
              placeholder="e.g. Lab 1 · Digital Studio (or Zoom Room 02)"
              className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#11232B] mb-1">
              Batch Description & Notes
            </label>
            <textarea
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Target student profile, prerequisites, lab requirements..."
              className="w-full p-2.5 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
            />
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
                "Update Batch"
              ) : (
                "Schedule Batch"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
