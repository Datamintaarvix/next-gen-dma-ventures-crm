"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Users,
  MessageSquare,
  Clock,
  FileCheck2,
  CreditCard,
  HeartHandshake,
  AlertTriangle,
  Briefcase,
  Layers,
  ChevronRight,
} from "lucide-react";
import { NotificationRecord, NotificationType } from "@/lib/validations/notification";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
      if (data.kpis) {
        setUnreadCount(data.kpis.unread || 0);
      }
    } catch (err) {
      console.error("Error fetching header notifications", err);
    }
  };

  useEffect(() => {
    fetchUnread();

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      });
      fetchUnread();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      fetchUnread();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const formatRelative = (isoString: string) => {
    try {
      const diffMs = new Date().getTime() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return "";
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "New Lead Assigned":
        return <Users className="w-3.5 h-3.5 text-[#078783]" />;
      case "New Admission":
        return <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "Payment Received":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case "Counselling Appointment":
        return <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />;
      case "Attendance Alert":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case "Placement Update":
        return <Briefcase className="w-3.5 h-3.5 text-teal-600" />;
      case "Upcoming Batch":
        return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchUnread();
        }}
        className="p-2 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#F3F8F7] relative transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#078783] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-in zoom-in-75">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-300 rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-[#F9FBFA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-[#078783] hover:underline font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notifications.slice(0, 5).map((n) => {
              const isUnread = n.status === "Unread";
              return (
                <div
                  key={n.id}
                  className={`p-3.5 hover:bg-slate-50 transition flex items-start gap-3 ${
                    isUnread ? "bg-teal-50/20" : ""
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-semibold line-clamp-1 ${
                          isUnread ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={n.linkUrl}
                        onClick={() => setIsOpen(false)}
                        className="text-[10px] text-[#078783] font-semibold hover:underline flex items-center gap-0.5"
                      >
                        Open Record <ChevronRight className="w-3 h-3" />
                      </Link>
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 font-medium"
                          title="Mark read"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No new notifications.
              </div>
            )}
          </div>

          {/* Footer Link to /notifications */}
          <div className="p-2.5 border-t border-slate-100 bg-[#F9FBFA] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#078783] hover:underline inline-flex items-center gap-1"
            >
              View Full Notification Centre
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
