"use client";

import { ActivityLog } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { History, Sparkles, Send, Bell, PlusCircle } from "lucide-react";

interface ActivityLogViewProps {
  logs: ActivityLog[];
}

export function ActivityLogView({ logs }: ActivityLogViewProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 text-center shadow-lg shadow-black/20">
        <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400">No activity logged yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-white tracking-tight">Audit & Activity Log</h3>
      </div>

      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
        {logs.map((log) => {
          const isExtension = log.activity_type === "TIME_EXTENDED";
          const isBid = log.activity_type === "BID_SUBMITTED";
          const isCreated = log.activity_type === "RFQ_CREATED";

          return (
            <div key={log.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-[#0f172a] flex items-center justify-center text-[10px] ${
                  isExtension
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                    : isBid
                    ? "bg-blue-500 text-white"
                    : isCreated
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-600 text-white"
                }`}
              >
                {isExtension ? (
                  <Sparkles className="w-2.5 h-2.5" />
                ) : isBid ? (
                  <Send className="w-2.5 h-2.5" />
                ) : isCreated ? (
                  <PlusCircle className="w-2.5 h-2.5" />
                ) : (
                  <Bell className="w-2.5 h-2.5" />
                )}
              </div>

              {/* Card */}
              <div
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  isExtension
                    ? "bg-amber-950/40 border-amber-800/80 text-amber-200"
                    : "bg-slate-950/70 border-slate-800/80 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`font-bold ${
                      isExtension
                        ? "text-amber-300"
                        : isBid
                        ? "text-blue-300"
                        : "text-slate-200"
                    }`}
                  >
                    {isExtension
                      ? "⚡ Dynamic Time Extension"
                      : isBid
                      ? "Quote Placed"
                      : log.activity_type.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed font-normal">{log.description}</p>

                {isExtension && log.previous_close_time && log.new_close_time && (
                  <div className="mt-2 pt-2 border-t border-amber-800/60 flex flex-wrap gap-x-4 text-[11px] text-amber-300/80 font-mono">
                    <span>
                      Previous Close:{" "}
                      <strong>{new Date(log.previous_close_time).toLocaleTimeString()}</strong>
                    </span>
                    <span>
                      Extended To:{" "}
                      <strong>{new Date(log.new_close_time).toLocaleTimeString()}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
