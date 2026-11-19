"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  COURSE_CATALOGUE_BY_CATEGORY,
  COURSE_CATEGORIES,
  ALL_COURSES,
  CourseCategory,
} from "@/lib/courses";
import { Search, ChevronDown, Check, X, BookOpen } from "lucide-react";

interface CourseSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  allowAll?: boolean;
  allLabel?: string;
  name?: string;
  id?: string;
}

const CATEGORY_COLORS: Record<CourseCategory, { bg: string; text: string; border: string }> = {
  "IT & Software": {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
  "Mechanical Design & Engineering": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  "Electric Vehicle & Automotive": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

export function CourseSelect({
  value = "",
  onChange,
  placeholder = "Select or search course...",
  disabled = false,
  className = "",
  error,
  allowAll = false,
  allLabel = "All Courses",
  name,
  id,
}: CourseSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtered categories
  const filteredGroups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const result: { category: CourseCategory; courses: string[] }[] = [];

    for (const cat of COURSE_CATEGORIES) {
      const list = COURSE_CATALOGUE_BY_CATEGORY[cat] || [];
      const matching = q ? list.filter((c) => c.toLowerCase().includes(q)) : [...list];
      if (matching.length > 0) {
        result.push({ category: cat, courses: matching });
      }
    }

    return result;
  }, [searchTerm]);

  const totalMatches = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.courses.length, 0);
  }, [filteredGroups]);

  // Check if current value is a legacy/non-catalogue course
  const isLegacyValue = useMemo(() => {
    if (!value || value === "All") return false;
    return !ALL_COURSES.some((c) => c.toLowerCase() === value.toLowerCase());
  }, [value]);

  const handleSelect = (courseName: string) => {
    onChange(courseName);
    setIsOpen(false);
    setSearchTerm("");
  };

  const displayText = useMemo(() => {
    if (allowAll && (!value || value === "All")) return allLabel;
    if (!value) return placeholder;
    return value;
  }, [value, allowAll, allLabel, placeholder]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for form serialization */}
      {name && <input type="hidden" name={name} id={id} value={value} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between text-left px-3 py-2 bg-[#F8FBFA] border rounded-lg text-xs transition-all ${
          error
            ? "border-red-300 focus:ring-1 focus:ring-red-400"
            : isOpen
            ? "border-[#078783] ring-1 ring-[#078783] bg-white shadow-xs"
            : "border-[#E2ECEB] hover:border-[#CBDCD9]"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : "cursor-pointer"}`}
      >
        <span
          className={`truncate font-medium flex items-center gap-1.5 ${
            !value || (allowAll && value === "All") ? "text-[#8A9EA5]" : "text-[#11232B]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#078783] shrink-0" />
          <span className="truncate">{displayText}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#5A7178] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#078783]" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#D5E2E0] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          {/* Search Box */}
          <div className="p-2.5 border-b border-[#E2ECEB] bg-[#FAFCFB]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A9EA5] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across 44 courses..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:border-[#078783] focus:ring-1 focus:ring-[#078783]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#8A9EA5] hover:text-[#11232B]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5 text-[10px] text-[#7B939B]">
              <span>44 Master Catalog Courses</span>
              {searchTerm && <span>{totalMatches} matches</span>}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-[#F0F5F4] p-1">
            {/* "All Courses" option if enabled */}
            {allowAll && !searchTerm && (
              <button
                type="button"
                onClick={() => handleSelect("All")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                  value === "All" || !value
                    ? "bg-[#E6F5F4] text-[#078783] font-bold"
                    : "text-[#11232B] hover:bg-[#F3F8F7]"
                }`}
              >
                <span>{allLabel}</span>
                {(value === "All" || !value) && <Check className="w-3.5 h-3.5 text-[#078783]" />}
              </button>
            )}

            {/* Legacy selection preservation */}
            {isLegacyValue && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 rounded-md mx-1 mb-1">
                  Existing Recorded Course
                </div>
                <button
                  type="button"
                  onClick={() => handleSelect(value)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg text-left bg-purple-50/50 text-purple-900 font-semibold"
                >
                  <span>{value}</span>
                  <Check className="w-3.5 h-3.5 text-purple-700" />
                </button>
              </div>
            )}

            {/* Categorized Options */}
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => {
                const colors = CATEGORY_COLORS[group.category];
                return (
                  <div key={group.category} className="py-1.5">
                    {/* Category Header */}
                    <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-[#5A7178]">
                      <span>{group.category}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full border text-[9px] font-semibold ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {group.courses.length}
                      </span>
                    </div>

                    {/* Courses in this category */}
                    <div className="mt-0.5 space-y-0.5">
                      {group.courses.map((course) => {
                        const isSelected = value?.toLowerCase() === course.toLowerCase();
                        return (
                          <button
                            key={course}
                            type="button"
                            onClick={() => handleSelect(course)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${
                              isSelected
                                ? "bg-[#E6F5F4] text-[#078783] font-bold shadow-2xs"
                                : "text-[#11232B] hover:bg-[#F3F8F7] hover:text-[#078783]"
                            }`}
                          >
                            <span className="truncate pr-2">{course}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#078783] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-[#8A9EA5]">
                <p>No courses match &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-[10px] text-[#A0B3BA] mt-0.5">
                  Try checking spelling or search by keyword (e.g. &ldquo;CAD&rdquo;, &ldquo;EV&rdquo;, &ldquo;Python&rdquo;)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Standard native select with optgroup for 44 courses, perfect for simple filter bars or standard HTML selects
 */
export function CourseOptgroupSelect({
  value = "",
  onChange,
  className = "",
  allowAll = false,
  allLabel = "All Courses",
  name,
  id,
}: {
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  allowAll?: boolean;
  allLabel?: string;
  name?: string;
  id?: string;
}) {
  return (
    <select
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      className={className}
    >
      {allowAll && <option value="All">{allLabel}</option>}
      {/* If current value is legacy, preserve it */}
      {value && value !== "All" && !ALL_COURSES.some((c) => c.toLowerCase() === value.toLowerCase()) && (
        <option value={value}>{value} (Recorded)</option>
      )}
      {COURSE_CATEGORIES.map((cat) => (
        <optgroup key={cat} label={`${cat} (${COURSE_CATALOGUE_BY_CATEGORY[cat].length})`}>
          {COURSE_CATALOGUE_BY_CATEGORY[cat].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
