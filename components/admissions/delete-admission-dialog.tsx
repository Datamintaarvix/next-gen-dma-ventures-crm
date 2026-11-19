"use client";

import React, { useState } from "react";
import { AdmissionRecord } from "@/lib/validations/admission";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";

interface DeleteAdmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionRecord | null;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteAdmissionDialog({
  isOpen,
  onClose,
  admission,
  onConfirm,
}: DeleteAdmissionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !admission) return null;

  const hasPaidFees = (admission.paidAmount || 0) > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(admission.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              hasPaidFees
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {hasPaidFees ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#11232B]">
              {hasPaidFees ? "Paid Tuition Record Detected" : "Delete Admission"}
            </h3>
            <p className="text-xs text-[#5A7178] mt-0.5">
              {admission.studentName} ({admission.admissionCode})
            </p>
          </div>
        </div>

        {hasPaidFees ? (
          <div className="space-y-2.5">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Notice:</strong> This candidate has recorded payments totaling{" "}
              <strong>₹{admission.paidAmount.toLocaleString("en-IN")}</strong>.
            </div>
            <p className="text-xs text-[#5A7178] leading-relaxed">
              Deleting this record will permanently remove the admission application and its audit timeline. Are you sure you wish to proceed?
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#5A7178] leading-relaxed">
            Are you sure you want to permanently delete admission{" "}
            <strong className="text-[#11232B]">{admission.admissionCode}</strong> for{" "}
            <strong className="text-[#11232B]">{admission.studentName}</strong>? This action cannot be undone.
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Admission"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
