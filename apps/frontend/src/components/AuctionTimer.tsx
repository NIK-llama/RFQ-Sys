"use client";

import { useEffect, useState } from "react";
import { RFQ } from "@/types";
import { Clock, Flame, ShieldAlert, Sparkles } from "lucide-react";

interface AuctionTimerProps {
  rfq: RFQ;
  onTimeExpired?: () => void;
}

export function AuctionTimer({ rfq, onTimeExpired }: AuctionTimerProps) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const closeTime = new Date(rfq.bid_close_time).getTime();
  const forcedCloseTime = new Date(rfq.forced_bid_close_time).getTime();
  const startTime = new Date(rfq.bid_start_time).getTime();

  const isUpcoming = now < startTime;
  const isClosed =
    now >= closeTime ||
    now >= forcedCloseTime ||
    rfq.status === "CLOSED" ||
    rfq.status === "FORCE_CLOSED";

  const diffMs = Math.max(0, closeTime - now);
  const totalSeconds = Math.floor(diffMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Trigger window check
  const windowMs = rfq.trigger_window_minutes * 60 * 1000;
  const inTriggerWindow = !isClosed && !isUpcoming && diffMs <= windowMs;

  const forcedDiffMs = Math.max(0, forcedCloseTime - now);
  const forcedMinutes = Math.floor(forcedDiffMs / (60 * 1000));

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 shadow-lg shadow-black/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Main Countdown Display */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isUpcoming
                ? "Auction Starts In"
                : isClosed
                ? "Auction Deadline"
                : "Current Bid Close Countdown"}
            </span>

            {inTriggerWindow && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/90 text-amber-300 border border-amber-700/80 animate-bounce">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                TRIGGER WINDOW ACTIVE
              </span>
            )}
          </div>

          {isClosed ? (
            <div className="text-3xl font-extrabold text-slate-400 tracking-tight">
              Bidding Closed
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                (Extension: +{rfq.extension_duration_minutes}m if active)
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Rules Snapshot */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <div className="text-xs">
            <span className="text-slate-400 block">Trigger Window (X):</span>
            <span className="font-semibold text-slate-200">Last {rfq.trigger_window_minutes} mins</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <div className="text-xs">
            <span className="text-slate-400 block">Extension (Y):</span>
            <span className="font-semibold text-slate-200">+{rfq.extension_duration_minutes} mins</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <div className="text-xs">
            <span className="text-slate-400 block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              Forced Close:
            </span>
            <span className="font-semibold text-rose-400">
              {new Date(rfq.forced_bid_close_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({forcedMinutes}m max)
            </span>
          </div>
        </div>
      </div>

      {inTriggerWindow && (
        <div className="mt-4 p-3 bg-gradient-to-r from-amber-950/40 to-orange-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">British Auction Dynamic Extension Active:</p>
            <p className="text-amber-300/90 mt-0.5">
              Any qualifying bid received now will automatically extend the closing time by{" "}
              <strong>{rfq.extension_duration_minutes} minutes</strong> (capped at forced close time).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
