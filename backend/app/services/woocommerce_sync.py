import httpx
from base64 import b64encode


class WooCommerceSyncService:
    def __init__(
        self,
        store_url: str,
        consumer_key: str,
        consumer_secret: str,
        supabase_client,
        org_id: str,
    ):
        self.base_url = f"{store_url.rstrip('/')}/wp-json/wc/v3"
        self.auth = b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
        self.headers = {"Authorization": f"Basic {self.auth}"}
        self.supabase = supabase_client
        self.org_id = org_id

    async def sync_products(self) -> dict:
        async with httpx.AsyncClient() as client:
            products = []
            page = 1
            while True:
                resp = await client.get(
                    f"{self.base_url}/products",
                    headers=self.headers,
                    params={"per_page": 100, "page": page},
                )
                resp.raise_for_status()
                batch = resp.json()
                if not batch:
                    break
                products.extend(batch)
                total_pages = int(resp.headers.get("X-WP-TotalPages", 1))
                if page >= total_pages:
                    break
                page += 1

            synced = 0
            for product in products:
                prod_data = {
                    "organization_id": self.org_id,
                    "name": product["name"],
                    "category": (
                        product.get("categories", [{}])[0].get("name", "Other")
                        if product.get("categories")
                        else "Other"
                    ),
                    "handle": product.get("slug"),
                    "image_url": (
                        product.get("images", [{}])[0].get("src")
                        if product.get("images")
                        else None
                    ),
                    "external_id": str(product["id"]),
                }
                result = self.supabase.table("products").upsert(
                    prod_data, on_conflict="organization_id,external_id"
                ).execute()

                if result.data:
                    product_id = result.data[0]["id"]
                    price = float(
                        product.get("regular_price") or product.get("price") or 0
                    )
                    var_data = {
                        "organization_id": self.org_id,
                        "product_id": product_id,
                        "name": "Default",
                        "sku": product.get("sku"),
                        "price": price,
                        "inventory_quantity": product.get("stock_quantity") or 0,
                        "external_id": str(product["id"]),
                        "is_active": product.get("status") == "publish",
                    }
                    self.supabase.table("product_variants").upsert(
                        var_data, on_conflict="organization_id,external_id"
                    ).execute()
                    synced += 1

            return {"products": len(products), "variants": synced}

    async def sync_orders(self, since_days: int = 180) -> dict:
        from datetime import datetime, timedelta

        since = (datetime.utcnow() - timedelta(days=since_days)).isoformat()

        async with httpx.AsyncClient() as client:
            orders = []
            page = 1
            while True:
                resp = await client.get(
                    f"{self.base_url}/orders",
                    headers=self.headers,
                    params={"per_page": 100, "page": page, "after": since},
                )
                resp.raise_for_status()
                batch = resp.json()
                if not batch:
                    break
                orders.extend(batch)
                total_pages = int(resp.headers.get("X-WP-TotalPages", 1))
                if page >= total_pages:
                    break
                page += 1

            synced = 0
            for order in orders:
                order_data = {
                    "organization_id": self.org_id,
                    "order_number": str(order.get("number", "")),
                    "external_id": str(order["id"]),
                    "customer_email": order.get("billing", {}).get("email"),
                    "channel": "woocommerce",
                    "total": float(order.get("total", 0)),
                    "financial_status": order.get("status", "completed"),
                    "order_date": order.get("date_created"),
                }
                result = self.supabase.table("orders").upsert(
                    order_data, on_conflict="organization_id,external_id"
                ).execute()
                if result.data:
                    synced += 1

            return {"orders": len(orders), "synced": synced}
