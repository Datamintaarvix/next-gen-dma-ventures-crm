import React from "react";
import {
  Users,
  MessageSquare,
  Calendar,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Wallet,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { StatMetric } from "@/lib/data/mock-data";

const iconMap = {
  leads: Users,
  enquiries: MessageSquare,
  followups: Calendar,
  converted: CheckCircle2,
  students: GraduationCap,
  courses: BookOpen,
  payments: Wallet,
  conversionRate: TrendingUp,
};

export function StatCard({ title, value, subtext, iconName }: StatMetric) {
  const IconComponent = iconMap[iconName] || Users;

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow relative bg-white border border-[#E2ECEB]">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#E6F5F4] flex items-center justify-center text-[#078783]">
          <IconComponent className="w-4 h-4" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#078783]" />
      </div>

      <div>
        <p className="text-xs text-[#5A7178] font-normal mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-[#11232B] tracking-tight mb-1">{value}</h3>
        <p className="text-xs text-[#078783] font-medium">{subtext}</p>
      </div>
    </Card>
  );
}
