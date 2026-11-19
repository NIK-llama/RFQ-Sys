from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.rfq import RFQ, RFQStatus, ExtensionTriggerType
from app.models.quote import Quote
from app.models.activity_log import AuctionActivityLog, ActivityType
from app.schemas.rfq import RFQCreate, RFQResponse, RFQDetailResponse
from app.schemas.quote import QuoteCreate, QuoteResponse
from app.schemas.activity_log import ActivityLogResponse


class AuctionService:

    @staticmethod
    def evaluate_status(rfq: RFQ, current_time: Optional[datetime] = None) -> RFQStatus:
        """Determines the current dynamic status of an RFQ."""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        # Ensure timezone awareness
        if rfq.bid_start_time.tzinfo is None:
            rfq.bid_start_time = rfq.bid_start_time.replace(tzinfo=timezone.utc)
        if rfq.bid_close_time.tzinfo is None:
            rfq.bid_close_time = rfq.bid_close_time.replace(tzinfo=timezone.utc)
        if rfq.forced_bid_close_time.tzinfo is None:
            rfq.forced_bid_close_time = rfq.forced_bid_close_time.replace(tzinfo=timezone.utc)

        if current_time < rfq.bid_start_time:
            return RFQStatus.UPCOMING
        if current_time >= rfq.forced_bid_close_time:
            return RFQStatus.FORCE_CLOSED
        if current_time >= rfq.bid_close_time:
            return RFQStatus.CLOSED
        return RFQStatus.ACTIVE

    @staticmethod
    def sync_rfq_status(rfq: RFQ, db: Session, current_time: Optional[datetime] = None) -> RFQStatus:
        new_status = AuctionService.evaluate_status(rfq, current_time)
        if rfq.status != new_status:
            old_status = rfq.status
            rfq.status = new_status
            log = AuctionActivityLog(
                rfq_id=rfq.id,
                activity_type=ActivityType.STATUS_CHANGED,
                description=f"Auction status changed from {old_status} to {new_status}."
            )
            db.add(log)
            db.commit()
            db.refresh(rfq)
        return rfq.status

    @staticmethod
    def get_supplier_best_quotes(quotes: List[Quote]) -> Dict[str, Quote]:
        """Find the best (lowest total price) quote for each carrier."""
        best: Dict[str, Quote] = {}
        # Assuming quotes are sorted by total_price asc, submitted_at asc
        for q in sorted(quotes, key=lambda x: (x.total_price, x.submitted_at)):
            if q.carrier_name not in best:
                best[q.carrier_name] = q
        return best

    @staticmethod
    def compute_supplier_rankings(quotes: List[Quote]) -> List[str]:
        """Returns ordered list of carrier names from lowest price to highest."""
        best_quotes = AuctionService.get_supplier_best_quotes(quotes)
        sorted_carriers = sorted(
            best_quotes.keys(),
            key=lambda c: (best_quotes[c].total_price, best_quotes[c].submitted_at)
        )
        return sorted_carriers

    @classmethod
    def create_rfq(cls, db: Session, payload: RFQCreate) -> RFQ:
        # Check uniqueness of reference_id
        existing = db.query(RFQ).filter(RFQ.reference_id == payload.reference_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"RFQ with Reference ID '{payload.reference_id}' already exists."
            )

        now = datetime.now(timezone.utc)
        rfq = RFQ(
            reference_id=payload.reference_id,
            name=payload.name,
            bid_start_time=payload.bid_start_time,
            bid_close_time=payload.bid_close_time,
            original_bid_close_time=payload.bid_close_time,
            forced_bid_close_time=payload.forced_bid_close_time,
            pickup_service_date=payload.pickup_service_date,
            trigger_window_minutes=payload.trigger_window_minutes,
            extension_duration_minutes=payload.extension_duration_minutes,
            extension_trigger_type=payload.extension_trigger_type,
            status=RFQStatus.ACTIVE if payload.bid_start_time <= now < payload.bid_close_time else (
                RFQStatus.UPCOMING if now < payload.bid_start_time else RFQStatus.CLOSED
            )
        )
        db.add(rfq)
        db.flush()

        log = AuctionActivityLog(
            rfq_id=rfq.id,
            activity_type=ActivityType.RFQ_CREATED,
            description=f"RFQ '{rfq.name}' created with British Auction enabled. Close: {rfq.bid_close_time.isoformat()}, Forced Close: {rfq.forced_bid_close_time.isoformat()}."
        )
        db.add(log)
        db.commit()
        db.refresh(rfq)
        return rfq

    @classmethod
    def submit_quote(cls, db: Session, rfq_id, payload: QuoteCreate) -> Tuple[Quote, bool, Optional[str]]:
        rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
        if not rfq:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found.")

        submission_time = payload.simulated_submitted_at or datetime.now(timezone.utc)
        if submission_time.tzinfo is None:
            submission_time = submission_time.replace(tzinfo=timezone.utc)

        # Sync and validate status
        current_status = cls.sync_rfq_status(rfq, db, submission_time)
        if current_status == RFQStatus.UPCOMING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Auction has not started yet. Starts at {rfq.bid_start_time.isoformat()}."
            )
        if current_status in (RFQStatus.CLOSED, RFQStatus.FORCE_CLOSED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Auction is {current_status.value}. Bidding is closed."
            )

        # Snapshot rankings before this bid
        existing_quotes = db.query(Quote).filter(Quote.rfq_id == rfq.id).all()
        prev_supplier_ranks = cls.compute_supplier_rankings(existing_quotes)
        prev_l1_carrier = prev_supplier_ranks[0] if prev_supplier_ranks else None
        prev_lowest_price = min([q.total_price for q in existing_quotes]) if existing_quotes else None

        # Compute total price
        total_price = payload.freight_charges + payload.origin_charges + payload.destination_charges

        # Create Quote
        quote = Quote(
            rfq_id=rfq.id,
            carrier_name=payload.carrier_name,
            freight_charges=payload.freight_charges,
            origin_charges=payload.origin_charges,
            destination_charges=payload.destination_charges,
            total_price=total_price,
            transit_time_days=payload.transit_time_days,
            validity_date=payload.validity_date,
            submitted_at=submission_time
        )
        db.add(quote)
        db.flush()

        # Recalculate rankings including new quote
        updated_quotes = existing_quotes + [quote]
        new_supplier_ranks = cls.compute_supplier_rankings(updated_quotes)
        new_l1_carrier = new_supplier_ranks[0] if new_supplier_ranks else None

        # Calculate rank of this quote
        sorted_all_quotes = sorted(updated_quotes, key=lambda q: (q.total_price, q.submitted_at))
        quote_rank_num = next((idx + 1 for idx, q in enumerate(sorted_all_quotes) if q.id == quote.id), 1)

        # Log bid submission
        bid_log = AuctionActivityLog(
            rfq_id=rfq.id,
            quote_id=quote.id,
            activity_type=ActivityType.BID_SUBMITTED,
            description=(
                f"Quote submitted by '{quote.carrier_name}' for ${total_price:,.2f} "
                f"(Freight: ${quote.freight_charges:,.2f}, Origin: ${quote.origin_charges:,.2f}, "
                f"Dest: ${quote.destination_charges:,.2f}). Current Rank: L{quote_rank_num}."
            ),
            created_at=submission_time
        )
        db.add(bid_log)

        # Check British Auction Trigger Window
        # Trigger window: [rfq.bid_close_time - X minutes, rfq.bid_close_time]
        trigger_window_delta = timedelta(minutes=rfq.trigger_window_minutes)
        window_start_time = rfq.bid_close_time - trigger_window_delta
        is_in_trigger_window = window_start_time <= submission_time <= rfq.bid_close_time

        extended = False
        extension_reason = None

        if is_in_trigger_window:
            should_extend = False
            trigger_detail = ""

            if rfq.extension_trigger_type == ExtensionTriggerType.BID_RECEIVED:
                should_extend = True
                trigger_detail = f"Bid received from '{quote.carrier_name}' within last {rfq.trigger_window_minutes} minutes"
            elif rfq.extension_trigger_type == ExtensionTriggerType.ANY_RANK_CHANGE:
                # Did supplier order change or did a new carrier enter the leaderboard?
                if prev_supplier_ranks != new_supplier_ranks:
                    should_extend = True
                    trigger_detail = f"Supplier ranking changed within last {rfq.trigger_window_minutes} minutes"
            elif rfq.extension_trigger_type == ExtensionTriggerType.L1_RANK_CHANGE:
                # Lowest bidder (L1) changed
                if prev_l1_carrier != new_l1_carrier or (prev_lowest_price is not None and total_price < prev_lowest_price):
                    should_extend = True
                    trigger_detail = f"Lowest bidder (L1) changed to '{new_l1_carrier}' (${total_price:,.2f}) within last {rfq.trigger_window_minutes} minutes"

            if should_extend:
                prev_close = rfq.bid_close_time
                potential_new_close = prev_close + timedelta(minutes=rfq.extension_duration_minutes)
                capped_new_close = min(potential_new_close, rfq.forced_bid_close_time)

                if capped_new_close > prev_close:
                    rfq.bid_close_time = capped_new_close
                    extended = True
                    minutes_added = (capped_new_close - prev_close).total_seconds() / 60
                    
                    if capped_new_close == rfq.forced_bid_close_time:
                        extension_reason = (
                            f"{trigger_detail}. Auction extended by {minutes_added:.1f} min(s) to Forced Close limit "
                            f"({capped_new_close.strftime('%H:%M:%S UTC')})."
                        )
                    else:
                        extension_reason = (
                            f"{trigger_detail}. Auction extended by {rfq.extension_duration_minutes} minutes "
                            f"to {capped_new_close.strftime('%H:%M:%S UTC')}."
                        )

                    ext_log = AuctionActivityLog(
                        rfq_id=rfq.id,
                        quote_id=quote.id,
                        activity_type=ActivityType.TIME_EXTENDED,
                        description=extension_reason,
                        previous_close_time=prev_close,
                        new_close_time=capped_new_close,
                        created_at=submission_time
                    )
                    db.add(ext_log)
                else:
                    # Already reached forced bid close time
                    ext_log = AuctionActivityLog(
                        rfq_id=rfq.id,
                        quote_id=quote.id,
                        activity_type=ActivityType.TIME_EXTENDED,
                        description=(
                            f"{trigger_detail}. Extension skipped because auction has already reached "
                            f"Forced Close Time ({rfq.forced_bid_close_time.strftime('%H:%M:%S UTC')})."
                        ),
                        previous_close_time=prev_close,
                        new_close_time=prev_close,
                        created_at=submission_time
                    )
                    db.add(ext_log)

        db.commit()
        db.refresh(quote)
        db.refresh(rfq)
        return quote, extended, extension_reason

    @classmethod
    def format_rfq_response(cls, rfq: RFQ, db: Session, current_time: Optional[datetime] = None) -> RFQResponse:
        cls.sync_rfq_status(rfq, db, current_time)
        now = current_time or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        quotes = db.query(Quote).filter(Quote.rfq_id == rfq.id).order_by(Quote.total_price.asc(), Quote.submitted_at.asc()).all()
        
        lowest_bid = quotes[0].total_price if quotes else None
        lowest_carrier = quotes[0].carrier_name if quotes else None
        
        window_start = rfq.bid_close_time - timedelta(minutes=rfq.trigger_window_minutes)
        is_in_window = window_start <= now <= rfq.bid_close_time

        return RFQResponse(
            id=rfq.id,
            reference_id=rfq.reference_id,
            name=rfq.name,
            status=rfq.status,
            bid_start_time=rfq.bid_start_time,
            bid_close_time=rfq.bid_close_time,
            original_bid_close_time=rfq.original_bid_close_time,
            forced_bid_close_time=rfq.forced_bid_close_time,
            pickup_service_date=rfq.pickup_service_date,
            trigger_window_minutes=rfq.trigger_window_minutes,
            extension_duration_minutes=rfq.extension_duration_minutes,
            extension_trigger_type=rfq.extension_trigger_type,
            current_lowest_bid=lowest_bid,
            current_lowest_carrier=lowest_carrier,
            total_bids_count=len(quotes),
            is_in_trigger_window=is_in_window,
            created_at=rfq.created_at,
            updated_at=rfq.updated_at
        )

    @classmethod
    def format_rfq_detail_response(cls, rfq: RFQ, db: Session, current_time: Optional[datetime] = None) -> RFQDetailResponse:
        base_resp = cls.format_rfq_response(rfq, db, current_time)
        
        quotes = db.query(Quote).filter(Quote.rfq_id == rfq.id).order_by(Quote.total_price.asc(), Quote.submitted_at.asc()).all()
        
        ranked_quotes: List[QuoteResponse] = []
        for idx, q in enumerate(quotes):
            ranked_quotes.append(
                QuoteResponse(
                    id=q.id,
                    rfq_id=q.rfq_id,
                    carrier_name=q.carrier_name,
                    freight_charges=q.freight_charges,
                    origin_charges=q.origin_charges,
                    destination_charges=q.destination_charges,
                    total_price=q.total_price,
                    transit_time_days=q.transit_time_days,
                    validity_date=q.validity_date,
                    submitted_at=q.submitted_at,
                    rank=f"L{idx + 1}",
                    rank_number=idx + 1
                )
            )

        logs = db.query(AuctionActivityLog).filter(AuctionActivityLog.rfq_id == rfq.id).order_by(AuctionActivityLog.created_at.desc()).all()
        log_responses = [ActivityLogResponse.model_validate(l) for l in logs]

        return RFQDetailResponse(
            **base_resp.model_dump(),
            quotes=ranked_quotes,
            activity_logs=log_responses
        )
