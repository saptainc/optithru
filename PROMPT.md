# Week 2 Prompt for Claude Code

Paste this entire block into Claude Code after running `cd ~/throughput-os && claude`:

---

Read the CLAUDE.md file in this project root. It contains the complete Week 2 build plan for Throughput OS — a TOC/Throughput Accounting SaaS for Shankara Naturals beauty brand.

Week 1 is complete: Next.js 16.2 frontend, FastAPI backend, remote Supabase, auth, dashboard, products page with editable COGS, and CSV import wizard are all working.

Week 2 adds: PostgreSQL RPC functions, constraint management, T/CU rankings, channel analysis, buffer management, capital trap identification, traditional vs. TOC comparison, and Throughput Accounting P&L.

Execute cards 36-45 in order. For each card:

1. The SQL migration files are already in ~/throughput-os/supabase/migrations/ (files 07 through 11). I will apply them manually via Supabase Studio SQL Editor — just tell me when to apply each one.

2. Create all frontend files (pages, components) exactly as specified in the Fizzy card descriptions. The card details are embedded in CLAUDE.md.

3. Update sidebar.tsx to add new navigation items (T/CU Rankings, Constraints, Compare, Financials) with the correct icons and order specified in CLAUDE.md.

4. After each card, run `npx next build` to verify no TypeScript errors.

5. For card 44 (FastAPI), create the Pydantic schemas, engine methods, endpoints, and tests, then run `uv run pytest -v`.

6. For card 45, run the 14-point E2E checklist and fix any issues.

CRITICAL CONSTRAINTS from Week 1 (do not violate):
- next.config.js MUST be .js not .ts
- Dashboard routes at /dashboard/ NOT in route group
- Auth uses client-side Supabase (createClient from lib/supabase/client), NOT server actions
- useEffect callbacks from parent MUST use useRef guard to prevent infinite loops
- Middleware at src/middleware.ts allows /api/* routes through without auth redirect
- After any config change: pkill -f "next dev"; rm -rf .next; npm run dev
- No root package.json in ~/throughput-os/

Start with card 36 (PostgreSQL RPC functions). Tell me when to apply the SQL.
