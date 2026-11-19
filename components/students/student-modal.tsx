"use client";

import React, { useState, useEffect } from "react";
import {
  StudentRecord,
  StudentFormData,
  studentCourseList,
  studentBatchList,
  studentGenderEnum,
  guardianRelationList,
  studentStatusEnum,
} from "@/lib/validations/student";
import { Button } from "@/components/ui/button";
import { X, Loader2, User, Phone, Mail, MapPin, Calendar, BookOpen, Users, DollarSign } from "lucide-react";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: StudentRecord) => void;
  studentToEdit?: StudentRecord | null;
}

export function StudentModal({
  isOpen,
  onClose,
  onSuccess,
  studentToEdit,
}: StudentModalProps) {
  const isEdit = Boolean(studentToEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<StudentFormData>({
    fullName: "",
    phoneNumber: "+91 ",
    email: "",
    dateOfBirth: "2002-01-01",
    gender: "Male",
    address: "",
    guardianName: "",
    guardianPhone: "+91 ",
    guardianRelation: "Father",
    course: "Digital Marketing",
    batchCode: "DM-2026-M1",
    admissionDate: todayStr,
    joiningDate: todayStr,
    status: "Active",
    totalFee: 45000,
    paidAmount: 20000,
    notes: "",
  });

  // Pre-fill on edit
  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        fullName: studentToEdit.fullName,
        phoneNumber: studentToEdit.phoneNumber,
        email: studentToEdit.email,
        dateOfBirth: studentToEdit.dateOfBirth,
        gender: studentToEdit.gender,
        address: studentToEdit.address,
        guardianName: studentToEdit.guardianName,
        guardianPhone: studentToEdit.guardianPhone,
        guardianRelation: (studentToEdit.guardianRelation as any) || "Father",
        course: studentToEdit.course,
        batchCode: studentToEdit.batchCode,
        admissionDate: studentToEdit.admissionDate,
        joiningDate: studentToEdit.joiningDate,
        status: studentToEdit.status,
        totalFee: studentToEdit.totalFee,
        paidAmount: studentToEdit.paidAmount,
        notes: studentToEdit.notes || "",
        linkedLeadId: studentToEdit.linkedLeadId,
        linkedLeadCode: studentToEdit.linkedLeadCode,
        linkedEnquiryId: studentToEdit.linkedEnquiryId,
        linkedEnquiryCode: studentToEdit.linkedEnquiryCode,
      });
    } else {
      setFormData({
        fullName: "",
        phoneNumber: "+91 ",
        email: "",
        dateOfBirth: "2002-01-01",
        gender: "Male",
        address: "",
        guardianName: "",
        guardianPhone: "+91 ",
        guardianRelation: "Father",
        course: "Digital Marketing",
        batchCode: "DM-2026-M1",
        admissionDate: todayStr,
        joiningDate: todayStr,
        status: "Active",
        totalFee: 45000,
        paidAmount: 20000,
        notes: "",
      });
    }
    setError(null);
  }, [studentToEdit, isOpen]);

  // When course changes, adjust batch choice
  const handleCourseChange = (course: string) => {
    const relevantBatches = studentBatchList.filter((b) => b.course === course);
    const firstBatchCode = relevantBatches.length > 0 ? relevantBatches[0].code : "";
    setFormData((prev) => ({
      ...prev,
      course,
      batchCode: firstBatchCode || prev.batchCode,
    }));
  };

  const availableBatches = studentBatchList.filter((b) => b.course === formData.course);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/students/${studentToEdit!.id}` : "/api/students";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save student record");
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
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-2xl shadow-xl border border-[#E2ECEB] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2ECEB] bg-[#FAFCFB]">
          <div>
            <h2 className="text-lg font-bold text-[#11232B]">
              {isEdit ? `Edit Student Record (${studentToEdit?.studentCode})` : "Register New Student"}
            </h2>
            <p className="text-xs text-[#5A7178] mt-0.5">
              {isEdit
                ? "Update student profile, enrollment details, and parent contact"
                : "Fill out the admission form below to enroll a new student"}
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-xs font-bold text-[#078783] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              1. Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aarav.sharma@example.com"
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[#11232B] mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full h-9 px-2 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#11232B] mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full h-9 px-2 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                  >
                    {studentGenderEnum.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Residential Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House/Flat No, Street, Area, City, State, Pincode"
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Guardian Details */}
          <div className="pt-2 border-t border-[#E2ECEB]">
            <h3 className="text-xs font-bold text-[#078783] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              2. Parent / Guardian Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Guardian Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  placeholder="+91 98765 43200"
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.guardianRelation}
                  onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                >
                  {guardianRelationList.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Course & Batch Details */}
          <div className="pt-2 border-t border-[#E2ECEB]">
            <h3 className="text-xs font-bold text-[#078783] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              3. Course & Batch Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Selected Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.course}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                >
                  {studentCourseList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Assigned Batch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.batchCode}
                  onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                >
                  {availableBatches.length > 0 ? (
                    availableBatches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} ({b.timing})
                      </option>
                    ))
                  ) : (
                    <option value={formData.batchCode}>{formData.batchCode}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Admission Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Batch Joining / Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Fees & Status */}
          <div className="pt-2 border-t border-[#E2ECEB]">
            <h3 className="text-xs font-bold text-[#078783] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              4. Fees & Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Total Course Fee (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.totalFee}
                  onChange={(e) => setFormData({ ...formData, totalFee: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Initial Paid Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={formData.totalFee}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11232B] mb-1">
                  Enrollment Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
                >
                  {studentStatusEnum.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-[#11232B] mb-1">
                Academic & Counsellor Remarks
              </label>
              <textarea
                rows={2}
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Background, placement expectations, installment terms..."
                className="w-full p-2.5 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
            </div>
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
                "Update Student"
              ) : (
                "Enroll Student"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
