"use client";

import React from "react";
import Link from "next/link";
import {
  NotificationRecord,
  NotificationType,
  NotificationPriority,
} from "@/lib/validations/notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  CalendarClock,
  Clock,
  FileCheck2,
  CreditCard,
  IndianRupee,
  HeartHandshake,
  Layers,
  AlertTriangle,
  Briefcase,
  ShieldCheck,
  Star,
  CheckCircle2,
  Check,
  Archive,
  Trash2,
  ExternalLink,
  Bell,
} from "lucide-react";

interface NotificationItemProps {
  notification: NotificationRecord;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleImportant: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onDelete,
  onToggleImportant,
}: NotificationItemProps) {
  const isUnread = notification.status === "Unread";

  // Visual icon & styling by type
  const getTypeMeta = (type: NotificationType) => {
    switch (type) {
      case "New Lead Assigned":
        return { icon: Users, color: "text-[#078783]", bg: "bg-teal-50 border-teal-200" };
      case "New Enquiry Received":
        return { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
      case "Follow-up Due":
        return { icon: CalendarClock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
      case "Follow-up Overdue":
        return { icon: Clock, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
      case "New Admission":
        return { icon: FileCheck2, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
      case "Payment Received":
        return { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
      case "Pending Payment":
        return { icon: IndianRupee, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
      case "Counselling Appointment":
        return { icon: HeartHandshake, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" };
      case "Upcoming Batch":
        return { icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
      case "Attendance Alert":
        return { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
      case "Placement Update":
        return { icon: Briefcase, color: "text-[#078783]", bg: "bg-teal-50 border-teal-200" };
      case "Staff Activity":
      default:
        return { icon: ShieldCheck, color: "text-slate-600", bg: "bg-slate-100 border-slate-200" };
    }
  };

  const meta = getTypeMeta(notification.type);
  const IconComponent = meta.icon;

  // Format relative time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`p-4 bg-white border rounded-2xl transition-all duration-150 flex flex-col sm:flex-row items-start justify-between gap-4 ${
        isUnread
          ? "border-teal-200 shadow-xs bg-gradient-to-r from-teal-50/20 to-white"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3.5 flex-1">
        {/* Type Icon */}
        <div
          className={`p-2.5 rounded-xl border ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}
        >
          <IconComponent className={`w-5 h-5 ${meta.color}`} />
        </div>

        {/* Content Body */}
        <div className="space-y-1.5 flex-1">
          {/* Header row: Status Dot, Title, Priority, Time */}
          <div className="flex flex-wrap items-center gap-2">
            {isUnread && (
              <span
                className="w-2 h-2 rounded-full bg-[#078783] shrink-0"
                title="Unread Notification"
              />
            )}
            <h4
              className={`text-sm font-bold leading-tight ${
                isUnread ? "text-slate-900" : "text-slate-700"
              }`}
            >
              {notification.title}
            </h4>

            {/* Priority Badge */}
            <Badge
              className={`text-[9px] font-bold px-1.5 py-0.2 ${
                notification.priority === "Urgent"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : notification.priority === "High"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : notification.priority === "Medium"
                  ? "bg-teal-50 text-teal-800 border-teal-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {notification.priority}
            </Badge>

            {/* Notification Type Pill */}
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {notification.type}
            </span>

            <span className="text-[11px] text-slate-400 ml-auto whitespace-nowrap">
              {formatTime(notification.createdAt)}
            </span>
          </div>

          {/* Message Description */}
          <p className="text-xs text-slate-600 leading-relaxed">{notification.message}</p>

          {/* Related Record Link & Recipient Tag */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href={notification.linkUrl}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50/80 hover:bg-teal-100 border border-teal-200 text-[#078783] font-semibold text-[11px] transition"
            >
              <span>
                Record: {notification.relatedId} ({notification.relatedModule})
              </span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {notification.recipientName && (
              <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                Assigned: <strong className="text-slate-700">{notification.recipientName}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
        {/* Toggle Important Star */}
        <button
          type="button"
          onClick={() => onToggleImportant(notification.id)}
          className={`p-1.5 rounded-lg transition ${
            notification.isImportant
              ? "text-yellow-500 hover:bg-yellow-50"
              : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
          }`}
          title={notification.isImportant ? "Unflag" : "Flag as Important"}
        >
          <Star className={`w-4 h-4 ${notification.isImportant ? "fill-yellow-400" : ""}`} />
        </button>

        {/* Mark as Read / Unread */}
        {isUnread ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMarkRead(notification.id)}
            className="h-8 px-2.5 text-xs text-[#078783] hover:bg-teal-50 font-semibold"
            title="Mark as Read"
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Mark Read
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMarkUnread(notification.id)}
            className="h-8 px-2 text-xs text-slate-500 hover:bg-slate-100"
            title="Mark as Unread"
          >
            Mark Unread
          </Button>
        )}

        {/* Archive */}
        {notification.status !== "Archived" && (
          <button
            type="button"
            onClick={() => onArchive(notification.id)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Archive Notification"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Delete Notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
