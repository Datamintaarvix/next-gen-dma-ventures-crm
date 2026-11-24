import { Type } from "@google/genai";
import { StaffRecord, CrmModule } from "@/lib/validations/staff";
import { getIndiaTodayStr } from "@/lib/utils";
import { getLeads } from "@/lib/storage/leads-store";
import { getEnquiries } from "@/lib/storage/enquiries-store";
import { getFollowUps } from "@/lib/storage/follow-ups-store";
import { getStudents } from "@/lib/storage/students-store";
import { getCourses } from "@/lib/storage/courses-store";
import { getBatches } from "@/lib/storage/batches-store";
import { getAdmissions } from "@/lib/storage/admissions-store";
import { getPayments } from "@/lib/storage/payments-store";
import { readAttendanceFromDisk } from "@/lib/storage/attendance-store";
import { readCounsellingFromDisk } from "@/lib/storage/counselling-store";
import { readPlacementsFromDisk } from "@/lib/storage/placements-store";
import { getAllStaff } from "@/lib/storage/staff-store";
import { getAllNotifications } from "@/lib/storage/notifications-store";
import {
  COURSE_CATEGORIES,
  COURSE_CATALOGUE_BY_CATEGORY,
  ALL_COURSES,
} from "@/lib/courses";

/**
 * ============================================================================
 * NEXT GEN DMA VENTURES CRM - AI ASSISTANT READ-ONLY DATA TOOLS
 * Controlled, secure, server-side data access tools with strict RBAC enforcement.
 * ZERO arbitrary SQL, ZERO write access, strictly parameterized live queries.
 * ============================================================================
 */

export interface ToolExecutionContext {
  staff: StaffRecord | null;
  isAdmin: boolean;
}

/**
 * Currency formatter for Indian Rupee (₹)
 */
export function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

/**
 * Checks module-level view permission for authenticated staff
 */
function checkPermission(
  ctx: ToolExecutionContext,
  module: CrmModule
): { allowed: boolean; error?: string } {
  if (ctx.isAdmin) return { allowed: true };
  if (!ctx.staff) {
    return {
      allowed: false,
      error: "Authentication required. Employee profile could not be verified.",
    };
  }

  const perms = ctx.staff.permissions;
  const hasView = Boolean(perms && perms[module] && perms[module].view);

  if (!hasView) {
    return {
      allowed: false,
      error: `Access Denied: Your employee role (${ctx.staff.role}) does not have view permission for the '${module}' module. Please contact your CRM Administrator for access.`,
    };
  }

  return { allowed: true };
}

/**
 * Helper to compute date boundaries for Asia/Kolkata
 */
function getDateBoundaries(): {
  today: string;
  startOfWeek: string;
  startOfMonth: string;
} {
  const today = getIndiaTodayStr(); // YYYY-MM-DD
  const [yearStr, monthStr, dayStr] = today.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const dateObj = new Date(year, month, day);
  const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const mondayObj = new Date(year, month, day - distanceToMonday);
  const startOfWeek = `${mondayObj.getFullYear()}-${String(mondayObj.getMonth() + 1).padStart(2, "0")}-${String(mondayObj.getDate()).padStart(2, "0")}`;
  const startOfMonth = `${yearStr}-${monthStr}-01`;

  return { today, startOfWeek, startOfMonth };
}

// ============================================================================
// 1. LEADS TOOL
// ============================================================================
async function executeGetLeads(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "leads");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allLeads = await getLeads();
  const { today } = getDateBoundaries();

  let filtered = [...allLeads];

  // Optional filter by status
  if (args.status && typeof args.status === "string" && args.status.trim() !== "") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((l) => l.status.toLowerCase() === s);
  }

  // Optional filter by assigned counselor
  if (args.assignedCounselor && typeof args.assignedCounselor === "string") {
    const counselor = args.assignedCounselor.trim().toLowerCase();
    filtered = filtered.filter(
      (l) => l.assignedCounselor && l.assignedCounselor.toLowerCase().includes(counselor)
    );
  }

  // Optional filter by course
  if (args.course && typeof args.course === "string") {
    const c = args.course.trim().toLowerCase();
    filtered = filtered.filter(
      (l) => l.interestedCourse && l.interestedCourse.toLowerCase().includes(c)
    );
  }

  // Optional date filter for follow-up date
  if (args.dateFilter) {
    if (args.dateFilter === "today") {
      filtered = filtered.filter((l) => l.followUpDate === today);
    } else if (args.dateFilter === "overdue") {
      filtered = filtered.filter((l) => l.followUpDate && l.followUpDate < today && l.status === "Follow-up");
    } else if (args.dateFilter === "upcoming") {
      filtered = filtered.filter((l) => l.followUpDate && l.followUpDate > today);
    }
  }

  // Optional search query (matches name, phone, lead code)
  if (args.search && typeof args.search === "string") {
    const q = args.search.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        (l.studentName && l.studentName.toLowerCase().includes(q)) ||
        (l.phoneNumber && l.phoneNumber.includes(q)) ||
        (l.leadCode && l.leadCode.toLowerCase().includes(q))
    );
  }

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);

  // Compute live KPIs across all genuine leads
  const byStatus: Record<string, number> = {};
  allLeads.forEach((l) => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
  });

  const overdueFollowUps = allLeads.filter(
    (l) => l.status === "Follow-up" && l.followUpDate && l.followUpDate < today
  ).length;

  const todayFollowUps = allLeads.filter(
    (l) => l.status === "Follow-up" && l.followUpDate === today
  ).length;

  return {
    totalLeadsInCRM: allLeads.length,
    matchingCount: filtered.length,
    overdueFollowUpsCount: overdueFollowUps,
    todayFollowUpsCount: todayFollowUps,
    statusBreakdown: byStatus,
    todayDateIST: today,
    leads: filtered.slice(0, limit).map((l) => ({
      leadCode: l.leadCode,
      studentName: l.studentName,
      phoneNumber: l.phoneNumber,
      interestedCourse: l.interestedCourse,
      status: l.status,
      assignedCounselor: l.assignedCounselor,
      followUpDate: l.followUpDate || "Not set",
      leadSource: l.leadSource,
      notes: l.notes || "",
    })),
  };
}

// ============================================================================
// 2. ENQUIRIES TOOL
// ============================================================================
async function executeGetEnquiries(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "enquiries");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allEnquiries = await getEnquiries();
  const { today } = getDateBoundaries();

  let filtered = [...allEnquiries];

  if (args.status && typeof args.status === "string") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((e) => e.status.toLowerCase() === s);
  }

  if (args.assignedCounsellor && typeof args.assignedCounsellor === "string") {
    const c = args.assignedCounsellor.trim().toLowerCase();
    filtered = filtered.filter(
      (e) => e.assignedCounsellor && e.assignedCounsellor.toLowerCase().includes(c)
    );
  }

  if (args.course && typeof args.course === "string") {
    const c = args.course.trim().toLowerCase();
    filtered = filtered.filter(
      (e) => e.interestedCourse && e.interestedCourse.toLowerCase().includes(c)
    );
  }

  if (args.search && typeof args.search === "string") {
    const q = args.search.trim().toLowerCase();
    filtered = filtered.filter(
      (e) =>
        (e.studentName && e.studentName.toLowerCase().includes(q)) ||
        (e.phoneNumber && e.phoneNumber.includes(q)) ||
        (e.enquiryCode && e.enquiryCode.toLowerCase().includes(q))
    );
  }

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);

  const byStatus: Record<string, number> = {};
  allEnquiries.forEach((e) => {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  });

  return {
    totalEnquiriesInCRM: allEnquiries.length,
    matchingCount: filtered.length,
    statusBreakdown: byStatus,
    todayDateIST: today,
    enquiries: filtered.slice(0, limit).map((e) => ({
      enquiryCode: e.enquiryCode,
      studentName: e.studentName,
      phoneNumber: e.phoneNumber,
      interestedCourse: e.interestedCourse,
      status: e.status,
      assignedCounsellor: e.assignedCounsellor,
      enquiryDate: e.enquiryDate,
      nextFollowUpDate: e.nextFollowUpDate || "None",
      enquiryMessage: e.enquiryMessage || "",
    })),
  };
}

// ============================================================================
// 3. FOLLOW-UPS TOOL
// ============================================================================
async function executeGetFollowUps(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "follow_ups");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allFollowUps = await getFollowUps();
  const { today } = getDateBoundaries();

  let filtered = [...allFollowUps];

  if (args.status && typeof args.status === "string") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((f) => f.status.toLowerCase() === s);
  }

  if (args.dateFilter) {
    if (args.dateFilter === "today") {
      filtered = filtered.filter((f) => f.followUpDate === today);
    } else if (args.dateFilter === "overdue") {
      filtered = filtered.filter(
        (f) => f.followUpDate && f.followUpDate < today && (f.status === "Pending" || f.status === "Rescheduled")
      );
    } else if (args.dateFilter === "upcoming") {
      filtered = filtered.filter((f) => f.followUpDate && f.followUpDate > today);
    }
  }

  if (args.assignedCounsellor && typeof args.assignedCounsellor === "string") {
    const c = args.assignedCounsellor.trim().toLowerCase();
    filtered = filtered.filter(
      (f) => f.assignedCounsellor && f.assignedCounsellor.toLowerCase().includes(c)
    );
  }

  if (args.relatedType && typeof args.relatedType === "string") {
    const t = args.relatedType.trim().toLowerCase();
    filtered = filtered.filter((f) => f.relatedType.toLowerCase() === t);
  }

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);

  const pending = allFollowUps.filter((f) => f.status === "Pending" || f.status === "Rescheduled");
  const completed = allFollowUps.filter((f) => f.status === "Completed");
  const overdue = pending.filter((f) => f.followUpDate && f.followUpDate < today);
  const todayTasks = pending.filter((f) => f.followUpDate === today);
  const upcomingTasks = pending.filter((f) => f.followUpDate && f.followUpDate > today);

  return {
    totalFollowUpsInCRM: allFollowUps.length,
    todayDateIST: today,
    kpiSummary: {
      total: allFollowUps.length,
      pending: pending.length,
      today: todayTasks.length,
      overdue: overdue.length,
      upcoming: upcomingTasks.length,
      completed: completed.length,
    },
    matchingCount: filtered.length,
    followUps: filtered.slice(0, limit).map((f) => ({
      followUpCode: f.followUpCode,
      studentName: f.studentName,
      contactNumber: f.contactNumber,
      relatedType: f.relatedType,
      relatedCode: f.relatedCode,
      followUpDate: f.followUpDate,
      followUpTime: f.followUpTime,
      type: f.type,
      assignedCounsellor: f.assignedCounsellor,
      priority: f.priority,
      status: f.status,
      notes: f.notes || "",
    })),
  };
}

// ============================================================================
// 4. STUDENTS TOOL
// ============================================================================
async function executeGetStudents(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "students");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allStudents = await getStudents();

  let filtered = [...allStudents];

  if (args.status && typeof args.status === "string") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((st) => st.status.toLowerCase() === s);
  }

  if (args.course && typeof args.course === "string") {
    const c = args.course.trim().toLowerCase();
    filtered = filtered.filter((st) => st.course && st.course.toLowerCase().includes(c));
  }

  if (args.batchCode && typeof args.batchCode === "string") {
    const b = args.batchCode.trim().toLowerCase();
    filtered = filtered.filter((st) => st.batchCode && st.batchCode.toLowerCase().includes(b));
  }

  if (args.paymentStatus && typeof args.paymentStatus === "string") {
    const ps = args.paymentStatus.trim().toLowerCase();
    filtered = filtered.filter((st) => st.paymentStatus && st.paymentStatus.toLowerCase() === ps);
  }

  if (args.attendanceWatchlist === true) {
    filtered = filtered.filter((st) => typeof st.attendancePercentage === "number" && st.attendancePercentage < 75);
  }

  if (args.search && typeof args.search === "string") {
    const q = args.search.trim().toLowerCase();
    filtered = filtered.filter(
      (st) =>
        (st.fullName && st.fullName.toLowerCase().includes(q)) ||
        (st.studentCode && st.studentCode.toLowerCase().includes(q)) ||
        (st.phoneNumber && st.phoneNumber.includes(q))
    );
  }

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);

  const activeCount = allStudents.filter((s) => s.status === "Active" || s.status === "Completed").length;
  const watchlistCount = allStudents.filter((s) => typeof s.attendancePercentage === "number" && s.attendancePercentage < 75).length;

  return {
    totalStudentsInCRM: allStudents.length,
    activeStudentsCount: activeCount,
    watchlistAttendanceCount: watchlistCount,
    matchingCount: filtered.length,
    students: filtered.slice(0, limit).map((s) => ({
      studentCode: s.studentCode,
      fullName: s.fullName,
      phoneNumber: s.phoneNumber,
      email: s.email,
      course: s.course,
      batchCode: s.batchCode,
      status: s.status,
      totalFee: formatINR(s.totalFee),
      paidAmount: formatINR(s.paidAmount),
      pendingAmount: formatINR(s.pendingAmount),
      paymentStatus: s.paymentStatus,
      attendancePercentage: typeof s.attendancePercentage === "number" ? `${s.attendancePercentage}%` : "No data",
    })),
  };
}

// ============================================================================
// 5. COURSES TOOL
// ============================================================================
async function executeGetCourses(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "courses");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  // 1. Standard Academy Curriculum (from lib/courses.ts: 3 core disciplines, 44 courses)
  let standardDisciplines = COURSE_CATEGORIES.map((discipline) => {
    const courses = [...COURSE_CATALOGUE_BY_CATEGORY[discipline]];
    return {
      discipline,
      courseCount: courses.length,
      courses,
    };
  });

  if (args.category && typeof args.category === "string" && args.category.trim() !== "") {
    const cat = args.category.trim().toLowerCase();
    standardDisciplines = standardDisciplines.filter((d) =>
      d.discipline.toLowerCase().includes(cat)
    );
  }

  if (args.search && typeof args.search === "string" && args.search.trim() !== "") {
    const q = args.search.trim().toLowerCase();
    standardDisciplines = standardDisciplines
      .map((d) => ({
        ...d,
        courses: d.courses.filter((name) => name.toLowerCase().includes(q)),
      }))
      .filter((d) => d.courses.length > 0);
  }

  // 2. Actual Live Database Records (from Supabase courses table)
  const allCourses = await getCourses();
  let dbFiltered = [...allCourses];

  if (args.category && typeof args.category === "string" && args.category.trim() !== "") {
    const cat = args.category.trim().toLowerCase();
    dbFiltered = dbFiltered.filter((c) => c.category && c.category.toLowerCase().includes(cat));
  }

  if (args.status && typeof args.status === "string" && args.status.trim() !== "") {
    const s = args.status.trim().toLowerCase();
    dbFiltered = dbFiltered.filter((c) => c.status.toLowerCase() === s);
  }

  if (args.search && typeof args.search === "string" && args.search.trim() !== "") {
    const q = args.search.trim().toLowerCase();
    dbFiltered = dbFiltered.filter(
      (c) =>
        (c.courseName && c.courseName.toLowerCase().includes(q)) ||
        (c.courseCode && c.courseCode.toLowerCase().includes(q))
    );
  }

  return {
    standardAcademyCurriculum: {
      description:
        "Official NEXT GEN DMA VENTURES master curriculum directory across 3 core disciplines (44 courses total).",
      totalDisciplines: COURSE_CATEGORIES.length,
      totalStandardCourses: ALL_COURSES.length,
      disciplines: standardDisciplines,
    },
    liveDatabaseRecords: {
      description: "Dynamically registered course records and cohorts in the Supabase database table.",
      totalDatabaseRecords: allCourses.length,
      matchingDatabaseRecords: dbFiltered.length,
      activeDatabaseCourses: dbFiltered.map((c) => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        category: c.category,
        duration: c.duration,
        durationWeeks: c.durationWeeks,
        fees: formatINR(c.fees),
        status: c.status,
      })),
      databaseStatusNote:
        allCourses.length === 0
          ? "There are currently 0 dynamic course records registered in the Supabase database table. The standard 44-course curriculum above represents the active academic programs offered by the academy for leads, enquiries, counselling, and enrollments."
          : undefined,
    },
  };
}

// ============================================================================
// 6. BATCHES TOOL
// ============================================================================
async function executeGetBatches(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "batches");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allBatches = await getBatches();
  let filtered = [...allBatches];

  if (args.status && typeof args.status === "string") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((b) => b.status.toLowerCase() === s);
  }

  if (args.courseName && typeof args.courseName === "string") {
    const c = args.courseName.trim().toLowerCase();
    filtered = filtered.filter((b) => b.courseName && b.courseName.toLowerCase().includes(c));
  }

  if (args.trainer && typeof args.trainer === "string") {
    const t = args.trainer.trim().toLowerCase();
    filtered = filtered.filter((b) => b.trainer && b.trainer.toLowerCase().includes(t));
  }

  const activeCount = allBatches.filter((b) => b.status === "Active" || b.status === "Upcoming").length;

  return {
    totalBatchesInCRM: allBatches.length,
    activeBatchesCount: activeCount,
    matchingCount: filtered.length,
    batches: filtered.map((b) => ({
      batchCode: b.batchCode,
      batchName: b.batchName,
      courseName: b.courseName,
      trainer: b.trainer,
      startDate: b.startDate,
      endDate: b.endDate,
      classTimings: b.classTimings || "TBD",
      classDays: b.classDays || "Mon - Fri",
      status: b.status,
      enrolledCount: b.enrolledCount || (b.studentIds ? b.studentIds.length : 0),
    })),
  };
}

// ============================================================================
// 7. ADMISSIONS TOOL
// ============================================================================
async function executeGetAdmissions(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "admissions");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allAdmissions = await getAdmissions();
  let filtered = [...allAdmissions];

  if (args.status && typeof args.status === "string") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((a) => a.status.toLowerCase() === s);
  }

  if (args.course && typeof args.course === "string") {
    const c = args.course.trim().toLowerCase();
    filtered = filtered.filter((a) => a.courseName && a.courseName.toLowerCase().includes(c));
  }

  if (args.search && typeof args.search === "string") {
    const q = args.search.trim().toLowerCase();
    filtered = filtered.filter(
      (a) =>
        (a.studentName && a.studentName.toLowerCase().includes(q)) ||
        (a.admissionCode && a.admissionCode.toLowerCase().includes(q)) ||
        (a.studentPhone && a.studentPhone.includes(q))
    );
  }

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);
  const enrolledCount = allAdmissions.filter((a) => a.status === "Enrolled").length;

  return {
    totalAdmissionsInCRM: allAdmissions.length,
    enrolledAdmissionsCount: enrolledCount,
    matchingCount: filtered.length,
    admissions: filtered.slice(0, limit).map((a) => ({
      admissionCode: a.admissionCode,
      studentName: a.studentName,
      studentPhone: a.studentPhone,
      courseName: a.courseName,
      batchCode: a.batchCode,
      admissionDate: a.admissionDate,
      counsellor: a.counsellor,
      totalFee: formatINR(a.totalFee),
      finalFee: formatINR(a.finalFee),
      paidAmount: formatINR(a.paidAmount),
      pendingAmount: formatINR(a.pendingAmount),
      status: a.status,
    })),
  };
}

// ============================================================================
// 8. PAYMENTS TOOL
// ============================================================================
async function executeGetPayments(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "payments");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allPayments = await getPayments();
  const { today, startOfWeek, startOfMonth } = getDateBoundaries();

  let filtered = [...allPayments];

  if (args.paymentMethod && typeof args.paymentMethod === "string") {
    const pm = args.paymentMethod.trim().toLowerCase();
    filtered = filtered.filter((p) => p.paymentMethod && p.paymentMethod.toLowerCase() === pm);
  }

  if (args.status && typeof args.status === "string") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((p) => p.status.toLowerCase() === s);
  }

  if (args.dateRange) {
    if (args.dateRange === "today") {
      filtered = filtered.filter((p) => p.paymentDate === today);
    } else if (args.dateRange === "this_week") {
      filtered = filtered.filter((p) => p.paymentDate >= startOfWeek);
    } else if (args.dateRange === "this_month") {
      filtered = filtered.filter((p) => p.paymentDate >= startOfMonth);
    }
  }

  const totalCollectedAllTime = allPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const thisMonthPayments = allPayments.filter((p) => p.paymentDate && p.paymentDate >= startOfMonth);
  const totalCollectedThisMonth = thisMonthPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const todayPayments = allPayments.filter((p) => p.paymentDate === today);
  const totalCollectedToday = todayPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);

  return {
    totalTransactionsInCRM: allPayments.length,
    financialSummary: {
      totalTuitionCollectedAllTime: formatINR(totalCollectedAllTime),
      totalTuitionCollectedThisMonth: formatINR(totalCollectedThisMonth),
      totalTuitionCollectedToday: formatINR(totalCollectedToday),
      todayDateIST: today,
      monthStartDateIST: startOfMonth,
    },
    matchingTransactionsCount: filtered.length,
    transactions: filtered.slice(0, limit).map((p) => ({
      receiptNo: p.receiptNo,
      studentName: p.studentName,
      courseName: p.courseName,
      amount: formatINR(p.amount),
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      status: p.status,
    })),
  };
}

// ============================================================================
// 9. ATTENDANCE TOOL
// ============================================================================
async function executeGetAttendance(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "attendance");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const attendanceData = await readAttendanceFromDisk();
  const sessions = attendanceData.sessions || [];

  let filtered = [...sessions];

  if (args.batchCode && typeof args.batchCode === "string") {
    const b = args.batchCode.trim().toLowerCase();
    filtered = filtered.filter((s) => s.batchCode && s.batchCode.toLowerCase().includes(b));
  }

  if (args.trainer && typeof args.trainer === "string") {
    const t = args.trainer.trim().toLowerCase();
    filtered = filtered.filter((s) => s.trainer && s.trainer.toLowerCase().includes(t));
  }

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);

  const totalSessions = sessions.length;
  let totalStudentsSum = 0;
  let totalPresentSum = 0;

  sessions.forEach((s) => {
    totalStudentsSum += s.totalStudents || 0;
    totalPresentSum += s.presentCount || 0;
  });

  const overallAvg = totalStudentsSum > 0 ? Math.round((totalPresentSum / totalStudentsSum) * 100) : 0;

  return {
    totalAttendanceSessionsInCRM: totalSessions,
    overallAverageAttendanceRate: totalStudentsSum > 0 ? `${overallAvg}%` : "No sessions logged",
    matchingSessionsCount: filtered.length,
    sessions: filtered.slice(0, limit).map((s) => ({
      sessionTitle: s.sessionTitle,
      batchCode: s.batchCode,
      batchName: s.batchName,
      courseName: s.courseName,
      date: s.date,
      trainer: s.trainer,
      totalStudents: s.totalStudents,
      presentCount: s.presentCount,
      absentCount: s.absentCount,
      rate: s.totalStudents > 0 ? `${Math.round((s.presentCount / s.totalStudents) * 100)}%` : "N/A",
    })),
  };
}

// ============================================================================
// 10. COUNSELLING TOOL
// ============================================================================
async function executeGetCounselling(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "counselling");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const sessions = await readCounsellingFromDisk();
  const { today } = getDateBoundaries();

  let filtered = [...sessions];

  if (args.status && typeof args.status === "string") {
    const s = args.status.trim().toLowerCase();
    filtered = filtered.filter((cs) => cs.status.toLowerCase() === s);
  }

  if (args.assignedCounsellor && typeof args.assignedCounsellor === "string") {
    const c = args.assignedCounsellor.trim().toLowerCase();
    filtered = filtered.filter(
      (cs) => cs.assignedCounsellor && cs.assignedCounsellor.toLowerCase().includes(c)
    );
  }

  if (args.dateFilter === "today") {
    filtered = filtered.filter((cs) => cs.counsellingDate === today);
  }

  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 15, 1), 50);

  const completed = sessions.filter((s) => s.status === "Completed").length;
  const converted = sessions.filter((s) => s.isConvertedToAdmission).length;
  const conversionRate = completed > 0 ? `${Math.round((converted / completed) * 100)}%` : "0%";

  return {
    totalCounsellingSessionsInCRM: sessions.length,
    completedSessionsCount: completed,
    convertedToAdmissionCount: converted,
    counsellingConversionRate: conversionRate,
    todayDateIST: today,
    matchingSessionsCount: filtered.length,
    sessions: filtered.slice(0, limit).map((cs) => ({
      sessionCode: cs.sessionCode,
      personName: cs.personName,
      contactNumber: cs.contactNumber,
      interestedCourse: cs.interestedCourse,
      assignedCounsellor: cs.assignedCounsellor,
      counsellingDate: cs.counsellingDate,
      startTime: cs.startTime,
      sessionType: cs.sessionType,
      status: cs.status,
      isConvertedToAdmission: cs.isConvertedToAdmission ? "Yes" : "No",
    })),
  };
}

// ============================================================================
// 11. PLACEMENT TOOL
// ============================================================================
async function executeGetPlacements(_args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "placements");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const placementData = await readPlacementsFromDisk();
  const companies = placementData.companies || [];
  const jobs = placementData.jobs || [];
  const offers = placementData.offers || [];

  const acceptedOffers = offers.filter((o) => o.status === "Accepted" || o.status === "Offer Extended").length;

  return {
    totalPartnerCompaniesInCRM: companies.length,
    totalJobDrivesInCRM: jobs.length,
    totalOffersRecorded: offers.length,
    acceptedOffersCount: acceptedOffers,
    partnerCompanies: companies.slice(0, 10).map((c) => ({
      name: c.name,
      industry: c.industry,
      address: c.address,
      activeOpportunitiesCount: c.activeOpportunitiesCount || 0,
      totalHiredCount: c.totalHiredCount || 0,
    })),
    recentOffers: offers.slice(0, 10).map((o) => ({
      studentName: o.studentName,
      companyName: o.companyName,
      jobTitle: o.jobTitle,
      offeredSalary: o.offeredSalaryDisplay || `${o.offeredSalaryLPA} LPA`,
      offerDate: o.offerDate,
      status: o.status,
    })),
  };
}

// ============================================================================
// 12. STAFF TOOL
// ============================================================================
async function executeGetStaff(args: Record<string, any>, ctx: ToolExecutionContext) {
  const perm = checkPermission(ctx, "staff");
  if (!perm.allowed) return { error: perm.error, isPermissionDenied: true };

  const allStaff = await getAllStaff();
  let filtered = [...allStaff];

  if (args.department && typeof args.department === "string") {
    const d = args.department.trim().toLowerCase();
    filtered = filtered.filter((s: StaffRecord) => s.department && s.department.toLowerCase().includes(d));
  }

  if (args.role && typeof args.role === "string") {
    const r = args.role.trim().toLowerCase();
    filtered = filtered.filter((s: StaffRecord) => s.role && s.role.toLowerCase().includes(r));
  }

  if (args.status && typeof args.status === "string") {
    const st = args.status.trim().toLowerCase();
    filtered = filtered.filter((s: StaffRecord) => s.employmentStatus.toLowerCase() === st);
  }

  const activeCount = allStaff.filter((s: StaffRecord) => s.employmentStatus === "Active").length;

  return {
    totalStaffInCRM: allStaff.length,
    activeStaffCount: activeCount,
    matchingCount: filtered.length,
    staff: filtered.map((s: StaffRecord) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      phoneNumber: s.phoneNumber,
      department: s.department,
      designation: s.designation,
      role: s.role,
      employmentStatus: s.employmentStatus,
      joiningDate: s.joiningDate,
    })),
  };
}

// ============================================================================
// 13. NOTIFICATIONS TOOL
// ============================================================================
async function executeGetNotifications(args: Record<string, any>, _ctx: ToolExecutionContext) {
  // Notifications are accessible to all authenticated CRM staff
  const notifications = await getAllNotifications();
  let filtered = [...notifications];

  if (args.isImportant === true) {
    filtered = filtered.filter((n) => n.isImportant);
  }

  const unreadCount = notifications.filter((n) => n.status === "Unread").length;
  const limit = Math.min(Math.max(parseInt(args.limit, 10) || 10, 1), 30);

  return {
    totalNotificationsInCRM: notifications.length,
    unreadNotificationsCount: unreadCount,
    notifications: filtered.slice(0, limit).map((n) => ({
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      status: n.status,
      isImportant: n.isImportant ? "Yes" : "No",
      createdAt: n.createdAt,
    })),
  };
}

// ============================================================================
// 14. DASHBOARD KPI SUMMARY TOOL
// ============================================================================
async function executeGetDashboardSummary(_args: Record<string, any>, ctx: ToolExecutionContext) {
  const { today, startOfMonth } = getDateBoundaries();

  // Load datasets in parallel, respecting module-level permissions
  const [
    leadsPerm,
    enquiriesPerm,
    studentsPerm,
    admissionsPerm,
    paymentsPerm,
    batchesPerm,
    attendancePerm,
    placementsPerm,
  ] = [
    checkPermission(ctx, "leads").allowed,
    checkPermission(ctx, "enquiries").allowed,
    checkPermission(ctx, "students").allowed,
    checkPermission(ctx, "admissions").allowed,
    checkPermission(ctx, "payments").allowed,
    checkPermission(ctx, "batches").allowed,
    checkPermission(ctx, "attendance").allowed,
    checkPermission(ctx, "placements").allowed,
  ];

  const [
    leads,
    enquiries,
    students,
    admissions,
    payments,
    batches,
    attendanceData,
    placementsData,
  ] = await Promise.all([
    leadsPerm ? getLeads() : Promise.resolve([]),
    enquiriesPerm ? getEnquiries() : Promise.resolve([]),
    studentsPerm ? getStudents() : Promise.resolve([]),
    admissionsPerm ? getAdmissions() : Promise.resolve([]),
    paymentsPerm ? getPayments() : Promise.resolve([]),
    batchesPerm ? getBatches() : Promise.resolve([]),
    attendancePerm ? readAttendanceFromDisk() : Promise.resolve({ sessions: [] }),
    placementsPerm ? readPlacementsFromDisk() : Promise.resolve({ offers: [] }),
  ]);

  // Leads metric
  let totalLeads: any = "[Restricted - Permission Required]";
  let convertedLeads: any = "[Restricted - Permission Required]";
  let overdueFollowUps: any = "[Restricted - Permission Required]";
  let todayFollowUps: any = "[Restricted - Permission Required]";
  if (leadsPerm) {
    totalLeads = leads.length;
    convertedLeads = leads.filter((l) => l.status === "Converted").length;
    overdueFollowUps = leads.filter((l) => l.status === "Follow-up" && l.followUpDate && l.followUpDate < today).length;
    todayFollowUps = leads.filter((l) => l.status === "Follow-up" && l.followUpDate === today).length;
  }

  // Enquiries metric
  let totalEnquiries: any = "[Restricted - Permission Required]";
  let activeEnquiries: any = "[Restricted - Permission Required]";
  if (enquiriesPerm) {
    totalEnquiries = enquiries.length;
    activeEnquiries = enquiries.filter((e) => e.status === "New" || e.status === "In Progress").length;
  }

  // Students metric
  let totalStudents: any = "[Restricted - Permission Required]";
  let activeStudents: any = "[Restricted - Permission Required]";
  if (studentsPerm) {
    totalStudents = students.length;
    activeStudents = students.filter((s) => s.status === "Active" || s.status === "Completed").length;
  }

  // Admissions metric
  let totalAdmissions: any = "[Restricted - Permission Required]";
  let confirmedAdmissions: any = "[Restricted - Permission Required]";
  if (admissionsPerm) {
    totalAdmissions = admissions.length;
    confirmedAdmissions = admissions.filter((a) => a.status === "Enrolled").length;
  }

  // Payments / Revenue metric
  let totalRevenue: any = "[Restricted - Permission Required]";
  let thisMonthRevenue: any = "[Restricted - Permission Required]";
  if (paymentsPerm) {
    const rawTotal = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const thisMonth = payments.filter((p) => p.paymentDate && p.paymentDate >= startOfMonth);
    const rawMonth = thisMonth.reduce((acc, p) => acc + (p.amount || 0), 0);
    totalRevenue = formatINR(rawTotal);
    thisMonthRevenue = formatINR(rawMonth);
  }

  // Batches metric
  let totalBatches: any = "[Restricted - Permission Required]";
  let activeBatches: any = "[Restricted - Permission Required]";
  if (batchesPerm) {
    totalBatches = batches.length;
    activeBatches = batches.filter((b) => b.status === "Active" || b.status === "Upcoming").length;
  }

  // Attendance metric
  let avgAttendance: any = "[Restricted - Permission Required]";
  if (attendancePerm) {
    const sessions = attendanceData.sessions || [];
    let totStud = 0;
    let totPres = 0;
    sessions.forEach((s: any) => {
      totStud += s.totalStudents || 0;
      totPres += s.presentCount || 0;
    });
    avgAttendance = totStud > 0 ? `${Math.round((totPres / totStud) * 100)}%` : "No sessions logged";
  }

  // Placement metric
  let placementOffers: any = "[Restricted - Permission Required]";
  if (placementsPerm) {
    const offers = (placementsData as any).offers || [];
    placementOffers = offers.filter((o: any) => o.status === "Accepted" || o.status === "Offer Extended").length;
  }

  return {
    todayDateIST: today,
    monthStartDateIST: startOfMonth,
    dashboardMetrics: {
      totalLeads,
      convertedLeads,
      overdueFollowUps,
      todayFollowUps,
      totalEnquiries,
      activeEnquiries,
      totalStudents,
      activeStudents,
      totalAdmissions,
      confirmedAdmissions,
      totalTuitionCollectedAllTime: totalRevenue,
      totalTuitionCollectedThisMonth: thisMonthRevenue,
      totalBatches,
      activeBatches,
      averageAttendance: avgAttendance,
      placementOffersExtended: placementOffers,
    },
  };
}

// ============================================================================
// GEMINI TOOL DECLARATIONS & ROUTING
// ============================================================================

export const crmToolDeclarations = [
  {
    name: "crm_get_dashboard_summary",
    description:
      "Get high-level real-time CRM dashboard metrics (total leads, active inquiries, active students, confirmed admissions, tuition collected this month, active batches, attendance, and placements). Use for 'today summary', 'overall status', 'give me an update', or high-level pipeline questions.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "crm_get_leads",
    description:
      "Retrieve leads from NEXT GEN DMA VENTURES CRM. Supports filtering by status (New, Contacted, Follow-up, Interested, Converted, Lost), counselor, course, dateFilter (today, overdue, upcoming), and keyword search.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Filter by lead status: New, Contacted, Follow-up, Interested, Converted, Lost.",
        },
        assignedCounselor: {
          type: Type.STRING,
          description: "Name of counselor assigned to lead (e.g. Priyanka, Vignesh).",
        },
        course: {
          type: Type.STRING,
          description: "Course of interest (e.g. Data Analytics, AI, Digital Marketing).",
        },
        dateFilter: {
          type: Type.STRING,
          description: "Filter follow-up date: 'today', 'overdue', 'upcoming'.",
        },
        search: {
          type: Type.STRING,
          description: "Search keyword matching student name, phone number, or lead code (e.g. LD-2401).",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum number of records to return (1-50, default 15).",
        },
      },
    },
  },
  {
    name: "crm_get_enquiries",
    description:
      "Retrieve inquiries/enquiries from CRM. Filter by status (New, In Progress, Converted, Closed), assigned counselor, course, or search name/phone.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Enquiry status: New, In Progress, Converted, Closed.",
        },
        assignedCounsellor: {
          type: Type.STRING,
          description: "Counselor handling the inquiry.",
        },
        course: {
          type: Type.STRING,
          description: "Course of inquiry.",
        },
        search: {
          type: Type.STRING,
          description: "Search student name, phone, or inquiry code.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum records to return (default 15).",
        },
      },
    },
  },
  {
    name: "crm_get_follow_ups",
    description:
      "Retrieve follow-up tasks from Follow-up Management. Filter by status (Pending, Completed, Rescheduled, Cancelled), dateFilter (today, overdue, upcoming), counselor, or relatedType (Lead, Enquiry).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Follow-up status: Pending, Completed, Rescheduled, Cancelled.",
        },
        dateFilter: {
          type: Type.STRING,
          description: "Filter follow-up date: 'today', 'overdue', 'upcoming'.",
        },
        assignedCounsellor: {
          type: Type.STRING,
          description: "Staff assigned to this follow-up.",
        },
        relatedType: {
          type: Type.STRING,
          description: "Related record type: 'Lead' or 'Enquiry'.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum records (default 15).",
        },
      },
    },
  },
  {
    name: "crm_get_students",
    description:
      "Retrieve enrolled student records. Filter by status (Active, Completed, Dropped), course, batchCode, paymentStatus (Paid, Partial, Overdue), or attendanceWatchlist (<75%).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Student status: Active, Completed, Dropped, On Hold.",
        },
        course: {
          type: Type.STRING,
          description: "Course name.",
        },
        batchCode: {
          type: Type.STRING,
          description: "Batch code (e.g. BATCH-2026-01).",
        },
        paymentStatus: {
          type: Type.STRING,
          description: "Payment status: Paid, Partial, Overdue.",
        },
        attendanceWatchlist: {
          type: Type.BOOLEAN,
          description: "Set to true to only return students with attendance below 75%.",
        },
        search: {
          type: Type.STRING,
          description: "Search student name, student code, or phone number.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum records to return.",
        },
      },
    },
  },
  {
    name: "crm_get_courses",
    description:
      "Retrieve academic courses, disciplines, and curriculum offered by NEXT GEN DMA VENTURES. Returns standard curriculum (3 disciplines, 44 courses) and live database records.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description:
            "Discipline or category: 'IT & Software', 'Mechanical Design & Engineering', or 'Electric Vehicle & Automotive'.",
        },
        status: {
          type: Type.STRING,
          description: "Course database status: Active, Inactive.",
        },
        search: {
          type: Type.STRING,
          description: "Course name or code search.",
        },
      },
    },
  },
  {
    name: "crm_get_batches",
    description:
      "Retrieve academic training batches and cohorts. Filter by status (Active, Upcoming, Completed), courseName, or trainer.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Batch status: Active, Upcoming, Completed.",
        },
        courseName: {
          type: Type.STRING,
          description: "Course name.",
        },
        trainer: {
          type: Type.STRING,
          description: "Trainer name.",
        },
      },
    },
  },
  {
    name: "crm_get_admissions",
    description:
      "Retrieve student admissions. Filter by status (Enrolled, Pending, Cancelled), course, or search name/phone.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Admission status: Enrolled, Pending, Cancelled.",
        },
        course: {
          type: Type.STRING,
          description: "Course name.",
        },
        search: {
          type: Type.STRING,
          description: "Search student name or admission code.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum records to return.",
        },
      },
    },
  },
  {
    name: "crm_get_payments",
    description:
      "Retrieve tuition fee collections and payment transactions. Calculate total revenue, this month's revenue, or filter by dateRange (today, this_week, this_month), paymentMethod (UPI, Cash, Net Banking, Credit Card), or status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dateRange: {
          type: Type.STRING,
          description: "Date filter: 'today', 'this_week', 'this_month', 'all'.",
        },
        paymentMethod: {
          type: Type.STRING,
          description: "Payment method: UPI, Net Banking, Cash, Credit Card, Debit Card.",
        },
        status: {
          type: Type.STRING,
          description: "Payment status: Success, Pending, Failed.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum records to return.",
        },
      },
    },
  },
  {
    name: "crm_get_attendance",
    description:
      "Retrieve batch attendance sessions, daily attendance logs, and student attendance averages.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        batchCode: {
          type: Type.STRING,
          description: "Batch code.",
        },
        trainer: {
          type: Type.STRING,
          description: "Trainer name.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum records to return.",
        },
      },
    },
  },
  {
    name: "crm_get_counselling",
    description:
      "Retrieve student counselling sessions, scheduled slots, and conversion tracking to admissions.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Session status: Scheduled, Completed, Cancelled, No Show.",
        },
        assignedCounsellor: {
          type: Type.STRING,
          description: "Counselor name.",
        },
        dateFilter: {
          type: Type.STRING,
          description: "Filter: 'today'.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum records.",
        },
      },
    },
  },
  {
    name: "crm_get_placements",
    description:
      "Retrieve corporate placements data: hiring partner companies, active job drives, student offers extended, and accepted placements.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "Maximum records.",
        },
      },
    },
  },
  {
    name: "crm_get_staff",
    description:
      "Retrieve CRM employee and faculty directory. Filter by department, designation, role, or status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        department: {
          type: Type.STRING,
          description: "Staff department: Admissions & Counselling, Academics & Training, Administration & Leadership, Finance & Accounts, etc.",
        },
        role: {
          type: Type.STRING,
          description: "Staff role: Super Admin, Admin, Manager, Counsellor, Trainer, Finance Staff.",
        },
        status: {
          type: Type.STRING,
          description: "Employment status: Active, Inactive.",
        },
      },
    },
  },
  {
    name: "crm_get_notifications",
    description:
      "Retrieve system notifications, operational alerts, and announcements for staff members.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        isImportant: {
          type: Type.BOOLEAN,
          description: "Set true to filter only high-priority / important alerts.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum notifications.",
        },
      },
    },
  },
];

/**
 * Executes a controlled, read-only CRM tool by name with parameter validation and RBAC
 */
export async function executeCrmTool(
  toolName: string,
  args: Record<string, any> = {},
  ctx: ToolExecutionContext
): Promise<Record<string, any>> {
  switch (toolName) {
    case "crm_get_dashboard_summary":
      return await executeGetDashboardSummary(args, ctx);

    case "crm_get_leads":
      return await executeGetLeads(args, ctx);

    case "crm_get_enquiries":
      return await executeGetEnquiries(args, ctx);

    case "crm_get_follow_ups":
      return await executeGetFollowUps(args, ctx);

    case "crm_get_students":
      return await executeGetStudents(args, ctx);

    case "crm_get_courses":
      return await executeGetCourses(args, ctx);

    case "crm_get_batches":
      return await executeGetBatches(args, ctx);

    case "crm_get_admissions":
      return await executeGetAdmissions(args, ctx);

    case "crm_get_payments":
      return await executeGetPayments(args, ctx);

    case "crm_get_attendance":
      return await executeGetAttendance(args, ctx);

    case "crm_get_counselling":
      return await executeGetCounselling(args, ctx);

    case "crm_get_placements":
      return await executeGetPlacements(args, ctx);

    case "crm_get_staff":
      return await executeGetStaff(args, ctx);

    case "crm_get_notifications":
      return await executeGetNotifications(args, ctx);

    default:
      return {
        error: `Unknown tool '${toolName}'. Please choose from approved CRM data tools.`,
        isUnknownTool: true,
      };
  }
}
