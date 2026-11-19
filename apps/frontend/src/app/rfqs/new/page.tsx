"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRFQ } from "@/lib/api";
import { ExtensionTriggerType } from "@/types";
import {
  Gavel,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldAlert,
  Sliders,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function CreateRFQPage() {
  const router = useRouter();

  // Helper defaults
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const defaultClose = new Date(now.getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const defaultForcedClose = new Date(now.getTime() + 120 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const defaultPickup = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [referenceId, setReferenceId] = useState(
    `RFQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [name, setName] = useState("");
  const [bidStartTime, setBidStartTime] = useState(defaultStart);
  const [bidCloseTime, setBidCloseTime] = useState(defaultClose);
  const [forcedBidCloseTime, setForcedBidCloseTime] = useState(defaultForcedClose);
  const [pickupServiceDate, setPickupServiceDate] = useState(defaultPickup);

  // British Auction Configuration Options
  const [triggerWindowMinutes, setTriggerWindowMinutes] = useState(10);
  const [extensionDurationMinutes, setExtensionDurationMinutes] = useState(5);
  const [extensionTriggerType, setExtensionTriggerType] =
    useState<ExtensionTriggerType>("L1_RANK_CHANGE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const startDate = new Date(bidStartTime);
    const closeDate = new Date(bidCloseTime);
    const forcedDate = new Date(forcedBidCloseTime);

    if (closeDate <= startDate) {
      setError("Bid Close Time must be later than Bid Start Time.");
      return;
    }

    if (forcedDate <= closeDate) {
      setError("Forced Bid Close Time must always be greater than Bid Close Time.");
      return;
    }

    if (triggerWindowMinutes <= 0 || extensionDurationMinutes <= 0) {
      setError("Trigger window and extension duration must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const created = await createRFQ({
        reference_id: referenceId.trim(),
        name: name.trim(),
        bid_start_time: new Date(bidStartTime).toISOString(),
        bid_close_time: new Date(bidCloseTime).toISOString(),
        forced_bid_close_time: new Date(forcedBidCloseTime).toISOString(),
        pickup_service_date: pickupServiceDate,
        trigger_window_minutes: Number(triggerWindowMinutes),
        extension_duration_minutes: Number(extensionDurationMinutes),
        extension_trigger_type: extensionTriggerType,
      });
      router.push(`/rfqs/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create RFQ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Auctions Overview
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Create New RFQ</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure Request for Quotation with British Auction dynamic auto-extensions.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>1. General RFQ Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference ID
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RFQ Name / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Machinery Shipment (Rotterdam -> Houston)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pickup / Service Date
              </label>
              <input
                type="date"
                value={pickupServiceDate}
                onChange={(e) => setPickupServiceDate(e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Section 2: Auction Schedule */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>2. Auction Bidding Timeline</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bid Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={bidStartTime}
                  onChange={(e) => setBidStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bid Close Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={bidCloseTime}
                  onChange={(e) => setBidCloseTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  Forced Close Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={forcedBidCloseTime}
                  onChange={(e) => setForcedBidCloseTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/30"
                  required
                />
                <p className="text-[10px] text-rose-600 mt-1">
                  Must be later than Bid Close Time. Hard cutoff.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: British Auction Configuration */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>3. British Auction Configuration Options</span>
              </h3>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Auto-Extension Rules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trigger Window (X Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={triggerWindowMinutes}
                    onChange={(e) => setTriggerWindowMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">minutes</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Monitors bidding activity within this window before close time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Extension Duration (Y Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={extensionDurationMinutes}
                    onChange={(e) => setExtensionDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">minutes</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Extra time added to auction each time trigger condition occurs.
                </p>
              </div>
            </div>

            {/* Extension Trigger Options */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Extension Trigger Condition:
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: "L1_RANK_CHANGE",
                    title: "c) Lowest Bidder (L1) Rank Change in Last X Minutes",
                    desc: "Auction extends ONLY when the lowest-priced supplier changes. (Prevents auction extension if new bids don't beat the best quote).",
                  },
                  {
                    id: "BID_RECEIVED",
                    title: "a) Bid Received in Last X Minutes",
                    desc: "If any supplier submits a new bid during the trigger window, the auction extends.",
                  },
                  {
                    id: "ANY_RANK_CHANGE",
                    title: "b) Any Supplier Rank Change in Last X Minutes",
                    desc: "If any change in supplier ranking occurs during the trigger window, the auction extends.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      extensionTriggerType === opt.id
                        ? "bg-indigo-50/70 border-indigo-400 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="extensionTrigger"
                      value={opt.id}
                      checked={extensionTriggerType === opt.id}
                      onChange={() => setExtensionTriggerType(opt.id as ExtensionTriggerType)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{opt.title}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Rule Callout */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>System Rule:</strong> The auction will continuously extend whenever the condition is met, but will <strong>never extend beyond the Forced Bid Close Time</strong>.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create RFQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
