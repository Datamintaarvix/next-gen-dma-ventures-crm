"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  enquirySchema,
  EnquiryFormData,
  EnquiryRecord,
  enquirySourceList,
  enquiryStatusEnum,
} from "@/lib/validations/enquiry";
import { leadCourseList } from "@/lib/validations/lead";
import { CourseSelect } from "@/components/courses/course-select";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (enquiry: EnquiryRecord) => void;
  initialData?: EnquiryRecord | null;
}

export function EnquiryModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: EnquiryModalProps) {
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
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      studentName: "",
      phoneNumber: "",
      email: "",
      interestedCourse: leadCourseList[0],
      enquirySource: enquirySourceList[0],
      enquiryDate: new Date().toISOString().split("T")[0],
      enquiryMessage: "",
      assignedCounsellor: "",
      status: "New",
      nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        studentName: initialData.studentName,
        phoneNumber: initialData.phoneNumber,
        email: initialData.email || "",
        interestedCourse: initialData.interestedCourse,
        enquirySource: initialData.enquirySource,
        enquiryDate: initialData.enquiryDate,
        enquiryMessage: initialData.enquiryMessage,
        assignedCounsellor: initialData.assignedCounsellor,
        status: initialData.status,
        nextFollowUpDate: initialData.nextFollowUpDate,
      });
    } else {
      reset({
        studentName: "",
        phoneNumber: "",
        email: "",
        interestedCourse: leadCourseList[0],
        enquirySource: enquirySourceList[0],
        enquiryDate: new Date().toISOString().split("T")[0],
        enquiryMessage: "",
        assignedCounsellor: "",
        status: "New",
        nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
    }
    setServerError(null);
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: EnquiryFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const url = isEditMode && initialData
        ? `/api/enquiries/${initialData.id}`
        : "/api/enquiries";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to save enquiry record");
      }

      onSaved(result.data);
      onClose();
    } catch (err: any) {
      console.error("Enquiry save error:", err);
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
              {isEditMode ? `ENQUIRY: ${initialData?.enquiryCode}` : "NEW RECORD"}
            </div>
            <h2 className="text-lg font-bold text-[#11232B]">
              {isEditMode ? "Edit Enquiry Details" : "Add New Enquiry"}
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
                Student Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ananya Rao"
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
                placeholder="e.g. +91 98450 32198"
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
                placeholder="e.g. ananya.rao@outlook.com"
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
                {...register("enquirySource")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white cursor-pointer font-medium"
              >
                {enquirySourceList.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
              {errors.enquirySource && (
                <p className="mt-1 text-[11px] text-red-500">{errors.enquirySource.message}</p>
              )}
            </div>

            {/* Enquiry Date */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Enquiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("enquiryDate")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.enquiryDate && (
                <p className="mt-1 text-[11px] text-red-500">{errors.enquiryDate.message}</p>
              )}
            </div>

            {/* Assigned Counsellor */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Assigned Staff <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mithun K"
                {...register("assignedCounsellor")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.assignedCounsellor && (
                <p className="mt-1 text-[11px] text-red-500">{errors.assignedCounsellor.message}</p>
              )}
            </div>

            {/* Enquiry Status */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Enquiry Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white cursor-pointer font-medium"
              >
                {enquiryStatusEnum.options.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-[11px] text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Next Follow-up Date */}
          <div>
            <label className="block text-xs font-semibold text-[#11232B] mb-1">
              Next Follow-up Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("nextFollowUpDate")}
              className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
            />
            {errors.nextFollowUpDate && (
              <p className="mt-1 text-[11px] text-red-500">{errors.nextFollowUpDate.message}</p>
            )}
          </div>

          {/* Enquiry Message */}
          <div>
            <label className="block text-xs font-semibold text-[#11232B] mb-1">
              Enquiry Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="What is the student inquiring about? (e.g. syllabus, batch schedule, fees, eligibility)..."
              {...register("enquiryMessage")}
              className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white resize-none"
            />
            {errors.enquiryMessage && (
              <p className="mt-1 text-[11px] text-red-500">{errors.enquiryMessage.message}</p>
            )}
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
              className="bg-[#078783] hover:bg-[#066F6C] text-white gap-2 min-w-[130px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditMode ? (
                "Update Enquiry"
              ) : (
                "Create Enquiry"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
