import { RFQ, RFQDetail, CreateRFQInput, SubmitQuoteInput, QuoteSubmissionResponse, RFQStatus } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchRFQs(status?: RFQStatus): Promise<RFQ[]> {
  const url = new URL(`${API_BASE}/rfqs`);
  if (status) {
    url.searchParams.set("status", status);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch RFQs: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchRFQDetails(id: string): Promise<RFQDetail> {
  const res = await fetch(`${API_BASE}/rfqs/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch RFQ details: ${res.statusText}`);
  }
  return res.json();
}

export async function createRFQ(payload: CreateRFQInput): Promise<RFQDetail> {
  const res = await fetch(`${API_BASE}/rfqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create RFQ.");
  }
  return res.json();
}

export async function submitQuote(
  rfqId: string,
  payload: SubmitQuoteInput
): Promise<QuoteSubmissionResponse> {
  const res = await fetch(`${API_BASE}/rfqs/${rfqId}/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit quote.");
  }
  return res.json();
}

export async function timeTravelRFQ(rfqId: string, minutesFromNow: number): Promise<RFQDetail> {
  const res = await fetch(
    `${API_BASE}/rfqs/${rfqId}/time-travel?minutes_from_now=${minutesFromNow}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to shift time.");
  }
  return res.json();
}
