import { RFQStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, Lock, AlertTriangle } from "lucide-react";

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
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80",
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      );
    case "UPCOMING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80",
            className
          )}
        >
          <Clock className="w-3 h-3 text-amber-400" />
          Upcoming
        </span>
      );
    case "FORCE_CLOSED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80",
            className
          )}
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          Force Closed
        </span>
      );
    case "CLOSED":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700",
            className
          )}
        >
          <Lock className="w-3 h-3 text-slate-400" />
          Closed
        </span>
      );
  }
}
