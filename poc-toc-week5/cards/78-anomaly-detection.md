# Card #78: Build proactive anomaly detection and alert system for critical TOC metric changes

**Fizzy URL**: https://fizzy.sapta.com/1/cards/78  
**Time Estimate**: 5 hours

---

## Goal
Proactively alert customers when T/CU drops, buffers go red, or throughput falls. Makes Throughput OS mission-critical instead of occasional.

## Step 1: Migration 22
File: `supabase/migrations/22-anomalies.sql`
```sql
CREATE TABLE IF NOT EXISTS public.anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  rule_id text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_anomalies_unresolved ON public.anomalies(organization_id, created_at DESC)
  WHERE resolved_at IS NULL;
```

## Step 2: AnomalyDetector
File: `backend/app/services/anomaly_detector.py`

5 rules:
1. tcu_drop_20pct — severity: warning
2. buffer_red — severity: critical  
3. throughput_down_15pct — severity: warning
4. top_product_ranking_shift — severity: info
5. order_velocity_drop_30pct — severity: warning

```python
class AnomalyDetector:
    async def run_checks(self, org_id: str) -> list[dict]:
        current = await self._get_current_snapshot(org_id)
        previous = await self._get_previous_snapshot(org_id)
        triggered = []

        for product in current.get("products", []):
            prev = next((p for p in previous.get("products", [])
                        if p["id"] == product["id"]), None)
            if prev and product["tcu"] < prev["tcu"] * 0.8:
                triggered.append({
                    "rule_id": "tcu_drop_20pct", "severity": "warning",
                    "message": f"T/CU for {product['name']} dropped {prev['tcu']:.0f} -> {product['tcu']:.0f}",
                    "entity_type": "product", "entity_id": product["id"]
                })

        for buf in current.get("buffers", []):
            if buf.get("zone") == "red":
                triggered.append({
                    "rule_id": "buffer_red", "severity": "critical",
                    "message": f"Buffer critically low for {buf['name']} - stockout risk",
                    "entity_type": "buffer", "entity_id": buf["id"]
                })

        return triggered

    async def store_deduped(self, org_id: str, anomalies: list[dict]) -> list[dict]:
        # Only store if same rule+entity has not fired in last 24h
        stored = []
        for a in anomalies:
            existing = (self.supabase.from_("anomalies")
                .select("id").eq("organization_id", org_id)
                .eq("rule_id", a["rule_id"])
                .gte("created_at", "now() - interval '24 hours'")
                .limit(1).execute())
            if not existing.data:
                r = self.supabase.from_("anomalies").insert(
                    {"organization_id": org_id, **a}).execute()
                stored.append(r.data[0])
        return stored
```

## Step 3: Wire into scheduler
In shopify_scheduler.py, after each sync:
```python
detector = AnomalyDetector(supabase, org_id)
anomalies = await detector.run_checks(org_id)
stored = await detector.store_deduped(org_id, anomalies)
for a in stored:
    if a["severity"] == "critical":
        await email_service.send_anomaly_alert(org_email, a)
```

Also run daily at 7am IST (UTC 01:30).

## Step 4: Notification bell
Dashboard header top-right:
- Bell icon with unread count badge (count of unresolved anomalies)
- Dropdown: last 10 anomalies, color-coded by severity
- "Resolve" button per anomaly -> sets resolved_at = now()

## Step 5: Critical anomaly email
Template: anomaly_alert.html
Subject: "Alert: [rule name]"
CTA button: links to relevant dashboard page (buffers/products).

## Done When
- AnomalyDetector correctly identifies TCU drop, buffer red, throughput decline from test data
- Anomalies stored with 24h deduplication
- Notification bell shows unread count
- Critical anomalies trigger Resend email
- APScheduler runs detector after every sync
