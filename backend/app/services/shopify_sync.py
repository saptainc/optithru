import httpx
from typing import Optional


class ShopifySyncService:
    """Sync products and orders from Shopify Admin API."""

    def __init__(self, shop_domain: str, access_token: str, supabase_client, org_id: str):
        self.base_url = f"https://{shop_domain}/admin/api/2024-01"
        self.headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
        }
        self.supabase = supabase_client
        self.org_id = org_id

    async def sync_products(self) -> dict:
        """Fetch products from Shopify and upsert into Supabase."""
        async with httpx.AsyncClient() as client:
            products = []
            url = f"{self.base_url}/products.json?limit=250"

            while url:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                products.extend(data.get("products", []))

                # Pagination via Link header
                link = response.headers.get("Link", "")
                url = None
                if 'rel="next"' in link:
                    for part in link.split(","):
                        if 'rel="next"' in part:
                            url = part.split("<")[1].split(">")[0]

            synced = 0
            for product in products:
                # Upsert product
                prod_data = {
                    "organization_id": self.org_id,
                    "name": product["title"],
                    "category": product.get("product_type", "Other") or "Other",
                    "handle": product.get("handle"),
                    "image_url": product.get("image", {}).get("src") if product.get("image") else None,
                    "external_id": str(product["id"]),
                }

                result = self.supabase.table("products").upsert(
                    prod_data,
                    on_conflict="organization_id,external_id"
                ).execute()

                if result.data:
                    product_id = result.data[0]["id"]

                    for variant in product.get("variants", []):
                        var_data = {
                            "organization_id": self.org_id,
                            "product_id": product_id,
                            "name": variant.get("title", "Default"),
                            "sku": variant.get("sku"),
                            "price": float(variant.get("price", 0)),
                            "inventory_quantity": variant.get("inventory_quantity", 0),
                            "external_id": str(variant["id"]),
                            "is_active": True,
                        }

                        self.supabase.table("product_variants").upsert(
                            var_data,
                            on_conflict="organization_id,external_id"
                        ).execute()
                        synced += 1

            return {"products": len(products), "variants": synced}

    async def sync_orders(self, since_date: Optional[str] = None) -> dict:
        """Fetch orders from Shopify and upsert into Supabase."""
        async with httpx.AsyncClient() as client:
            orders = []
            url = f"{self.base_url}/orders.json?limit=250&status=any"
            if since_date:
                url += f"&created_at_min={since_date}"

            while url:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                orders.extend(data.get("orders", []))

                link = response.headers.get("Link", "")
                url = None
                if 'rel="next"' in link:
                    for part in link.split(","):
                        if 'rel="next"' in part:
                            url = part.split("<")[1].split(">")[0]

            synced = 0
            for order in orders:
                order_data = {
                    "organization_id": self.org_id,
                    "order_number": str(order.get("order_number", "")),
                    "external_id": str(order["id"]),
                    "customer_email": order.get("email"),
                    "channel": order.get("source_name", "web"),
                    "total": float(order.get("total_price", 0)),
                    "financial_status": order.get("financial_status", "paid"),
                    "order_date": order.get("created_at"),
                }

                result = self.supabase.table("orders").upsert(
                    order_data,
                    on_conflict="organization_id,external_id"
                ).execute()

                if result.data:
                    synced += 1

            return {"orders": len(orders), "synced": synced}
