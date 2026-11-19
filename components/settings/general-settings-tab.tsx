"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneralSettings } from "@/lib/validations/settings";
import {
  Sliders,
  Clock,
  Calendar,
  Globe,
  IndianRupee,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LayoutDashboard,
} from "lucide-react";

interface GeneralSettingsTabProps {
  initialGeneral: GeneralSettings;
  onSave: (data: GeneralSettings) => Promise<void>;
}

export function GeneralSettingsTab({ initialGeneral, onSave }: GeneralSettingsTabProps) {
  const [formData, setFormData] = useState<GeneralSettings>(initialGeneral);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof GeneralSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await onSave(formData);
      setSuccessMsg("General CRM application preferences saved successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update general settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert Notifications */}
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
        {/* Card 1: Regional & Localization Preferences */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Regional & Localization
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Timezone, currency symbols, and datetime rendering standards
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                CRM Portal Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.crmName}
                onChange={(e) => handleChange("crmName", e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Default Currency
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.defaultCurrency}
                    onChange={(e) => handleChange("defaultCurrency", e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => handleChange("currencySymbol", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Date Format
                </label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) => handleChange("dateFormat", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                  <option value="DD MMM YYYY">DD MMM YYYY (e.g. 18 Nov 2026)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  System Timezone
                </label>
                <select
                  value={formData.timeZone}
                  onChange={(e) => handleChange("timeZone", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                System Interface Language
              </label>
              <select
                value={formData.defaultLanguage}
                onChange={(e) => handleChange("defaultLanguage", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value="English (India)">English (India)</option>
                <option value="English (US)">English (United States)</option>
                <option value="English (UK)">English (United Kingdom)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: UI & Navigation Defaults */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 text-[#078783] rounded-lg">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Interface & Data Display
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Default record table sizing and dashboard routing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Default Table Rows Per Page
              </label>
              <select
                value={formData.paginationLimit}
                onChange={(e) => handleChange("paginationLimit", parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value={10}>10 records per page (Compact)</option>
                <option value={15}>15 records per page (Standard)</option>
                <option value={20}>20 records per page (Spacious)</option>
                <option value={50}>50 records per page (High Volume)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Default Home Screen View
              </label>
              <select
                value={formData.defaultDashboard}
                onChange={(e) => handleChange("defaultDashboard", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value="executive">Institutional Overview (Executive KPIs)</option>
                <option value="admissions">Admissions & Cohorts Centric</option>
                <option value="leads">Lead Pipeline & Enquiries</option>
                <option value="academics">Academics, Batches & Attendance</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Institutional Financial Year Cycle
              </label>
              <select
                value={formData.fiscalYearStart}
                onChange={(e) => handleChange("fiscalYearStart", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              >
                <option value="April">April - March (Standard Indian Fiscal Year)</option>
                <option value="January">January - December (Calendar Year)</option>
              </select>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100 text-gray-600 space-y-1 text-[11px]">
              <span className="font-semibold text-gray-800 block">Workspace Application State:</span>
              <p>• Date previews render as: <span className="font-mono text-[#078783]">18/11/2026</span></p>
              <p>• Currency figures render as: <span className="font-mono text-[#078783]">₹1,25,000</span></p>
              <p>• Operating server time: <span className="font-mono text-[#078783]">IST (UTC+05:30)</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
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
          <span>Save General Settings</span>
        </Button>
      </div>
    </form>
  );
}
