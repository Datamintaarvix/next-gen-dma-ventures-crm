"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  UserCheck,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const { signIn, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(email.trim(), password);
      if (res.success) {
        router.push(returnUrl);
      } else {
        setErrorMessage(res.error || "Invalid email or password. Please verify your credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected authentication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
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

        <h1 className="text-2xl font-black text-[#11232B] tracking-tight">
          NEXT GEN DMA VENTURES
        </h1>
        <p className="mt-1 text-xs font-semibold text-[#078783] tracking-widest uppercase">
          Enterprise Education CRM & Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-[#E2ECEB] sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#11232B]">Staff Sign In</h2>
            <p className="text-xs text-[#5A7178] mt-0.5">
              Access your authorized modules and dashboard workspace.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#11232B] mb-1.5">
                Staff Email Address
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#11232B]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#078783] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A9EA5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="block w-full pl-9 pr-10 py-2.5 bg-[#F8FBFA] border border-[#D5E3E1] rounded-xl text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-2 focus:ring-[#078783] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A9EA5] hover:text-[#11232B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#5A7178] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#078783] focus:ring-[#078783] border-[#D5E3E1]"
                />
                <span>Remember session</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] text-[#078783] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supabase Secure Auth</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#078783] hover:bg-[#066F6C] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Credentials for Testing */}
          <div className="mt-6 pt-5 border-t border-[#E2ECEB]">
            <p className="text-[11px] font-semibold text-[#5A7178] uppercase tracking-wider mb-2.5">
              Quick Sign-In (Verified Roles):
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("info@datamintaarvix.com", "")}
                className="p-2.5 rounded-lg bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-teal-900 flex items-center justify-between">
                  <span>Super Admin</span>
                  <span className="text-[10px] text-teal-600 font-normal">Click to fill email</span>
                </div>
                <div className="text-[11px] text-teal-800 font-medium">Mithun K (info@datamintaarvix.com)</div>
              </button>
            </div>
          </div>

          {/* Policy Notice */}
          <div className="mt-6 text-center text-[11px] text-[#6C838C] leading-relaxed bg-[#F8FBFA] p-3 rounded-xl border border-[#E2ECEB]">
            Public registration is disabled. Employee accounts are created and provisioned exclusively by authorized CRM Administrators.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F8F7] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#078783] animate-spin" />
          <p className="text-xs font-semibold text-[#5A7178] tracking-wider uppercase">
            Loading Login Portal...
          </p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
