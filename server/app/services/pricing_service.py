"""
Pricing service for fair, cost-anchored credit pricing
"""
import os
from typing import Dict, Optional
from decimal import Decimal, ROUND_UP
from app.models.user import User, PPPBand


class PricingService:
    """Service for calculating fair, cost-anchored credit prices"""

    # PPP adjustment multipliers
    PPP_MULTIPLIERS = {
        PPPBand.LOW: Decimal("0.70"),
        PPPBand.LMID: Decimal("0.80"),
        PPPBand.UMID: Decimal("0.90"),
        PPPBand.HIGH: Decimal("1.00"),
    }

    # Solidarity discount multiplier
    SOLIDARITY_MULTIPLIER = Decimal("0.85")

    # Credit packs available for purchase
    CREDIT_PACKS = [300, 700, 2000]

    def __init__(self):
        """Initialize pricing service with environment variables"""
        # Load costs from environment (no hardcoding)
        self.model_cost_per_min = Decimal(
            os.getenv("MODEL_COST_PER_MIN_USD", "0.15")
        )
        self.infra_cost_per_min = Decimal(
            os.getenv("INFRA_COST_PER_MIN_USD", "0.05")
        )
        self.overhead_per_min = Decimal(
            os.getenv("OVERHEAD_PER_MIN_USD", "0.02")
        )
        self.margin_cap = Decimal(os.getenv("MARGIN_CAP", "0.12"))

    def calculate_base_cost_per_min(self) -> Decimal:
        """Calculate base cost per minute (model + infra + overhead)"""
        return (
            self.model_cost_per_min
            + self.infra_cost_per_min
            + self.overhead_per_min
        )

    def calculate_price_per_credit(self, ppp_band: str = "HIGH", solidarity: bool = False) -> Decimal:
        """
        Calculate price per credit with PPP and solidarity adjustments
        
        Formula: (BASE_COST_PER_MIN / 2) * (1 + MARGIN_CAP) * PPP_MULTIPLIER * SOLIDARITY_MULTIPLIER
        """
        base_cost = self.calculate_base_cost_per_min()
        
        # Price per credit = (cost per minute / 2) * (1 + margin)
        # Divide by 2 because 1 credit = 30 seconds = 0.5 minutes
        base_price = (base_cost / Decimal("2")) * (Decimal("1") + self.margin_cap)
        
        # Apply PPP adjustment
        ppp_multiplier = self.PPP_MULTIPLIERS.get(
            PPPBand(ppp_band), self.PPP_MULTIPLIERS[PPPBand.HIGH]
        )
        price = base_price * ppp_multiplier
        
        # Apply solidarity discount if opted in
        if solidarity:
            price = price * self.SOLIDARITY_MULTIPLIER
        
        # Round to 4 decimal places for precision
        return price.quantize(Decimal("0.0001"), rounding=ROUND_UP)

    def calculate_pack_price(
        self, credits: int, ppp_band: str = "HIGH", solidarity: bool = False
    ) -> Decimal:
        """Calculate total price for a credit pack"""
        price_per_credit = self.calculate_price_per_credit(ppp_band, solidarity)
        total = price_per_credit * Decimal(str(credits))
        # Round to 2 decimal places for currency
        return total.quantize(Decimal("0.01"), rounding=ROUND_UP)

    def create_pricing_snapshot(
        self, user: User, credits: int
    ) -> Dict:
        """
        Create a pricing snapshot for a purchase
        Stores all pricing details for audit and refund purposes
        """
        return {
            "credits": credits,
            "price_per_credit": float(
                self.calculate_price_per_credit(
                    user.ppp_band, user.solidarity_opt_in
                )
            ),
            "total_price": float(
                self.calculate_pack_price(
                    credits, user.ppp_band, user.solidarity_opt_in
                )
            ),
            "ppp_band": user.ppp_band,
            "solidarity_opt_in": user.solidarity_opt_in,
            "base_cost_per_min": float(self.calculate_base_cost_per_min()),
            "margin_cap": float(self.margin_cap),
            "model_cost": float(self.model_cost_per_min),
            "infra_cost": float(self.infra_cost_per_min),
            "overhead_cost": float(self.overhead_per_min),
        }

    def get_pricing_breakdown(self, user: User) -> Dict:
        """
        Get detailed pricing breakdown for display in UI
        Shows: cost components, margin, PPP adjustment, solidarity discount
        """
        base_cost = self.calculate_base_cost_per_min()
        price_per_credit = self.calculate_price_per_credit(
            user.ppp_band, user.solidarity_opt_in
        )
        
        # Calculate what the price would be without PPP/solidarity
        base_price = (base_cost / Decimal("2")) * (Decimal("1") + self.margin_cap)
        
        ppp_multiplier = self.PPP_MULTIPLIERS.get(
            PPPBand(user.ppp_band), self.PPP_MULTIPLIERS[PPPBand.HIGH]
        )
        
        breakdown = {
            "cost_components": {
                "model_cost_per_min": float(self.model_cost_per_min),
                "infra_cost_per_min": float(self.infra_cost_per_min),
                "overhead_per_min": float(self.overhead_per_min),
                "total_cost_per_min": float(base_cost),
            },
            "pricing": {
                "base_price_per_credit": float(base_price),
                "ppp_adjustment": {
                    "band": user.ppp_band,
                    "multiplier": float(ppp_multiplier),
                    "adjusted_price": float(base_price * ppp_multiplier),
                },
                "solidarity": {
                    "opted_in": user.solidarity_opt_in,
                    "multiplier": float(self.SOLIDARITY_MULTIPLIER) if user.solidarity_opt_in else 1.0,
                    "final_price_per_credit": float(price_per_credit),
                },
                "margin_cap": float(self.margin_cap),
            },
            "credit_packs": {
                pack: {
                    "credits": pack,
                    "price": float(self.calculate_pack_price(pack, user.ppp_band, user.solidarity_opt_in)),
                }
                for pack in self.CREDIT_PACKS
            },
        }
        
        return breakdown


# Singleton instance
_pricing_service: Optional[PricingService] = None


def get_pricing_service() -> PricingService:
    """Get or create pricing service instance"""
    global _pricing_service
    if _pricing_service is None:
        _pricing_service = PricingService()
    return _pricing_service

