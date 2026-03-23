from fastapi import APIRouter, Depends, Query
from app.services.toc_engine import TOCEngine
from app.schemas.toc import (
    ThroughputSummary,
    ProductRanking,
    WhatIfRequest,
    WhatIfResponse,
    BufferStatus,
    ChannelTCU,
    DollarDays,
)

router = APIRouter()
engine = TOCEngine()


@router.get("/throughput-summary", response_model=ThroughputSummary)
async def get_throughput_summary():
    """Get system-wide throughput accounting KPIs."""
    return ThroughputSummary(
        total_throughput=0,
        total_inventory_investment=0,
        total_operating_expense=0,
        net_profit=0,
        product_count=0,
        order_count=0,
    )


@router.get("/product-rankings", response_model=list[ProductRanking])
async def get_product_rankings(
    constraint_type: str = Query(default="marketing_budget"),
):
    """Get products ranked by T/CU for a given constraint type."""
    return []


@router.post("/what-if", response_model=WhatIfResponse)
async def run_what_if(params: WhatIfRequest):
    """Run a what-if simulation with T and OE deltas."""
    result = engine.run_what_if(
        base_throughput=params.base_throughput,
        base_oe=params.base_oe,
        throughput_delta_pct=params.throughput_delta_pct,
        oe_delta_pct=params.oe_delta_pct,
    )
    return WhatIfResponse(**result)


@router.get("/buffer-status", response_model=list[BufferStatus])
async def get_buffer_status():
    """Get buffer status for all product variants."""
    return []


@router.get("/channel-tcu", response_model=list[ChannelTCU])
async def get_channel_tcu():
    """Get marketing channel T/CU analysis."""
    return []


@router.get("/dollar-days", response_model=list[DollarDays])
async def get_dollar_days(
    period_days: int = Query(default=90, ge=1, le=365),
):
    """Get IDD/TDD capital trap analysis."""
    return []


@router.get("/pnl")
async def get_pnl():
    """Get Throughput Accounting P&L metrics."""
    return {
        "throughput": 0,
        "operating_expense": 0,
        "investment": 0,
        "net_profit": 0,
        "roi": 0,
        "productivity": 0,
        "investment_turns": 0,
    }
