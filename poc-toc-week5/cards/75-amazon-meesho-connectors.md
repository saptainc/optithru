# Card #75: Build Amazon India and Meesho connectors for cross-marketplace TOC analysis

**Fizzy URL**: https://fizzy.sapta.com/1/cards/75  
**Time Estimate**: 6 hours

---

## Goal
Add Amazon India (SP-API) and Meesho (CSV) as data sources. Most Indian DTC brands sell on 3+ channels. Throughput OS becomes the single TOC source of truth across all of them.

## Step 1: DB source tracking
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'shopify';
ALTER TABLE public.order_line_items ADD COLUMN IF NOT EXISTS source text DEFAULT 'shopify';

CREATE TABLE IF NOT EXISTS public.variable_cost_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  source text NOT NULL,
  adjustment_type text NOT NULL,  -- referral_fee | fba_fee | platform_commission
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Step 2: Amazon SP-API connector
File: `backend/app/services/amazon_sync.py`

Amazon.in marketplace ID = A21TJRUUN4KGV
Auth: LWA (Login With Amazon) OAuth

```python
class AmazonSyncService:
    MARKETPLACE_IN = "A21TJRUUN4KGV"

    async def sync_catalog(self):
        # GET /catalog/2022-04-01/items?marketplaceIds=A21TJRUUN4KGV
        # Map: asin -> external_id, item_name -> name, source="amazon"

    async def sync_orders(self, since_days: int = 180):
        # GET /orders/v0/orders?MarketplaceIds=...&CreatedAfter=...
        # Map OrderItems -> order_line_items with source="amazon"

    async def sync_fees(self):
        # GET /finances/v0/financialEvents
        # Extract FBAServiceFee + ReferralFee per order
        # Insert into variable_cost_adjustments (these reduce T)
```

Key nuance: Amazon T = selling_price - referral_fee(5-15%) - FBA_fee.
Always use settlement amount not listed price.

## Step 3: Meesho CSV import
Meesho has no public API. Parse their Order Report CSV.

Expected columns: order_id, product_name, quantity, selling_price, settlement_amount, order_date
settlement_amount = net after commission (~15-25%) -- use directly as T per order line.

File: `backend/app/services/meesho_sync.py`
Endpoint: POST /api/v1/meesho/import (multipart CSV upload)

## Step 4: Update fn_channel_tcu RPC
```sql
-- Add marketplace breakdown by o.source
SELECT
  o.source as channel,
  SUM(tcu_calc) as total_throughput,
  COUNT(DISTINCT product_id) as products
FROM orders o
JOIN order_line_items oli ON oli.order_id = o.id
GROUP BY o.source
```

Channels dashboard now shows T/CU breakdown: Shopify / Amazon / Meesho / WooCommerce.

## Step 5: Amazon Settings UI
Add "Amazon" tab in Settings -> Connections:
- Fields: Seller ID, LWA Client ID, LWA Client Secret
- Link to: https://developer.amazonservices.in/
- "Sync Now" button -> POST /api/v1/amazon/sync
- "Import Meesho CSV" file upload -> POST /api/v1/meesho/import

## Done When
- AmazonSyncService syncs products and orders from Amazon.in sandbox/real data
- Amazon fees reduce T correctly via variable_cost_adjustments
- Meesho CSV upload imports orders with correct T values
- Channels dashboard shows T/CU per marketplace
- uv run pytest -v passes including Amazon + Meesho tests
