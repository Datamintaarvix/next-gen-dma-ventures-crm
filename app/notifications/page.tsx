"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  NotificationRecord,
  NotificationKPIStats,
  notificationTypeEnum,
  notificationPriorityEnum,
  NotificationType,
  NotificationPriority,
  NotificationSettings,
  defaultNotificationSettings,
} from "@/lib/validations/notification";
import { NotificationKPIs } from "@/components/notifications/notification-kpis";
import { NotificationItem } from "@/components/notifications/notification-item";
import { NotificationSettingsModal } from "@/components/notifications/notification-settings-modal";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Bell,
  BellRing,
  CheckCheck,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  Settings,
  Star,
  Archive,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [kpis, setKpis] = useState<NotificationKPIStats>({
    total: 0,
    unread: 0,
    read: 0,
    important: 0,
    archived: 0,
    urgent: 0,
    typeBreakdown: {},
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filters State
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (notificationToast) {
      const timer = setTimeout(() => setNotificationToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationToast]);

  // Load Notifications
  const fetchNotifications = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (activeStatusFilter !== "All") params.set("status", activeStatusFilter);
      if (selectedType !== "All") params.set("type", selectedType);
      if (selectedPriority !== "All") params.set("priority", selectedPriority);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load notifications");

      if (data.notifications) setNotifications(data.notifications);
      if (data.kpis) setKpis(data.kpis);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setNotificationToast({
        type: "error",
        message: err.message || "Failed to load notifications",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeStatusFilter, selectedType, selectedPriority]);

  // Handlers for individual item actions
  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      });
      if (res.ok) {
        fetchNotifications(true);
      }
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleMarkUnread = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unread" }),
      });
      if (res.ok) {
        fetchNotifications(true);
      }
    } catch (err) {
      console.error("Failed to mark notification unread", err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      if (res.ok) {
        setNotificationToast({
          type: "success",
          message: "Notification moved to archive.",
        });
        fetchNotifications(true);
      }
    } catch (err) {
      console.error("Failed to archive notification", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification record permanently?")) {
      return;
    }
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotificationToast({
          type: "success",
          message: "Notification removed permanently.",
        });
        fetchNotifications(true);
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleToggleImportant = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-important" }),
      });
      if (res.ok) {
        fetchNotifications(true);
      }
    } catch (err) {
      console.error("Failed to toggle important", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotificationToast({
          type: "success",
          message: "All unread notifications marked as read.",
        });
        fetchNotifications(true);
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Filtered Notifications for search and pagination
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.relatedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.type.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSearch;
    });
  }, [notifications, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / pageSize) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage]);

  return (
    <div className="min-h-screen bg-[#F3F8F7] pb-16">
      {/* Toast Notification Banner */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in slide-in-from-top duration-300">
          <div
            className={`p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 border ${
              notificationToast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notificationToast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span className="text-xs font-semibold">{notificationToast.message}</span>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="p-1 hover:bg-black/10 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Header & Quick Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#078783] text-white rounded-xl shadow-sm">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#192C34] tracking-tight">
                  Notification Centre
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Institutional event stream, actionable alerts & real-time CRM updates
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchNotifications(true)}
              disabled={isRefreshing}
              className="rounded-xl border-slate-300 hover:bg-white text-xs h-9"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-[#078783]" : ""}`}
              />
              Refresh
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSettingsModalOpen(true)}
              className="rounded-xl border-slate-300 hover:bg-white text-xs h-9 flex items-center gap-1.5 text-slate-700"
            >
              <Settings className="w-3.5 h-3.5 text-[#078783]" />
              Alert Rules & Settings
            </Button>

            {kpis.unread > 0 && (
              <Button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-xl text-xs h-9 px-3.5 font-semibold shadow-sm flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read ({kpis.unread})
              </Button>
            )}
          </div>
        </div>

        {/* 6 KPI Highlights Ribbon */}
        <NotificationKPIs
          stats={kpis}
          activeStatusFilter={activeStatusFilter}
          onStatusFilterChange={(st) => {
            setActiveStatusFilter(st);
            setCurrentPage(1);
          }}
          onMarkAllAsRead={handleMarkAllAsRead}
          isMarkingAllRead={isMarkingAll}
        />

        {/* Status Navigation Tab Pills */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: "All", label: "All Active Alerts", count: kpis.total, icon: Bell },
              { id: "Unread", label: "Unread", count: kpis.unread, icon: BellRing },
              { id: "Urgent", label: "Urgent Action", count: kpis.urgent, icon: AlertTriangle },
              { id: "Important", label: "Flagged Important", count: kpis.important, icon: Star },
              { id: "Read", label: "Read / Reviewed", count: kpis.read, icon: CheckCheck },
              { id: "Archived", label: "Archived", count: kpis.archived, icon: Archive },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#192C34] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <TabIcon
                    className={`w-4 h-4 ${isActive ? "text-[#38B2AC]" : "text-slate-500"}`}
                  />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E2ECEB] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title, message, related ID, recipient..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#078783] transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {notificationTypeEnum.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-medium">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                {notificationPriorityEnum.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400 font-medium px-2">
              Showing {filteredNotifications.length} alerts
            </div>
          </div>
        </div>

        {/* Notifications Stream List */}
        <div className="space-y-3">
          {paginatedNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onToggleImportant={handleToggleImportant}
            />
          ))}

          {filteredNotifications.length === 0 && (
            <Card className="p-12 text-center bg-white border border-[#E2ECEB] rounded-2xl">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                There are no notifications matching your selected status or search filter.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveStatusFilter("All");
                  setSelectedType("All");
                  setSelectedPriority("All");
                  setSearchTerm("");
                }}
                className="text-xs rounded-xl border-slate-300"
              >
                Reset Filters
              </Button>
            </Card>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-white border border-[#E2ECEB] rounded-2xl flex items-center justify-between text-xs text-slate-600 shadow-xs">
            <div>
              Page <span className="font-bold text-slate-800">{currentPage}</span> of{" "}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 px-2.5 rounded-lg border-slate-300"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                    currentPage === idx + 1
                      ? "bg-[#078783] text-white"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-7 px-2.5 rounded-lg border-slate-300"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Rules & Settings Modal */}
      <NotificationSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSuccess={() => {
          setNotificationToast({
            type: "success",
            message: "Notification alert preferences saved successfully!",
          });
        }}
      />
    </div>
  );
}
