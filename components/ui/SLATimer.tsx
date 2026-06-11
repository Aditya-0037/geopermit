"use client";

import { getDaysRemaining, getSLAStatus } from "@/lib/utils";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

interface SLATimerProps {
  deadline: Date | string;
  status: string;
}

export default function SLATimer({ deadline, status }: SLATimerProps) {
  const daysRemaining = getDaysRemaining(deadline);
  const slaStatus = getSLAStatus(deadline);
  
  if (status === "Closed" || status === "Approved" || status === "Rejected") {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 w-fit">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-semibold">SLA Cleared</span>
      </div>
    );
  }

  let colorClasses = "";
  let barColor = "";
  let statusText = "";
  let Icon = Clock;

  if (slaStatus === "overdue") {
    colorClasses = "bg-red-50 text-red-700 border-red-200";
    barColor = "bg-red-600";
    statusText = `Overdue by ${Math.abs(daysRemaining)} days`;
    Icon = AlertCircle;
  } else if (slaStatus === "warning") {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
    barColor = "bg-amber-500";
    statusText = `${daysRemaining} days remaining (SLA Warning)`;
  } else {
    colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
    barColor = "bg-blue-600";
    statusText = `${daysRemaining} business days remaining`;
  }

  // Calculate percentage for progress bar (SLA is 10 business days total)
  const remaining = Math.max(0, Math.min(10, daysRemaining));
  const progressPercent = (remaining / 10) * 100;

  return (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold w-fit ${colorClasses}`}>
        <Icon className="w-4 h-4" />
        <span>{statusText}</span>
      </div>
      
      {daysRemaining >= 0 && (
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
