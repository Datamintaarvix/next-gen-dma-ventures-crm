import {
  ReportPeriod,
  ReportFilterParams,
  FullAnalyticsPayload,
  AnalyticsKPIs,
  ChartDataPoint,
  CounsellorPerformanceMetric,
  FinancialSummaryReport,
  AttendanceAnalyticsReport,
  PlacementAnalyticsReport,
  StaffPerformanceReportItem,
} from "@/lib/validations/report";

import { getLeads } from "@/lib/storage/leads-store";
import { getEnquiries } from "@/lib/storage/enquiries-store";
import { getFollowUps } from "@/lib/storage/follow-ups-store";
import { getAdmissions } from "@/lib/storage/admissions-store";
import { getPayments, getInstallmentPlans } from "@/lib/storage/payments-store";
import { getStudents } from "@/lib/storage/students-store";
import { getCourses } from "@/lib/storage/courses-store";
import { getBatches } from "@/lib/storage/batches-store";
import { getCounsellingSessions } from "@/lib/storage/counselling-store";
import { readPlacementsFromDisk } from "@/lib/storage/placements-store";
import { getAllStaff } from "@/lib/storage/staff-store";
import { readAttendanceFromDisk } from "@/lib/storage/attendance-store";

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateToMonthYear(d: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function isDateInPeriod(
  dateStr: string | undefined | null,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string
): boolean {
  if (period === "all") return true;
  const d = parseDate(dateStr);
  if (!d) return true;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const todayStart = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);
  const todayEnd = new Date(currentYear, currentMonth, currentDate, 23, 59, 59, 999);

  if (period === "today") {
    return d >= todayStart && d <= todayEnd;
  }

  if (period === "this-week") {
    const day = now.getDay();
    const diff = currentDate - day + (day === 0 ? -6 : 1);
    const monday = new Date(currentYear, currentMonth, diff, 0, 0, 0, 0);
    return d >= monday;
  }

  if (period === "this-month") {
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    return d >= startOfMonth;
  }

  if (period === "last-month") {
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  }

  if (period === "this-quarter") {
    const currentQuarter = Math.floor(currentMonth / 3);
    const startOfQuarter = new Date(currentYear, currentQuarter * 3, 1, 0, 0, 0, 0);
    return d >= startOfQuarter;
  }

  if (period === "this-year") {
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    return d >= startOfYear;
  }

  if (period === "custom") {
    if (customStart && customEnd) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    }
    if (customStart) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      return d >= s;
    }
    if (customEnd) {
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return d <= e;
    }
  }

  return true;
}

function getPeriodDisplay(
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): string {
  switch (period) {
    case "today":
      return "Today";
    case "this-week":
      return "This Week";
    case "this-month":
      return "This Month (Current)";
    case "last-month":
      return "Last Month";
    case "this-quarter":
      return "This Quarter (Q4)";
    case "this-year":
      return "This Year (2026)";
    case "custom":
      return startDate && endDate
        ? `${startDate} to ${endDate}`
        : "Custom Range";
    case "all":
    default:
      return "All Time (Complete Historical Data)";
  }
}

export async function getFullAnalyticsData(
  params: ReportFilterParams = { period: "all" }
): Promise<FullAnalyticsPayload> {
  const { period, startDate, endDate, course } = params;

  // 1. Fetch raw data in parallel
  const [
    leads,
    enquiries,
    followUps,
    admissions,
    payments,
    installmentPlans,
    students,
    batches,
    counsellingSessions,
    placementsData,
    staffList,
    attendanceData,
  ] = await Promise.all([
    getLeads(),
    getEnquiries(),
    getFollowUps(),
    getAdmissions(),
    getPayments(),
    getInstallmentPlans(),
    getStudents(),
    getBatches(),
    getCounsellingSessions(),
    readPlacementsFromDisk(),
    getAllStaff(),
    readAttendanceFromDisk(),
  ]);

  // Apply course filter if specified
  const filteredLeads = leads.filter((l) => {
    if (course && l.interestedCourse && !l.interestedCourse.toLowerCase().includes(course.toLowerCase())) {
      return false;
    }
    return isDateInPeriod(l.createdAt, period, startDate, endDate);
  });

  const filteredEnquiries = enquiries.filter((e) => {
    if (course && e.interestedCourse && !e.interestedCourse.toLowerCase().includes(course.toLowerCase())) {
      return false;
    }
    return isDateInPeriod(e.createdAt || e.enquiryDate, period, startDate, endDate);
  });

  const filteredAdmissions = admissions.filter((a) => {
    if (course && a.courseName && !a.courseName.toLowerCase().includes(course.toLowerCase())) {
      return false;
    }
    return isDateInPeriod(a.admissionDate || a.createdAt, period, startDate, endDate);
  });

  const filteredPayments = payments.filter((p) => {
    if (course && p.courseName && !p.courseName.toLowerCase().includes(course.toLowerCase())) {
      return false;
    }
    return isDateInPeriod(p.paymentDate || p.createdAt, period, startDate, endDate);
  });

  const filteredCounselling = counsellingSessions.filter((c) => {
    return isDateInPeriod(c.counsellingDate || c.createdAt, period, startDate, endDate);
  });

  const filteredFollowUps = followUps.filter((f) => {
    return isDateInPeriod(f.followUpDate || f.createdAt, period, startDate, endDate);
  });

  // Calculate KPIs
  const totalLeads = filteredLeads.length;
  const totalEnquiries = filteredEnquiries.length;
  const totalStudents = students.filter((s) => s.status !== "Dropped").length;
  const totalAdmissions = filteredAdmissions.length;

  const totalRevenueCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalExpectedRevenue = filteredAdmissions.reduce((acc, a) => acc + (a.totalFee || 0), 0);
  const totalOutstandingFees = filteredAdmissions.reduce((acc, a) => acc + (a.pendingAmount || 0), 0);

  const activeBatches = batches.filter(
    (b) => b.status === "Active" || b.status === "Upcoming"
  ).length;

  // Placement rate
  const eligibleStudents = students.filter(
    (s) => s.status === "Active" || s.status === "Completed"
  ).length;
  const placedOffers = placementsData.offers.filter(
    (o) => o.status === "Accepted" || o.status === "Offer Extended"
  );
  const totalPlacedCount = placedOffers.length;
  const placementSuccessRate = eligibleStudents > 0
    ? Math.round((totalPlacedCount / eligibleStudents) * 100)
    : 0;

  // Average attendance
  const studentsWithAttendance = students.filter(
    (s) => typeof s.attendancePercentage === "number" && !isNaN(s.attendancePercentage)
  );
  const averageAttendancePercentage = studentsWithAttendance.length > 0
    ? Math.round(
        studentsWithAttendance.reduce((acc, s) => acc + s.attendancePercentage, 0) /
          studentsWithAttendance.length
      )
    : 0;

  const totalCounsellingSessions = filteredCounselling.length;

  const kpis: AnalyticsKPIs = {
    totalLeads,
    totalEnquiries,
    totalStudents,
    totalAdmissions,
    totalRevenueCollected,
    totalExpectedRevenue,
    totalOutstandingFees,
    activeBatches,
    placementSuccessRate,
    averageAttendancePercentage,
    totalCounsellingSessions,
  };

  // Monthly trends for leads & enquiries
  const monthlyBuckets: Record<string, { leads: number; enquiries: number; admissions: number; revenue: number }> = {};

  filteredLeads.forEach((l) => {
    const d = parseDate(l.createdAt);
    if (d) {
      const key = formatDateToMonthYear(d);
      if (!monthlyBuckets[key]) {
        monthlyBuckets[key] = { leads: 0, enquiries: 0, admissions: 0, revenue: 0 };
      }
      monthlyBuckets[key].leads += 1;
    }
  });

  filteredEnquiries.forEach((e) => {
    const d = parseDate(e.createdAt || e.enquiryDate);
    if (d) {
      const key = formatDateToMonthYear(d);
      if (!monthlyBuckets[key]) {
        monthlyBuckets[key] = { leads: 0, enquiries: 0, admissions: 0, revenue: 0 };
      }
      monthlyBuckets[key].enquiries += 1;
    }
  });

  filteredAdmissions.forEach((a) => {
    const d = parseDate(a.admissionDate || a.createdAt);
    if (d) {
      const key = formatDateToMonthYear(d);
      if (!monthlyBuckets[key]) {
        monthlyBuckets[key] = { leads: 0, enquiries: 0, admissions: 0, revenue: 0 };
      }
      monthlyBuckets[key].admissions += 1;
    }
  });

  filteredPayments.forEach((p) => {
    const d = parseDate(p.paymentDate || p.createdAt);
    if (d) {
      const key = formatDateToMonthYear(d);
      if (!monthlyBuckets[key]) {
        monthlyBuckets[key] = { leads: 0, enquiries: 0, admissions: 0, revenue: 0 };
      }
      monthlyBuckets[key].revenue += p.amount || 0;
    }
  });

  const leadTrends: ChartDataPoint[] = Object.keys(monthlyBuckets)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((month) => ({
      name: month,
      leads: monthlyBuckets[month].leads,
      enquiries: monthlyBuckets[month].enquiries,
      admissions: monthlyBuckets[month].admissions,
    }));

  const admissionsByMonth: ChartDataPoint[] = Object.keys(monthlyBuckets)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((month) => ({
      name: month,
      admissions: monthlyBuckets[month].admissions,
      revenue: monthlyBuckets[month].revenue,
    }));

  const revenueTrends: ChartDataPoint[] = Object.keys(monthlyBuckets)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((month) => ({
      name: month,
      collected: monthlyBuckets[month].revenue,
    }));

  // Lead Source Distribution
  const sourceCounts: Record<string, number> = {};
  filteredLeads.forEach((l) => {
    const src = l.leadSource || "Website";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const leadSourceDistribution = Object.keys(sourceCounts).map((src) => ({
    name: src,
    value: sourceCounts[src],
  }));

  // Lead Status Distribution
  const statusCounts: Record<string, number> = {};
  filteredLeads.forEach((l) => {
    const st = l.status || "New";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });
  const leadStatusDistribution = Object.keys(statusCounts).map((st) => ({
    name: st,
    value: statusCounts[st],
  }));

  // Counsellor Performance
  const counsellorMap: Record<
    string,
    { assigned: number; converted: number; admissions: number; revenue: number }
  > = {};

  filteredLeads.forEach((l) => {
    const cName = l.assignedCounselor || "Unassigned";
    if (!counsellorMap[cName]) {
      counsellorMap[cName] = { assigned: 0, converted: 0, admissions: 0, revenue: 0 };
    }
    counsellorMap[cName].assigned += 1;
    if (l.status === "Converted") {
      counsellorMap[cName].converted += 1;
    }
  });

  filteredAdmissions.forEach((a) => {
    const cName = a.counsellor || "Unassigned";
    if (!counsellorMap[cName]) {
      counsellorMap[cName] = { assigned: 0, converted: 0, admissions: 0, revenue: 0 };
    }
    counsellorMap[cName].admissions += 1;
    counsellorMap[cName].revenue += a.paidAmount || 0;
  });

  const counsellorPerformance: CounsellorPerformanceMetric[] = Object.keys(counsellorMap).map(
    (cName) => {
      const data = counsellorMap[cName];
      const convRate =
        data.assigned > 0 ? Math.round((data.converted / data.assigned) * 100) : 0;
      return {
        counsellorName: cName,
        leadsAssigned: data.assigned,
        leadsConverted: data.converted,
        conversionRate: convRate,
        admissionsCount: data.admissions,
        revenueGenerated: data.revenue,
      };
    }
  );

  // Admissions by Course
  const courseAdmissionMap: Record<string, { admissions: number; revenue: number }> = {};
  filteredAdmissions.forEach((a) => {
    const cName = a.courseName || "Other";
    if (!courseAdmissionMap[cName]) {
      courseAdmissionMap[cName] = { admissions: 0, revenue: 0 };
    }
    courseAdmissionMap[cName].admissions += 1;
    courseAdmissionMap[cName].revenue += a.totalFee || 0;
  });
  const admissionsByCourse: ChartDataPoint[] = Object.keys(courseAdmissionMap).map((cName) => ({
    name: cName.length > 20 ? cName.slice(0, 18) + "..." : cName,
    fullName: cName,
    admissions: courseAdmissionMap[cName].admissions,
    revenue: courseAdmissionMap[cName].revenue,
  }));

  // Admissions by Batch
  const batchAdmissionMap: Record<string, number> = {};
  filteredAdmissions.forEach((a) => {
    const bCode = a.batchCode || "Unassigned";
    batchAdmissionMap[bCode] = (batchAdmissionMap[bCode] || 0) + 1;
  });
  const admissionsByBatch: ChartDataPoint[] = batches.map((b) => ({
    name: b.batchName || b.batchCode,
    code: b.batchCode,
    admissions: batchAdmissionMap[b.batchCode] || b.enrolledCount || 0,
    capacity: b.maxCapacity || 25,
  }));

  // Admission Status Distribution
  const admissionStatusCounts: Record<string, number> = {};
  filteredAdmissions.forEach((a) => {
    const st = a.status || "Enrolled";
    admissionStatusCounts[st] = (admissionStatusCounts[st] || 0) + 1;
  });
  const admissionStatusDistribution = Object.keys(admissionStatusCounts).map((st) => ({
    name: st,
    value: admissionStatusCounts[st],
  }));

  // Course Revenue Breakdown
  const courseRevenueMap: Record<string, number> = {};
  filteredPayments.forEach((p) => {
    const cName = p.courseName || "General";
    courseRevenueMap[cName] = (courseRevenueMap[cName] || 0) + (p.amount || 0);
  });
  const courseRevenueBreakdown: ChartDataPoint[] = Object.keys(courseRevenueMap).map((cName) => ({
    name: cName.length > 20 ? cName.slice(0, 18) + "..." : cName,
    fullName: cName,
    revenue: courseRevenueMap[cName],
  }));

  // Financials
  const paymentMethodMap: Record<string, number> = {};
  filteredPayments.forEach((p) => {
    const m = p.paymentMethod || "Other";
    paymentMethodMap[m] = (paymentMethodMap[m] || 0) + (p.amount || 0);
  });
  const totalPaymentSum = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const paymentMethodDistribution = Object.keys(paymentMethodMap).map((m) => ({
    method: m,
    amount: paymentMethodMap[m],
    percentage:
      totalPaymentSum > 0
        ? Math.round((paymentMethodMap[m] / totalPaymentSum) * 100)
        : 0,
  }));

  const sortedPayments = [...filteredPayments].sort((a, b) =>
    (b.paymentDate || b.createdAt || "").localeCompare(a.paymentDate || a.createdAt || "")
  );
  const recentCollections = sortedPayments.slice(0, 10).map((p) => ({
    paymentId: p.receiptNo || p.id,
    studentName: p.studentName,
    course: p.courseName,
    amount: p.amount,
    paymentMethod: p.paymentMethod,
    date: p.paymentDate || p.createdAt?.slice(0, 10) || "Recent",
  }));

  // Pending installments
  const allInstallments: any[] = [];
  installmentPlans.forEach((plan) => {
    if (plan.installments && Array.isArray(plan.installments)) {
      plan.installments.forEach((inst) => {
        if (inst.status === "Pending" || inst.status === "Overdue") {
          allInstallments.push({
            installmentId: inst.id || `INST-${plan.studentId}`,
            studentName: plan.studentName || "Student",
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: inst.status,
          });
        }
      });
    }
  });

  const financials: FinancialSummaryReport = {
    totalCollected: totalRevenueCollected,
    totalBilled: totalExpectedRevenue,
    totalOutstanding: totalOutstandingFees,
    collectionRate:
      totalExpectedRevenue > 0
        ? Math.round((totalRevenueCollected / totalExpectedRevenue) * 100)
        : 0,
    paymentMethodDistribution,
    recentCollections,
    pendingInstallments: allInstallments.slice(0, 10),
  };

  // Attendance Analytics
  const lowAttendanceStudents = students
    .filter((s) => typeof s.attendancePercentage === "number" && s.attendancePercentage < 75)
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
    .map((s) => ({
      studentId: s.id,
      studentCode: s.studentCode || `STU-${s.id}`,
      studentName: s.fullName,
      courseName: s.course || "Standard Course",
      batchCode: s.batchCode || "General",
      attendancePercentage: s.attendancePercentage,
    }));

  const batchWiseAttendance = batches.map((b) => {
    const batchStudents = students.filter(
      (s) => s.batchCode === b.batchCode
    );
    const avg =
      batchStudents.length > 0
        ? Math.round(
            batchStudents.reduce(
              (acc, s) => acc + (s.attendancePercentage || 0),
              0
            ) / batchStudents.length
          )
        : 0;
    return {
      batchName: b.batchName || b.batchCode,
      courseName: b.courseName,
      trainer: b.trainer || "Faculty Lead",
      studentCount: batchStudents.length || b.enrolledCount || 0,
      avgAttendance: avg,
    };
  });

  const attendance: AttendanceAnalyticsReport = {
    overallAttendanceRate: averageAttendancePercentage,
    totalSessionsHeld: attendanceData.sessions.length,
    lowAttendanceStudents,
    batchWiseAttendance,
  };

  // Placement Analytics
  const salaries = placementsData.offers
    .map((o) => o.offeredSalaryLPA)
    .filter((s) => typeof s === "number" && s > 0);
  const highestSalaryLPA = salaries.length > 0 ? Math.max(...salaries) : 0;
  const averageSalaryLPA =
    salaries.length > 0
      ? Number((salaries.reduce((acc, s) => acc + s, 0) / salaries.length).toFixed(1))
      : 0;

  // Company hiring distribution
  const companyHiresMap: Record<string, { industry: string; hiredCount: number; roles: Set<string> }> = {};
  placementsData.companies.forEach((comp) => {
    companyHiresMap[comp.name] = {
      industry: comp.industry || "Tech",
      hiredCount: 0,
      roles: new Set<string>(),
    };
  });
  placementsData.offers.forEach((o) => {
    if (!companyHiresMap[o.companyName]) {
      companyHiresMap[o.companyName] = {
        industry: "Information Technology",
        hiredCount: 0,
        roles: new Set<string>(),
      };
    }
    companyHiresMap[o.companyName].hiredCount += 1;
    if (o.jobTitle) {
      companyHiresMap[o.companyName].roles.add(o.jobTitle);
    }
  });

  const companyHires = Object.keys(companyHiresMap)
    .map((cName) => ({
      companyName: cName,
      industry: companyHiresMap[cName].industry,
      hiredCount: companyHiresMap[cName].hiredCount,
      roles: Array.from(companyHiresMap[cName].roles),
    }))
    .sort((a, b) => b.hiredCount - a.hiredCount);

  const placements: PlacementAnalyticsReport = {
    totalEligible: eligibleStudents,
    totalPlaced: totalPlacedCount,
    placementRate: placementSuccessRate,
    highestSalaryLPA,
    averageSalaryLPA,
    companyHires,
  };

  // Counselling Stats
  const counsellingStatusCounts: Record<string, number> = {};
  const counsellingTypeCounts: Record<string, number> = {};
  const counsellingByCounsellor: Record<string, number> = {};

  filteredCounselling.forEach((c) => {
    const st = c.status || "Scheduled";
    counsellingStatusCounts[st] = (counsellingStatusCounts[st] || 0) + 1;

    const ty = c.sessionType || "In-person";
    counsellingTypeCounts[ty] = (counsellingTypeCounts[ty] || 0) + 1;

    const cn = c.assignedCounsellor || "General";
    counsellingByCounsellor[cn] = (counsellingByCounsellor[cn] || 0) + 1;
  });

  const completedCounselling = counsellingStatusCounts["Completed"] || 0;
  const counsellingStats = {
    total: filteredCounselling.length,
    completed: completedCounselling,
    scheduled: (counsellingStatusCounts["Scheduled"] || 0) + (counsellingStatusCounts["Confirmed"] || 0),
    cancelled: counsellingStatusCounts["Cancelled"] || 0,
    noShow: (counsellingStatusCounts["No-Show"] || 0) + (counsellingStatusCounts["No Show"] || 0),
    conversionRate:
      filteredCounselling.length > 0
        ? Math.round((completedCounselling / filteredCounselling.length) * 100)
        : 0,
    typeDistribution: Object.keys(counsellingTypeCounts).map((t) => ({
      type: t,
      count: counsellingTypeCounts[t],
    })),
    statusDistribution: Object.keys(counsellingStatusCounts).map((s) => ({
      status: s,
      count: counsellingStatusCounts[s],
    })),
    counsellorDistribution: Object.keys(counsellingByCounsellor).map((c) => ({
      counsellor: c,
      sessions: counsellingByCounsellor[c],
    })),
  };

  // Follow-up Metrics
  const completedFollowUps = filteredFollowUps.filter((f) => f.status === "Completed").length;
  const overdueFollowUps = filteredFollowUps.filter((f) => f.status === "Missed").length;
  const pendingFollowUps = filteredFollowUps.filter((f) => f.status === "Pending" || f.status === "Rescheduled").length;
  const followUpMetrics = {
    total: filteredFollowUps.length,
    completed: completedFollowUps,
    pending: pendingFollowUps,
    overdue: overdueFollowUps,
    completionRate:
      filteredFollowUps.length > 0
        ? Math.round((completedFollowUps / filteredFollowUps.length) * 100)
        : 0,
  };

  // Staff Performance aggregation
  const staffPerformance: StaffPerformanceReportItem[] = staffList.map((st) => {
    const leadsHandled = leads.filter(
      (l) => l.assignedCounselor === st.fullName
    ).length;
    const leadsConverted = leads.filter(
      (l) =>
        l.assignedCounselor === st.fullName &&
        l.status === "Converted"
    ).length;
    const counsellingSess = counsellingSessions.filter(
      (c) => c.assignedCounsellor === st.fullName
    ).length;
    const followUpsDone = followUps.filter(
      (f) => f.assignedCounsellor === st.fullName && f.status === "Completed"
    ).length;
    const admissionsClosed = admissions.filter(
      (a) => a.counsellor === st.fullName
    ).length;
    const revenueGen = admissions
      .filter((a) => a.counsellor === st.fullName)
      .reduce((acc, a) => acc + (a.paidAmount || 0), 0);

    const conversionRate =
      leadsHandled > 0 ? Math.round((leadsConverted / leadsHandled) * 100) : 0;

    return {
      staffId: st.id,
      staffName: st.fullName,
      role: st.role,
      department: st.department,
      leadsHandled,
      counsellingSessions: counsellingSess,
      followUpsDone,
      admissionsClosed,
      conversionRate,
      revenueGenerated: revenueGen,
    };
  });

  return {
    period,
    dateRangeDisplay: getPeriodDisplay(period, startDate, endDate),
    kpis,
    leadTrends,
    leadSourceDistribution,
    leadStatusDistribution,
    counsellorPerformance,
    admissionsByCourse,
    admissionsByMonth,
    admissionsByBatch,
    admissionStatusDistribution,
    revenueTrends,
    courseRevenueBreakdown,
    financials,
    attendance,
    placements,
    counsellingStats,
    followUpMetrics,
    staffPerformance,
  };
}
