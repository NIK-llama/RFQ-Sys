export type RFQStatus = "UPCOMING" | "ACTIVE" | "CLOSED" | "FORCE_CLOSED";

export type ExtensionTriggerType = "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_RANK_CHANGE";

export type ActivityType = "RFQ_CREATED" | "BID_SUBMITTED" | "TIME_EXTENDED" | "STATUS_CHANGED";

export interface Quote {
  id: string;
  rfq_id: string;
  carrier_name: string;
  freight_charges: number | string;
  origin_charges: number | string;
  destination_charges: number | string;
  total_price: number | string;
  transit_time_days: number;
  validity_date: string;
  submitted_at: string;
  rank?: string;
  rank_number?: number;
}

export interface ActivityLog {
  id: string;
  rfq_id: string;
  quote_id?: string | null;
  activity_type: ActivityType;
  description: string;
  previous_close_time?: string | null;
  new_close_time?: string | null;
  created_at: string;
}

export interface RFQ {
  id: string;
  reference_id: string;
  name: string;
  status: RFQStatus;
  bid_start_time: string;
  bid_close_time: string;
  original_bid_close_time: string;
  forced_bid_close_time: string;
  pickup_service_date: string;
  trigger_window_minutes: number;
  extension_duration_minutes: number;
  extension_trigger_type: ExtensionTriggerType;
  current_lowest_bid?: number | string | null;
  current_lowest_carrier?: string | null;
  total_bids_count: number;
  is_in_trigger_window: boolean;
  created_at: string;
  updated_at: string;
}

export interface RFQDetail extends RFQ {
  quotes: Quote[];
  activity_logs: ActivityLog[];
}

export interface CreateRFQInput {
  reference_id: string;
  name: string;
  bid_start_time: string;
  bid_close_time: string;
  forced_bid_close_time: string;
  pickup_service_date: string;
  trigger_window_minutes: number;
  extension_duration_minutes: number;
  extension_trigger_type: ExtensionTriggerType;
}

export interface SubmitQuoteInput {
  carrier_name: string;
  freight_charges: number;
  origin_charges: number;
  destination_charges: number;
  transit_time_days: number;
  validity_date: string;
  simulated_submitted_at?: string;
}

export interface QuoteSubmissionResponse {
  quote: Quote;
  auction_extended: boolean;
  extension_reason?: string | null;
}
