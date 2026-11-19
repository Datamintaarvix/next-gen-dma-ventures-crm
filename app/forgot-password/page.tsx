"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your registered staff email address.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "/reset-password";

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(
          `Password reset instructions have been dispatched to ${email}. Please check your inbox or consult your CRM Administrator.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
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

        <h1 className="text-xl font-black text-[#11232B] tracking-tight">
          Reset Account Password
        </h1>
        <p className="mt-1 text-xs text-[#5A7178]">
          NEXT GEN DMA VENTURES CRM Security Service
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-[#E2ECEB] sm:px-10">
          {successMessage ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-teal-50 text-[#078783] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#11232B]">Reset Link Sent</h3>
              <p className="text-xs text-[#5A7178] leading-relaxed">
                {successMessage}
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#078783] hover:bg-[#066F6C] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#5A7178] leading-relaxed mb-4">
                Enter your verified staff email address and we will dispatch a secure recovery link to re-establish your credentials.
              </p>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#11232B] mb-1.5">
                  Registered Staff Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A9EA5]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@nextgendma.com"
                    className="block w-full pl-9 pr-3 py-2.5 bg-[#F8FBFA] border border-[#D5E3E1] rounded-xl text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-2 focus:ring-[#078783] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-[#078783] hover:bg-[#066F6C] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Recovery Link...</span>
                  </>
                ) : (
                  <span>Send Recovery Instructions</span>
                )}
              </button>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A7178] hover:text-[#078783] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-[#E2ECEB] flex items-center justify-center gap-1.5 text-[11px] text-[#8A9EA5]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#078783]" />
            <span>Encrypted Authentication Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
