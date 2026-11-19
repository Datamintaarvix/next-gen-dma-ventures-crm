"use client";

import React, { useState, useEffect } from "react";
import { BatchRecord } from "@/lib/validations/batch";
import { StudentRecord } from "@/lib/validations/student";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  UserPlus,
  ArrowRightLeft,
  Loader2,
  Users,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AssignStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchRecord | null;
  onSuccess: () => void;
}

export function AssignStudentModal({
  isOpen,
  onClose,
  batch,
  onSuccess,
}: AssignStudentModalProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && batch) {
      setIsLoadingStudents(true);
      setError(null);
      setSelectedStudentId("");
      setRemarks("");

      fetch("/api/students")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setStudents(data.data);
          }
        })
        .catch((e) => console.error("Error loading students:", e))
        .finally(() => setIsLoadingStudents(false));
    }
  }, [isOpen, batch]);

  if (!isOpen || !batch) return null;

  const isFull = (batch.availableSeats || 0) <= 0;

  // Selected student record
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Check if student is already in this batch
  const isAlreadyInThisBatch = selectedStudent
    ? selectedStudent.batchCode?.toLowerCase() === batch.batchCode.toLowerCase()
    : false;

  // Check if student is in another batch (meaning this is a Transfer)
  const isTransfer = selectedStudent
    ? Boolean(selectedStudent.batchCode && selectedStudent.batchCode !== "Unassigned" && !isAlreadyInThisBatch)
    : false;

  // Filter students by search term
  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      s.phoneNumber.includes(q) ||
      s.course.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError("Please select a student");
      return;
    }
    if (isAlreadyInThisBatch) {
      setError("This student is already enrolled in this batch");
      return;
    }
    if (isFull) {
      setError("This batch is at full capacity. Cannot enroll more students.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        studentId: selectedStudentId,
        remarks: remarks || undefined,
      };

      if (isTransfer && selectedStudent?.batchCode) {
        payload.transferFromBatchCode = selectedStudent.batchCode;
      }

      const res = await fetch(`/api/batches/${batch.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to assign student");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete student assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E2ECEB] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2ECEB] bg-[#FAFCFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E6F5F4] text-[#078783] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#11232B]">
                Assign Student to Batch
              </h2>
              <p className="text-xs text-[#5A7178]">
                {batch.batchName} ({batch.batchCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7B939B] hover:text-[#11232B] hover:bg-[#F3F8F7] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capacity Strip */}
        <div className="px-5 py-3 bg-[#F9FBFA] border-b border-[#E2ECEB] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#078783]" />
            <span className="text-[#5A7178]">
              Capacity:{" "}
              <strong className="text-[#11232B]">
                {batch.enrolledCount} / {batch.maxCapacity} seats
              </strong>
            </span>
          </div>

          <Badge variant={isFull ? "dropped" : "active"} className="text-[11px]">
            {isFull ? "Full Capacity" : `${batch.availableSeats} Seats Available`}
          </Badge>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Student Search & Selector */}
          <div>
            <label className="block text-xs font-medium text-[#11232B] mb-1">
              Select Student to Enroll / Transfer <span className="text-red-500">*</span>
            </label>

            {/* Quick search input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B939B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, code, or course..."
                className="w-full h-8 pl-8 pr-3 rounded-md bg-[#FAFCFB] border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            <select
              required
              disabled={isLoadingStudents || isFull}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
            >
              <option value="">-- Choose student from directory --</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode}) — Course: {s.course} [Current: {s.batchCode || "None"}]
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Notice if student is in another batch */}
          {selectedStudent && (
            <div className="p-3 rounded-xl border text-xs space-y-1 bg-[#FAFCFB]">
              {isAlreadyInThisBatch ? (
                <div className="text-amber-800 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  This student is already enrolled in {batch.batchName}.
                </div>
              ) : isTransfer ? (
                <div className="text-[#2563EB] font-medium flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Mode: Student will be moved from batch{" "}
                  <strong>{selectedStudent.batchCode}</strong> to{" "}
                  <strong>{batch.batchCode}</strong>.
                </div>
              ) : (
                <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Student is currently unassigned and ready for enrollment.
                </div>
              )}
              <div className="text-[11px] text-[#7B939B]">
                Enrolled Course: {selectedStudent.course} · Attendance:{" "}
                {selectedStudent.attendancePercentage}%
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-[#11232B] mb-1">
              Transfer / Assignment Remarks (optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Shifted from evening batch due to work schedule change..."
              className="w-full h-9 px-3 rounded-lg border border-[#D5E2E0] text-xs text-[#11232B] focus:outline-none focus:border-[#078783]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E2ECEB] flex items-center justify-end gap-2.5">
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
              disabled={isSubmitting || !selectedStudentId || isAlreadyInThisBatch || isFull}
              className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : isTransfer ? (
                "Transfer Student"
              ) : (
                "Enroll in Batch"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
