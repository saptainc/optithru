# Throughput OS: a complete PoC blueprint for one founder, six weeks

**The fastest path to a working SaaS demo that shows professional services executives where profit hides in their existing team capacity.** Throughput OS applies Goldratt's Theory of Constraints to reveal that the "best" clients often destroy value while overlooked ones generate outsized returns per hour of the firm's scarcest resource. This blueprint covers every decision—theory, tech stack, integrations, simulation engine, week-by-week build plan, and pilot customer strategy—scoped for a solo technical founder targeting a real SMB customer within 60 days.

The professional services industry is ripe for this product. The SPI 2025 Benchmark reports average billable utilization fell to **68.9%** and EBITDA collapsed to **9.8%** (from 15.4% the prior year), the lowest in five years. Yet firms using analytics tools show **28% higher EBITDA**. The PSA software market grows at 31% CAGR, hitting $15.4B in 2025. No product on the market applies TOC's throughput-per-constraint-unit lens to professional services data. That is the gap Throughput OS fills.

---

## How TOC actually works in professional services

The constraint in most professional services firms is **senior or specialist practitioner capacity**—not junior staff, not office space, not technology. Senior consultants and partners are involved in nearly every major client engagement and sales pitch. Their hours are the choke point for both delivery and growth. Clients buy the firm for senior expertise; juniors cannot substitute for relationship trust, domain depth, or decision authority. This makes senior time non-fungible and makes identifying and exploiting that constraint the single highest-leverage management action.

Throughput Accounting reframes profitability by splitting all money flows into three buckets that map cleanly to services:

**Throughput (T)** equals revenue minus truly variable costs. For services, truly variable costs are subcontractors, freelancers, direct project expenses (travel, materials), and per-engagement sales commissions. Employee salaries are explicitly *not* variable costs—you pay them regardless of whether they bill. This is the fundamental departure from traditional cost accounting, which allocates labor as a variable cost per project and thereby distorts every profitability calculation.

**Investment (I)** equals money tied up in the system: WIP (unbilled time already invested), accounts receivable, and unbilled expenses. Professional services firms carry less inventory than manufacturers, but **unbilled time is a silent capital drain**—the average firm captures only 72% of billable hours worked.

**Operating Expense (OE)** equals all fixed costs: salaries, wages, benefits, rent, tools, marketing, insurance, and administration. This is the total cost of keeping the system running.

The killer metric is **T/CU—throughput per constraint unit**. For a consulting firm whose constraint is a senior partner with 1,800 available hours per year:

| | Strategy Project | Implementation Project | Training Workshop |
|---|---|---|---|
| Revenue | $150,000 | $300,000 | $40,000 |
| Variable costs | $15,000 | $100,000 | $5,000 |
| **Throughput** | **$135,000** | **$200,000** | **$35,000** |
| Senior partner hours | 200 hrs | 100 hrs | 10 hrs |
| **T/CU** | **$675/hr** | **$2,000/hr** | **$3,500/hr** |

Traditional accounting says the implementation project is the winner at $200K total throughput. T/CU analysis reveals the training workshop generates **$3,500 per hour of the constraint**—five times more value per scarce hour. Prioritizing workshops and implementation over strategy engagements could unlock $100K+ in annual profit without hiring anyone. This inversion of conventional wisdom is the "aha moment" that sells the product.

The decision rule is clean: when the constraint is fully loaded, accept projects with the highest T/CU. When it has capacity, accept anything with positive throughput. The **Throughput Accounting Performance Ratio (TPAR)** = T/CU ÷ (total OE ÷ total constraint hours). If TPAR exceeds 1, the project more than covers its share of operating expenses.

---

## Goldratt's five focusing steps as the product's operating logic

The entire product workflow maps to the Five Focusing Steps, which serve as both the analytics pipeline and the user journey:

**Step 1—Identify.** The software automatically finds the constraint by computing utilization (demand hours ÷ capacity hours) for every team member. The person or role group exceeding **90–95% utilization** while others sit at 60–70% is the bottleneck. Red flags include long proposal turnaround times, projects stalled waiting for senior review, and senior staff working overtime while juniors have bench time.

**Step 2—Exploit.** The T/CU ranking view shows executives exactly how their constraint's time is allocated across clients and projects. The system highlights low-T/CU engagements consuming high constraint hours—these are the "profit destroyers." Actionable recommendations include stripping administrative tasks from the constraint, batching similar work, and delegating preparation to juniors.

**Step 3—Subordinate.** The product shows that non-constraint idle time is *expected and healthy*. A junior at 60% utilization supporting a senior at 95% is the correct allocation. This insight alone is culturally revolutionary for firms that punish anyone below 80% utilization.

**Step 4—Elevate.** What-if scenarios model the impact of adding constraint capacity: hiring another senior, training a junior to handle senior-level tasks, or productizing expertise into scalable offerings that don't require one-on-one senior time.

**Step 5—Repeat.** After elevation, the constraint moves. The software continuously recalculates to identify the new bottleneck—often the sales pipeline once delivery capacity expands.

---

## The minimum viable integration is Harvest plus CSV

The research yields a clear finding: **Harvest alone covers approximately 80% of the data needed for TOC calculations**, and no unified API (Merge.dev, Codat, Apideck) covers time tracking tools. Direct integration with Harvest is both necessary and sufficient for the PoC.

Harvest's V2 REST API provides time entries with hours, billable rates, and cost rates per person per project; user records with `weekly_capacity` (in seconds) and `cost_rate`; project and client records; invoices; expenses; and critically, an uninvoiced report endpoint (`/v2/reports/uninvoiced`) that directly calculates WIP. The API uses OAuth 2.0, has clean documentation, and rate limits are generous at roughly one request per second. A solo developer can build a complete Harvest integration in **5–7 days**.

The data mapping to TOC metrics is direct:

- **Throughput**: Harvest `billable_amount` per project minus `expenses` (direct costs). Subcontractor costs from Harvest expenses or CSV supplement.
- **Investment**: Harvest uninvoiced report (`/v2/reports/uninvoiced`) gives unbilled time and expenses by project.
- **Operating Expense**: Harvest `cost_rate × weekly_capacity` per user as a salary proxy, supplemented by manual CSV input for overhead.
- **Constraint identification**: Harvest team report (`/v2/reports/time/team`) provides `total_hours`, `billable_hours`, and `weekly_capacity` per user—everything needed to compute utilization.
- **T/CU**: Throughput per project divided by constraint hours per project, derived from filtered time entries (`/v2/time_entries?user_id={constraint}&project_id={project}`).

QuickBooks Online integration should be deferred to Phase 2. QBO's OAuth 2.0 implementation is significantly more complex (tokens expire hourly, minor version specification required, sandbox setup needed), and a solo developer would spend **2–3 weeks** on QBO alone. For the PoC, CSV upload covers accounting data—total OE from a P&L export, subcontractor costs, and any data not in Harvest. Pre-built CSV templates matching Harvest's, Toggl's, and Clockify's export formats let the product work for firms using any time tracker.

For firms not using Harvest, the fallback strategy is CSV-only with guided field mapping. This still delivers the core insight—it just requires 30 minutes of customer data preparation instead of a one-click OAuth connection.

---

## A tech stack optimized for speed and impressiveness

The recommended architecture balances rapid development, low cost, and executive-ready polish:

**Frontend**: Next.js 15 with App Router, TypeScript, and Tailwind CSS v4. Server Components render data-heavy dashboard pages on the server. Server Actions eliminate the need for separate API endpoints for most CRUD operations. A $199–299 SaaS boilerplate (MakerKit or supastarter) saves 1–2 weeks of auth and billing scaffolding.

**UI components**: shadcn/ui as the foundation (53 pre-built chart components, auto-theming, dark mode) plus Tremor for KPI cards and analytics-specific layouts. Both are built on Recharts and are fully interoperable. The executive dashboard follows the universal B2B analytics pattern: **4 KPI cards at top → primary time-series chart → supporting bar/donut charts → sortable detail table**. Free starter templates like `shadcn-admin` (2,800+ GitHub stars) provide a production-quality shell.

**Backend and database**: Supabase provides PostgreSQL, Row Level Security for multi-tenant isolation, built-in auth (email + OAuth), real-time subscriptions, and auto-generated REST APIs—all from a single platform at **$0/month** on the free tier (500MB database, 50K MAU). This eliminates the need to manage separate auth, database, storage, and real-time services.

**Analytics engine**: A FastAPI microservice on Railway handles TOC calculations, Monte Carlo simulations, and LLM integration. Next.js rewrites proxy `/api/py/*` to the FastAPI backend transparently. Key libraries: numpy, pandas, scipy for calculations; anthropic or openai for AI-generated insights. Railway costs **$5–15/month** for PoC workloads.

**AI layer**: Claude Sonnet via the Anthropic API generates natural-language executive summaries from dashboard data ("Your constraint utilization is at 94%. Shifting 12 hours from Client A to Client D would increase monthly throughput by $8,200."). At roughly $0.01–0.05 per query, 1,000 monthly queries cost under $50. The Vercel AI SDK handles streaming responses in the frontend.

**Deployment**: Vercel free tier for the Next.js frontend (automatic CI/CD from GitHub, global CDN, SSL). Total monthly infrastructure cost: **$15–30**. When charging customers, upgrade Vercel to Pro ($20/month) and Supabase to Pro ($25/month) for a total of approximately **$60/month**.

---

## Skip agent-based modeling; use deterministic calculations plus Monte Carlo

For a 4–6 week PoC, a full agent-based simulation framework (Mesa or SimPy) is unnecessary overhead. The professional services resource allocation problem is fundamentally deterministic for the base case: given known team capacity, project demands, and rates, throughput and constraint utilization are straightforward calculations. Save simulation frameworks for post-PMF when modeling emergent behavior or complex multi-constraint scenarios.

The minimum viable "digital twin" is a Python calculation engine that takes team roster data and project data as inputs and produces TOC metrics as outputs. For what-if scenarios, layer Monte Carlo sampling on top:

**Scenario: "Raise prices 10% on the lowest three T/CU clients."** For each of 1,000 iterations, apply the price increase, sample a client-loss probability (15–20% per client based on price elasticity research), and record the resulting throughput. Report P10/P50/P90 outcomes. At the scale of a 20–50 person firm with 10–30 projects, **each Monte Carlo run completes in under 50 milliseconds**—fast enough for real-time interactive sliders in the browser.

The four scenarios that matter most to executives, in order of impact:

- **"What if we reallocate constraint hours from low-T/CU to high-T/CU work?"** Pure deterministic reallocation showing dollar-denominated profit gain. This is the core value proposition.
- **"What if we hire one more [constraint role]?"** Add a resource, redistribute demand, show new throughput ceiling and break-even timeline.
- **"What if we lose our biggest client?"** Remove that project's revenue and hours, show freed capacity and which pipeline projects could absorb it.
- **"What if we raise prices on low-T/CU clients?"** Monte Carlo with client-loss probability distribution, showing the range of outcomes.

The most compelling visualization is a **tornado chart** showing the dollar impact of each scenario ranked by magnitude, paired with an **interactive slider** that lets executives adjust parameters (price increase percentage, hiring count) and watch the throughput projection update in real time. This "playground" experience is what makes executives lean forward during demos.

---

## Week-by-week build plan

### Week 1: Foundation and data pipeline

Set up Next.js 15 project with Supabase (auth + database), FastAPI microservice on Railway, and GitHub CI/CD. Design the database schema: organizations, team_members (role, cost_rate, bill_rate, weekly_capacity, skills, seniority_level), clients, projects (client_id, status, revenue, variable_costs), time_entries (person, project, hours, billable, rate). Build the CSV import pipeline with field mapping UI and pre-built templates for Harvest, Toggl, and Clockify export formats. Implement basic navigation shell with placeholder pages. **Deliverable**: user can sign up, upload a CSV, and see raw data in a table.

### Week 2: Core TOC engine and basic dashboard

Build the FastAPI calculation endpoints: utilization per team member, throughput per project, constraint identification (highest utilization resource), T/CU per project/client, firm-level T/I/OE/NP. Wire these to the frontend dashboard with **4 KPI cards** (Total Throughput, Constraint Utilization %, Net Profit, T/CU of top client), one time-series area chart (throughput over time), and a sortable table of projects ranked by T/CU. Use realistic seed data for a fictional 25-person consulting firm. **Deliverable**: upload data → see the constraint identified → see T/CU rankings.

### Week 3: The "aha moment" view and Harvest integration

Build the **split comparison view**: left side shows traditional project ranking by margin, right side shows TOC ranking by T/CU. Highlight the inversions—projects that look profitable by margin but rank poorly by T/CU. Add a capacity heatmap showing constraint hours allocation across clients with color coding (green = high T/CU, red = low T/CU). Begin Harvest OAuth 2.0 integration: app registration, auth flow, data sync for users, projects, clients, time entries, invoices, expenses, and uninvoiced report. **Deliverable**: the view that makes executives say "I had no idea Client A was costing us that much constraint time."

### Week 4: What-if scenarios and simulation

Build 2–3 interactive scenario tools in FastAPI + React: (1) constraint reallocation ("shift X hours from Project A to Project B"—deterministic), (2) pricing scenario with Monte Carlo and histogram visualization, (3) hiring scenario ("add one senior consultant"). Add interactive sliders that update projections in real time. Include a tornado chart summarizing all scenarios ranked by dollar impact. **Deliverable**: executives can interact with their own data and see quantified outcomes of decisions.

### Week 5: AI insights and integration polish

Add Claude-powered executive summary (feed KPIs to LLM, generate 3–4 sentence narrative insight). Add natural-language Q&A ("Which clients have the worst T/CU?"). Complete Harvest integration testing with real data. Build onboarding flow: guided setup wizard with OAuth connection or CSV upload, field mapping, capacity configuration. Add PDF export for the constraint analysis report. **Deliverable**: complete end-to-end flow from data connection to AI-generated insight.

### Week 6: Demo preparation and pilot readiness

Create three demo datasets representing different firm archetypes: a 15-person marketing agency, a 30-person IT consultancy, and a 20-person accounting firm. Each dataset tells a clear story with a specific constraint and hidden-profit reveal. Write the 20-minute demo script. Polish visual design: consistent color scheme, dark mode, responsive layout, loading states. Security hardening: HTTPS enforced, database encryption at rest (Supabase default), Row Level Security for tenant isolation. Bug fixes and edge case handling. Deploy to production URL with custom domain. **Deliverable**: demo-ready product.

### What to build real versus mock

Build real: CSV import and parsing, all TOC calculations (must produce correct numbers), the T/CU ranking and constraint identification views, at least one interactive what-if scenario, Harvest OAuth flow, authentication and multi-tenancy. Mock or hardcode: historical trend charts (generate 6–12 months of realistic fake data), notification system, team member photos, integration marketplace ("Coming soon: Toggl, QuickBooks, Xero"), PDF export (static template initially), email alerts.

---

## Landing the first pilot customer

Start outreach during **Week 3 of the build**, not after the product is finished. The ideal pilot customer is a professional services firm with **10–50 billable employees** that already tracks time (Harvest preferred), has thin margins despite high utilization ("we're all slammed but not making money"), and has a decision-maker who will personally attend the debrief.

The most productive channels, ranked by conversion probability: personal network contacts who run professional services firms; warm introductions via accountants, lawyers, and business coaches who serve these firms (Vistage Chairs are especially valuable—each coaches 12–16 CEOs and actively seeks resources to share); LinkedIn outreach to Managing Partners and CEOs at 10–100 person consulting, IT, marketing, and accounting firms; and industry communities (Reddit r/consulting, Pavilion, AICPA events).

Lead with outcomes, not theory. The value proposition that resonates is **"Find $100K+ in hidden profit in your existing team without hiring anyone."** Never lead with "Theory of Constraints"—executives want results, not frameworks. Reveal the methodology after they see its output.

Structure the pilot as a **60-day paid engagement at $500–$2,000** (positioned as covering data analysis costs). Paid pilots convert at **60–90%** versus under 30% for free pilots, and paying customers provide honest feedback. Credit the pilot fee toward the first three months of the subscription. Require an NDA, a signed pilot agreement with success criteria, and auto-conversion terms.

The data ask from the pilot customer is modest: a time tracking CSV export (Harvest one-click), a team roster spreadsheet (names, roles, bill rates, cost rates, capacity hours), and a client/project list with revenue figures. A P&L summary and rate card are helpful but not essential. No sensitive PII is required. Minimum viable security: mutual NDA, HTTPS/TLS, encrypted database (Supabase default), Row Level Security for tenant isolation, and a one-page data handling agreement specifying storage, access, and deletion policy.

Success criteria to agree on upfront: (1) the tool identifies at least one constraint resource the firm wasn't managing as such, (2) T/CU analysis produces a different client/project priority ranking than traditional margins, (3) at least one actionable insight worth more than $10K/year in throughput improvement is identified, and (4) the executive confirms the analysis would change a real decision.

---

## Pricing and conversion economics

Post-pilot pricing should be a flat monthly fee tiered by firm size: **$299/month** for 5–15 employees, **$599/month** for 16–50 employees, and **$999/month** for 51–100 employees. This positions below PSA tools ($24–60/user/month, meaning $240–3,000/month for a 10–50 person firm) while offering differentiated constraint analytics no PSA provides. For a firm finding $100K+ in hidden throughput, even $7,200/year represents a **14× ROI**.

Create urgency through founding-member pricing ("40% off for life for the first five customers"), scarcity ("accepting only three pilot firms this quarter for white-glove support"), and cost-of-inaction framing using the customer's own data ("every month without reallocation costs approximately $12K in foregone throughput"). The auto-conversion clause in the pilot agreement provides structural momentum.

The realistic timeline from today: demo-ready product by Week 6, first pilot customer signed by Week 8, pilot data onboarded by Week 9, first "aha moment" delivered by Week 10, pilot completed and conversion discussion by Week 14, and first paying customer by **Week 16–18**. Three paying customers—the threshold for initial validation—is achievable by Month 5–6.

---

## Conclusion: the strategic advantage is the lens, not the dashboard

Throughput OS's defensibility lies not in the dashboard technology—anyone can build charts—but in applying a **counterintuitive economic framework** that most professional services executives have never encountered. The insight that a $40K training workshop generates 5× more value per constraint hour than a $150K strategy engagement genuinely changes decision-making. The Mabin and Balderstone meta-analysis of 100+ TOC implementations found a mean **68% increase in revenue** and **82% improvement in financial performance** with zero reported failures.

The product's competitive moat deepens over time as it accumulates customer data, refines constraint identification algorithms, and builds industry benchmarks that new entrants cannot replicate. The SaaS boilerplate and Harvest integration are commodities; the TOC calculation engine and the executive "aha moment" are not. Build the lens first, then build the platform around it.