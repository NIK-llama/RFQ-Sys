"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RFQ, RFQStatus } from "@/types";
import { fetchRFQs } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Gavel,
  ArrowRight,
  PlusCircle,
  Clock,
  ShieldAlert,
  Flame,
  Search,
  RefreshCw,
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            British Auctions Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dynamic competitive bidding with automatic time extensions and hard forced close rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            title="Refresh auctions"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/rfqs/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create British Auction</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "UPCOMING", "CLOSED", "FORCE_CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s === "ALL" ? "All Auctions" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of RFQs */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <Gavel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Auctions Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "ALL"
              ? "No auctions matched your filter criteria."
              : "Get started by creating your first British Auction RFQ."}
          </p>
          <div className="mt-4">
            <Link
              href="/rfqs/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create RFQ
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRfqs.map((rfq) => {
            const hasLowest = rfq.current_lowest_bid !== null && rfq.current_lowest_bid !== undefined;

            return (
              <div
                key={rfq.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Reference ID & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {rfq.reference_id}
                    </span>
                    <StatusBadge status={rfq.status} />
                  </div>

                  {/* RFQ Name */}
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {rfq.name}
                  </h3>

                  {/* Lowest Bid Card */}
                  <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/60 border border-slate-200/60">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Current Lowest Bid (L1)
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-slate-900 font-mono">
                        {hasLowest ? formatCurrency(rfq.current_lowest_bid) : "No bids yet"}
                      </span>
                      {hasLowest && rfq.current_lowest_carrier && (
                        <span className="text-xs text-emerald-700 font-semibold truncate max-w-[120px]">
                          {rfq.current_lowest_carrier}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timing & Extension Rules */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        Current Close:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(rfq.bid_close_time)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        Forced Close:
                      </span>
                      <span className="font-semibold text-rose-700">
                        {formatDateTime(rfq.forced_bid_close_time)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Trigger Rule:</span>
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {rfq.extension_trigger_type.replace("_", " ")} ({rfq.trigger_window_minutes}m / +{rfq.extension_duration_minutes}m)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href={`/rfqs/${rfq.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition-all"
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
