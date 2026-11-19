"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";
import { CrmModule } from "@/lib/validations/staff";

interface AppLayoutProps {
  children: React.ReactNode;
}

const ROUTE_TO_MODULE: Record<string, CrmModule> = {
  "/leads": "leads",
  "/students": "students",
  "/courses": "courses",
  "/enquiries": "enquiries",
  "/follow-ups": "follow_ups",
  "/admissions": "admissions",
  "/payments": "payments",
  "/counselling": "counselling",
  "/batches": "batches",
  "/attendance": "attendance",
  "/placements": "placements",
  "/reports": "reports",
  "/staff": "staff",
  "/settings": "settings",
};

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, staff, isAdmin, isLoading, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPublicAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/unauthorized");

  // Route-level protection for authenticated pages
  useEffect(() => {
    if (isLoading) return;

    if (!isPublicAuthPage) {
      if (!user) {
        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check module permission if not admin
      if (!isAdmin && staff) {
        for (const [route, mod] of Object.entries(ROUTE_TO_MODULE)) {
          if (pathname === route || pathname.startsWith(route + "/")) {
            if (!hasPermission(mod, "view")) {
              router.push(`/unauthorized?module=${mod}`);
              return;
            }
          }
        }
      }
    }
  }, [user, staff, isAdmin, isLoading, pathname, isPublicAuthPage, router, hasPermission]);

  // If on login/forgot-password/unauthorized pages, render full screen without CRM framing
  if (isPublicAuthPage) {
    return <>{children}</>;
  }

  // Show clean loading state while verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F8F7] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#078783] animate-spin" />
        <p className="text-xs font-semibold text-[#5A7178] tracking-wider uppercase">
          Verifying CRM Security Session...
        </p>
      </div>
    );
  }

  // If unauthenticated, prevent flicker while redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F8F7] flex text-[#11232B]">
      {/* Sidebar (Desktop fixed + Mobile slide-over) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navigation */}
        <TopNav onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
