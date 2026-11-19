"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  leadSchema,
  LeadFormData,
  LeadRecord,
  leadCourseList,
  leadSourceList,
  leadStatusEnum,
} from "@/lib/validations/lead";
import { CourseSelect } from "@/components/courses/course-select";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (lead: LeadRecord) => void;
  initialData?: LeadRecord | null;
}

export function LeadModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: LeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditMode = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      studentName: "",
      phoneNumber: "",
      email: "",
      interestedCourse: leadCourseList[0],
      leadSource: leadSourceList[0],
      status: "New",
      assignedCounselor: "",
      followUpDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        studentName: initialData.studentName,
        phoneNumber: initialData.phoneNumber,
        email: initialData.email || "",
        interestedCourse: initialData.interestedCourse,
        leadSource: initialData.leadSource,
        status: initialData.status,
        assignedCounselor: initialData.assignedCounselor,
        followUpDate: initialData.followUpDate,
        notes: initialData.notes || "",
      });
    } else {
      reset({
        studentName: "",
        phoneNumber: "",
        email: "",
        interestedCourse: leadCourseList[0],
        leadSource: leadSourceList[0],
        status: "New",
        assignedCounselor: "",
        followUpDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
    setServerError(null);
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const url = isEditMode && initialData
        ? `/api/leads/${initialData.id}`
        : "/api/leads";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to save lead record");
      }

      onSaved(result.data);
      onClose();
    } catch (err: any) {
      console.error("Lead save error:", err);
      setServerError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2ECEB] flex items-center justify-between bg-[#FAFCFB]">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#078783] uppercase">
              {isEditMode ? `LEAD RECORD: ${initialData?.leadCode}` : "NEW RECORD"}
            </div>
            <h2 className="text-lg font-bold text-[#11232B]">
              {isEditMode ? "Edit Lead Information" : "Create New Lead"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A9EA5] hover:text-[#11232B] hover:bg-[#F3F8F7] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                {...register("studentName")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.studentName && (
                <p className="mt-1 text-[11px] text-red-500">{errors.studentName.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                {...register("phoneNumber")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-[11px] text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. aarav.sharma@gmail.com"
                {...register("email")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Interested Course */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Interested Course <span className="text-red-500">*</span>
              </label>
              <CourseSelect
                value={watch("interestedCourse")}
                onChange={(val) => setValue("interestedCourse", val, { shouldValidate: true })}
                placeholder="Select or search course..."
                error={errors.interestedCourse?.message}
              />
              {errors.interestedCourse && (
                <p className="mt-1 text-[11px] text-red-500">{errors.interestedCourse.message}</p>
              )}
            </div>

            {/* Enquiry Source */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Enquiry Source <span className="text-red-500">*</span>
              </label>
              <select
                {...register("leadSource")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white cursor-pointer"
              >
                {leadSourceList.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
              {errors.leadSource && (
                <p className="mt-1 text-[11px] text-red-500">{errors.leadSource.message}</p>
              )}
            </div>

            {/* Lead Status */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Lead Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white cursor-pointer font-medium"
              >
                {leadStatusEnum.options.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-[11px] text-red-500">{errors.status.message}</p>
              )}
            </div>

            {/* Assigned Staff */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Assigned Staff <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mithun K"
                {...register("assignedCounselor")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.assignedCounselor && (
                <p className="mt-1 text-[11px] text-red-500">{errors.assignedCounselor.message}</p>
              )}
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Next Follow-up Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("followUpDate")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.followUpDate && (
                <p className="mt-1 text-[11px] text-red-500">{errors.followUpDate.message}</p>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#11232B] mb-1">
              Additional Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Background, career goals, demo workshop attended, payment preferences..."
              {...register("notes")}
              className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E2ECEB] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#078783] hover:bg-[#066F6C] text-white gap-2 min-w-[120px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditMode ? (
                "Update Lead"
              ) : (
                "Save Lead"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
