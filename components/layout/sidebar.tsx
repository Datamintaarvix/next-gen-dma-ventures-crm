"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  MessageSquare,
  CalendarClock,
  FileCheck2,
  CreditCard,
  HeartHandshake,
  Layers,
  UserCheck,
  Briefcase,
  BarChart2,
  UsersRound,
  Bell,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { CrmModule } from "@/lib/validations/staff";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: CrmModule;
}

export const CRM_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Leads Management", href: "/leads", icon: Users, module: "leads" },
  { label: "Student Management", href: "/students", icon: GraduationCap, module: "students" },
  { label: "Course Management", href: "/courses", icon: BookOpen, module: "courses" },
  { label: "Enquiries", href: "/enquiries", icon: MessageSquare, module: "enquiries" },
  { label: "Follow-up Management", href: "/follow-ups", icon: CalendarClock, module: "follow_ups" },
  { label: "Admissions", href: "/admissions", icon: FileCheck2, module: "admissions" },
  { label: "Payment Management", href: "/payments", icon: CreditCard, module: "payments" },
  { label: "Counselling Management", href: "/counselling", icon: HeartHandshake, module: "counselling" },
  { label: "Batch Management", href: "/batches", icon: Layers, module: "batches" },
  { label: "Attendance Management", href: "/attendance", icon: UserCheck, module: "attendance" },
  { label: "Placement Management", href: "/placements", icon: Briefcase, module: "placements" },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart2, module: "reports" },
  { label: "Staff Management", href: "/staff", icon: UsersRound, module: "staff" },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings, module: "settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { staff, isAdmin, hasPermission } = useAuth();

  // Filter navigation items based on user role and permissions
  const visibleNavItems = CRM_NAV_ITEMS.filter((item) => {
    if (!item.module) return true; // Universal items like Dashboard and Notifications
    if (isAdmin) return true; // Admins have full access
    return hasPermission(item.module, "view");
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#192C34] text-[#E0EBE9] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-[#243B45]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand / Logo Section */}
        <div className="p-5 pb-4 border-b border-[#243B45]/60 flex flex-col items-start relative">
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A9EA5] hover:text-white hover:bg-[#243B45] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Card */}
          <Link href="/" className="group block">
            <div className="bg-white rounded-xl p-2 w-[84px] h-[74px] flex items-center justify-center shadow-md mb-3 border border-white/10 overflow-hidden">
              <Image
                src="/assets/nextgen-dma-logo.png"
                alt="NEXT GEN DMA VENTURES"
                width={76}
                height={68}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="text-white font-bold tracking-wider text-xs leading-tight">
              <div>NEXT GEN DMA</div>
              <div className="text-white/90">VENTURES</div>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-[#6C838C] uppercase">
              WORKSPACE
            </div>
            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-[#078783] text-white shadow-sm font-semibold"
                        : "text-[#9EB1B8] hover:text-white hover:bg-[#20363F]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-[#8A9EA5] group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-4 border-t border-[#243B45]/70 text-[11px] text-[#7A939C]">
          <div className="flex items-center gap-1.5 text-white/90 font-medium mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#078783]" />
            <span>LIVE WORKSPACE</span>
          </div>
          <p className="text-[10px] text-[#677F88] leading-tight">
            Connected to Supabase.
          </p>
        </div>
      </aside>
    </>
  );
}
