import json
from app.config import get_settings


class AIInsightsService:
    def __init__(self, supabase_client, org_id: str):
        self.supabase = supabase_client
        self.org_id = org_id
        self.settings = get_settings()

    async def _build_context(self) -> dict:
        """Gather current TOC data for the org."""
        # KPIs
        kpis = self.supabase.rpc("fn_system_kpis", {"p_org_id": self.org_id}).execute()
        # Top products
        products = self.supabase.from_("v_product_throughput").select(
            "product_name, price, cogs, throughput_per_unit, throughput_margin_pct, inventory_quantity"
        ).eq("organization_id", self.org_id).order("throughput_per_unit", desc=True).limit(10).execute()
        # Bottom products
        bottom = self.supabase.from_("v_product_throughput").select(
            "product_name, throughput_per_unit, inventory_quantity, cogs"
        ).eq("organization_id", self.org_id).order("throughput_per_unit", desc=False).limit(5).execute()
        # Marketing channels
        channels = self.supabase.table("marketing_spend").select(
            "channel, spend, revenue_attributed"
        ).eq("organization_id", self.org_id).execute()

        return {
            "kpis": kpis.data[0] if kpis.data else {},
            "top_products": products.data or [],
            "bottom_products": bottom.data or [],
            "marketing_channels": channels.data or [],
        }

    async def generate_weekly_insights(self) -> dict:
        """Generate 3 prioritized TOC recommendations using Claude."""
        if not self.settings.ANTHROPIC_API_KEY or self.settings.ANTHROPIC_API_KEY.startswith("sk-ant-placeholder"):
            # Return mock insights for development
            return {"recommendations": [
                {
                    "action": "Shift 30% of Meta Ads budget to Email marketing",
                    "impact_inr": 45000,
                    "reasoning": "Email T/CU is 16.8x vs Meta's 0.79x — reallocating budget maximizes throughput per constraint unit",
                },
                {
                    "action": "Discontinue bottom 5 SKUs with IDD/TDD > 50",
                    "impact_inr": 32000,
                    "reasoning": "These products tie up capital with minimal throughput — freed capital can be redeployed to high-T/CU products",
                },
                {
                    "action": "Negotiate 10% COGS reduction on Kumkumadi Oil",
                    "impact_inr": 18000,
                    "reasoning": "As the highest-volume product, even small TVC reductions create significant throughput gains",
                },
            ]}

        import anthropic
        context = await self._build_context()
        client = anthropic.Anthropic(api_key=self.settings.ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"""You are a Theory of Constraints advisor for an Indian DTC beauty brand.

Here is their current Throughput OS data:
{json.dumps(context, indent=2, default=str)}

Provide exactly 3 prioritized recommendations. For each:
1. A clear, specific action (not a vague suggestion)
2. The estimated monthly throughput impact in INR
3. Why TOC theory supports this action

Return ONLY valid JSON: {{"recommendations": [{{"action": "...", "impact_inr": N, "reasoning": "..."}}]}}"""
            }]
        )
        try:
            return json.loads(message.content[0].text)
        except (json.JSONDecodeError, IndexError):
            return {"recommendations": [], "error": "Failed to parse AI response"}

    async def generate_product_insight(self, variant_id: str) -> str:
        """Generate AI narrative for a specific product."""
        product = self.supabase.from_("v_product_throughput").select("*").eq("variant_id", variant_id).single().execute()
        if not product.data:
            return "Product not found."

        if not self.settings.ANTHROPIC_API_KEY or self.settings.ANTHROPIC_API_KEY.startswith("sk-ant-placeholder"):
            p = product.data
            return f"{p.get('product_name', 'This product')} has a throughput margin of {p.get('throughput_margin_pct', 0):.1f}%. Consider optimizing COGS to improve T/CU ranking."

        import anthropic
        client = anthropic.Anthropic(api_key=self.settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": f"Analyze this product from a TOC perspective and give 2 actionable recommendations:\n{json.dumps(product.data, default=str)}"
            }]
        )
        return message.content[0].text

    async def ask_question(self, question: str) -> str:
        """Answer a free-form question about the org's TOC data."""
        context = await self._build_context()
        if not self.settings.ANTHROPIC_API_KEY or self.settings.ANTHROPIC_API_KEY.startswith("sk-ant-placeholder"):
            return f"Based on your data, here's a brief analysis related to '{question}': Focus on maximizing T/CU by prioritizing high-throughput products and shifting marketing spend to channels with the highest T/CU ratio."

        import anthropic
        client = anthropic.Anthropic(api_key=self.settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": f"You are a TOC advisor. Here is the business data:\n{json.dumps(context, indent=2, default=str)}\n\nQuestion: {question}\n\nAnswer concisely using TOC principles."
            }]
        )
        return message.content[0].text
