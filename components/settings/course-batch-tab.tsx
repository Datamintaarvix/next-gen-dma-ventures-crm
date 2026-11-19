"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseBatchConfig } from "@/lib/validations/settings";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

interface CourseBatchTabProps {
  initialConfig: CourseBatchConfig;
  onSave: (config: CourseBatchConfig) => Promise<void>;
}

export function CourseBatchTab({ initialConfig, onSave }: CourseBatchTabProps) {
  const [formData, setFormData] = useState<CourseBatchConfig>(initialConfig);
  const [newCatInput, setNewCatInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (formData.courseCategories.includes(trimmed)) {
      alert("Category already exists.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      courseCategories: [...prev.courseCategories, trimmed],
    }));
    setNewCatInput("");
  };

  const handleRemoveCategory = (cat: string) => {
    if (formData.courseCategories.length <= 1) {
      alert("At least one course category must be retained.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      courseCategories: prev.courseCategories.filter((c) => c !== cat),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await onSave(formData);
      setSuccessMsg("Academic courses & batch cohort preferences updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save configuration.");
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast Notifications */}
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

      {/* Module Shortcuts Card */}
      <div className="bg-[#F3F8F7] border border-[#E2ECEB] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h4 className="font-bold text-[#11232B] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#078783]" />
            Direct Module Shortcuts
          </h4>
          <p className="text-gray-500 mt-0.5">
            Settings apply globally across Course and Batch management modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:text-[#078783] hover:border-[#078783] font-medium flex items-center gap-1"
          >
            Manage Courses <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/batches"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:text-[#078783] hover:border-[#078783] font-medium flex items-center gap-1"
          >
            Manage Batches <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Course Categories */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 text-[#078783] rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Course Curriculum Categories
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Standard classifications used when publishing courses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex flex-wrap gap-2">
              {formData.courseCategories.map((cat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#078783] border border-teal-200 rounded-full text-xs font-medium"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="hover:text-rose-600 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add new category..."
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCategory}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Batch & Cohort Defaults */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-[#11232B]">
                  Cohort Capacities & Attendance Thresholds
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Global parameters applied to training batches
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Default Batch Capacity
                </label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={formData.defaultBatchCapacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultBatchCapacity: parseInt(e.target.value, 10) || 25,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Maximum students per cohort</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Low Attendance Alert (%)
                </label>
                <input
                  type="number"
                  min={50}
                  max={90}
                  value={formData.lowAttendanceThreshold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lowAttendanceThreshold: parseInt(e.target.value, 10) || 75,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Triggers debarment watchlist</p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Default Campus Classroom / Lab Location
              </label>
              <input
                type="text"
                value={formData.defaultClassroom}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, defaultClassroom: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowBatchTransfer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allowBatchTransfer: e.target.checked,
                    }))
                  }
                  className="rounded text-[#078783] focus:ring-[#078783]"
                />
                <span className="font-medium text-gray-800">
                  Allow Student Batch Transfers between running cohorts
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoEnrollmentApproval}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      autoEnrollmentApproval: e.target.checked,
                    }))
                  }
                  className="rounded text-[#078783] focus:ring-[#078783]"
                />
                <span className="font-medium text-gray-800">
                  Automatic Admission Enrollment on 100% upfront fee payment
                </span>
              </label>
            </div>
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
          <span>Save Academic Configurations</span>
        </Button>
      </div>
    </form>
  );
}
