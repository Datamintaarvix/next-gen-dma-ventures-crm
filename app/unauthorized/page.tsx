"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ShieldAlert, ArrowLeft, LogOut, Home, Mail, Loader2 } from "lucide-react";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get("module") || "this module";
  const { staff, role, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#F3F8F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center bg-white rounded-2xl p-3 shadow-md border border-[#E2ECEB] mb-4">
          <Image
            src="/assets/nextgen-dma-logo.png"
            alt="NEXT GEN DMA VENTURES"
            width={72}
            height={64}
            className="w-16 h-14 object-contain"
            priority
          />
        </div>

        <div className="mx-auto w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-black text-[#11232B] tracking-tight">
          Access Restricted
        </h1>
        <p className="mt-1 text-xs font-semibold text-rose-600 tracking-wide uppercase">
          Insufficient Role-Based Privileges
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-[#E2ECEB] sm:px-10 text-center space-y-5">
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-left space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-[#5A7178]">
              <span>Logged In Staff:</span>
              <span className="font-bold text-[#11232B]">{staff?.fullName || "Staff Member"}</span>
            </div>
            <div className="flex justify-between items-center text-[#5A7178]">
              <span>Assigned Role:</span>
              <span className="font-semibold text-[#078783] bg-teal-50 px-2 py-0.5 rounded text-[10px]">
                {role || "Employee"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#5A7178]">
              <span>Attempted Resource:</span>
              <span className="font-mono text-rose-700 font-semibold">{moduleParam}</span>
            </div>
          </div>

          <p className="text-xs text-[#5A7178] leading-relaxed">
            Your employee account is not granted permission to view or manage records in this module. To request module access, please reach out to your CRM Administrator.
          </p>

          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center gap-2.5 text-xs text-teal-800 text-left">
            <Mail className="w-4 h-4 text-[#078783] shrink-0" />
            <div className="leading-tight">
              <span className="font-bold">CRM Super Admin:</span>
              <div className="text-[11px] text-teal-700">Rajesh Khanna (rajesh.khanna@nextgendma.com)</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href="/"
              className="py-2.5 px-3 bg-[#078783] hover:bg-[#066F6C] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </Link>

            <button
              onClick={() => signOut()}
              className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-[#11232B] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F8F7] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#078783] animate-spin" />
          <p className="text-xs font-semibold text-[#5A7178] tracking-wider uppercase">
            Loading Permission Check...
          </p>
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
