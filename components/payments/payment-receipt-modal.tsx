"use client";

import React from "react";
import { PaymentTransactionRecord } from "@/lib/validations/payment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  Building,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import Image from "next/image";

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentTransactionRecord | null;
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
}: PaymentReceiptModalProps) {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  // Convert amount to simple words (approx for common Indian INR figures)
  const numberToWords = (num: number): string => {
    if (num <= 0) return "Zero Rupees Only";
    return `Rupees ${num.toLocaleString("en-IN")} Only`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden my-6 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E2ECEB] bg-[#F8FBFA] print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#078783]" />
            <span className="text-xs font-bold text-[#11232B]">
              Official Fee Receipt · {payment.receiptNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs bg-[#078783] hover:bg-[#066e6b] text-white flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#EAEAEA] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          id="printable-receipt"
          className="p-8 sm:p-10 space-y-6 text-[#11232B] bg-white print:p-6"
        >
          {/* Receipt Top: Brand & Institute Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-[#078783] pb-6 gap-4">
            <div className="space-y-1.5">
              <div className="h-12 w-44 relative mb-1">
                <Image
                  src="/assets/nextgen-dma-logo.png"
                  alt="NEXT GEN DMA VENTURES"
                  fill
                  sizes="176px"
                  className="object-contain object-left"
                  priority
                />
              </div>
              <div className="text-[11px] font-bold text-[#078783] uppercase tracking-wider">
                Education & Professional Upskilling
              </div>
              <p className="text-[11px] text-[#5A7178] max-w-sm leading-relaxed">
                Next Gen DMA Campus, Bellandur Outer Ring Road, Bengaluru, Karnataka 560103
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#5A7178] pt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#078783]" /> +91 98765 43210
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#078783]" /> admissions@nextgendma.com
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#078783]" /> www.nextgendma.com
                </span>
              </div>
            </div>

            <div className="sm:text-right space-y-1 shrink-0 bg-[#F8FBFA] p-3 rounded-xl border border-[#E2ECEB]">
              <span className="text-[10px] uppercase font-bold text-[#5A7178] tracking-wider block">
                Tuition Fee Receipt
              </span>
              <div className="font-mono text-base font-bold text-[#078783]">
                {payment.receiptNo}
              </div>
              <div className="text-[11px] text-[#5A7178]">
                Date:{" "}
                <strong className="text-[#11232B]">
                  {new Date(payment.paymentDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
              <div className="text-[10px] font-mono text-[#5A7178]">
                Txn ID: {payment.id}
              </div>
            </div>
          </div>

          {/* Student & Cohort Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8FBFA] p-4 rounded-xl border border-[#E2ECEB]">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#078783] tracking-wider block">
                Student Particulars
              </span>
              <div className="font-bold text-sm text-[#11232B]">{payment.studentName}</div>
              <div className="text-[#5A7178]">
                Student ID: <span className="font-mono font-bold text-[#11232B]">{payment.studentCode}</span>
              </div>
              <div className="text-[#5A7178]">
                Admission ID: <span className="font-mono text-[#11232B]">{payment.admissionCode}</span>
              </div>
              <div className="text-[#5A7178]">Phone: {payment.studentPhone}</div>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <span className="text-[10px] uppercase font-bold text-[#078783] tracking-wider block">
                Academic Program
              </span>
              <div className="font-bold text-sm text-[#11232B]">{payment.courseName}</div>
              <div className="text-[#5A7178]">
                Cohort: <span className="font-mono text-[#11232B]">{payment.batchName} ({payment.batchCode})</span>
              </div>
              <div className="text-[#5A7178]">
                Mode: Classroom & Live Studio Labs
              </div>
              <div className="text-[#5A7178]">
                Received By: <strong className="text-[#11232B]">{payment.receivedBy}</strong>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="rounded-xl border border-[#E2ECEB] overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FBFA] border-b border-[#E2ECEB] text-[11px] font-semibold text-[#5A7178] uppercase">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEB]">
                <tr>
                  <td className="py-2 px-4 text-[#5A7178]">Total Program Fee</td>
                  <td className="py-2 px-4 text-right font-mono font-medium">
                    ₹{payment.totalFee.toLocaleString("en-IN")}
                  </td>
                </tr>
                {payment.discountAmount > 0 && (
                  <tr>
                    <td className="py-2 px-4 text-emerald-700">Scholarship / Merit Discount</td>
                    <td className="py-2 px-4 text-right font-mono font-medium text-emerald-700">
                      -₹{payment.discountAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                )}
                <tr className="bg-[#FAFDFD]">
                  <td className="py-2 px-4 font-bold text-[#11232B]">Net Payable Tuition Fee</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-[#11232B]">
                    ₹{payment.finalFee.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="bg-[#E6F5F4]/60 font-bold">
                  <td className="py-3 px-4 text-[#078783] text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#078783]" />
                    Amount Paid in this Receipt
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base font-bold text-[#078783]">
                    ₹{Math.abs(payment.amount).toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-[#5A7178]">Total Cumulative Paid to Date</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-[#11232B]">
                    ₹{payment.cumulativePaid.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="bg-[#FFFDF5]">
                  <td className="py-2.5 px-4 font-bold text-amber-800">Remaining Outstanding Balance Due</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-800">
                    ₹{payment.outstandingBalance.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Method & Words */}
          <div className="p-3.5 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#5A7178]">Payment Method:</span>
              <span className="font-semibold text-[#11232B]">{payment.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5A7178]">Transaction Ref / UTR:</span>
              <span className="font-mono text-[#11232B] font-bold">{payment.transactionRef}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#E8EFEF]">
              <span className="text-[#5A7178]">Amount in Words:</span>
              <span className="italic text-[#11232B] font-medium">{numberToWords(Math.abs(payment.amount))}</span>
            </div>
          </div>

          {/* Signatures & Verification Seal */}
          <div className="pt-8 flex items-end justify-between text-xs text-[#5A7178]">
            <div className="space-y-1">
              <div className="w-24 h-12 border-b border-[#B8CECA] flex items-end pb-1 text-[10px] font-mono text-[#078783]">
                STAMP / SEAL
              </div>
              <div className="text-[10px] text-[#8B9E9E]">NEXT GEN DMA VENTURES</div>
            </div>

            <div className="text-right space-y-1">
              <div className="w-36 border-b border-[#B8CECA] pb-1 text-[11px] font-semibold text-[#11232B]">
                {payment.receivedBy}
              </div>
              <div className="text-[10px] text-[#8B9E9E]">Authorized Accounts Officer</div>
            </div>
          </div>

          {/* Receipt Footer Notice */}
          <div className="text-center pt-4 border-t border-[#E2ECEB] text-[10px] text-[#8B9E9E] leading-normal">
            This is a computer-generated fee receipt issued by NEXT GEN DMA VENTURES. All tuition fee payments are subject to institute admission terms and refund policies.
          </div>
        </div>
      </div>
    </div>
  );
}
