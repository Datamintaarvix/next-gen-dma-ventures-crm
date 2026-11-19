"use client";

import React, { useState, useEffect } from "react";
import {
  InstallmentPlan,
  InstallmentItem,
  InstallmentStatus,
} from "@/lib/validations/payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Calendar,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  Loader2,
  Edit2,
  Save,
  PlusCircle,
  Receipt,
} from "lucide-react";

interface InstallmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string | null;
  onOpenRecordPayment: (admissionId: string, amount: number) => void;
  onSuccess?: () => void;
}

export function InstallmentDrawer({
  isOpen,
  onClose,
  admissionId,
  onOpenRecordPayment,
  onSuccess,
}: InstallmentDrawerProps) {
  const [plan, setPlan] = useState<InstallmentPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedInstallments, setEditedInstallments] = useState<InstallmentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && admissionId) {
      setIsLoading(true);
      setError(null);
      setIsEditing(false);

      fetch(`/api/payments/installments?admissionId=${admissionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setPlan(data.data);
            setEditedInstallments(data.data.installments || []);
          } else {
            setPlan(null);
          }
        })
        .catch((err) => {
          console.error("Error fetching installment plan:", err);
          setError("Failed to load installment schedule");
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, admissionId]);

  if (!isOpen) return null;

  const handleSaveSchedule = async () => {
    if (!plan) return;
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        planId: plan.id,
        installments: editedInstallments.map((i) => ({
          id: i.id,
          installmentNumber: i.installmentNumber,
          dueDate: i.dueDate,
          amount: i.amount,
          notes: i.notes,
        })),
      };

      const res = await fetch("/api/payments/installments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update installment schedule");
      }

      setPlan(data.data);
      setEditedInstallments(data.data.installments || []);
      setIsEditing(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: InstallmentStatus) => {
    switch (status) {
      case "Paid":
        return <Badge variant="converted">Paid</Badge>;
      case "Partially Paid":
        return <Badge variant="duesoon">Partial</Badge>;
      case "Overdue":
        return <Badge variant="missed">Overdue</Badge>;
      case "Pending":
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2ECEB] bg-[#F8FBFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F5F4] flex items-center justify-center text-[#078783]">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#11232B]">
                Installment Payment Schedule
              </h2>
              <p className="text-xs text-[#5A7178]">
                {plan ? `${plan.studentName} · ${plan.courseName} (${plan.admissionCode})` : "Installment tracking"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {plan && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-8 text-xs text-[#11232B] border-[#E2ECEB]"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Reschedule Due Dates
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#EAEAEA] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[#5A7178] gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#078783]" />
              <p className="text-xs font-medium">Loading installment schedule...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !plan ? (
            <div className="py-12 text-center text-[#5A7178] space-y-2">
              <Calendar className="w-8 h-8 text-[#078783] mx-auto opacity-40" />
              <h3 className="text-sm font-semibold text-[#11232B]">No Installment Plan Set</h3>
              <p className="text-xs max-w-sm mx-auto">
                This student does not have an active split installment plan registered.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB]">
                <div>
                  <span className="text-[10px] text-[#5A7178] uppercase font-bold block">Net Course Fee</span>
                  <div className="text-base font-bold font-mono text-[#11232B]">
                    ₹{plan.finalFee.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#078783] uppercase font-bold block">Paid to Date</span>
                  <div className="text-base font-bold font-mono text-[#078783]">
                    ₹{plan.paidAmount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 uppercase font-bold block">Outstanding Due</span>
                  <div className="text-base font-bold font-mono text-amber-700">
                    ₹{plan.pendingAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Installments List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#11232B] uppercase tracking-wider">
                    Scheduled Installments ({(plan.installments || []).length})
                  </h3>
                  {plan.pendingAmount > 0 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onOpenRecordPayment(plan.admissionId, plan.pendingAmount);
                      }}
                      className="h-7 text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      Pay Outstanding
                    </Button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {(isEditing ? editedInstallments : plan.installments || []).map((inst, idx) => (
                    <div
                      key={inst.id || idx}
                      className="p-4 rounded-xl border border-[#E2ECEB] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#078783]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E6F5F4] flex items-center justify-center font-bold text-xs text-[#078783] shrink-0">
                          #{inst.installmentNumber}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[#11232B]">
                              Installment {inst.installmentNumber}
                            </span>
                            {getStatusBadge(inst.status)}
                          </div>
                          {isEditing && inst.status !== "Paid" ? (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="date"
                                value={inst.dueDate}
                                onChange={(e) => {
                                  const next = [...editedInstallments];
                                  next[idx].dueDate = e.target.value;
                                  setEditedInstallments(next);
                                }}
                                className="text-xs border border-[#E2ECEB] rounded px-2 py-1 bg-[#F8FBFA]"
                              />
                              <input
                                type="number"
                                value={inst.amount}
                                onChange={(e) => {
                                  const next = [...editedInstallments];
                                  next[idx].amount = Number(e.target.value);
                                  setEditedInstallments(next);
                                }}
                                className="w-24 text-xs font-mono border border-[#E2ECEB] rounded px-2 py-1 bg-[#F8FBFA]"
                              />
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#5A7178] flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-[#078783]" />
                              Due:{" "}
                              <strong className="text-[#11232B]">
                                {new Date(inst.dueDate).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </strong>
                              {inst.receiptNo && (
                                <span className="font-mono text-[#078783] ml-1">
                                  ({inst.receiptNo})
                                </span>
                              )}
                            </div>
                          )}
                          {inst.notes && (
                            <div className="text-[10px] text-[#5A7178]">{inst.notes}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right self-end sm:self-auto">
                        <div>
                          <div className="text-xs font-mono font-bold text-[#11232B]">
                            ₹{inst.amount.toLocaleString("en-IN")}
                          </div>
                          {inst.paidAmount > 0 && inst.paidAmount < inst.amount && (
                            <div className="text-[10px] text-amber-600">
                              Paid: ₹{inst.paidAmount.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>

                        {inst.status !== "Paid" && !isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onClose();
                              onOpenRecordPayment(plan.admissionId, inst.amount - (inst.paidAmount || 0));
                            }}
                            className="h-7 text-xs border-[#078783] text-[#078783] hover:bg-[#E6F5F4]"
                          >
                            Pay Installment
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="pt-3 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedInstallments(plan.installments || []);
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSchedule}
                      disabled={isSaving}
                      className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Save Schedule
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
