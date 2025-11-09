"""
Credits API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import stripe
import os
from app.database import get_db
from app.models.user import User
from app.services.credit_service import get_credit_service
from app.services.pricing_service import get_pricing_service

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


class CreditsResponse(BaseModel):
    credits: int
    plan: str
    ppp_band: str
    solidarity_opt_in: bool
    pricing_breakdown: Optional[dict] = None


class PurchaseRequest(BaseModel):
    credits: int  # Must be one of: 300, 700, 2000


class PurchaseResponse(BaseModel):
    checkout_url: str
    session_id: str
    credits: int
    price: float


@router.get("", response_model=CreditsResponse)
async def get_credits(
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Get user's current credits and pricing breakdown"""
    # TODO: Get current user from auth
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    pricing_service = get_pricing_service()
    pricing_breakdown = pricing_service.get_pricing_breakdown(user)
    
    return {
        "credits": user.credits,
        "plan": user.plan.value,
        "ppp_band": user.ppp_band,
        "solidarity_opt_in": user.solidarity_opt_in,
        "pricing_breakdown": pricing_breakdown,
    }


@router.post("/purchase", response_model=PurchaseResponse)
async def purchase_credits(
    request: PurchaseRequest,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Create Stripe checkout session for credit purchase"""
    # TODO: Get current user from auth
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate credit pack
    pricing_service = get_pricing_service()
    if request.credits not in pricing_service.CREDIT_PACKS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid credit pack. Available packs: {pricing_service.CREDIT_PACKS}",
        )
    
    # Calculate price with PPP and solidarity adjustments
    total_price = pricing_service.calculate_pack_price(
        request.credits, user.ppp_band, user.solidarity_opt_in
    )
    
    # Create pricing snapshot for storage
    pricing_snapshot = pricing_service.create_pricing_snapshot(user, request.credits)
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"{request.credits} Credits",
                            "description": f"Purchase {request.credits} credits for music generation",
                        },
                        "unit_amount": int(total_price * 100),  # Convert to cents
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{os.getenv('NEXTAUTH_URL', 'http://localhost:3000')}/credits/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('NEXTAUTH_URL', 'http://localhost:3000')}/credits/cancel",
            metadata={
                "user_id": str(user.id),
                "credits": str(request.credits),
                "pricing_snapshot": str(pricing_snapshot),  # Store as JSON string
            },
        )

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "credits": request.credits,
            "price": float(total_price),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-ppp")
async def update_ppp_band(
    ppp_band: str,
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Update user's PPP band"""
    # TODO: Get current user from auth
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    valid_bands = ["HIGH", "UMID", "LMID", "LOW"]
    if ppp_band not in valid_bands:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid PPP band. Must be one of: {valid_bands}",
        )
    
    user.ppp_band = ppp_band
    db.commit()
    
    return {"ppp_band": ppp_band}


@router.post("/toggle-solidarity")
async def toggle_solidarity(
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Toggle solidarity pricing opt-in"""
    # TODO: Get current user from auth
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.solidarity_opt_in = not user.solidarity_opt_in
    db.commit()
    
    return {"solidarity_opt_in": user.solidarity_opt_in}
