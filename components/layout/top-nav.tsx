"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Calendar as CalendarIcon,
  HelpCircle,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Settings,
  Lock,
} from "lucide-react";
import { NotificationDropdown } from "./notification-dropdown";
import { useAuth } from "@/lib/auth/auth-context";

interface TopNavProps {
  onToggleSidebar: () => void;
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "ST";
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
  const router = useRouter();
  const { user, staff, role, isAdmin, signOut, hasPermission } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = staff?.fullName || user?.user_metadata?.fullName || user?.email?.split("@")[0] || "Staff User";
  const displayRole = role || (isAdmin ? "Super Admin" : "Employee");
  const displayEmail = staff?.email || user?.email || "user@nextgendma.com";
  const displayStaffId = staff?.id || "STF";
  const initials = getInitials(staff?.fullName, user?.email);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/students?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (err) {
      console.error("Sign out failed", err);
    } finally {
      setIsSigningOut(false);
      setShowSignOutDialog(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2ECEB] flex items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Toggle & Global Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#F3F8F7] transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A9EA5]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, students (press Enter)..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F3F8F7] border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white transition-all"
            />
          </form>
        </div>

        {/* Right: Quick actions & Admin Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Calendar link */}
          <Link
            href="/counselling"
            className="p-2 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#F3F8F7] transition-colors"
            title="Counselling Calendar"
            aria-label="Calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </Link>

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* Settings Shortcut (Admins only) */}
          {isAdmin && (
            <Link
              href="/settings"
              className="p-2 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#F3F8F7] transition-colors"
              title="CRM Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-[#E2ECEB] mx-1 hidden sm:block" />

          {/* User Profile Chip */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-[#F3F8F7] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#078783] text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-[#11232B] truncate max-w-[130px]">{displayName}</div>
                <div className="text-[10px] text-[#078783] font-medium truncate max-w-[130px]">{displayRole}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5A7178] hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-[#E2ECEB] py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#E2ECEB]">
                  <div className="font-semibold text-[#11232B] truncate">{displayName}</div>
                  <div className="text-[11px] text-[#5A7178] truncate">{displayEmail}</div>
                  <span className="inline-block px-1.5 py-0.5 bg-teal-50 text-[#078783] rounded text-[9px] font-bold mt-1">
                    {displayRole} • {displayStaffId}
                  </span>
                </div>
                <div className="py-1">
                  {isAdmin && (
                    <>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#5A7178] hover:text-[#11232B] hover:bg-[#F3F8F7]"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Company & Profile Settings</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#5A7178] hover:text-[#11232B] hover:bg-[#F3F8F7]"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#078783]" />
                        <span>User Roles & Permissions</span>
                      </Link>
                    </>
                  )}
                  {(isAdmin || hasPermission("reports", "view")) && (
                    <Link
                      href="/reports"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#5A7178] hover:text-[#11232B] hover:bg-[#F3F8F7]"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Executive Analytics Audit</span>
                    </Link>
                  )}
                </div>
                <div className="border-t border-[#E2ECEB] pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowSignOutDialog(true);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Session / Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Session Lock Modal */}
      {showSignOutDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-[#078783] rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Sign Out / Lock Session</h3>
                <p className="text-xs text-gray-500">{displayName} ({displayRole})</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your active session token will be cleared securely. You will be redirected to the CRM login portal.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isSigningOut}
                onClick={() => setShowSignOutDialog(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isSigningOut ? "Signing out..." : "Sign Out Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
