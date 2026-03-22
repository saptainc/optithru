from fastapi import APIRouter

router = APIRouter()


@router.get("/throughput-summary")
async def get_throughput_summary():
    """Placeholder — will be wired to Supabase RPC in Week 2."""
    return {
        "total_throughput": 0,
        "total_inventory_investment": 0,
        "total_operating_expense": 0,
        "net_profit": 0,
        "product_count": 0,
        "order_count": 0,
    }


@router.get("/product-rankings")
async def get_product_rankings(constraint_type: str = "marketing_budget"):
    """Placeholder — will be wired to Supabase RPC in Week 2."""
    return []


@router.post("/what-if")
async def run_what_if(params: dict):
    """Placeholder — will be implemented in Week 2."""
    return {"message": "What-if simulation not yet implemented"}


@router.get("/buffer-status")
async def get_buffer_status():
    """Placeholder — will be wired to Supabase RPC in Week 2."""
    return []
