import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoNotice } from "@/components/dashboard/demo-notice";
import { Plus } from "lucide-react";

export interface ModuleItem {
  id: string;
  badgeIndex: string;
  title: string;
  subtitle: string;
  category: string;
  status: string;
  statusVariant?: any;
}

interface ModulePageProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  noticeMessage?: string;
  items: ModuleItem[];
  itemCountLabel?: string;
}

export function ModulePage({
  title,
  subtitle,
  actionLabel,
  noticeMessage = `Sample ${title.toLowerCase()} content for demonstration. This view is not connected to a live CRM.`,
  items,
  itemCountLabel = "3 sample items",
}: ModulePageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-widest text-[#078783] uppercase">
            NEXT GEN / DEMO WORKSPACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#11232B] tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7178]">{subtitle}</p>
        </div>

        <Button className="bg-[#078783] hover:bg-[#066F6C] text-white gap-1.5 shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </Button>
      </div>

      {/* Notice Callout */}
      <DemoNotice message={noticeMessage} />

      {/* Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#11232B]">Overview</h2>
          <span className="text-xs text-[#5A7178]">{itemCountLabel}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#E2ECEB] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-36"
            >
              <div>
                <div className="text-[10px] font-bold tracking-wider text-[#078783] uppercase mb-1">
                  {item.badgeIndex}
                </div>
                <h3 className="font-bold text-sm text-[#11232B]">{item.title}</h3>
                <p className="text-xs text-[#5A7178] mt-1">{item.subtitle}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2ECEB]/60 text-xs">
                <span className="text-[#8A9EA5] text-[11px]">{item.category}</span>
                <Badge variant={item.statusVariant || "default"}>{item.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
