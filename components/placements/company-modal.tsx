"use client";

import React, { useState, useEffect } from "react";
import {
  CompanyRecord,
  CompanyFormData,
  partnershipStatusEnum,
  PartnershipStatus,
} from "@/lib/validations/placement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Building2,
  Globe,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from "lucide-react";

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: CompanyRecord) => void;
  initialData?: CompanyRecord | null;
}

const industryList = [
  "IT & Software Services",
  "Product & SaaS",
  "Digital Marketing & Advertising",
  "Data Science & AI/ML",
  "FinTech & Banking",
  "EdTech & E-Learning",
  "E-Commerce & Retail",
  "UI/UX & Creative Design",
  "Consulting & Business Analytics",
  "Healthcare & BioTech",
  "Media & Entertainment",
  "Other",
];

export function CompanyModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CompanyModalProps) {
  const isEditing = !!initialData;

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState(industryList[0]);
  const [customIndustry, setCustomIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [partnershipStatus, setPartnershipStatus] = useState<PartnershipStatus>("Active");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      if (industryList.includes(initialData.industry)) {
        setIndustry(initialData.industry);
        setCustomIndustry("");
      } else {
        setIndustry("Other");
        setCustomIndustry(initialData.industry);
      }
      setWebsite(initialData.website || "");
      setContactPerson(initialData.contactPerson || "");
      setContactEmail(initialData.contactEmail || "");
      setContactNumber(initialData.contactNumber || "");
      setAddress(initialData.address || "");
      setPartnershipStatus(initialData.partnershipStatus || "Active");
      setNotes(initialData.notes || "");
    } else {
      setName("");
      setIndustry(industryList[0]);
      setCustomIndustry("");
      setWebsite("");
      setContactPerson("");
      setContactEmail("");
      setContactNumber("");
      setAddress("Bengaluru, Karnataka");
      setPartnershipStatus("Active");
      setNotes("");
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalIndustry = industry === "Other" ? (customIndustry.trim() || "Technology") : industry;

    if (!name.trim()) {
      setErrorMsg("Company name is required.");
      return;
    }
    if (!contactPerson.trim()) {
      setErrorMsg("Contact person name is required.");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      setErrorMsg("Please enter a valid official email address.");
      return;
    }
    if (!contactNumber.trim() || contactNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit contact number.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Company address / location is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CompanyFormData = {
        name: name.trim(),
        industry: finalIndustry,
        website: website.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        partnershipStatus,
        notes: notes.trim() || undefined,
      };

      const url = isEditing
        ? `/api/placements/companies/${initialData.id}`
        : "/api/placements/companies";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save company information");
      }

      onSuccess(data.company);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F9FBFA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#078783]/10 text-[#078783] rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? `Edit Hiring Partner · ${initialData?.id}` : "Register Partner Company"}
              </h3>
              <p className="text-xs text-slate-500">
                Maintain corporate relationships, recruiter contacts and MOU status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Company Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#078783]" />
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. GrowthPulse Media or Google"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Partnership Status</label>
              <select
                value={partnershipStatus}
                onChange={(e) => setPartnershipStatus(e.target.value as PartnershipStatus)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white font-medium"
              >
                {partnershipStatusEnum.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Industry & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-500" />
                Industry Vertical <span className="text-red-500">*</span>
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none bg-white"
              >
                {industryList.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              {industry === "Other" && (
                <input
                  type="text"
                  placeholder="Specify industry"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#078783]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-500" />
                Official Website
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
              />
            </div>
          </div>

          {/* Recruiter / Contact Person Details */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#078783]" />
              Primary Recruiter / HR Contact
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shalini Nair (HR Head)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-[#078783] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Official Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="hr@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-[#078783] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-[#078783] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Address / Location */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              Office Address / Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 4th Block, Indiranagar, Bengaluru, Karnataka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              Hiring Notes & MOU Terms (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. MOU renewed annually in July; prefers digital marketing candidates with Google Ads certification."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#078783]/20 focus:border-[#078783] outline-none resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#078783] hover:bg-[#066f6c] text-white rounded-xl px-5 font-semibold shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Update Company
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Register Partner
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
