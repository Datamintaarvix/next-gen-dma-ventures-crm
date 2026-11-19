import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-[#E6F5F4] text-[#078783]",
        new: "bg-[#E6F5F4] text-[#078783]",
        contacted: "bg-[#E0F2FE] text-[#0284C7]",
        interested: "bg-[#E0F7F6] text-[#0D9488]",
        followup: "bg-[#FEF3C7] text-[#D97706]",
        converted: "bg-[#ECFDF5] text-[#059669]",
        active: "bg-[#E6F5F4] text-[#078783]",
        scheduled: "bg-[#E6F5F4] text-[#078783]",
        duesoon: "bg-[#FEF3C7] text-[#D97706]",
        confirmed: "bg-[#E6F5F4] text-[#078783]",
        pending: "bg-[#FEF3C7] text-[#D97706]",
        received: "bg-[#ECFDF5] text-[#059669]",
        unread: "bg-[#E6F5F4] text-[#078783]",
        lost: "bg-[#FFE4E6] text-[#E11D48]",
        inprogress: "bg-[#EFF6FF] text-[#2563EB]",
        responded: "bg-[#F0FDF4] text-[#16A34A]",
        closed: "bg-[#F1F5F9] text-[#64748B]",
        completed: "bg-[#ECFDF5] text-[#059669]",
        upcoming: "bg-[#EFF6FF] text-[#2563EB]",
        inactive: "bg-[#F1F5F9] text-[#64748B]",
        draft: "bg-[#FEF3C7] text-[#D97706]",
        archived: "bg-[#F1F5F9] text-[#64748B]",
        dropped: "bg-[#FFE4E6] text-[#E11D48]",
        paid: "bg-[#ECFDF5] text-[#059669]",
        partial: "bg-[#FEF3C7] text-[#D97706]",
        rescheduled: "bg-[#EFF6FF] text-[#2563EB]",
        missed: "bg-[#FEF2F2] text-[#DC2626]",
        cancelled: "bg-[#F1F5F9] text-[#64748B]",
        high: "bg-[#FEF2F2] text-[#DC2626]",
        medium: "bg-[#FEF3C7] text-[#D97706]",
        low: "bg-[#F1F5F9] text-[#64748B]",
        outline: "border border-[#E2ECEB] text-[#5A7178]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
