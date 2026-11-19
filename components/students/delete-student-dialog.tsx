"use client";

import React, { useState } from "react";
import { StudentRecord } from "@/lib/validations/student";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteStudentDialog({
  isOpen,
  onClose,
  student,
  onConfirm,
}: DeleteStudentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !student) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(student.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2ECEB] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#11232B]">Delete Student Record</h3>
            <p className="text-xs text-[#5A7178] mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-[#5A7178] leading-relaxed">
          Are you sure you want to remove <strong className="text-[#11232B]">{student.fullName}</strong> (
          <span className="font-mono">{student.studentCode}</span>)? This will erase enrollment, payment records, and attendance history associated with this student.
        </p>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete Student"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
