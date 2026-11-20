"use client";

import { Quote } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { FileText } from "lucide-react";

interface QuoteBreakdownProps {
  quotes: Quote[];
}

export function QuoteBreakdown({ quotes }: QuoteBreakdownProps) {
  if (quotes.length === 0) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 text-center shadow-lg shadow-black/20">
        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="font-semibold text-slate-200">No Quotes Submitted</h4>
        <p className="text-sm text-slate-400 mt-1">
          Detailed bid breakdowns will appear here once suppliers submit quotes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-lg shadow-black/20 overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white tracking-tight">All Submitted Quotes</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent breakdown of freight, origin, and destination charges.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700/80">
          {quotes.length} Total {quotes.length === 1 ? "Bid" : "Bids"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3.5">Rank</th>
              <th scope="col" className="px-4 py-3.5">Carrier</th>
              <th scope="col" className="px-4 py-3.5 text-right">Freight Charges</th>
              <th scope="col" className="px-4 py-3.5 text-right">Origin</th>
              <th scope="col" className="px-4 py-3.5 text-right">Destination</th>
              <th scope="col" className="px-4 py-3.5 text-right">Total Price</th>
              <th scope="col" className="px-4 py-3.5">Transit</th>
              <th scope="col" className="px-4 py-3.5">Validity</th>
              <th scope="col" className="px-4 py-3.5">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-normal">
            {quotes.map((q, idx) => {
              const isL1 = idx === 0;
              return (
                <tr
                  key={q.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isL1 ? "bg-emerald-950/20 font-medium" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded ${
                        isL1
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {q.rank || `L${idx + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-white">
                    {q.carrier_name}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono text-slate-300">
                    {formatCurrency(q.freight_charges)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono text-slate-300">
                    {formatCurrency(q.origin_charges)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono text-slate-300">
                    {formatCurrency(q.destination_charges)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono font-bold text-white">
                    {formatCurrency(q.total_price)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-400">
                    {q.transit_time_days} days
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-400">
                    {q.validity_date}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-400">
                    {formatDateTime(q.submitted_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
