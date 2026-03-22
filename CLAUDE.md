# Throughput OS — Week 2: TOC Calculation Engine

## What this project is
Beauty e-commerce profitability platform applying Theory of Constraints / Throughput Accounting.
Target customer: Shankara Naturals (premium Ayurvedic skincare, ~$3M revenue, 48+ SKUs on Shopify).
100% of Shankara's net profits go to humanitarian causes — every throughput improvement increases humanitarian impact.

## What was built in Week 1 (already working)
- Next.js 16.2 frontend with App Router, TypeScript, Tailwind, shadcn/ui, Recharts
- FastAPI Python backend with TOC calculation engine (4 passing tests)
- Remote Supabase at https://supabase.1in3in5.org (PostgreSQL + Auth + RLS)
- Login/signup auth flow (client-side Supabase auth, not server actions)
- Dashboard with 4 KPI cards + throughput bar chart
- Products page with real Shankara catalog (89 Shopify imports), editable COGS
- CSV import wizard (4 entity types: products, variants, orders, marketing spend)
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
│   │   ├── components/          # React components
│   │   ├── lib/                 # Supabase clients, format utils, API client
│   │   └── middleware.ts        # Auth middleware (allows /api/* routes through)
│   └── package.json
├── backend/                     # FastAPI microservice
│   ├── app/
│   │   ├── main.py              # FastAPI app with CORS
│   │   ├── config.py            # pydantic-settings
│   │   ├── routers/             # health.py, calculations.py
│   │   ├── services/            # toc_engine.py
│   │   └── schemas/             # toc.py (Pydantic models)
│   ├── tests/
│   └── pyproject.toml
├── supabase/migrations/         # SQL files (applied via Studio SQL Editor)
├── scripts/                     # TypeScript utility scripts
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

## CRITICAL: Lessons from Week 1 (DO NOT REPEAT THESE MISTAKES)

### 1. next.config.js MUST be .js, not .ts
Next.js 16.2 requires `next.config.js` with `module.exports`. Never create next.config.ts or next.config.mjs.

### 2. allowedDevOrigins needs ALL hostname variations
```js
allowedDevOrigins: [
  'http://10.1.34.200:3000',
  'http://10.1.34.200',
  '10.1.34.200',
  'http://localhost:3000',
  'http://localhost',
],
```
Without all 5, client-side JavaScript silently fails (onClick handlers don't fire).

### 3. Dashboard routes are at /dashboard/, NOT in a route group
The directory is `src/app/dashboard/` — NOT `src/app/(dashboard)/`. Route groups caused URL mapping issues.

### 4. Auth uses client-side Supabase, NOT server actions
Server actions with `form action={handleSubmit}` don't work in Next.js 16.2 + Turbopack. All auth forms use:
```tsx
const supabase = createClient()  // browser client
const { error } = await supabase.auth.signInWithPassword({ email, password })
```

### 5. Middleware must allow /api/* routes through
Without this, the Next.js proxy to FastAPI gets redirected to /login:
```ts
const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
// Add && !isApiRoute to the redirect condition
```

### 6. useEffect + onValidated callback = infinite loop
Never put a parent callback in useEffect dependencies. Use useRef(hasRun) guard:
```tsx
const hasRun = useRef(false)
useEffect(() => {
  if (hasRun.current) return
  hasRun.current = true
  // ... do work, call onValidated
}, [csvData, mappings]) // NO onValidated here
```

### 7. Clean .next cache after config changes
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run dev
```

### 8. Product variants import needs FK resolution
The CSV import for product_variants must resolve product_name → product_id before inserting.

### 9. No root package.json
The root ~/throughput-os/ must NOT have a package.json — it confuses Turbopack module resolution.

### 10. FastAPI health endpoint needs dual routes
```python
@router.get("/healthz")
@router.get("/api/v1/healthz")
async def health_check():
```

## Week 2: What to Build

Execute these cards IN ORDER. Each card has full code — create the files exactly as specified.

### Card 35: Fix Week 1 issues (SKIP if all working)
Verify: npx next build passes, login works, dashboard shows data, COGS editing works with toast.

### Card 36: PostgreSQL RPC functions
1. Apply `supabase/migrations/07-rpc-functions.sql` via Supabase Studio SQL Editor
2. Creates fn_product_throughput_summary() and fn_system_kpis()
3. Update dashboard page.tsx to use RPC calls instead of JS aggregation
4. Verify: Dashboard KPIs show non-zero values

### Card 37: Constraint management UI
1. Create `src/app/dashboard/constraints/page.tsx`
2. Create `src/components/constraints/constraint-manager.tsx`
3. Add "Constraints" with Target icon to sidebar
4. Verify: Can add/activate/delete constraints at /dashboard/constraints

### Card 38: T/CU rankings page (THE KEY FEATURE)
1. Apply `supabase/migrations/08-tcu-rankings.sql` via Studio
2. Create `src/app/dashboard/rankings/page.tsx`
3. Create `src/components/rankings/tcu-rankings-table.tsx`
4. Create `src/components/rankings/tcu-scatter-chart.tsx`
5. Add "T/CU Rankings" with TrendingUp icon to sidebar
6. Verify: Products ranked by T/CU, constraint dropdown re-ranks

### Card 39: Marketing channel T/CU analysis
1. Apply `supabase/migrations/09-channel-tcu.sql` via Studio
2. Replace `src/app/dashboard/channels/page.tsx`
3. Create `src/components/channels/channel-analysis.tsx`
4. Create `src/components/channels/budget-reallocation-card.tsx`
5. Verify: Bar chart with email at top, meta_ads at bottom

### Card 40: Buffer management engine
1. Apply `supabase/migrations/10-buffer-management.sql` via Studio
2. Replace `src/app/dashboard/buffers/page.tsx`
3. Create `src/components/buffers/buffer-status-board.tsx`
4. Verify: Buffer cards with Green/Yellow/Red zones

### Card 41: Capital trap identification (IDD/TDD)
1. Apply `supabase/migrations/11-dollar-days.sql` via Studio
2. Create `src/components/products/capital-trap-table.tsx`
3. Add "Capital Traps" tab to products page
4. Verify: Products sorted by IDD/TDD ratio, traps flagged red

### Card 42: Traditional vs. TOC split comparison
1. Create `src/app/dashboard/compare/page.tsx`
2. Create `src/components/compare/split-comparison.tsx`
3. Add "Compare" with ArrowLeftRight icon to sidebar
4. Verify: Side-by-side panels with rank inversions highlighted

### Card 43: Throughput Accounting P&L
1. Create `src/app/dashboard/financials/page.tsx`
2. Create `src/components/financials/throughput-waterfall.tsx`
3. Create `src/components/financials/throughput-pnl.tsx`
4. Add "Financials" with DollarSign icon to sidebar
5. Verify: Waterfall chart + P&L with ROI, Productivity, Investment Turns

### Card 44: Extend FastAPI backend
1. Create `app/schemas/toc.py` with Pydantic models
2. Add methods to `app/services/toc_engine.py`
3. Add 5 new endpoints to `app/routers/calculations.py`
4. Add `get_user_org_id` to `app/dependencies.py`
5. Add 3 new tests
6. Verify: `uv run pytest -v` passes all tests

### Card 45: End-to-end verification
Run the 14-point checklist. Fix issues. Git commit.

## Sidebar Navigation (final state after Week 2)
The sidebar should have these items in order:
```
Dashboard        → /dashboard           (LayoutDashboard)
Products         → /dashboard/products  (Package)
T/CU Rankings    → /dashboard/rankings  (TrendingUp)       ← NEW
Orders           → /dashboard/orders    (ShoppingCart)
Channels         → /dashboard/channels  (Megaphone)
Buffers          → /dashboard/buffers   (BarChart3)
Constraints      → /dashboard/constraints (Target)          ← NEW
Compare          → /dashboard/compare   (ArrowLeftRight)    ← NEW
Financials       → /dashboard/financials (DollarSign)       ← NEW
Simulate         → /dashboard/simulate  (FlaskConical)
Import           → /dashboard/import    (Upload)
Settings         → /dashboard/settings  (Settings)
```

## SQL Migrations to Apply (via Supabase Studio SQL Editor)
These files are in ~/throughput-os/supabase/migrations/ — paste each into Studio and run:
1. 07-rpc-functions.sql (card 36)
2. 08-tcu-rankings.sql (card 38)
3. 09-channel-tcu.sql (card 39)
4. 10-buffer-management.sql (card 40)
5. 11-dollar-days.sql (card 41)

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

## Code Conventions
- TypeScript: strict mode, no `any` (use sparingly), named exports
- Python: type hints, async for I/O, Pydantic for validation
- Server Components by default; 'use client' only when needed
- All data tables scoped by organization_id for multi-tenant RLS
- Supabase client: use @supabase/ssr with getAll/setAll cookie pattern
- NEVER use @supabase/auth-helpers-nextjs (deprecated)
- Config: next.config.js (NOT .ts)
- After any config change: `pkill -f "next dev"; rm -rf .next; npm run dev`
