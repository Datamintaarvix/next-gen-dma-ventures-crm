import React from "react";

interface DemoNoticeProps {
  message?: string;
}

export function DemoNotice({
  message = "Active Institutional Workspace — Academic cohorts, student enrolments, and fee transactions are recorded in the CRM database.",
}: DemoNoticeProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2ECEB] border-l-4 border-l-[#078783] p-4 text-xs sm:text-sm text-[#3E555C] shadow-sm">
      {message}
    </div>
  );
}
