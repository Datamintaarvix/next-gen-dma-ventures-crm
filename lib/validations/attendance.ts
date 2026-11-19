import { z } from "zod";

export const attendanceStatusEnum = [
  "Present",
  "Absent",
  "Late",
  "Excused",
] as const;

export type AttendanceStatus = (typeof attendanceStatusEnum)[number];

export const singleStudentAttendanceSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  studentCode: z.string().min(1, "Student code is required"),
  studentName: z.string().min(1, "Student name is required"),
  status: z.enum(attendanceStatusEnum),
  checkInTime: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type SingleStudentAttendance = z.infer<typeof singleStudentAttendanceSchema>;

export const markAttendanceSessionSchema = z.object({
  courseName: z.string().min(1, "Course is required"),
  batchCode: z.string().min(1, "Batch code is required"),
  batchName: z.string().min(1, "Batch name is required"),
  date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  sessionTitle: z.string().min(2, "Session title is required"),
  trainer: z.string().min(1, "Trainer/Instructor name is required"),
  recordedBy: z.string().min(1, "Recorded by staff name is required"),
  notes: z.string().optional().nullable(),
  records: z
    .array(singleStudentAttendanceSchema)
    .min(1, "At least one student must be included in the attendance session"),
});

export type MarkAttendanceSessionFormData = z.infer<typeof markAttendanceSessionSchema>;

export interface AttendanceRecord {
  id: string; // e.g. "ATT-20261118-001"
  sessionId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  courseName: string;
  batchCode: string;
  batchName: string;
  date: string; // YYYY-MM-DD
  sessionTitle: string;
  status: AttendanceStatus;
  checkInTime?: string | null;
  remarks?: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: string | null;
}

export interface AttendanceSession {
  id: string; // e.g. "SESS-DM-2026-M1-20261118"
  courseName: string;
  batchCode: string;
  batchName: string;
  date: string; // YYYY-MM-DD
  sessionTitle: string;
  trainer: string;
  recordedBy: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  notes?: string | null;
  records: AttendanceRecord[];
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: string | null;
}

export interface AttendanceKPIStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  overallPercentage: number;
  totalSessionsHeld: number;
  activeBatchesCount: number;
  lowAttendanceCount: number; // students < 75%
}

export interface StudentAttendanceProfile {
  studentId: string;
  studentCode: string;
  studentName: string;
  courseName: string;
  batchCode: string;
  batchName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  excusedClasses: number;
  attendancePercentage: number;
  status: string; // e.g. "Active"
  isLowAttendance: boolean; // < 75%
  monthlyBreakdown: {
    monthYear: string; // e.g. "Nov 2026"
    totalClasses: number;
    attended: number;
    percentage: number;
  }[];
  history: AttendanceRecord[];
}

export interface BatchAttendanceReport {
  batchCode: string;
  batchName: string;
  courseName: string;
  trainer: string;
  totalEnrolled: number;
  totalSessions: number;
  avgAttendancePercentage: number;
  students: {
    studentId: string;
    studentCode: string;
    studentName: string;
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    lateClasses: number;
    excusedClasses: number;
    attendancePercentage: number;
    isLowAttendance: boolean;
  }[];
}
