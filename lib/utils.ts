import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns current date string (YYYY-MM-DD) formatted for Indian Standard Time (Asia/Kolkata).
 * Avoids UTC boundary conversion discrepancies.
 */
export function getIndiaTodayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Evaluates whether a target YYYY-MM-DD date is strictly in the past relative to IST today.
 */
export function isDateOverdue(dateStr: string, todayStr?: string): boolean {
  if (!dateStr) return false;
  const today = todayStr || getIndiaTodayStr();
  return dateStr < today;
}

/**
 * Evaluates whether a target YYYY-MM-DD date is today in IST.
 */
export function isDateToday(dateStr: string, todayStr?: string): boolean {
  if (!dateStr) return false;
  const today = todayStr || getIndiaTodayStr();
  return dateStr === today;
}

/**
 * Evaluates whether a target YYYY-MM-DD date is in the future relative to IST today.
 */
export function isDateUpcoming(dateStr: string, todayStr?: string): boolean {
  if (!dateStr) return false;
  const today = todayStr || getIndiaTodayStr();
  return dateStr > today;
}
