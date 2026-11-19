"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  Volume2,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function NotificationsTab() {
  const [settings, setSettings] = useState<any>({
    inAppAlerts: true,
    desktopNotifications: true,
    soundEnabled: false,
    emailDigest: false,
    reminderMinutesBefore: 15,
    categoryPreferences: {
      "New Lead Assigned": true,
      "New Enquiry Received": true,
      "Follow-up Due": true,
      "Follow-up Overdue": true,
      "New Admission": true,
      "Payment Received": true,
      "Pending Payment": true,
      "Counselling Appointment": true,
      "Upcoming Batch": true,
      "Attendance Alert": true,
      "Placement Update": true,
      "Staff Activity": true,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications/settings");
        const json = await res.json();
        if (json.success && json.data) {
          setSettings(json.data);
        }
      } catch (e) {
        // use fallback defaults
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSuccessMsg(null);
  };

  const handleCategoryToggle = (cat: string) => {
    setSettings((prev: any) => ({
      ...prev,
      categoryPreferences: {
        ...prev.categoryPreferences,
        [cat]: !prev.categoryPreferences[cat],
      },
    }));
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update notification settings.");
      }
      setSuccessMsg("Notification rules and dispatch triggers updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
        <Loader2 className="w-6 h-6 text-[#078783] animate-spin mb-2" />
        <p className="text-xs text-gray-500">Loading notification rules...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast Alert */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Delivery Channels */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 text-[#078783] rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Delivery Channels & Audio
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Global alerting methods for counsellors, trainers, and admins
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.inAppAlerts}
                  onChange={() => handleToggle("inAppAlerts")}
                  className="mt-0.5 rounded text-[#078783] focus:ring-[#078783]"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    In-App Notification Centre Bell
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Display unread badge counters and dropdown alerts in header
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.desktopNotifications}
                  onChange={() => handleToggle("desktopNotifications")}
                  className="mt-0.5 rounded text-[#078783] focus:ring-[#078783]"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    Browser Pop-up & Desktop Push Alerts
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Notify when tabs are in background for urgent follow-ups
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={() => handleToggle("soundEnabled")}
                  className="mt-0.5 rounded text-[#078783] focus:ring-[#078783]"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    Chime Sound on Inbound Lead
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Play audio cue when a new walk-in or website lead is registered
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailDigest}
                  onChange={() => handleToggle("emailDigest")}
                  className="mt-0.5 rounded text-[#078783] focus:ring-[#078783]"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    Daily Executive Email Digest
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Send 09:00 AM summary of admissions, collections, and overdue follow-ups
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <label className="block text-gray-700 font-semibold mb-1">
                Pre-appointment Reminder Timing
              </label>
              <select
                value={settings.reminderMinutesBefore || 15}
                onChange={(e) =>
                  setSettings((prev: any) => ({
                    ...prev,
                    reminderMinutesBefore: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value={10}>10 minutes before session</option>
                <option value={15}>15 minutes before session (Recommended)</option>
                <option value={30}>30 minutes before session</option>
                <option value={60}>1 hour before session</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Category Filters */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Trigger Categories
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Select which system events generate real-time staff alerts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-xs">
            {Object.keys(settings.categoryPreferences || {}).map((cat) => (
              <label
                key={cat}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
              >
                <span className="font-medium text-gray-800">{cat}</span>
                <input
                  type="checkbox"
                  checked={settings.categoryPreferences[cat]}
                  onChange={() => handleCategoryToggle(cat)}
                  className="rounded text-[#078783] focus:ring-[#078783]"
                />
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-[#078783] hover:bg-[#066F6C] text-white gap-2 px-5 text-xs h-9 shadow-sm"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Notification Preferences</span>
        </Button>
      </div>
    </form>
  );
}
