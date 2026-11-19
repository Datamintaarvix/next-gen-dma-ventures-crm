"use client";

import React, { useState } from "react";
import { EnquiryRecord } from "@/lib/validations/enquiry";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteEnquiryDialogProps {
  enquiry: EnquiryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (enquiryId: string) => void;
}

export function DeleteEnquiryDialog({
  enquiry,
  isOpen,
  onClose,
  onDeleted,
}: DeleteEnquiryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !enquiry) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to delete enquiry");
      }

      onDeleted(enquiry.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2ECEB] shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-[#11232B]">Delete Enquiry Record</h3>
          <p className="text-xs text-[#5A7178]">
            Are you sure you want to permanently delete enquiry{" "}
            <span className="font-semibold text-[#11232B]">{enquiry.studentName}</span> (
            <span className="font-mono text-[#078783]">{enquiry.enquiryCode}</span>)? This will
            also remove its logged communication history.
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white flex-1 gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
