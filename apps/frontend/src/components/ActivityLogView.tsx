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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center shadow-sm">
        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">No activity logged yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-slate-900 tracking-tight">Audit & Activity Log</h3>
      </div>

      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
        {logs.map((log) => {
          const isExtension = log.activity_type === "TIME_EXTENDED";
          const isBid = log.activity_type === "BID_SUBMITTED";
          const isCreated = log.activity_type === "RFQ_CREATED";

          return (
            <div key={log.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${
                  isExtension
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                    : isBid
                    ? "bg-blue-500 text-white"
                    : isCreated
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-400 text-white"
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
                    ? "bg-amber-50/70 border-amber-200"
                    : "bg-slate-50/60 border-slate-200/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`font-bold ${
                      isExtension
                        ? "text-amber-800"
                        : isBid
                        ? "text-blue-800"
                        : "text-slate-800"
                    }`}
                  >
                    {isExtension
                      ? "⚡ Dynamic Time Extension"
                      : isBid
                      ? "Quote Placed"
                      : log.activity_type.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed font-normal">{log.description}</p>

                {isExtension && log.previous_close_time && log.new_close_time && (
                  <div className="mt-2 pt-2 border-t border-amber-200/60 flex flex-wrap gap-x-4 text-[11px] text-amber-900/80 font-mono">
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
