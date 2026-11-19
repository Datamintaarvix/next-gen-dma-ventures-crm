import { z } from "zod";

export const reportPeriodEnum = [
  "today",
  "this-week",
  "this-month",
  "last-month",
  "this-quarter",
  "this-year",
  "all",
  "custom",
] as const;
export type ReportPeriod = (typeof reportPeriodEnum)[number];

export interface ReportFilterParams {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  course?: string;
  department?: string;
}

export interface AnalyticsKPIs {
  totalLeads: number;
  totalEnquiries: number;
  totalStudents: number;
  totalAdmissions: number;
  totalRevenueCollected: number;
  totalExpectedRevenue: number;
  totalOutstandingFees: number;
  activeBatches: number;
  placementSuccessRate: number; // percentage
  averageAttendancePercentage: number;
  totalCounsellingSessions: number;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface CounsellorPerformanceMetric {
  counsellorName: string;
  leadsAssigned: number;
  leadsConverted: number;
  conversionRate: number; // %
  admissionsCount: number;
  revenueGenerated: number;
}

export interface CourseAnalyticsItem {
  courseName: string;
  category: string;
  leadsCount: number;
  admissionsCount: number;
  enrolledStudents: number;
  revenueCollected: number;
  averageFees: number;
}

export interface FinancialSummaryReport {
  totalCollected: number;
  totalBilled: number;
  totalOutstanding: number;
  collectionRate: number; // %
  paymentMethodDistribution: { method: string; amount: number; percentage: number }[];
  recentCollections: {
    paymentId: string;
    studentName: string;
    course: string;
    amount: number;
    paymentMethod: string;
    date: string;
  }[];
  pendingInstallments: {
    installmentId: string;
    studentName: string;
    amount: number;
    dueDate: string;
    status: string;
  }[];
}

export interface AttendanceAnalyticsReport {
  overallAttendanceRate: number;
  totalSessionsHeld: number;
  lowAttendanceStudents: {
    studentId: string;
    studentCode: string;
    studentName: string;
    courseName: string;
    batchCode: string;
    attendancePercentage: number;
  }[];
  batchWiseAttendance: {
    batchName: string;
    courseName: string;
    trainer: string;
    studentCount: number;
    avgAttendance: number;
  }[];
}

export interface PlacementAnalyticsReport {
  totalEligible: number;
  totalPlaced: number;
  placementRate: number;
  highestSalaryLPA: number;
  averageSalaryLPA: number;
  companyHires: {
    companyName: string;
    industry: string;
    hiredCount: number;
    roles: string[];
  }[];
}

export interface StaffPerformanceReportItem {
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  leadsHandled: number;
  counsellingSessions: number;
  followUpsDone: number;
  admissionsClosed: number;
  conversionRate: number;
  revenueGenerated: number;
}

export interface FullAnalyticsPayload {
  period: ReportPeriod;
  dateRangeDisplay: string;
  kpis: AnalyticsKPIs;
  leadTrends: ChartDataPoint[];
  leadSourceDistribution: { name: string; value: number }[];
  leadStatusDistribution: { name: string; value: number }[];
  counsellorPerformance: CounsellorPerformanceMetric[];
  admissionsByCourse: ChartDataPoint[];
  admissionsByMonth: ChartDataPoint[];
  admissionsByBatch: ChartDataPoint[];
  admissionStatusDistribution: { name: string; value: number }[];
  revenueTrends: ChartDataPoint[];
  courseRevenueBreakdown: ChartDataPoint[];
  financials: FinancialSummaryReport;
  attendance: AttendanceAnalyticsReport;
  placements: PlacementAnalyticsReport;
  counsellingStats: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    noShow: number;
    conversionRate: number;
    typeDistribution: { type: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    counsellorDistribution: { counsellor: string; sessions: number }[];
  };
  followUpMetrics: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  staffPerformance: StaffPerformanceReportItem[];
}
