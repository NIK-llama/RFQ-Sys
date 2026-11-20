"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { RFQDetail, SubmitQuoteInput, QuoteSubmissionResponse } from "@/types";
import { fetchRFQDetails, submitQuote, timeTravelRFQ } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { AuctionTimer } from "@/components/AuctionTimer";
import { Leaderboard } from "@/components/Leaderboard";
import { QuoteBreakdown } from "@/components/QuoteBreakdown";
import { QuoteSubmissionModal } from "@/components/QuoteSubmissionModal";
import { ActivityLogView } from "@/components/ActivityLogView";
import {
  ArrowLeft,
  Sliders,
  ShieldAlert,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";

export default function AuctionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const rfqId = resolvedParams.id;

  const [rfq, setRfq] = useState<RFQDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeTravelLoading, setTimeTravelLoading] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await fetchRFQDetails(rfqId);
      setRfq(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      if (!rfq) setError(err.message || "Failed to load RFQ details.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [rfqId]);

  const handleQuoteSubmit = async (
    data: SubmitQuoteInput
  ): Promise<QuoteSubmissionResponse> => {
    const res = await submitQuote(rfqId, data);
    await loadData(true);
    return res;
  };

  const handleTimeTravel = async (minutes: number) => {
    setTimeTravelLoading(true);
    try {
      const updated = await timeTravelRFQ(rfqId, minutes);
      setRfq(updated);
    } catch (err: any) {
      alert(err.message || "Failed to shift time.");
    } finally {
      setTimeTravelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-28" />
        <div className="h-10 bg-slate-800 rounded w-1/2" />
        <div className="h-40 bg-[#0f172a] rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-[#0f172a] rounded-2xl border border-slate-800 lg:col-span-2" />
          <div className="h-80 bg-[#0f172a] rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="max-w-md mx-auto my-12 bg-[#0f172a] rounded-2xl border border-slate-800 p-8 text-center shadow-lg shadow-black/20">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-white">Error Loading Auction</h3>
        <p className="text-sm text-slate-400 mt-1">{error || "RFQ not found."}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Auctions
        </Link>
      </div>
    );
  }

  const isBiddingActive = rfq.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Auctions
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/80">
              {rfq.reference_id}
            </span>
            <StatusBadge status={rfq.status} />
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              Service Date: {rfq.pickup_service_date}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            {rfq.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-800 bg-[#0f172a] text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh details"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!isBiddingActive}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition ${
              isBiddingActive
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 hover:scale-[1.02]"
                : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Supplier Quote</span>
          </button>
        </div>
      </div>

      {/* Live Countdown & Dynamic Extension Timer */}
      <AuctionTimer rfq={rfq} onTimeExpired={() => loadData(true)} />

      {/* Testing & Demo Helper Bar */}
      <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 text-indigo-300">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Reviewer Testing Tool:</span>
          <span className="text-slate-400 hidden sm:inline">
            Shift close time to test the trigger window & extension live:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTimeTravel(3)}
            disabled={timeTravelLoading}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
          >
            Set 3 Mins Left (In Window)
          </button>
          <button
            onClick={() => handleTimeTravel(1)}
            disabled={timeTravelLoading}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
          >
            Set 1 Min Left
          </button>
          <button
            onClick={() => handleTimeTravel(30)}
            disabled={timeTravelLoading}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
          >
            Reset (30m)
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Leaderboard & Quotes), Right Column (Config & Activity Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaderboard & Submitted Quotes */}
        <div className="lg:col-span-2 space-y-6">
          <Leaderboard quotes={rfq.quotes} />
          <QuoteBreakdown quotes={rfq.quotes} />
        </div>

        {/* Right 1 Col: British Auction Config & Activity Audit Trail */}
        <div className="space-y-6">
          {/* Configuration Card */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 shadow-lg shadow-black/20 space-y-3.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Auction Configuration</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Trigger Window (X):</span>
                <span className="font-semibold text-slate-200">
                  {rfq.trigger_window_minutes} minutes before close
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Extension Duration (Y):</span>
                <span className="font-semibold text-slate-200">
                  +{rfq.extension_duration_minutes} minutes added
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Extension Trigger:</span>
                <span className="font-semibold text-indigo-400 text-right">
                  {rfq.extension_trigger_type === "L1_RANK_CHANGE"
                    ? "Lowest Bidder (L1) Change"
                    : rfq.extension_trigger_type === "BID_RECEIVED"
                    ? "Any Bid Received"
                    : "Any Rank Change"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Initial Bid Close:</span>
                <span className="font-mono text-slate-200">
                  {formatDateTime(rfq.original_bid_close_time)}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Forced Bid Close:</span>
                <span className="font-mono font-bold text-rose-400">
                  {formatDateTime(rfq.forced_bid_close_time)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400">
              Extensions will strictly stop when Current Close reaches Forced Close.
            </div>
          </div>

          {/* Activity Log Feed */}
          <ActivityLogView logs={rfq.activity_logs} />
        </div>
      </div>

      {/* Quote Submission Modal */}
      <QuoteSubmissionModal
        rfqId={rfq.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleQuoteSubmit}
      />
    </div>
  );
}
