"use client";

import { useState } from "react";
import { SubmitQuoteInput, QuoteSubmissionResponse } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { X, Send, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface QuoteSubmissionModalProps {
  rfqId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitQuoteInput) => Promise<QuoteSubmissionResponse>;
}

export function QuoteSubmissionModal({
  rfqId,
  isOpen,
  onClose,
  onSubmit,
}: QuoteSubmissionModalProps) {
  const [carrierName, setCarrierName] = useState("");
  const [freightCharges, setFreightCharges] = useState<number | "">("");
  const [originCharges, setOriginCharges] = useState<number | "">("");
  const [destinationCharges, setDestinationCharges] = useState<number | "">("");
  const [transitTimeDays, setTransitTimeDays] = useState<number | "">("");
  const [validityDate, setValidityDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuoteSubmissionResponse | null>(null);

  if (!isOpen) return null;

  const fVal = typeof freightCharges === "number" ? freightCharges : 0;
  const oVal = typeof originCharges === "number" ? originCharges : 0;
  const dVal = typeof destinationCharges === "number" ? destinationCharges : 0;
  const totalPrice = fVal + oVal + dVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!carrierName.trim()) {
      setError("Please enter a Carrier / Supplier name.");
      return;
    }
    if (freightCharges === "" || originCharges === "" || destinationCharges === "") {
      setError("Please fill in all pricing fields.");
      return;
    }
    if (transitTimeDays === "" || Number(transitTimeDays) <= 0) {
      setError("Please specify a valid transit time in days.");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit({
        carrier_name: carrierName.trim(),
        freight_charges: Number(freightCharges),
        origin_charges: Number(originCharges),
        destination_charges: Number(destinationCharges),
        transit_time_days: Number(transitTimeDays),
        validity_date: validityDate,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to submit quote.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900">Submit Supplier Quote</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter competitive charges to compete in this British auction.</p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {result ? (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  result.auction_extended
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                {result.auction_extended ? (
                  <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {result.auction_extended
                      ? "British Auction Extended!"
                      : "Quote Successfully Submitted!"}
                  </h4>
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">
                    {result.extension_reason ||
                      `Your bid of ${formatCurrency(
                        result.quote.total_price
                      )} has been entered into the auction leaderboard.`}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Carrier:</span>
                  <span className="font-semibold text-slate-800">{result.quote.carrier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Price:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatCurrency(result.quote.total_price)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
              >
                Done & View Leaderboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier Name</label>
                <input
                  type="text"
                  placeholder="e.g. DHL Global Forwarding"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Freight ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2500"
                    value={freightCharges}
                    onChange={(e) => setFreightCharges(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Origin ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="250"
                    value={originCharges}
                    onChange={(e) => setOriginCharges(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="200"
                    value={destinationCharges}
                    onChange={(e) => setDestinationCharges(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Total Computed Quote Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Calculated Total Price:</span>
                <span className="font-extrabold text-slate-900 font-mono text-base">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transit Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="3"
                    value={transitTimeDays}
                    onChange={(e) => setTransitTimeDays(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Date</label>
                  <input
                    type="date"
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Submitting..." : "Submit Quote"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
