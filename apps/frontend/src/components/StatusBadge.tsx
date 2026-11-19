import { RFQStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, Lock, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: RFQStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200",
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case "UPCOMING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200",
            className
          )}
        >
          <Clock className="w-3 h-3 text-amber-500" />
          Upcoming
        </span>
      );
    case "FORCE_CLOSED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200",
            className
          )}
        >
          <AlertTriangle className="w-3 h-3 text-rose-500" />
          Force Closed
        </span>
      );
    case "CLOSED":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200",
            className
          )}
        >
          <Lock className="w-3 h-3 text-slate-500" />
          Closed
        </span>
      );
  }
}
