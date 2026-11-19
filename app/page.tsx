import React from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Calendar,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  Layers,
  Award,
  Briefcase,
  PhoneCall,
  UserCheck,
  AlertCircle,
  FileCheck2,
  CreditCard,
  HeartHandshake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeads } from "@/lib/storage/leads-store";
import { getEnquiries } from "@/lib/storage/enquiries-store";
import { getStudents } from "@/lib/storage/students-store";
import { getAdmissions } from "@/lib/storage/admissions-store";
import { getPayments } from "@/lib/storage/payments-store";
import { getBatches } from "@/lib/storage/batches-store";
import { getCounsellingSessions } from "@/lib/storage/counselling-store";
import { readPlacementsFromDisk } from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch real-time live data directly from primary Supabase storage
  const [
    leads,
    enquiries,
    students,
    admissions,
    payments,
    batches,
    counselling,
    placements,
  ] = await Promise.all([
    getLeads(),
    getEnquiries(),
    getStudents(),
    getAdmissions(),
    getPayments(),
    getBatches(),
    getCounsellingSessions(),
    readPlacementsFromDisk(),
  ]);

  const totalLeads = leads.length;
  const totalEnquiries = enquiries.length;
  const activeStudents = students.filter((s) => s.status === "Active" || s.status === "Completed").length;
  const totalAdmissions = admissions.length;
  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const activeBatches = batches.filter((b) => b.status === "Active" || b.status === "Upcoming").length;

  const totalOffers = placements.offers.filter(
    (o) => o.status === "Accepted" || o.status === "Offer Extended"
  ).length;
  const placementRate = activeStudents > 0 ? Math.round((totalOffers / activeStudents) * 100) : 0;

  const studentsWithAtt = students.filter((s) => typeof s.attendancePercentage === "number");
  const avgAttendance = studentsWithAtt.length > 0
    ? Math.round(studentsWithAtt.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentsWithAtt.length)
    : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const statCards = [
    {
      title: "Total Leads",
      value: totalLeads.toString(),
      subtext: `${leads.filter((l) => l.status === "Converted").length} converted to admissions`,
      icon: Users,
      href: "/leads",
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
    },
    {
      title: "Active Inquiries",
      value: totalEnquiries.toString(),
      subtext: `${enquiries.filter((e) => e.status === "New" || e.status === "In Progress").length} awaiting follow-up`,
      icon: MessageSquare,
      href: "/enquiries",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Active Students",
      value: activeStudents.toString(),
      subtext: `${students.length} total enrolled candidates`,
      icon: GraduationCap,
      href: "/students",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      title: "Confirmed Admissions",
      value: totalAdmissions.toString(),
      subtext: `${admissions.filter((a) => a.status === "Enrolled").length} enrolled in batches`,
      icon: Award,
      href: "/admissions",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
    },
    {
      title: "Tuition Collected",
      value: formatCurrency(totalRevenue),
      subtext: "Realized bank & UPI inflows",
      icon: IndianRupee,
      href: "/payments",
      bgColor: "bg-teal-50",
      textColor: "text-[#078783]",
    },
    {
      title: "Active Cohort Batches",
      value: activeBatches.toString(),
      subtext: `${batches.length} total academic batches`,
      icon: Layers,
      href: "/batches",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-700",
    },
    {
      title: "Placement Success Rate",
      value: activeStudents > 0 ? `${placementRate}%` : "No data",
      subtext: activeStudents > 0 ? `${totalOffers} offers from partner firms` : "No placement drives yet",
      icon: Briefcase,
      href: "/placements",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-800",
    },
    {
      title: "Attendance Average",
      value: studentsWithAtt.length > 0 ? `${avgAttendance}%` : "No data",
      subtext: studentsWithAtt.length > 0
        ? `${students.filter((s) => (s.attendancePercentage || 0) < 75).length} students on watchlist`
        : "No attendance logged",
      icon: UserCheck,
      href: "/attendance",
      bgColor: "bg-amber-50",
      textColor: "text-amber-800",
    },
  ];

  const quickActions = [
    { label: "New Lead", href: "/leads", icon: Users, color: "text-[#078783] bg-teal-50" },
    { label: "New Admission", href: "/admissions", icon: FileCheck2, color: "text-indigo-600 bg-indigo-50" },
    { label: "Record Payment", href: "/payments", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
    { label: "Counselling Slot", href: "/counselling", icon: HeartHandshake, color: "text-blue-600 bg-blue-50" },
    { label: "Take Attendance", href: "/attendance", icon: UserCheck, color: "text-amber-600 bg-amber-50" },
    { label: "Placement Drive", href: "/placements", icon: Briefcase, color: "text-purple-600 bg-purple-50" },
    { label: "View Analytics", href: "/reports", icon: TrendingUp, color: "text-cyan-600 bg-cyan-50" },
    { label: "System Settings", href: "/settings", icon: BookOpen, color: "text-gray-700 bg-gray-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-widest text-[#078783] uppercase flex items-center gap-2">
            <span>NEXT GEN DMA VENTURES</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500 font-medium">INSTITUTIONAL WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#11232B] tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7178]">
            Real-time pipeline monitoring across admissions, fee realization, training cohorts, and corporate placements
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold">
          <Link
            href="/reports"
            className="px-3.5 py-1.5 bg-[#078783] hover:bg-[#066F6C] text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span>Detailed Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Live Stat Cards Grid (8 Live Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href} className="group">
              <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow relative bg-white border border-[#E2ECEB] rounded-xl h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.textColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#078783] transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-[#5A7178] font-normal mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-[#11232B] tracking-tight mb-1">{stat.value}</h3>
                  <p className="text-[11px] text-[#078783] font-medium truncate">{stat.subtext}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Operations Launchpad */}
      <Card className="border border-gray-200 bg-white shadow-sm rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#11232B] mb-3">
          Quick Action Launchpad
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-[#078783] hover:bg-teal-50/30 transition-all text-center group"
              >
                <div className={`p-2 rounded-lg ${action.color} mb-1.5 transition-transform group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 group-hover:text-[#078783]">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
