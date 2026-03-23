# Throughput OS — Week 3: Simulation Engine, Product Details, Shopify Sync & Demo Prep

## What this project is
Beauty e-commerce profitability platform applying Theory of Constraints / Throughput Accounting.
Target customer: Shankara Naturals (premium Ayurvedic skincare, ~$3M revenue, 48+ SKUs on Shopify).
100% of Shankara's net profits go to humanitarian causes — every throughput improvement increases humanitarian impact.

## What was built in Weeks 1–2 (already working)
- Next.js 16.2 frontend with App Router, TypeScript, Tailwind, shadcn/ui, Recharts
- FastAPI Python backend with TOC calculation engine (7+ passing tests)
- Remote Supabase at https://supabase.1in3in5.org (PostgreSQL + Auth + RLS)
- Login/signup auth flow (client-side Supabase auth, not server actions)
- Dashboard with 4 KPI cards + throughput bar chart + recent orders
- Products page with real Shankara catalog (89 Shopify imports), editable COGS, Capital Traps tab
- T/CU Rankings page with constraint-aware product ranking + scatter chart
- Marketing Channels page with T/CU per channel + budget reallocation card
- Buffer Management with Green/Yellow/Red zone status board
- Constraint Management UI (add/activate/delete constraints)
- Traditional vs. TOC split comparison view with rank inversions highlighted
- Throughput Accounting P&L with waterfall chart + key ratios (ROI, Productivity, Investment Turns)
- CSV import wizard (4 entity types: products, variants, orders, marketing spend)
- FastAPI backend with 5 RPC-proxying endpoints + TOC engine methods + 7 tests
- PostgreSQL RPC functions: fn_system_kpis, fn_product_throughput_summary, fn_tcu_rankings, fn_channel_tcu, fn_calculate_buffers, fn_dollar_days
- start-dev.sh launching both frontend + backend

## Tech Stack
- **Frontend:** Next.js 16.2 (App Router, Turbopack), TypeScript strict, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Python 3.12, FastAPI, Pydantic v2, uv package manager
- **Database:** Remote Supabase (PostgreSQL 15) at https://supabase.1in3in5.org
- **Auth:** Supabase GoTrue (email auth, client-side — NOT server actions)

## Project Structure
```
~/throughput-os/
├── frontend/                    # Next.js 16.2 app
│   ├── next.config.js           # MUST be .js (NOT .ts) — has allowedDevOrigins + rewrites
│   ├── src/
│   │   ├── app/dashboard/       # All dashboard routes (NOT in route group)
│   │   │   ├── page.tsx         # Dashboard with KPIs
│   │   │   ├── products/        # Product list + [variantId] detail
│   │   │   ├── rankings/        # T/CU rankings
│   │   │   ├── channels/        # Marketing channel analysis
│   │   │   ├── buffers/         # Buffer status board
│   │   │   ├── constraints/     # Constraint management
│   │   │   ├── compare/         # Traditional vs. TOC comparison
│   │   │   ├── financials/      # Throughput P&L + waterfall
│   │   │   ├── simulate/        # What-If Simulator (Week 3)
│   │   │   ├── demo/            # Demo scenarios page (Week 3)
│   │   │   ├── import/          # CSV import wizard
│   │   │   └── settings/        # Shopify connection + theme toggle
│   │   ├── components/          # React components by feature
│   │   ├── lib/                 # Supabase clients, format utils, API client
│   │   └── middleware.ts        # Auth middleware (allows /api/* routes through)
│   └── package.json
├── backend/                     # FastAPI microservice
│   ├── app/
│   │   ├── main.py              # FastAPI app with CORS
│   │   ├── config.py            # pydantic-settings
│   │   ├── routers/             # health.py, calculations.py, shopify.py, reports.py
│   │   ├── services/            # toc_engine.py, shopify_sync.py
│   │   └── schemas/             # toc.py (Pydantic models)
│   ├── tests/
│   └── pyproject.toml
├── supabase/migrations/         # SQL files (applied via Studio SQL Editor)
├── start-dev.sh                 # Starts both frontend + backend
└── CLAUDE.md                    # This file
```

## Critical Environment Details

### Remote Supabase credentials
```
SUPABASE_URL=https://supabase.1in3in5.org
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcyNTg4NDE2LCJleHAiOjE5MzAyNjg0MTZ9.ZsLiM3YMzD-MRMAqYiNRMm-PYmTiH97DrrTFMES2cMA
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzI1ODg0MTYsImV4cCI6MTkzMDI2ODQxNn0.HFtj81BFTFmn5LKgv0zQcG3PtNPySINLznRxFhA4zbc
```

### Organization and user
```
Org ID: a0000000-0000-0000-0000-000000000001 (Shankara Naturals)
User: hari@1in3in5.org / password123
User ID: ea6dc8ee-51e4-4fa8-98d0-a542f4d7803e
```

### Network access
- Server IP: 10.1.34.200
- Frontend: http://10.1.34.200:3000
- FastAPI: http://localhost:8080
- Supabase Studio: https://supabase.1in3in5.org

### Commands
```bash
# Frontend (from ~/throughput-os/frontend/)
npm run dev                    # Dev server on port 3000
npx next build                 # Production build check

# Backend (from ~/throughput-os/backend/)
uv run fastapi dev app/main.py --port 8080   # Dev server
uv run pytest -v                              # Run tests

# Both (from ~/throughput-os/)
./start-dev.sh                 # Start both services
```

## CRITICAL: Lessons from Weeks 1–2 (DO NOT REPEAT)

### 1. next.config.js MUST be .js, not .ts
Next.js 16.2 requires `next.config.js` with `module.exports`. Never create next.config.ts.

### 2. allowedDevOrigins needs ALL hostname variations
```js
allowedDevOrigins: ['http://10.1.34.200:3000','http://10.1.34.200','10.1.34.200','http://localhost:3000','http://localhost'],
```

### 3. Dashboard routes at /dashboard/, NOT in a route group
Directory is `src/app/dashboard/` — NOT `src/app/(dashboard)/`.

### 4. Auth uses client-side Supabase, NOT server actions
All auth forms use `createClient()` from `lib/supabase/client`.

### 5. Middleware must allow /api/* routes through
Without this, the Next.js proxy to FastAPI gets redirected to /login.

### 6. useEffect + parent callback = infinite loop
Use `useRef(hasRun)` guard. Never put parent callbacks in useEffect deps.

### 7. Clean .next cache after config changes
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run dev
```

### 8. React keys must use variant_id, not product_name
Product names can duplicate (seed + Shopify imports). Always use UUID for keys.

### 9. FastAPI health endpoint needs dual routes
`@router.get("/healthz")` and `@router.get("/api/v1/healthz")`.

### 10. No root package.json in ~/throughput-os/

## Week 3: What to Build (Cards 46–57)

Execute these cards IN ORDER. This is the **MVP gate** — end of Week 3 produces a demo-ready product.

### Card 46: Fix Week 2 issues and verify all pages
Smoke test all Week 2 features. Fix TypeScript errors, missing components, RPC mismatches. 13-point checklist. (2h)

### Card 47: TOC metric snapshots for trend tracking
1. Apply `supabase/migrations/12-toc-snapshots.sql` — creates fn_capture_snapshot() and fn_snapshot_history()
2. Create `src/components/dashboard/throughput-trend-chart.tsx` — AreaChart with T and NP trend lines
3. Add "Capture Snapshot" button to dashboard + trend chart below KPI cards
4. Seed 30 days of backdated snapshots for demo
Done when: Dashboard shows 30-day trend chart, snapshot button works. (3h)

### Card 48: Interactive What-If Simulator (THE DEMO CENTERPIECE)
1. Apply `supabase/migrations/13-what-if.sql` — creates fn_what_if_price_change()
2. Replace simulate/page.tsx with server component fetching baseline KPIs + products
3. Create `src/components/simulate/what-if-simulator.tsx` — 4 scenario tabs:
   - Price Change (slider -30% to +30%)
   - Budget Reallocation (shift X% between channels)
   - SKU Discontinuation (multi-select, show freed capital vs. throughput loss)
   - Constraint Change (adjust capacity ±50%)
4. Create `src/components/simulate/scenario-panel.tsx` — reusable before/after display with large ΔT
5. Each scenario: local state for client-side math, "Save Scenario" button inserts to simulations table
Done when: All 4 tabs work with real-time projections, save works. (6h)

### Card 49: Per-product detail page
1. Create `src/app/dashboard/products/[variantId]/page.tsx` — dynamic route
2. Create `src/components/products/product-detail.tsx` — 6 sections: header, throughput waterfall, sales velocity, buffer status, capital efficiency, auto-generated recommendations
3. Make product names clickable (Link) in product-table, tcu-rankings-table, capital-trap-table
Done when: Click product → detail page with breakdown + recommendations. (4h)

### Card 50: Shopify Admin API live sync
1. Create `backend/app/services/shopify_sync.py` — ShopifySyncService with sync_products() and sync_orders()
2. Create `backend/app/routers/shopify.py` — POST /api/v1/shopify/sync endpoint
3. Apply unique indexes for upsert: idx_orders_external, idx_variants_external
4. Create `src/components/settings/shopify-connect.tsx` — connection card with domain/token fields + "Sync Now" button
5. Replace settings/page.tsx with real settings page
6. Register shopify router in main.py, add httpx to dependencies
Done when: Settings page → Sync Now → products/orders appear in dashboard. (5h)

### Card 51: Product mix optimizer
1. Apply `supabase/migrations/14-product-mix-optimizer.sql` — creates fn_optimal_product_mix()
2. Create `src/components/simulate/product-mix-optimizer.tsx` — current vs. recommended pie charts + detail table
3. Add as 5th tab on What-If Simulator
Done when: Product Mix tab shows two pie charts + throughput improvement summary. (4h)

### Card 52: Subscription impact calculator
1. Create `src/components/simulate/subscription-calculator.tsx` — 4 sliders (conversion rate, discount, duration, interval), client-side LTV calculations, bar chart + cumulative throughput curve, top 5 subscription candidates
2. Add as 6th tab on What-If Simulator
Done when: Subscription tab shows 8.7× LTV multiplier insight. (3h)

### Card 53: Shankara brand theming
1. Add Shankara earth-tone CSS variables in globals.css under [data-theme="shankara"]
2. Add Shankara logo to sidebar + branded login page
3. Add theme toggle in Settings (Default vs. Shankara)
Done when: Warm browns/golds/cream applied, logo visible, login branded. (3h)

### Card 54: Pre-build 5 "aha moment" demo scenarios
1. Create `src/app/dashboard/demo/page.tsx` — lists 5 scenarios as cards with "Run Scenario" buttons
2. Insert 5 pre-built simulations into simulations table
3. Add "Demo" to sidebar nav
5 scenarios: Hero product isn't most profitable, Bottom 10 SKUs destroy capital, Email 12-40× better than Meta, 10% subscription transforms economics, Shorter lead time frees 35% buffer cash.
Done when: Demo page links to pre-loaded scenarios. (4h)

### Card 55: PDF export for Throughput Analysis Report
1. Add reportlab to backend deps: `uv add reportlab`
2. Create `backend/app/routers/reports.py` — GET /api/v1/reports/throughput-analysis returns PDF
3. Add "Export Report" button to dashboard header
Report sections: Cover page, Executive summary, T/CU rankings, Channel analysis, Recommendations.
Done when: Button downloads valid multi-page PDF. (4h)

### Card 56: Mobile responsiveness, loading skeletons, error states
1. Create loading.tsx for every dashboard route (skeleton UI)
2. Create error.tsx for every dashboard route (friendly error + retry)
3. Mobile audit at 375px: overflow-x-auto on tables, responsive grids, touch targets
4. Empty states for pages with no data
5. Visual consistency pass
Done when: All pages mobile-friendly, loading/error states present. (4h)

### Card 57: Week 3 E2E verification + demo recording + git commit
24-point checklist. Git commit. Record 3-minute demo video.
THIS IS THE MVP GATE. (3h)

## Sidebar Navigation (final state after Week 3)
```
Dashboard        → /dashboard           (LayoutDashboard)
Products         → /dashboard/products  (Package)
T/CU Rankings    → /dashboard/rankings  (TrendingUp)
Orders           → /dashboard/orders    (ShoppingCart)
Channels         → /dashboard/channels  (Megaphone)
Buffers          → /dashboard/buffers   (BarChart3)
Constraints      → /dashboard/constraints (Target)
Compare          → /dashboard/compare   (ArrowLeftRight)
Financials       → /dashboard/financials (DollarSign)
Simulate         → /dashboard/simulate  (FlaskConical)
Demo             → /dashboard/demo      (Presentation)      ← NEW
Import           → /dashboard/import    (Upload)
Settings         → /dashboard/settings  (Settings)
```

## SQL Migrations to Apply (via Supabase Studio SQL Editor)
Files in ~/throughput-os/supabase/migrations/ — paste each into Studio and run:
1. 12-toc-snapshots.sql (card 47)
2. 13-what-if.sql (card 48)
3. 14-product-mix-optimizer.sql (card 51)
4. Unique indexes for Shopify upsert (card 50 — inline in card description)
5. Snapshot seed data (card 47 — inline in card description)

## TOC Formulas Reference
- **Throughput (T)** = Revenue − TVC (COGS + shipping + payment processing)
- **T/CU** = Throughput per unit ÷ Constraint units consumed
- **Net Profit** = T − OE
- **ROI** = (T − OE) / I
- **Productivity** = T / OE (breakeven at 1.0)
- **Investment Turns** = T / I
- **IDD** = inventory_qty × COGS × avg_days_in_stock
- **TDD** = throughput_per_unit × units_sold
- **Buffer** = ADU × Lead Time × Variability Factor (1.5)
- **Subscriber LTV** = (AOV × (1-discount)) × (365/interval) × margin × avg_duration_months/12

## Code Conventions
- TypeScript: strict mode, named exports
- Python: type hints, async for I/O, Pydantic for validation
- Server Components by default; 'use client' only when needed (charts, sliders, state)
- All data tables scoped by organization_id for multi-tenant RLS
- Supabase client: use @supabase/ssr with getAll/setAll cookie pattern
- NEVER use @supabase/auth-helpers-nextjs (deprecated)
- Config: next.config.js (NOT .ts)
- React keys: always use variant_id or UUID, never product_name
- After any config change: `pkill -f "next dev"; rm -rf .next; npm run dev`
