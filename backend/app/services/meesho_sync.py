import csv
import io
from datetime import datetime, timezone


class MeeshoCSVParser:
    """Parse Meesho Seller Hub order report CSV."""

    def __init__(self, supabase_client, org_id: str):
        self.supabase = supabase_client
        self.org_id = org_id

    async def parse_and_import(self, csv_content: str) -> dict:
        reader = csv.DictReader(io.StringIO(csv_content))
        orders_synced = 0

        for row in reader:
            order_data = {
                "organization_id": self.org_id,
                "order_number": row.get("order_id", row.get("Order ID", "")),
                "external_id": f"meesho_{row.get('order_id', row.get('Order ID', ''))}",
                "customer_email": None,
                "channel": "meesho",
                "source": "meesho",
                "total": float(row.get("selling_price", row.get("Selling Price", 0)) or 0),
                "financial_status": "paid",
                "order_date": datetime.now(timezone.utc).isoformat(),
            }

            self.supabase.table("orders").upsert(
                order_data, on_conflict="organization_id,external_id"
            ).execute()
            orders_synced += 1

        return {"orders": orders_synced}
