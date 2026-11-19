"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DepartmentItem } from "@/lib/validations/settings";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Briefcase,
  Save,
  Loader2,
} from "lucide-react";

interface DepartmentsTabProps {
  initialDepartments: DepartmentItem[];
  onSave: (departments: DepartmentItem[]) => Promise<void>;
}

export function DepartmentsTab({ initialDepartments, onSave }: DepartmentsTabProps) {
  const [departments, setDepartments] = useState<DepartmentItem[]>(initialDepartments);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headOfDepartment, setHeadOfDepartment] = useState("");
  const [designationsText, setDesignationsText] = useState("");
  const [colorBadge, setColorBadge] = useState("teal");

  const openAddModal = () => {
    setEditingDept(null);
    setName("");
    setDescription("");
    setHeadOfDepartment("");
    setDesignationsText("Junior Associate, Senior Associate, Team Lead");
    setColorBadge("teal");
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description);
    setHeadOfDepartment(dept.headOfDepartment || "");
    setDesignationsText(dept.designations.join(", "));
    setColorBadge(dept.colorBadge || "teal");
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedDesignations = designationsText
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    let updatedList: DepartmentItem[];

    if (editingDept) {
      updatedList = departments.map((d) =>
        d.id === editingDept.id
          ? {
              ...d,
              name: name.trim(),
              description: description.trim(),
              headOfDepartment: headOfDepartment.trim() || null,
              designations: parsedDesignations.length > 0 ? parsedDesignations : ["Executive"],
              colorBadge,
            }
          : d
      );
    } else {
      const newDept: DepartmentItem = {
        id: `dept-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        description: description.trim(),
        headOfDepartment: headOfDepartment.trim() || null,
        designations: parsedDesignations.length > 0 ? parsedDesignations : ["Executive"],
        colorBadge,
      };
      updatedList = [...departments, newDept];
    }

    setIsSaving(true);
    try {
      await onSave(updatedList);
      setDepartments(updatedList);
      setSuccessMsg(
        editingDept
          ? `Department "${name}" updated successfully.`
          : `Department "${name}" created successfully.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save department.");
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDepartment = async (id: string, deptName: string) => {
    if (departments.length <= 1) {
      alert("At least one operational department must remain configured.");
      return;
    }
    if (!confirm(`Are you sure you want to remove the "${deptName}" department?`)) return;

    const updated = departments.filter((d) => d.id !== id);
    setIsSaving(true);
    try {
      await onSave(updated);
      setDepartments(updated);
      setSuccessMsg(`Department "${deptName}" removed.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
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

      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#11232B]">
            Organizational Structure & Hierarchy
          </h3>
          <p className="text-xs text-gray-500">
            Configure institutional divisions, functional departments, and role designations
          </p>
        </div>
        <Button
          onClick={openAddModal}
          size="sm"
          className="bg-[#078783] hover:bg-[#066F6C] text-white text-xs gap-1.5 h-8 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </Button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Card
            key={dept.id}
            className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden flex flex-col justify-between"
          >
            <CardHeader className="pb-3 border-b border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#078783] tracking-wider block mb-1">
                    {dept.id}
                  </span>
                  <CardTitle className="text-sm font-bold text-[#11232B]">
                    {dept.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(dept)}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                    className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-1">
                {dept.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-3 text-xs flex-1">
              <div>
                <span className="text-[11px] font-semibold text-gray-700 block mb-0.5">
                  Head of Department:
                </span>
                <p className="text-gray-900 font-medium">
                  {dept.headOfDepartment || "Unassigned"}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-gray-700 block mb-1.5">
                  Designations & Roles ({dept.designations.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {dept.designations.map((desig, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-medium"
                    >
                      {desig}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">
                {editingDept ? "Edit Department" : "Add New Department"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Corporate Training"
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Department Scope & Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key responsibilities and goals..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Head of Department / Lead
                </label>
                <input
                  type="text"
                  value={headOfDepartment}
                  onChange={(e) => setHeadOfDepartment(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Designations List (comma separated) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={designationsText}
                  onChange={(e) => setDesignationsText(e.target.value)}
                  placeholder="e.g. Senior Counsellor, Academic Counsellor, Lead Telecaller"
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#078783]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Separate multiple titles with commas. Staff forms will populate these options.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="bg-[#078783] hover:bg-[#066F6C] text-white text-xs gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
