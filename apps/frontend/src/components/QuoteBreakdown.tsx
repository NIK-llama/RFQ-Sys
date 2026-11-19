"use client";

import { Quote } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { FileText, Calendar, Clock, DollarSign } from "lucide-react";

interface QuoteBreakdownProps {
  quotes: Quote[];
}

export function QuoteBreakdown({ quotes }: QuoteBreakdownProps) {
  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="font-semibold text-slate-800">No Quotes Submitted</h4>
        <p className="text-sm text-slate-500 mt-1">
          Detailed bid breakdowns will appear here once suppliers submit quotes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 tracking-tight">All Submitted Quotes</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of freight, origin, and destination charges.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
          {quotes.length} Total {quotes.length === 1 ? "Bid" : "Bids"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
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
          <tbody className="divide-y divide-slate-100 font-normal">
            {quotes.map((q, idx) => {
              const isL1 = idx === 0;
              return (
                <tr
                  key={q.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isL1 ? "bg-emerald-50/30 font-medium" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded ${
                        isL1
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {q.rank || `L${idx + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                    {q.carrier_name}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono">
                    {formatCurrency(q.freight_charges)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono">
                    {formatCurrency(q.origin_charges)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono">
                    {formatCurrency(q.destination_charges)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                    {formatCurrency(q.total_price)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                    {q.transit_time_days} days
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
                    {q.validity_date}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
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
