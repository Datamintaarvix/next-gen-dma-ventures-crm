"use client";

import React, { useState } from "react";
import { BatchRecord } from "@/lib/validations/batch";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, ShieldAlert, Ban } from "lucide-react";

interface DeleteBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchRecord | null;
  onConfirm: (id: string, force: boolean) => Promise<void>;
  onCancelBatch: (id: string) => Promise<void>;
}

export function DeleteBatchDialog({
  isOpen,
  onClose,
  batch,
  onConfirm,
  onCancelBatch,
}: DeleteBatchDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen || !batch) return null;

  const hasEnrolledStudents = (batch.enrolledCount || 0) > 0;

  const handleDelete = async (force: boolean) => {
    setIsDeleting(true);
    try {
      await onConfirm(batch.id, force);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelBatch = async () => {
    setIsCancelling(true);
    try {
      await onCancelBatch(batch.id);
      onClose();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              hasEnrolledStudents
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {hasEnrolledStudents ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#11232B]">
              {hasEnrolledStudents ? "Active Enrolled Students Detected" : "Delete Batch"}
            </h3>
            <p className="text-xs text-[#5A7178] mt-0.5">
              {batch.batchName} ({batch.batchCode})
            </p>
          </div>
        </div>

        {hasEnrolledStudents ? (
          <div className="space-y-2.5">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Warning:</strong> This batch currently has{" "}
              <strong>{batch.enrolledCount} active student(s)</strong> assigned to it.
            </div>
            <p className="text-xs text-[#5A7178] leading-relaxed">
              Deleting this batch directly will unlink or orphan enrolled students. It is strongly recommended to mark this batch as <strong>Cancelled</strong> or transfer students to another batch instead.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#5A7178] leading-relaxed">
            Are you sure you want to permanently delete batch{" "}
            <strong className="text-[#11232B]">{batch.batchName}</strong> ({batch.batchCode})? This action cannot be undone.
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting || isCancelling}
            className="w-full sm:w-auto text-xs"
          >
            Close
          </Button>

          {hasEnrolledStudents ? (
            <>
              <Button
                type="button"
                onClick={handleCancelBatch}
                disabled={isDeleting || isCancelling}
                className="w-full sm:w-auto text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5 mr-1.5" />
                    Cancel Batch Instead
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDelete(true)}
                disabled={isDeleting || isCancelling}
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
                "Delete Batch"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
