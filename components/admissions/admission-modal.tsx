"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AdmissionRecord,
  AdmissionFormData,
  admissionStatusEnum,
  paymentMethodEnum,
  defaultDocumentsList,
} from "@/lib/validations/admission";
import { StudentRecord } from "@/lib/validations/student";
import { CourseRecord } from "@/lib/validations/course";
import { BatchRecord } from "@/lib/validations/batch";
import { leadCounselorList } from "@/lib/validations/lead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  FileCheck2,
  UserCheck,
  UserPlus,
  BookOpen,
  Layers,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Search,
  CheckCircle2,
} from "lucide-react";

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admission: AdmissionRecord) => void;
  admissionToEdit?: AdmissionRecord | null;
}

export function AdmissionModal({
  isOpen,
  onClose,
  onSuccess,
  admissionToEdit,
}: AdmissionModalProps) {
  const isEdit = Boolean(admissionToEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // External data
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Student mode: "existing" | "new"
  const [studentMode, setStudentMode] = useState<"existing" | "new">("existing");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Form State
  const [formData, setFormData] = useState<AdmissionFormData>({
    studentMode: "existing",
    studentId: "",
    newStudent: {
      fullName: "",
      phoneNumber: "",
      email: "",
      gender: "Male",
      dateOfBirth: "2002-01-01",
      address: "",
      guardianName: "",
      guardianPhone: "",
    },
    courseName: "Digital Marketing",
    courseCode: "CRS-101",
    batchCode: "DM-2026-M1",
    batchName: "DM Morning Elite",
    admissionDate: todayStr,
    counsellor: "Priya Nair",
    totalFee: 45000,
    discountAmount: 0,
    discountReason: "",
    finalFee: 45000,
    initialPayment: 0,
    paymentMethod: "UPI / GPay",
    transactionRef: "",
    status: "Application Received",
    notes: "",
    documents: [...defaultDocumentsList],
  });

  // Fetch reference students, courses, batches
  useEffect(() => {
    if (isOpen) {
      setIsLoadingData(true);
      Promise.all([
        fetch("/api/students").then((r) => r.json()),
        fetch("/api/courses").then((r) => r.json()),
        fetch("/api/batches").then((r) => r.json()),
      ])
        .then(([sData, cData, bData]) => {
          if (sData.success) setStudents(sData.data || []);
          if (cData.success) setCourses(cData.data || []);
          if (bData.success) setBatches(bData.data || []);
        })
        .catch((err) => console.error("Error loading admission modal data:", err))
        .finally(() => setIsLoadingData(false));
    }
  }, [isOpen]);

  // Populate edit data
  useEffect(() => {
    if (admissionToEdit) {
      setStudentMode("existing");
      setSelectedStudentId(admissionToEdit.studentId);
      setFormData({
        studentMode: "existing",
        studentId: admissionToEdit.studentId,
        courseName: admissionToEdit.courseName,
        courseCode: admissionToEdit.courseCode,
        batchCode: admissionToEdit.batchCode,
        batchName: admissionToEdit.batchName,
        admissionDate: admissionToEdit.admissionDate,
        counsellor: admissionToEdit.counsellor,
        totalFee: admissionToEdit.totalFee,
        discountAmount: admissionToEdit.discountAmount,
        discountReason: admissionToEdit.discountReason || "",
        finalFee: admissionToEdit.finalFee,
        initialPayment: 0,
        paymentMethod: (admissionToEdit.paymentMethod as any) || "UPI / GPay",
        transactionRef: "",
        status: admissionToEdit.status,
        notes: admissionToEdit.notes || "",
        documents: admissionToEdit.documents || [...defaultDocumentsList],
      });
    } else {
      setStudentMode("existing");
      setSelectedStudentId("");
      setFormData({
        studentMode: "existing",
        studentId: "",
        newStudent: {
          fullName: "",
          phoneNumber: "",
          email: "",
          gender: "Male",
          dateOfBirth: "2002-01-01",
          address: "",
          guardianName: "",
          guardianPhone: "",
        },
        courseName: courses[0]?.courseName || "Digital Marketing",
        courseCode: courses[0]?.courseCode || "CRS-101",
        batchCode: batches[0]?.batchCode || "DM-2026-M1",
        batchName: batches[0]?.batchName || "DM Morning Elite",
        admissionDate: todayStr,
        counsellor: leadCounselorList[0] || "Priya Nair",
        totalFee: courses[0]?.fees || 45000,
        discountAmount: 0,
        discountReason: "",
        finalFee: courses[0]?.fees || 45000,
        initialPayment: 0,
        paymentMethod: "UPI / GPay",
        transactionRef: "",
        status: "Application Received",
        notes: "",
        documents: [...defaultDocumentsList],
      });
    }
    setError(null);
  }, [admissionToEdit, isOpen, courses.length, batches.length]);

  // Handle Course Change
  const handleCourseChange = (selectedCourseName: string) => {
    const selected = courses.find((c) => c.courseName === selectedCourseName);
    const newTotalFee = selected?.fees ?? formData.totalFee;
    const newFinalFee = Math.max(0, newTotalFee - (formData.discountAmount || 0));

    // Find available batches for this course
    const courseBatches = batches.filter(
      (b) => b.courseName.toLowerCase() === selectedCourseName.toLowerCase()
    );
    const firstBatch = courseBatches[0];

    setFormData((prev) => ({
      ...prev,
      courseName: selectedCourseName,
      courseCode: selected?.courseCode || "CRS-GEN",
      totalFee: newTotalFee,
      finalFee: newFinalFee,
      batchCode: firstBatch ? firstBatch.batchCode : prev.batchCode,
      batchName: firstBatch ? firstBatch.batchName : prev.batchName,
    }));
  };

  // Handle Discount change
  const handleDiscountChange = (discount: number) => {
    const safeDiscount = Math.max(0, discount);
    const finalFee = Math.max(0, formData.totalFee - safeDiscount);
    setFormData((prev) => ({
      ...prev,
      discountAmount: safeDiscount,
      finalFee,
    }));
  };

  // Handle Total Fee manual edit
  const handleTotalFeeChange = (fee: number) => {
    const safeFee = Math.max(0, fee);
    const finalFee = Math.max(0, safeFee - (formData.discountAmount || 0));
    setFormData((prev) => ({
      ...prev,
      totalFee: safeFee,
      finalFee,
    }));
  };

  // Filter batches for current course
  const currentCourseBatches = useMemo(() => {
    return batches.filter(
      (b) => b.courseName.toLowerCase() === formData.courseName.toLowerCase()
    );
  }, [batches, formData.courseName]);

  // Filter students for existing student selector
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.phoneNumber.includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        ...formData,
        studentMode,
        studentId: studentMode === "existing" ? selectedStudentId : null,
      };

      if (studentMode === "existing" && !selectedStudentId) {
        throw new Error("Please select an existing student from the directory");
      }

      if (studentMode === "new") {
        if (!formData.newStudent?.fullName || !formData.newStudent?.phoneNumber || !formData.newStudent?.email) {
          throw new Error("Please provide the candidate's full name, phone number, and email address");
        }
      }

      if (formData.finalFee < 0) {
        throw new Error("Final payable fee cannot be negative");
      }

      if (formData.initialPayment && formData.initialPayment > formData.finalFee) {
        throw new Error("Initial payment cannot exceed the final payable amount");
      }

      const url = isEdit ? `/api/admissions/${admissionToEdit?.id}` : "/api/admissions";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save admission record");
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E2ECEB] overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2ECEB] bg-[#F8FBFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F5F4] flex items-center justify-center text-[#078783]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#11232B]">
                {isEdit ? `Edit Admission (${admissionToEdit?.admissionCode})` : "Create New Admission"}
              </h2>
              <p className="text-xs text-[#5A7178]">
                {isEdit
                  ? "Update academic cohort, fee structure, or document verifications"
                  : "Register a candidate, assign course & cohort batch, and setup tuition payments"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5A7178] hover:text-[#11232B] hover:bg-[#EAEAEA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Candidate / Student Selection */}
          {!isEdit && (
            <div className="space-y-3 p-4 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#078783]" />
                  Candidate Selection
                </label>
                <div className="flex items-center gap-1 bg-[#E8EFEF] p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode("existing");
                      setFormData((p) => ({ ...p, studentMode: "existing" }));
                    }}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      studentMode === "existing"
                        ? "bg-white text-[#078783] shadow-sm font-semibold"
                        : "text-[#5A7178] hover:text-[#11232B]"
                    }`}
                  >
                    Select Existing Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode("new");
                      setFormData((p) => ({ ...p, studentMode: "new" }));
                    }}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      studentMode === "new"
                        ? "bg-white text-[#078783] shadow-sm font-semibold"
                        : "text-[#5A7178] hover:text-[#11232B]"
                    }`}
                  >
                    + Register New Student
                  </button>
                </div>
              </div>

              {studentMode === "existing" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#5A7178] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter student directory by name, code (STU-1001), phone, or email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2ECEB] bg-white text-[#11232B] focus:outline-none focus:border-[#078783]"
                    />
                  </div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required={studentMode === "existing"}
                    className="w-full text-xs bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                  >
                    <option value="">-- Choose a student from directory ({filteredStudents.length} available) --</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentCode} · {s.fullName} ({s.phoneNumber}) - Current: {s.course}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-[#11232B]">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.newStudent?.fullName || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          newStudent: { ...p.newStudent!, fullName: e.target.value },
                        }))
                      }
                      className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#11232B]">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.newStudent?.phoneNumber || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          newStudent: { ...p.newStudent!, phoneNumber: e.target.value },
                        }))
                      }
                      className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#11232B]">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul.sharma@gmail.com"
                      value={formData.newStudent?.email || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          newStudent: { ...p.newStudent!, email: e.target.value },
                        }))
                      }
                      className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#11232B]">Gender</label>
                    <select
                      value={formData.newStudent?.gender || "Male"}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          newStudent: { ...p.newStudent!, gender: e.target.value as any },
                        }))
                      }
                      className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Academic Program & Cohort Batch */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#078783]" />
              Course & Cohort Assignment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Course */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Academic Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseName}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.courseName}>
                      {c.courseName} ({c.courseCode}) · ₹{c.fees?.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Assigned Batch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.batchCode}
                  onChange={(e) => {
                    const sel = batches.find((b) => b.batchCode === e.target.value);
                    setFormData((p) => ({
                      ...p,
                      batchCode: e.target.value,
                      batchName: sel ? sel.batchName : e.target.value,
                    }));
                  }}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {currentCourseBatches.length === 0 ? (
                    <option value="">No active batches for this course (select course first)</option>
                  ) : (
                    currentCourseBatches.map((b) => (
                      <option key={b.id} value={b.batchCode}>
                        {b.batchCode} - {b.batchName} ({b.availableSeats} seats left)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Admission Date */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Admission Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.admissionDate}
                  onChange={(e) => setFormData((p) => ({ ...p, admissionDate: e.target.value }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>

              {/* Counsellor */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Assigned Counsellor <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.counsellor}
                  onChange={(e) => setFormData((p) => ({ ...p, counsellor: e.target.value }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {leadCounselorList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Fee Structure */}
          <div className="space-y-3 p-4 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB]">
            <label className="text-xs font-bold text-[#11232B] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#078783]" />
              Tuition Fee & Payment Breakdown
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Total Course Fee */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Total Course Fee (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.totalFee}
                  onChange={(e) => handleTotalFeeChange(Number(e.target.value))}
                  className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 font-mono text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>

              {/* Scholarship / Discount */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Scholarship / Discount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.discountAmount}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 font-mono text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>

              {/* Final Payable */}
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Final Payable Amount (₹)
                </label>
                <input
                  type="number"
                  readOnly
                  disabled
                  value={formData.finalFee}
                  className="w-full text-xs mt-1 bg-[#EAEAEA] border border-[#D5D5D5] rounded-lg px-3 py-2 font-mono font-bold text-[#078783]"
                />
              </div>
            </div>

            {/* Discount Reason */}
            <div>
              <label className="text-[11px] font-semibold text-[#11232B]">Discount / Scholarship Justification</label>
              <input
                type="text"
                placeholder="e.g. Merit Test 90%+, Early Bird, Referral Waiver"
                value={formData.discountReason || ""}
                onChange={(e) => setFormData((p) => ({ ...p, discountReason: e.target.value }))}
                className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
              />
            </div>

            {/* Initial Payment */}
            {!isEdit && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-[#E8EFEF]">
                <div>
                  <label className="text-[11px] font-semibold text-[#11232B]">Initial Payment (₹)</label>
                  <input
                    type="number"
                    min={0}
                    max={formData.finalFee}
                    placeholder="0"
                    value={formData.initialPayment || 0}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, initialPayment: Number(e.target.value) }))
                    }
                    className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 font-mono text-[#11232B] focus:outline-none focus:border-[#078783]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#11232B]">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value as any }))}
                    className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                  >
                    {paymentMethodEnum.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#11232B]">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    placeholder="UPI/321948 or Cheque No."
                    value={formData.transactionRef || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, transactionRef: e.target.value }))}
                    className="w-full text-xs mt-1 bg-white border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Workflow Status & Documents Checklist */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">
                  Admission Workflow Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as any }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                >
                  {admissionStatusEnum.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#11232B]">Additional Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Student background, requirements, career goals..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full text-xs mt-1 bg-[#F8FBFA] border border-[#E2ECEB] rounded-lg px-3 py-2 text-[#11232B] focus:outline-none focus:border-[#078783]"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="p-3 bg-[#F8FBFA] rounded-xl border border-[#E2ECEB] space-y-2">
              <label className="text-[11px] font-bold text-[#11232B] uppercase tracking-wider block">
                Verification Documents Checklist
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(formData.documents || []).map((doc, idx) => (
                  <label
                    key={doc.id || idx}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E2ECEB] hover:bg-[#F3F8F7] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={doc.submitted}
                      onChange={(e) => {
                        const next = [...(formData.documents || [])];
                        next[idx] = { ...next[idx], submitted: e.target.checked };
                        setFormData((p) => ({ ...p, documents: next }));
                      }}
                      className="rounded text-[#078783] focus:ring-[#078783]"
                    />
                    <span className="text-[11px] text-[#11232B] truncate">{doc.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#E2ECEB] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs bg-[#078783] hover:bg-[#066e6b] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Admission"
              ) : (
                "Submit Admission"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
