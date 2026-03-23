# Card #72: Build Claude-powered AI Insights engine with weekly recommendations and product analysis

**Fizzy URL**: https://fizzy.sapta.com/1/cards/72  
**Time Estimate**: 6 hours

---

## Goal
Build a Claude-powered AI Insights engine. No other analytics tool explains what to DO — they just show numbers. This is the key differentiator.

## Step 1: Add Anthropic SDK
```bash
cd ~/throughput-os/backend && uv add anthropic
```
Add ANTHROPIC_API_KEY to .env and config.py.

## Step 2: Build AIInsightsService
File: `backend/app/services/ai_insights.py`

```python
import anthropic, json
from app.core.config import settings

class AIInsightsService:
    def __init__(self, supabase, org_id: str):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.supabase = supabase
        self.org_id = org_id

    async def _build_context(self) -> dict:
        kpis = self.supabase.rpc("fn_system_kpis", {"p_org_id": self.org_id}).execute().data
        products = self.supabase.rpc("fn_product_throughput_summary",
                                     {"p_org_id": self.org_id}).execute().data[:20]
        return {"kpis": kpis, "products": products}

    async def generate_weekly_insights(self) -> dict:
        context = await self._build_context()
        message = self.client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            messages=[{"role": "user", "content":
                f"You are a TOC advisor for an Indian DTC brand.\n"
                f"Data: {json.dumps(context)}\n"
                f"Provide 3 prioritized recommendations. Each: action, impact_inr, reasoning.\n"
                f'Respond ONLY with JSON: {{"recommendations": [{{"action":"...","impact_inr":N,"reasoning":"..."}}]}}'
            }]
        )
        return json.loads(message.content[0].text)
```

## Step 3: API Endpoints
File: `backend/app/routers/ai_insights.py`

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/insights/weekly | Generate/cache weekly recommendations |
| GET | /api/v1/insights/product/{id} | AI narrative for a specific product |
| POST | /api/v1/insights/ask | Free-form TOC question |

## Step 4: Migration 18
File: `supabase/migrations/18-ai-insights.sql`
```sql
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  type text NOT NULL,
  content jsonb NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
```

## Step 5: AI Insights panel on /dashboard
Below the 4 KPI cards, add:
- 3 recommendation cards with action + impact badge (e.g. "+₹42,000/mo")
- "Refresh Insights" button (triggers re-generation, costs API tokens)
- "Ask a Question" text input -> POST /insights/ask
- "Last generated: X min ago" timestamp

## Step 6: Weekly digest extension
Add the top 1 AI recommendation as the headline of the Monday APScheduler Resend email.

## Done When
- GET /api/v1/insights/weekly returns 3 valid Claude recommendations for Shankara data
- AI Insights panel renders on /dashboard with real data
- POST /insights/ask answers "Which products should I discontinue?"
- Weekly digest email includes top recommendation
- uv run pytest -v passes
