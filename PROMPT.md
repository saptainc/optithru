# Week 3 Prompt for Claude Code

Paste this into Claude Code after running `cd ~/throughput-os && claude`:

---

Read the CLAUDE.md file in this project root. It contains the complete Week 3 build plan for Throughput OS — a TOC/Throughput Accounting SaaS for Shankara Naturals beauty brand.

Weeks 1–2 are complete: Next.js 16.2 frontend, FastAPI backend, remote Supabase, auth, dashboard with KPIs, products with editable COGS, T/CU rankings, channel analysis, buffer management, constraints, traditional vs. TOC comparison, Throughput P&L, and CSV import are all working.

Week 3 adds: TOC metric snapshots with trend charts, interactive What-If Simulator (6 scenario tabs), per-product detail pages, Shopify Admin API live sync, product mix optimizer, subscription impact calculator, Shankara brand theming, 5 pre-built demo scenarios, PDF export, and mobile polish.

**This is the MVP gate — end of Week 3 produces a demo-ready product.**

Execute cards 46-57 in order. For each card:

1. SQL migration files are already in ~/throughput-os/supabase/migrations/ (files 12 through 15). I will apply them manually via Supabase Studio SQL Editor — tell me when to apply each one.

2. Create all frontend files (pages, components) as specified in the card descriptions in CLAUDE.md.

3. For the What-If Simulator (card 48), use client-side state for slider-driven calculations. Only call RPC functions for precision when needed. This keeps the simulator responsive without server round-trips.

4. For the Shopify sync (card 50), add httpx to backend dependencies and create the ShopifySyncService class. Register the new shopify router in main.py.

5. For the PDF export (card 55), add reportlab to backend dependencies and create the reports router.

6. After each card, run `npx next build` to verify no TypeScript errors.

7. For card 57 (final), run the 24-point E2E checklist and fix any issues.

CRITICAL CONSTRAINTS from Weeks 1-2 (do not violate):
- next.config.js MUST be .js not .ts
- Dashboard routes at /dashboard/ NOT in route group
- Auth uses client-side Supabase (createClient from lib/supabase/client), NOT server actions
- useEffect callbacks from parent MUST use useRef guard to prevent infinite loops
- React keys MUST use variant_id (UUID), never product_name (duplicates exist)
- Middleware allows /api/* routes through without auth redirect
- After any config change: pkill -f "next dev"; rm -rf .next; npm run dev
- No root package.json in ~/throughput-os/

Start with card 46 (verify Week 2). Tell me when to apply each SQL migration.
