"use client";

import React, { useState } from "react";
import { CourseRecord } from "@/lib/validations/course";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";

interface DeleteCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseRecord | null;
  onConfirm: (id: string, force: boolean) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function DeleteCourseDialog({
  isOpen,
  onClose,
  course,
  onConfirm,
  onArchive,
}: DeleteCourseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  if (!isOpen || !course) return null;

  const hasDependencies = (course.enrolledStudentsCount || 0) > 0;

  const handleDelete = async (force: boolean) => {
    setIsDeleting(true);
    try {
      await onConfirm(course.id, force);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await onArchive(course.id);
      onClose();
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2ECEB] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              hasDependencies
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {hasDependencies ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#11232B]">
              {hasDependencies ? "Active Dependencies Detected" : "Delete Course"}
            </h3>
            <p className="text-xs text-[#5A7178] mt-0.5">
              {course.courseName} ({course.courseCode})
            </p>
          </div>
        </div>

        {hasDependencies ? (
          <div className="space-y-2.5">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Warning:</strong> This course currently has{" "}
              <strong>{course.enrolledStudentsCount} active enrolled student(s)</strong> and{" "}
              <strong>{course.activeBatchesCount || 1} active batch(es)</strong> linked to it.
            </div>
            <p className="text-xs text-[#5A7178] leading-relaxed">
              Deleting this course directly will orphan enrolled students. It is strongly recommended to <strong>Archive or Deactivate</strong> the course instead, preserving student history.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#5A7178] leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <strong className="text-[#11232B]">{course.courseName}</strong>? This action cannot be undone.
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting || isArchiving}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>

          {hasDependencies ? (
            <>
              <Button
                type="button"
                onClick={handleArchive}
                disabled={isDeleting || isArchiving}
                className="w-full sm:w-auto text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  "Archive Course Instead"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDelete(true)}
                disabled={isDeleting || isArchiving}
                className="w-full sm:w-auto text-xs text-red-600 hover:bg-red-50 border-red-200"
              >
                Force Delete
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Course"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
