"use client";

import React from "react";
import Image from "next/image";
import { X, Printer, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullAnalyticsPayload } from "@/lib/validations/report";

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FullAnalyticsPayload;
}

export function PrintableReportModal({
  isOpen,
  onClose,
  data,
}: PrintableReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls Header (Hidden during actual print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Printable Executive Summary Report
            </h3>
            <p className="text-xs text-gray-500">
              Formatted for official paper documentation & auditing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-[#078783] hover:bg-[#066f6b] text-white text-xs h-8"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save as PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div
          id="printable-report"
          className="p-8 overflow-y-auto space-y-6 text-gray-800 bg-white"
        >
          {/* Institutional Header with Logo */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-[#078783]">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/assets/nextgen-dma-logo.png"
                  alt="NEXT GEN DMA VENTURES"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#11232B] tracking-tight">
                  NEXT GEN DMA VENTURES
                </h1>
                <p className="text-xs text-gray-500">
                  Institute of Digital Marketing, Analytics & Technology Excellence
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="px-2 py-0.5 bg-teal-100 text-[#078783] font-bold rounded text-[11px] uppercase tracking-wider block mb-1">
                Executive Audit Report
              </span>
              <p className="text-gray-600">
                <span className="font-semibold">Period:</span> {data.dateRangeDisplay}
              </p>
              <p className="text-gray-400 text-[11px]">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Section 1: Executive KPI Summary */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              1. Institutional Key Performance Indicators
            </h2>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Total Leads</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {data.kpis.totalLeads}
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Confirmed Admissions</p>
                <p className="text-lg font-bold text-[#078783] mt-0.5">
                  {data.kpis.totalAdmissions}
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Revenue Collected</p>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(data.kpis.totalRevenueCollected)}
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Outstanding Balance</p>
                <p className="text-lg font-bold text-amber-700 mt-0.5">
                  {formatCurrency(data.kpis.totalOutstandingFees)}
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Active Students</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {data.kpis.totalStudents}
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Avg Attendance</p>
                <p className="text-lg font-bold text-blue-700 mt-0.5">
                  {data.kpis.averageAttendancePercentage}%
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Active Cohorts</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {data.kpis.activeBatches} Batches
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 font-medium">Placement Success</p>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">
                  {data.kpis.placementSuccessRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Admissions & Revenue by Course */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              2. Course Admissions & Revenue Distribution
            </h2>
            <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2 px-3">Course Curriculum</th>
                  <th className="py-2 px-3 text-center">Enrolled Students</th>
                  <th className="py-2 px-3 text-right">Fee Value (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.admissionsByCourse.map((c, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-semibold text-gray-900">
                      {c.fullName || c.name}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-800">
                      {c.admissions}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[#078783]">
                      {formatCurrency(Number(c.revenue))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Staff & Counsellor Conversions */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              3. Staff & Counsellor Performance Summary
            </h2>
            <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2 px-3">Staff Name</th>
                  <th className="py-2 px-3">Designation / Role</th>
                  <th className="py-2 px-3 text-center">Leads</th>
                  <th className="py-2 px-3 text-center">Admissions</th>
                  <th className="py-2 px-3 text-center">Conversion</th>
                  <th className="py-2 px-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.staffPerformance.map((st, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-semibold text-gray-900">
                      {st.staffName}
                    </td>
                    <td className="py-2 px-3 text-gray-600">{st.role}</td>
                    <td className="py-2 px-3 text-center text-gray-800">
                      {st.leadsHandled}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">
                      {st.admissionsClosed}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-gray-800">
                      {st.conversionRate}%
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[#078783]">
                      {formatCurrency(st.revenueGenerated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Signatures & Certification Block */}
          <div className="pt-8 border-t border-gray-200 mt-6 grid grid-cols-3 gap-6 text-xs text-gray-600">
            <div>
              <p className="font-semibold text-gray-900 mb-6">Prepared By:</p>
              <div className="border-b border-gray-300 w-36 mb-1"></div>
              <p className="text-[11px] text-gray-500">Admissions & Accounts Lead</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-6">Verified By:</p>
              <div className="border-b border-gray-300 w-36 mb-1"></div>
              <p className="text-[11px] text-gray-500">Academic Director</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-6">Authorized Signatory:</p>
              <div className="border-b border-gray-300 w-36 mb-1"></div>
              <p className="text-[11px] text-gray-500">NEXT GEN DMA VENTURES</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
