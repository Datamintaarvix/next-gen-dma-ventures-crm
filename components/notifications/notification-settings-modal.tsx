"use client";

import React, { useState, useEffect } from "react";
import {
  NotificationSettings,
  defaultNotificationSettings,
  notificationTypeEnum,
  NotificationType,
} from "@/lib/validations/notification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Settings,
  Bell,
  Volume2,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
} from "lucide-react";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (settings: NotificationSettings) => void;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
  onSuccess,
}: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/notifications/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) setSettings(data.settings);
        })
        .catch((err) => console.error("Error loading notification settings", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleCategory = (cat: NotificationType) => {
    setSettings((prev) => ({
      ...prev,
      categoryPreferences: {
        ...prev.categoryPreferences,
        [cat]: !prev.categoryPreferences[cat],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update notification settings");

      onSuccess(data.settings);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Notification Rules & Dispatch Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Configure in-app alert channels, reminders & category subscriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* General Dispatch Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#078783]" />
              Alert Channels & Timing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* In-app alerts */}
              <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition">
                <div>
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#078783]" />
                    In-App Notification Banners
                  </div>
                  <div className="text-[11px] text-slate-500">Show live top bar bell alerts</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.inAppAlerts}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, inAppAlerts: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#078783] rounded cursor-pointer"
                />
              </label>

              {/* Sound alert */}
              <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition">
                <div>
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                    Chime Sound on New Alert
                  </div>
                  <div className="text-[11px] text-slate-500">Play subtle audio alert</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#078783] rounded cursor-pointer"
                />
              </label>

              {/* Email digest */}
              <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition">
                <div>
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    Daily Email Digest
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Summary of admissions & follow-ups
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailDigest}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, emailDigest: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#078783] rounded cursor-pointer"
                />
              </label>

              {/* Reminder minutes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#078783]" />
                    Session Reminder Timing
                  </div>
                  <div className="text-[11px] text-slate-500">Lead follow-up notice</div>
                </div>
                <select
                  value={settings.reminderMinutesBefore}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      reminderMinutesBefore: Number(e.target.value),
                    }))
                  }
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value={10}>10 mins before</option>
                  <option value={15}>15 mins before</option>
                  <option value={30}>30 mins before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Subscriptions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Enabled Notification Categories
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {notificationTypeEnum.map((type) => {
                const isEnabled = settings.categoryPreferences?.[type] !== false;
                return (
                  <label
                    key={type}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                  >
                    <span className="font-medium text-slate-700">{type}</span>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleCategory(type)}
                      className="w-4 h-4 accent-[#078783] rounded cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-xl px-5 font-semibold text-xs shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
