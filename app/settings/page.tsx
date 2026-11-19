"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Sliders,
  Users,
  Layers,
  BookOpen,
  Bell,
  Shield,
  Database,
  FileText,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { CompanyProfileTab } from "@/components/settings/company-profile-tab";
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab";
import { UsersPermissionsTab } from "@/components/settings/users-permissions-tab";
import { DepartmentsTab } from "@/components/settings/departments-tab";
import { CourseBatchTab } from "@/components/settings/course-batch-tab";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { SecurityTab } from "@/components/settings/security-tab";
import { DataBackupTab } from "@/components/settings/data-backup-tab";
import { AuditLogsTab } from "@/components/settings/audit-logs-tab";
import {
  FullSettingsPayload,
  CompanySettings,
  GeneralSettings,
  DepartmentItem,
  CourseBatchConfig,
  SecuritySettings,
} from "@/lib/validations/settings";

type TabKey =
  | "company"
  | "general"
  | "users"
  | "departments"
  | "course-batch"
  | "notifications"
  | "security"
  | "data-backup"
  | "audit-logs";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("company");
  const [settingsData, setSettingsData] = useState<FullSettingsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        throw new Error(`Failed to load system settings: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setSettingsData(json.data);
      } else {
        throw new Error(json.error || "Failed to load CRM settings.");
      }
    } catch (err: any) {
      console.error("Error loading settings:", err);
      setError(err.message || "Failed to retrieve configuration data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Generic Save Handler to update specific sections via PUT /api/settings
  const handleSaveSection = async (section: string, data: any) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section,
        data,
        adminUser: "Rajesh Khanna (Super Admin)",
        adminEmail: "rajesh.khanna@nextgendma.com",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to update ${section} settings.`);
    }
    if (json.data) {
      setSettingsData(json.data);
    }
  };

  const handleLogCustomAudit = async (action: string, details: string) => {
    try {
      await fetch("/api/settings/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          category: "Security",
          details,
          user: "Rajesh Khanna (Super Admin)",
          userEmail: "rajesh.khanna@nextgendma.com",
        }),
      });
    } catch {
      // ignore
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "company", label: "Company Profile", icon: Building2 },
    { key: "general", label: "General Settings", icon: Sliders },
    { key: "users", label: "Users & Permissions", icon: Users },
    { key: "departments", label: "Departments", icon: Layers },
    { key: "course-batch", label: "Courses & Batches", icon: BookOpen },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security", icon: Shield },
    { key: "data-backup", label: "Data & Backup", icon: Database },
    { key: "audit-logs", label: "Audit Logs", icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-widest text-[#078783] uppercase flex items-center gap-2">
            <span>NEXT GEN DMA VENTURES</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500 font-medium">ADMINISTRATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#11232B] tracking-tight">
            Settings & CRM Administration
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7178]">
            Configure company branding, operator permissions, academic policies, real verified backups, and security audit logs
          </p>
        </div>

        {/* Super Admin Session Pill */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm self-start sm:self-auto text-xs">
          <ShieldCheck className="w-4 h-4 text-[#078783]" />
          <div>
            <span className="text-[10px] text-gray-400 block leading-tight">Current Session:</span>
            <span className="font-semibold text-gray-800">Rajesh Khanna (Super Admin)</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSettings}
            className="text-xs text-rose-700 underline font-semibold hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Settings Navigation Tabs Bar */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl px-2 pt-2 shadow-sm">
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-[#078783] text-[#078783] bg-teal-50/50 rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#078783]" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Tab View Body */}
      <div>
        {isLoading && !settingsData ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <Loader2 className="w-8 h-8 text-[#078783] animate-spin mb-3" />
            <h3 className="text-sm font-bold text-gray-900">
              Loading NEXT GEN DMA VENTURES Configuration
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Fetching organization identity, access matrix, and database health...
            </p>
          </div>
        ) : settingsData ? (
          <>
            {activeTab === "company" && (
              <CompanyProfileTab
                initialCompany={settingsData.company}
                onSave={async (data: CompanySettings) => handleSaveSection("company", data)}
              />
            )}

            {activeTab === "general" && (
              <GeneralSettingsTab
                initialGeneral={settingsData.general}
                onSave={async (data: GeneralSettings) => handleSaveSection("general", data)}
              />
            )}

            {activeTab === "users" && (
              <UsersPermissionsTab
                onAuditAction={(action, cat, details) => handleLogCustomAudit(action, details)}
              />
            )}

            {activeTab === "departments" && (
              <DepartmentsTab
                initialDepartments={settingsData.departments}
                onSave={async (data: DepartmentItem[]) => handleSaveSection("departments", data)}
              />
            )}

            {activeTab === "course-batch" && (
              <CourseBatchTab
                initialConfig={settingsData.courseBatch}
                onSave={async (data: CourseBatchConfig) => handleSaveSection("courseBatch", data)}
              />
            )}

            {activeTab === "notifications" && <NotificationsTab />}

            {activeTab === "security" && (
              <SecurityTab
                initialSecurity={settingsData.security}
                onSave={async (data: SecuritySettings) => handleSaveSection("security", data)}
                onLogAudit={(action, details) => handleLogCustomAudit(action, details)}
              />
            )}

            {activeTab === "data-backup" && (
              <DataBackupTab initialHealth={settingsData.databaseHealth} />
            )}

            {activeTab === "audit-logs" && <AuditLogsTab />}
          </>
        ) : null}
      </div>
    </div>
  );
}
