"use client";

import React, { useState, useEffect } from "react";
import { BatchRecord, BatchStatus, batchStatusEnum } from "@/lib/validations/batch";
import { StudentRecord } from "@/lib/validations/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Layers,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  Edit,
  UserPlus,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";

interface BatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchRecord | null;
  onEdit: (batch: BatchRecord) => void;
  onStatusChange: (id: string, newStatus: BatchStatus) => Promise<void>;
  onOpenAssignModal: (batch: BatchRecord) => void;
  onRefresh: () => void;
}

export function BatchDetailsModal({
  isOpen,
  onClose,
  batch,
  onEdit,
  onStatusChange,
  onOpenAssignModal,
  onRefresh,
}: BatchDetailsModalProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<StudentRecord[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (batch && isOpen) {
      setIsLoadingDetails(true);
      fetch(`/api/batches/${batch.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setEnrolledStudents(data.data.enrolledStudents || []);
          }
        })
        .catch((e) => console.error("Error loading batch details:", e))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [batch, isOpen]);

  if (!isOpen || !batch) return null;

  const handleStatusSelect = async (newStatus: BatchStatus) => {
    if (newStatus === batch.status) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(batch.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student from the batch?")) return;
    setRemovingStudentId(studentId);
    try {
      const res = await fetch(`/api/batches/${batch.id}/students?studentId=${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove student");
      }
      setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId));
      onRefresh();
    } catch (e: any) {
      alert("Error removing student: " + e.message);
    } finally {
      setRemovingStudentId(null);
    }
  };

  const percentFilled = Math.min(
    100,
    Math.round(((batch.enrolledCount || enrolledStudents.length) / batch.maxCapacity) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2ECEB] bg-[#FAFCFB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E6F5F4] text-[#078783] flex items-center justify-center font-bold text-lg shrink-0 border border-[#BDE7E5]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#11232B]">{batch.batchName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-medium border border-[#E2ECEB]">
                  {batch.batchCode}
                </span>
                <Badge
                  variant={
                    batch.status === "Active"
                      ? "active"
                      : batch.status === "Upcoming"
                      ? "upcoming"
                      : batch.status === "Completed"
                      ? "completed"
                      : "cancelled"
                  }
                  className="capitalize"
                >
                  {batch.status}
                </Badge>
              </div>
              <p className="text-xs text-[#5A7178] mt-0.5">
                {batch.courseName} · Trainer: {batch.trainer}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Quick Status Select */}
            <div className="flex items-center gap-1.5 bg-[#F3F8F7] px-2.5 py-1 rounded-lg border border-[#D5E2E0]">
              <span className="text-[11px] font-medium text-[#5A7178]">Status:</span>
              <select
                disabled={isUpdatingStatus}
                value={batch.status}
                onChange={(e) => handleStatusSelect(e.target.value as BatchStatus)}
                className="bg-transparent text-xs font-semibold text-[#11232B] focus:outline-none cursor-pointer"
              >
                {batchStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(batch);
              }}
              className="h-8 text-xs gap-1.5"
            >
              <Edit className="w-3.5 h-3.5 text-[#078783]" />
              Edit
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#7B939B] hover:text-[#11232B] hover:bg-[#F3F8F7] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#F9FBFA]">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
              <div className="text-[11px] text-[#7B939B] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#078783]" />
                Class Timings
              </div>
              <div className="text-xs font-bold text-[#11232B] mt-1">{batch.classTimings}</div>
              <div className="text-[10px] text-[#7B939B] mt-0.5">{batch.classDays}</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
              <div className="text-[11px] text-[#7B939B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                Cohort Dates
              </div>
              <div className="text-xs font-bold text-[#11232B] mt-1">{batch.startDate}</div>
              <div className="text-[10px] text-[#7B939B] mt-0.5">to {batch.endDate}</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
              <div className="text-[11px] text-[#7B939B] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Enrolled Students
              </div>
              <div className="text-sm font-bold text-emerald-700 mt-1">
                {enrolledStudents.length || batch.enrolledCount} / {batch.maxCapacity}
              </div>
              <div className="text-[10px] text-[#7B939B] mt-0.5">{percentFilled}% capacity filled</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
              <div className="text-[11px] text-[#7B939B] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
                Classroom
              </div>
              <div className="text-xs font-bold text-[#11232B] mt-1 truncate">
                {batch.classroom || "Main Campus"}
              </div>
              <div className="text-[10px] text-[#7B939B] mt-0.5">In-Person & Live Stream</div>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E2ECEB] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#11232B]">Batch Enrollment Progress</span>
              <span className="text-[#078783]">
                {batch.availableSeats} seat(s) available
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#E2ECEB] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentFilled >= 100
                    ? "bg-red-500"
                    : percentFilled >= 75
                    ? "bg-amber-500"
                    : "bg-[#078783]"
                }`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#7B939B]">
              <span>0 Seats</span>
              <span>Capacity: {batch.maxCapacity} Learners</span>
            </div>
          </div>

          {/* Description & Trainer Card */}
          {batch.description && (
            <div className="bg-white p-4 rounded-xl border border-[#E2ECEB] shadow-sm space-y-1.5">
              <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider">
                Batch Description
              </h4>
              <p className="text-xs text-[#5A7178] leading-relaxed">
                {batch.description}
              </p>
            </div>
          )}

          {/* Enrolled Students Table */}
          <div className="bg-white rounded-xl border border-[#E2ECEB] shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-[#E2ECEB] bg-[#FAFCFB] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider">
                  Enrolled Students ({enrolledStudents.length})
                </h4>
                <p className="text-[11px] text-[#7B939B] mt-0.5">
                  Learners actively registered in this batch schedule
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => onOpenAssignModal(batch)}
                disabled={batch.status === "Completed" || batch.status === "Cancelled"}
                className="h-8 text-xs bg-[#078783] hover:bg-[#066e6b] text-white gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign Student
              </Button>
            </div>

            {isLoadingDetails ? (
              <div className="p-8 text-center text-xs text-[#7B939B]">
                Loading enrolled students...
              </div>
            ) : enrolledStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAFCFB] text-[#7B939B] border-b border-[#E2ECEB]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Student Code</th>
                      <th className="py-2.5 px-4 font-semibold">Full Name</th>
                      <th className="py-2.5 px-4 font-semibold">Contact</th>
                      <th className="py-2.5 px-4 font-semibold">Attendance</th>
                      <th className="py-2.5 px-4 font-semibold">Fee Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2ECEB]">
                    {enrolledStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[#F9FBFA]">
                        <td className="py-2.5 px-4 font-mono font-medium text-[#11232B]">
                          {s.studentCode}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[#11232B]">
                          {s.fullName}
                        </td>
                        <td className="py-2.5 px-4 text-[#5A7178]">
                          {s.phoneNumber}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-700">
                          {s.attendancePercentage}%
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant={s.paymentStatus === "Paid" ? "paid" : "partial"}>
                            {s.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => handleRemoveStudent(s.id)}
                            disabled={removingStudentId === s.id}
                            className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#7B939B] space-y-2">
                <div>No students currently assigned to this batch.</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAssignModal(batch)}
                  className="text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1 text-[#078783]" />
                  Enroll First Student
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
