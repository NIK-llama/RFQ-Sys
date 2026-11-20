"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RFQ } from "@/types";
import { fetchRFQs } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Gavel,
  ArrowRight,
  Clock,
  ShieldAlert,
  Search,
  RefreshCw,
  PlusCircle,
} from "lucide-react";

export default function AuctionListingPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchRFQs();
      setRfqs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const filteredRfqs = rfqs.filter((rfq) => {
    const matchesStatus =
      statusFilter === "ALL" || rfq.status === statusFilter;
    const matchesSearch =
      rfq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.reference_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            British Auctions Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic competitive bidding with automatic time extensions and hard forced close rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-[#0f172a] text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-semibold"
            title="Refresh auctions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 shadow-lg shadow-black/20">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "UPCOMING", "CLOSED", "FORCE_CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {s === "ALL" ? "All Auctions" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of RFQs */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-900 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-12 text-center shadow-lg shadow-black/20">
          <Gavel className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No Auctions Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "ALL"
              ? "No auctions matched your filter criteria."
              : "No RFQs exist right now. Click '+ Create RFQ' or run seed.py."}
          </p>
          <div className="mt-4">
            <Link
              href="/rfqs/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-500 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Create RFQ
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRfqs.map((rfq) => {
            const hasLowest =
              rfq.current_lowest_bid !== null && rfq.current_lowest_bid !== undefined;

            return (
              <div
                key={rfq.id}
                className="bg-[#0f172a] rounded-2xl border border-slate-800/90 p-5 shadow-lg shadow-black/20 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Reference ID & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800/80">
                      {rfq.reference_id}
                    </span>
                    <StatusBadge status={rfq.status} />
                  </div>

                  {/* RFQ Name */}
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                    {rfq.name}
                  </h3>

                  {/* Lowest Bid Card */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Current Lowest Bid (L1)
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-emerald-400 font-mono">
                        {hasLowest ? formatCurrency(rfq.current_lowest_bid) : "No bids yet"}
                      </span>
                      {hasLowest && rfq.current_lowest_carrier && (
                        <span className="text-xs text-emerald-300 font-semibold truncate max-w-[130px]">
                          {rfq.current_lowest_carrier}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timing & Extension Rules */}
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Current Close:
                      </span>
                      <span className="font-semibold text-slate-200">
                        {formatDateTime(rfq.bid_close_time)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        Forced Close:
                      </span>
                      <span className="font-semibold text-rose-400">
                        {formatDateTime(rfq.forced_bid_close_time)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Trigger Rule:</span>
                      <span className="font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                        {rfq.extension_trigger_type.replace("_", " ")} ({rfq.trigger_window_minutes}m / +{rfq.extension_duration_minutes}m)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <Link
                    href={`/rfqs/${rfq.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700/60 hover:border-transparent"
                  >
                    <span>View Auction & Bid</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
