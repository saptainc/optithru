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

    @staticmethod
    def calculate_dollar_days(
        inventory_qty: int,
        cogs: float,
        avg_days_in_stock: float,
        throughput_per_unit: float,
        units_sold: int,
    ) -> dict:
        """Calculate IDD and TDD for capital trap identification."""
        idd = round(inventory_qty * cogs * avg_days_in_stock)
        tdd = round(units_sold * throughput_per_unit)
        ratio = round(idd / tdd, 1) if tdd > 0 else 999.0
        return {
            "idd": idd,
            "tdd": tdd,
            "idd_tdd_ratio": ratio,
            "is_capital_trap": ratio > 5,
        }

    @staticmethod
    def calculate_pnl(
        throughput: float,
        operating_expense: float,
        investment: float,
    ) -> dict:
        """Calculate Throughput Accounting P&L metrics."""
        net_profit = throughput - operating_expense
        roi = round(net_profit / investment, 4) if investment > 0 else 0.0
        productivity = round(throughput / operating_expense, 4) if operating_expense > 0 else 0.0
        investment_turns = round(throughput / investment, 4) if investment > 0 else 0.0
        return {
            "net_profit": round(net_profit, 2),
            "roi": roi,
            "productivity": productivity,
            "investment_turns": investment_turns,
        }
