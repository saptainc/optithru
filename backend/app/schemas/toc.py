from pydantic import BaseModel, Field
from typing import Optional


class ThroughputSummary(BaseModel):
    total_throughput: float = 0
    total_inventory_investment: float = 0
    total_operating_expense: float = 0
    net_profit: float = 0
    product_count: int = 0
    order_count: int = 0
    total_units_sold: int = 0
    total_revenue: float = 0


class ProductRanking(BaseModel):
    variant_id: Optional[str] = None
    product_name: str
    category: str = ""
    price: float = 0
    throughput_per_unit: float = 0
    constraint_units_consumed: float = 0
    tcu: float = 0
    priority_rank: int = 0
    total_units_sold: int = 0
    total_throughput: float = 0


class WhatIfRequest(BaseModel):
    base_throughput: float
    base_oe: float
    throughput_delta_pct: float = 0.0
    oe_delta_pct: float = 0.0


class WhatIfResponse(BaseModel):
    projected_throughput: float
    projected_oe: float
    projected_net_profit: float
    throughput_delta: float


class BufferStatus(BaseModel):
    variant_id: Optional[str] = None
    product_name: str
    category: str = ""
    inventory_quantity: int = 0
    avg_daily_usage: float = 0
    lead_time_days: int = 14
    buffer_quantity: int = 0
    green_zone_qty: int = 0
    yellow_zone_qty: int = 0
    red_zone_qty: int = 0
    current_zone: str = "green"


class ChannelTCU(BaseModel):
    channel: str
    total_spend: float = 0
    total_revenue: float = 0
    estimated_throughput: float = 0
    tcu: float = 0
    conversions: int = 0
    cpa: float = 0
    roas: float = 0


class DollarDays(BaseModel):
    variant_id: Optional[str] = None
    product_name: str
    category: str = ""
    inventory_quantity: int = 0
    cogs: float = 0
    throughput_per_unit: float = 0
    avg_days_in_stock: float = 0
    idd: float = 0
    tdd: float = 0
    idd_tdd_ratio: float = 0
    is_capital_trap: bool = False
