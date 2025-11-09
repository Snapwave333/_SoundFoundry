"""
Stripe webhook handler for credit purchases
"""
from fastapi import APIRouter, Request, HTTPException, Header, Depends
import stripe
import os
import json
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.credit_service import get_credit_service
from app.services.pricing_service import get_pricing_service

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db),
):
    """Handle Stripe webhook events"""
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle checkout.session.completed
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        credits_amount = int(session.get("metadata", {}).get("credits", 0))
        
        # Parse pricing snapshot from metadata
        pricing_snapshot_str = session.get("metadata", {}).get("pricing_snapshot", "{}")
        try:
            pricing_snapshot = json.loads(pricing_snapshot_str)
        except:
            pricing_snapshot = {}

        if user_id and credits_amount:
            credit_service = get_credit_service()
            credit_service.credit_credits(
                db,
                int(user_id),
                credits_amount,
                "purchase",
                meta={
                    "stripe_session_id": session.get("id"),
                    "stripe_payment_intent": session.get("payment_intent"),
                    "pricing_snapshot": pricing_snapshot,
                },
            )

    return {"status": "success"}
