# Card #80: Performance hardening: connection pooling, query optimization, Redis caching, and load testing

**Fizzy URL**: https://fizzy.sapta.com/1/cards/80  
**Time Estimate**: 5 hours

---

## Goal
Handle 10 concurrent orgs without degradation. p95 < 500ms at 50 concurrent users. Redis caching for expensive computations.

## Step 1: Verify Supavisor pooler
In config.py, confirm you use the pooler URL (port 6543, not 5432):
```
postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

## Step 2: Add critical indexes
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_line_items_product_variant_id
  ON public.order_line_items(product_variant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_organization_id_created_at
  ON public.orders(organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_organization_id
  ON public.product_variants(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_toc_snapshots_org_captured
  ON public.toc_snapshots(organization_id, captured_at DESC);
```

Profile first: EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM fn_product_throughput_summary('YOUR_ORG_ID');

## Step 3: Redis caching
Deploy Redis on Railway (free tier). Add REDIS_URL to env vars.
```bash
cd ~/throughput-os/backend && uv add "redis[asyncio]"
```

File: `backend/app/core/cache.py`
```python
from redis.asyncio import Redis
import json

redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

async def get_cached(key: str):
    val = await redis_client.get(key)
    return json.loads(val) if val else None

async def set_cached(key: str, value, ttl: int = 300):
    await redis_client.setex(key, ttl, json.dumps(value))

async def invalidate_org(org_id: str):
    keys = await redis_client.keys(f"throughput:*:{org_id}*")
    if keys:
        await redis_client.delete(*keys)
```

Cache keys (TTL 5 min):
- throughput:kpis:{org_id}
- throughput:rankings:{org_id}:{constraint_id}
- throughput:channel_tcu:{org_id}

Call invalidate_org(org_id) after every sync.

## Step 4: Locust load test
```bash
cd ~/throughput-os/backend && uv add locust
```

File: `tests/load_test.py`
```python
from locust import HttpUser, task, between

class DashboardUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def get_kpis(self):
        self.client.get("/api/v1/kpis",
                        headers={"Authorization": "Bearer TEST_TOKEN"})

    @task(2)
    def get_rankings(self):
        self.client.get("/api/v1/rankings?constraint_type=budget",
                        headers={"Authorization": "Bearer TEST_TOKEN"})

    @task(1)
    def get_products(self):
        self.client.get("/api/v1/products",
                        headers={"Authorization": "Bearer TEST_TOKEN"})
```

Run:
```bash
locust -f tests/load_test.py --headless -u 50 -r 5 --run-time 60s        --host https://api.throughput.ai
```
Target: p95 < 500ms, error rate = 0% at 50 users.

## Step 5: Backup verification + horizontal scaling docs
- Confirm Supabase Pro plan backups active
- Document restore procedure in README.md
- Confirm FastAPI is stateless (no global in-memory state except Redis)
- Confirm APScheduler jobs are idempotent

## Done When
- No connection errors under 50 concurrent users
- Slowest RPCs have indexes, run < 100ms (EXPLAIN verified)
- Redis deployed, cache hit rate > 70% in production
- Locust: p95 < 500ms at 50 users, 0% errors
- Restore procedure documented
