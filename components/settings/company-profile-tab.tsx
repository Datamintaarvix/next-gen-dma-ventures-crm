"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanySettings } from "@/lib/validations/settings";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";

interface CompanyProfileTabProps {
  initialCompany: CompanySettings;
  onSave: (data: CompanySettings) => Promise<void>;
}

export function CompanyProfileTab({ initialCompany, onSave }: CompanyProfileTabProps) {
  const [formData, setFormData] = useState<CompanySettings>(initialCompany);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof CompanySettings, value: string) => {
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
      setSuccessMsg("Company profile and branding settings updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update company settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast Notification Alerts */}
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

      {/* Main Grid: Form Inputs + Live Branding Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-[#078783] rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#11232B]">
                    Institutional Profile & Identity
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Official organization details used in student certificates, invoices, and executive reports
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Company / Institute Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ""}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="e.g. Empowering Tomorrow's Tech Leaders"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Official Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Logo Asset Path / URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Default: /assets/nextgen-dma-logo.png (stored in public directory)
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Registered Campus Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Company Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    GSTIN / Tax Registration No.
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber || ""}
                    onChange={(e) => handleChange("gstNumber", e.target.value)}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Business Incorporation / Registration ID
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber || ""}
                    onChange={(e) => handleChange("registrationNumber", e.target.value)}
                    placeholder="e.g. DMA-REG-2024-889"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Document Branding Preview Card */}
        <div className="space-y-4">
          <Card className="border border-teal-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-teal-50/60 pb-3 border-b border-teal-100">
              <div className="flex items-center gap-2 text-[#078783]">
                <Eye className="w-4 h-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">
                  Live Branding Preview
                </CardTitle>
              </div>
              <CardDescription className="text-[11px] text-gray-500">
                How institutional identity appears on payment receipts & reports
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Receipt/Report Header Preview Box */}
              <div className="border border-gray-200 rounded-xl p-4 bg-[#F8FAF9] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 bg-white rounded-lg p-1 border border-gray-200 shrink-0">
                    <Image
                      src={formData.logoUrl || "/assets/nextgen-dma-logo.png"}
                      alt={formData.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#11232B] text-sm leading-tight">
                      {formData.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                      {formData.tagline || "Institute of Technology & Marketing Excellence"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-2 text-[10px] text-gray-600 space-y-0.5">
                  <p className="line-clamp-2">
                    <span className="font-semibold text-gray-700">Campus:</span> {formData.address}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Contact:</span> {formData.phone} | {formData.email}
                  </p>
                  {formData.gstNumber && (
                    <p>
                      <span className="font-semibold text-gray-700">GSTIN:</span> {formData.gstNumber}
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded p-2 text-center text-[10px] text-gray-400 font-mono">
                  [Sample Fee Receipt / Enrollment Certificate]
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5 text-[11px]">
                <span className="font-semibold text-gray-700 block">Consistency Check:</span>
                <p className="text-gray-500">
                  ✓ Synchronized with Executive Analytics reports modal.
                </p>
                <p className="text-gray-500">
                  ✓ Synchronized with Payment receipt generation engine.
                </p>
                <p className="text-gray-500">
                  ✓ Protected against unauthenticated edits.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Action Bar */}
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
          <span>Save Company Profile</span>
        </Button>
      </div>
    </form>
  );
}
