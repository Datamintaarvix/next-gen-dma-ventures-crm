"use client";

import React, { useState, useEffect } from "react";
import { CourseRecord, CourseStatus, courseStatusEnum } from "@/lib/validations/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  BookOpen,
  Clock,
  DollarSign,
  User,
  Users,
  Layers,
  CheckCircle2,
  ListOrdered,
  Calendar,
  Edit,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";

interface CourseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseRecord | null;
  onEdit: (course: CourseRecord) => void;
  onStatusChange: (id: string, newStatus: CourseStatus) => Promise<void>;
}

export function CourseDetailsModal({
  isOpen,
  onClose,
  course,
  onEdit,
  onStatusChange,
}: CourseDetailsModalProps) {
  const [detailedData, setDetailedData] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"syllabus" | "students" | "batches">("syllabus");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (course && isOpen) {
      setIsLoadingDetails(true);
      fetch(`/api/courses/${course.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setDetailedData(data.data);
          }
        })
        .catch((e) => console.error("Error fetching course details:", e))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [course, isOpen]);

  if (!isOpen || !course) return null;

  const handleStatusSelect = async (newStatus: CourseStatus) => {
    if (newStatus === course.status) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(course.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const enrolledStudents = detailedData?.enrolledStudents || [];
  const associatedBatches = detailedData?.associatedBatches || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2ECEB] bg-[#FAFCFB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E6F5F4] text-[#078783] flex items-center justify-center font-bold text-lg shrink-0 border border-[#BDE7E5]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#11232B]">{course.courseName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-medium border border-[#E2ECEB]">
                  {course.courseCode}
                </span>
                <Badge
                  variant={
                    course.status === "Active"
                      ? "active"
                      : course.status === "Draft"
                      ? "draft"
                      : "inactive"
                  }
                  className="capitalize"
                >
                  {course.status}
                </Badge>
              </div>
              <p className="text-xs text-[#5A7178] mt-0.5">
                {course.category} · {course.level} Level · {course.mode}
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
                value={course.status}
                onChange={(e) => handleStatusSelect(e.target.value as CourseStatus)}
                className="bg-transparent text-xs font-semibold text-[#11232B] focus:outline-none cursor-pointer"
              >
                {courseStatusEnum.map((st) => (
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
                onEdit(course);
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
                Duration
              </div>
              <div className="text-sm font-bold text-[#11232B] mt-1">{course.duration}</div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
              <div className="text-[11px] text-[#7B939B] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Course Fee
              </div>
              <div className="text-sm font-bold text-emerald-700 mt-1">
                ₹{course.fees.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
              <div className="text-[11px] text-[#7B939B] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                Enrolled Students
              </div>
              <div className="text-sm font-bold text-[#2563EB] mt-1">
                {course.enrolledStudentsCount || enrolledStudents.length} Students
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[#E2ECEB] shadow-sm">
              <div className="text-[11px] text-[#7B939B] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
                Active Batches
              </div>
              <div className="text-sm font-bold text-[#7C3AED] mt-1">
                {associatedBatches.length || course.activeBatchesCount || 0} Batches
              </div>
            </div>
          </div>

          {/* Description & Instructor Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-[#E2ECEB] shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider">
                Course Description
              </h4>
              <p className="text-xs text-[#5A7178] leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2ECEB] shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#078783]" />
                Lead Instructor
              </h4>
              <div className="font-bold text-xs text-[#11232B]">{course.instructor}</div>
              <p className="text-[11px] text-[#7B939B] leading-normal">
                {course.instructorBio || "Senior Academic Faculty & Industry Practitioner."}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-[#E2ECEB] pt-2">
            <button
              onClick={() => setActiveTab("syllabus")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "syllabus"
                  ? "border-[#078783] text-[#078783]"
                  : "border-transparent text-[#5A7178] hover:text-[#11232B]"
              }`}
            >
              Curriculum Syllabus ({course.syllabus.length} Modules)
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "students"
                  ? "border-[#078783] text-[#078783]"
                  : "border-transparent text-[#5A7178] hover:text-[#11232B]"
              }`}
            >
              Enrolled Students ({enrolledStudents.length})
            </button>
            <button
              onClick={() => setActiveTab("batches")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "batches"
                  ? "border-[#078783] text-[#078783]"
                  : "border-transparent text-[#5A7178] hover:text-[#11232B]"
              }`}
            >
              Associated Batches ({associatedBatches.length})
            </button>
          </div>

          {/* TAB 1: SYLLABUS */}
          {activeTab === "syllabus" && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2ECEB] shadow-sm space-y-3">
              <div className="space-y-2.5">
                {course.syllabus.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFCFB] border border-[#E2ECEB] hover:border-[#078783]/40 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#E6F5F4] text-[#078783] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="text-xs text-[#11232B] font-medium leading-relaxed">
                      {topic}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ENROLLED STUDENTS */}
          {activeTab === "students" && (
            <div className="bg-white rounded-xl border border-[#E2ECEB] overflow-hidden shadow-sm">
              {enrolledStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFCFB] text-[#7B939B] border-b border-[#E2ECEB]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Student Code</th>
                        <th className="py-2.5 px-4 font-semibold">Full Name</th>
                        <th className="py-2.5 px-4 font-semibold">Contact</th>
                        <th className="py-2.5 px-4 font-semibold">Attendance</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2ECEB]">
                      {enrolledStudents.map((s: any) => (
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
                            <Badge
                              variant={
                                s.status === "Active"
                                  ? "active"
                                  : s.status === "Completed"
                                  ? "completed"
                                  : "inactive"
                              }
                            >
                              {s.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#7B939B]">
                  No active students currently enrolled in this course.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSOCIATED BATCHES */}
          {activeTab === "batches" && (
            <div className="space-y-3">
              {associatedBatches.length > 0 ? (
                associatedBatches.map((batch: any) => (
                  <div
                    key={batch.code}
                    className="p-4 bg-white rounded-xl border border-[#E2ECEB] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#11232B]">{batch.name}</span>
                        <Badge variant="active" className="text-[10px] font-mono">
                          {batch.code}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-[#5A7178] mt-1">
                        Timing: {batch.timing} · Days: {batch.days} · Trainer: {batch.trainer}
                      </div>
                    </div>
                    <Badge variant="active" className="self-start sm:self-auto">
                      Running Batch
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 bg-white rounded-xl border border-[#E2ECEB] text-center text-xs text-[#7B939B]">
                  No batches configured for this course yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
