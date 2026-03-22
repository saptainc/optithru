from typing import Optional

class TOCEngine:
    """Core Theory of Constraints calculation engine."""

    @staticmethod
    def calculate_throughput(
        price: float,
        cogs: float,
        shipping: float,
        processing_pct: float = 0.029,
        processing_fixed: float = 0.30,
    ) -> float:
        """T = Price - TVC (COGS + shipping + payment processing)"""
        processing_cost = price * processing_pct + processing_fixed
        tvc = cogs + shipping + processing_cost
        return round(price - tvc, 2)

    @staticmethod
    def rank_by_tcu(
        products: list[dict],
        constraint_capacity: float,
    ) -> list[dict]:
        """Rank products by Throughput per Constraint Unit (T/CU).
        
        Each product dict must have:
          - name: str
          - throughput: float (T per unit)
          - constraint_units: float (resource consumed per unit)
        """
        for p in products:
            if p["constraint_units"] > 0:
                p["tcu"] = round(p["throughput"] / p["constraint_units"], 2)
            else:
                p["tcu"] = float("inf")
        
        ranked = sorted(products, key=lambda x: x["tcu"], reverse=True)
        for i, p in enumerate(ranked):
            p["priority_rank"] = i + 1
        return ranked

    @staticmethod
    def calculate_buffer(
        avg_daily_usage: float,
        lead_time_days: int,
        variability_factor: float = 1.5,
    ) -> dict:
        """Calculate TOC buffer with Green/Yellow/Red zones."""
        buffer_qty = round(avg_daily_usage * lead_time_days * variability_factor)
        zone_size = buffer_qty // 3
        return {
            "buffer_quantity": buffer_qty,
            "red_zone_qty": zone_size,
            "yellow_zone_qty": zone_size,
            "green_zone_qty": buffer_qty - (2 * zone_size),
        }

    @staticmethod
    def calculate_channel_tcu(
        channel_spend: float,
        channel_throughput: float,
    ) -> float:
        """T/CU for marketing channels: throughput per dollar of spend."""
        if channel_spend <= 0:
            return 0.0
        return round(channel_throughput / channel_spend, 2)

    @staticmethod
    def run_what_if(
        base_throughput: float,
        base_oe: float,
        throughput_delta_pct: float = 0.0,
        oe_delta_pct: float = 0.0,
    ) -> dict:
        """Simple what-if: apply % changes to T and OE."""
        new_t = base_throughput * (1 + throughput_delta_pct / 100)
        new_oe = base_oe * (1 + oe_delta_pct / 100)
        return {
            "projected_throughput": round(new_t, 2),
            "projected_oe": round(new_oe, 2),
            "projected_net_profit": round(new_t - new_oe, 2),
            "throughput_delta": round(new_t - base_throughput, 2),
        }
