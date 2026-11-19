"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  followUpSchema,
  FollowUpFormData,
  FollowUpRecord,
  followUpTypeEnum,
  followUpPriorityEnum,
  followUpRelatedTypeEnum,
} from "@/lib/validations/follow-up";
import { leadCounselorList } from "@/lib/validations/lead";
import { Button } from "@/components/ui/button";
import { X, Loader2, Link2 } from "lucide-react";

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (record: FollowUpRecord) => void;
  initialData?: FollowUpRecord | null;
  defaultRelatedType?: "Lead" | "Enquiry" | "General";
  defaultRelatedId?: string;
  defaultRelatedCode?: string;
  defaultStudentName?: string;
  defaultPhone?: string;
  defaultCounsellor?: string;
}

export function FollowUpModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  defaultRelatedType = "General",
  defaultRelatedId,
  defaultRelatedCode,
  defaultStudentName,
  defaultPhone,
  defaultCounsellor,
}: FollowUpModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Available leads and enquiries for quick linking
  const [leadsList, setLeadsList] = useState<{ id: string; leadCode: string; studentName: string; phoneNumber: string; assignedCounselor: string }[]>([]);
  const [enquiriesList, setEnquiriesList] = useState<{ id: string; enquiryCode: string; studentName: string; phoneNumber: string; assignedCounsellor: string }[]>([]);

  const isEditMode = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      studentName: defaultStudentName || "",
      relatedType: defaultRelatedType,
      relatedId: defaultRelatedId || null,
      relatedCode: defaultRelatedCode || null,
      contactNumber: defaultPhone || "",
      followUpDate: new Date().toISOString().split("T")[0],
      followUpTime: "11:00",
      type: "Phone Call",
      assignedCounsellor: defaultCounsellor || leadCounselorList[0],
      priority: "Medium",
      status: "Pending",
      notes: "",
    },
  });

  const selectedRelatedType = watch("relatedType");

  // Fetch leads and enquiries for auto-link dropdown
  useEffect(() => {
    if (isOpen) {
      fetch("/api/leads")
        .then((res) => res.json())
        .then((d) => {
          if (d.success) setLeadsList(d.data);
        })
        .catch(() => {});

      fetch("/api/enquiries")
        .then((res) => res.json())
        .then((d) => {
          if (d.success) setEnquiriesList(d.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      reset({
        studentName: initialData.studentName,
        relatedType: initialData.relatedType,
        relatedId: initialData.relatedId || null,
        relatedCode: initialData.relatedCode || null,
        contactNumber: initialData.contactNumber,
        followUpDate: initialData.followUpDate,
        followUpTime: initialData.followUpTime,
        type: initialData.type,
        assignedCounsellor: initialData.assignedCounsellor,
        priority: initialData.priority,
        status: initialData.status,
        notes: initialData.notes || "",
      });
    } else {
      reset({
        studentName: defaultStudentName || "",
        relatedType: defaultRelatedType,
        relatedId: defaultRelatedId || null,
        relatedCode: defaultRelatedCode || null,
        contactNumber: defaultPhone || "",
        followUpDate: new Date().toISOString().split("T")[0],
        followUpTime: "11:00",
        type: "Phone Call",
        assignedCounsellor: defaultCounsellor || leadCounselorList[0],
        priority: "Medium",
        status: "Pending",
        notes: "",
      });
    }
    setServerError(null);
  }, [
    initialData,
    isOpen,
    reset,
    defaultStudentName,
    defaultPhone,
    defaultRelatedType,
    defaultRelatedId,
    defaultRelatedCode,
    defaultCounsellor,
  ]);

  if (!isOpen) return null;

  // Auto-fill student info when selecting from Lead dropdown
  const handleSelectLead = (leadId: string) => {
    const lead = leadsList.find((l) => l.id === leadId);
    if (lead) {
      setValue("relatedId", lead.id);
      setValue("relatedCode", lead.leadCode);
      setValue("studentName", lead.studentName);
      setValue("contactNumber", lead.phoneNumber);
      if (lead.assignedCounselor) {
        setValue("assignedCounsellor", lead.assignedCounselor);
      }
    }
  };

  // Auto-fill student info when selecting from Enquiry dropdown
  const handleSelectEnquiry = (enquiryId: string) => {
    const enq = enquiriesList.find((e) => e.id === enquiryId);
    if (enq) {
      setValue("relatedId", enq.id);
      setValue("relatedCode", enq.enquiryCode);
      setValue("studentName", enq.studentName);
      setValue("contactNumber", enq.phoneNumber);
      if (enq.assignedCounsellor) {
        setValue("assignedCounsellor", enq.assignedCounsellor);
      }
    }
  };

  const onSubmit = async (data: FollowUpFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const url = isEditMode && initialData
        ? `/api/follow-ups/${initialData.id}`
        : "/api/follow-ups";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to save follow-up record");
      }

      onSaved(result.data);
      onClose();
    } catch (err: any) {
      console.error("Follow-up save error:", err);
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
              {isEditMode ? `FOLLOW-UP: ${initialData?.followUpCode}` : "NEW FOLLOW-UP"}
            </div>
            <h2 className="text-lg font-bold text-[#11232B]">
              {isEditMode ? "Edit Follow-up Details" : "Schedule New Follow-up"}
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

          {/* Related Lead or Enquiry selector */}
          <div className="p-3.5 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#11232B]">
              <Link2 className="w-3.5 h-3.5 text-[#078783]" />
              <span>Link with CRM Module (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A7178] mb-1">
                  Source Type
                </label>
                <select
                  {...register("relatedType")}
                  className="w-full px-3 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                >
                  {followUpRelatedTypeEnum.options.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt === "General" ? "General Contact (Standalone)" : `${rt} Record`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRelatedType === "Lead" && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#5A7178] mb-1">
                    Select Lead Record
                  </label>
                  <select
                    onChange={(e) => handleSelectLead(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leadsList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.leadCode} · {l.studentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRelatedType === "Enquiry" && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#5A7178] mb-1">
                    Select Enquiry Record
                  </label>
                  <select
                    onChange={(e) => handleSelectEnquiry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  >
                    <option value="">-- Choose Enquiry --</option>
                    {enquiriesList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiryCode} · {e.studentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Student / Lead Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Meera Krishnan"
                {...register("studentName")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.studentName && (
                <p className="mt-1 text-[11px] text-red-500">{errors.studentName.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 99001 45678"
                {...register("contactNumber")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.contactNumber && (
                <p className="mt-1 text-[11px] text-red-500">{errors.contactNumber.message}</p>
              )}
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Follow-up Date <span className="text-red-500">*</span>
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

            {/* Follow-up Time */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Follow-up Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                {...register("followUpTime")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white"
              />
              {errors.followUpTime && (
                <p className="mt-1 text-[11px] text-red-500">{errors.followUpTime.message}</p>
              )}
            </div>

            {/* Follow-up Type */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Follow-up Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("type")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white cursor-pointer font-medium"
              >
                {followUpTypeEnum.options.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-[11px] text-red-500">{errors.type.message}</p>
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

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                {...register("priority")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white cursor-pointer font-medium"
              >
                {followUpPriorityEnum.options.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>

            {/* Follow-up Status */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white cursor-pointer font-medium"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Missed">Missed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Notes and Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#11232B] mb-1">
              Notes & Discussion Agenda
            </label>
            <textarea
              rows={3}
              placeholder="What needs to be discussed or followed up on?..."
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
              className="bg-[#078783] hover:bg-[#066F6C] text-white gap-2 min-w-[130px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditMode ? (
                "Update Follow-up"
              ) : (
                "Schedule Follow-up"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
