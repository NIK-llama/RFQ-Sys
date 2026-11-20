"use client";

import { Quote } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Trophy, Award, TrendingDown, Users } from "lucide-react";

interface LeaderboardProps {
  quotes: Quote[];
}

export function Leaderboard({ quotes }: LeaderboardProps) {
  // Deduplicate by carrier best quote for supplier ranking
  const bestQuotesByCarrier: { [carrier: string]: Quote } = {};
  quotes.forEach((q) => {
    const existing = bestQuotesByCarrier[q.carrier_name];
    if (!existing || Number(q.total_price) < Number(existing.total_price)) {
      bestQuotesByCarrier[q.carrier_name] = q;
    }
  });

  const rankedCarriers = Object.values(bestQuotesByCarrier).sort(
    (a, b) => Number(a.total_price) - Number(b.total_price)
  );

  const l1Price = rankedCarriers.length > 0 ? Number(rankedCarriers[0].total_price) : 0;

  if (rankedCarriers.length === 0) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 text-center shadow-lg shadow-black/20">
        <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="font-semibold text-slate-200">No Bids Placed Yet</h4>
        <p className="text-sm text-slate-400 mt-1">
          Be the first supplier to submit a quote and take the L1 ranking!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white tracking-tight">Supplier Leaderboard</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700/80">
          {rankedCarriers.length} Participating {rankedCarriers.length === 1 ? "Supplier" : "Suppliers"}
        </span>
      </div>

      <div className="space-y-2.5">
        {rankedCarriers.map((quote, idx) => {
          const rankLabel = `L${idx + 1}`;
          const isL1 = idx === 0;
          const priceDiff = Number(quote.total_price) - l1Price;

          return (
            <div
              key={quote.carrier_name}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                isL1
                  ? "bg-emerald-950/40 border-emerald-800/80 shadow-md shadow-emerald-950/20"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isL1
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                      : idx === 1
                      ? "bg-slate-800 text-slate-200 border border-slate-700"
                      : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}
                >
                  {isL1 ? <Award className="w-5 h-5" /> : rankLabel}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{quote.carrier_name}</span>
                    {isL1 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                        Lowest Bidder (L1)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Transit: {quote.transit_time_days} days • Submitted: {formatDateTime(quote.submitted_at)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-lg font-bold font-mono ${isL1 ? "text-emerald-400" : "text-slate-200"}`}>
                  {formatCurrency(quote.total_price)}
                </span>
                {!isL1 && priceDiff > 0 && (
                  <p className="text-[11px] font-medium text-rose-400 flex items-center justify-end gap-0.5">
                    <TrendingDown className="w-3 h-3 rotate-180" />
                    +{formatCurrency(priceDiff)} vs L1
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
