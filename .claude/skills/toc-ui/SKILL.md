---
description: Architecture, UI/UX, visual design system (Fizzy-inspired), and domain rules for the OptiThru Theory of Constraints (TOC) and Throughput Accounting dashboard.
tags: [ui, ux, dashboard, toc, throughput-accounting, layout, routing, fizzy, design-system]
---

# Skill: Theory of Constraints (TOC) Dashboard Architecture

## 1. Context & Domain Rules
You are assisting in building an executive decision-support dashboard for an online beauty and skincare company. The application strictly follows **Theory of Constraints (TOC)** and **Throughput Accounting (TA)** principles.

*   **CRITICAL DIRECTIVE:** Never use traditional cost accounting metrics (e.g., Gross Margin, COGS, Cost per Unit, Overhead Allocation) when generating components, mock data, or calculation logic.
*   The UI must facilitate the TOC continuous improvement cycle: *Identify, Exploit, Subordinate, Elevate*.
*   **Manage by Exception:** Leadership dashboards must surface anomalies (bottlenecks, stock risks) rather than overwhelming users with nominal data (like line-by-line recent orders).

## 2. Information Architecture (Routing & Menus)
**Rule:** Do not create flat menus or group items under generic headers like "KPIs". Group navigation by logical TOC business functions.

When generating routing or sidebar components, enforce this exact structure:

*   **Overview (The Scoreboard)**
    *   `/dashboard` - Executive Dashboard
    *   `/financials` - Throughput Accounting P&L
*   **Sales & Market (Exploit)**
    *   `/sales/t-cu` - Products by T/CU (Throughput per Constraint Unit)
    *   `/sales/channels` - Channel Performance
    *   `/sales/orders` - Orders List
*   **Operations & Flow (Subordinate)**
    *   `/ops/constraint` - Constraint Center (Active bottleneck monitoring)
    *   `/ops/buffers` - Buffer Management (Stock & time buffers)
    *   `/ops/kanban` - Production Kanban
*   **Strategy (Elevate)**
    *   `/strategy/simulate` - Simulate / What-If Scenarios
*   **System Admin** *(Grouped visually at the bottom)*
    *   `/admin/integrations` - Integrations / Import
    *   `/admin/settings` - Users & Settings

## 3. Dashboard Layout Component Hierarchy (`/dashboard`)
**Rule:** The main dashboard layout must strictly follow a top-to-bottom hierarchy: **Macro Financials -> Immediate Threats -> Profit Drivers -> Trends.**

### Row 1: The Global Goal (Macro Health)
*   **Components:** 5 top-level KPI cards in a single row.
*   **Metrics:** Total Throughput ($T) | Inventory & Investment ($I) | Operating Expense ($OE) | Net Profit ($NP) | ROI.
*   **UI Requirement:** Render educational micro-copy subtext under the primary numbers (e.g., under Total Throughput, display: *"Revenue minus truly variable costs"*).

### Row 2: Flow Protection (Immediate Threats)
*   **Left (60% width):** Aggregate Buffer Status list. **CRITICAL:** Filter this list to *only* render items in `Red` or `Yellow` status. Hide `Green` (safe) items by default to prevent executive cognitive overload.
*   **Right (40% width):** Active Constraint Status. A gauge or alert widget showing the current system bottleneck and its utilization (e.g., *"2oz Liquid Filling Machine - 98% Utilized"*).

### Row 3: Profit Drivers (Exploitation & Mix)
*   **Left (50% width):** Top Products horizontal bar chart. Must be ranked strictly by **T/CU** (Throughput per Constraint Unit), not absolute revenue.
*   **Right (50% width):** Channel Summary (DTC vs. Amazon vs. Wholesale). **CRITICAL:** Display the value as Total Throughput ($T) generated per channel, not just order counts.

### Row 4: Context & Trends
*   **Full Width:** A 30-Day trendline chart plotting Throughput ($T) versus Operating Expense ($OE) over time.

## 4. Strict UI Design & Color Semantics
**Rule:** In TOC Replenishment and Buffer Management, traffic light colors have absolute, universal operational meanings dictating immediate action.

*   **THE TRAFFIC LIGHT RULE:**
    *   `Red` = Expedite / Danger / Imminent Stockout
    *   `Yellow` = Monitor closely / Replenishment needed
    *   `Green` = Safe / Do nothing
*   **Constraint:** NEVER use Red, Yellow, or Green for general data visualization (e.g., do not color the top product green and bottom product amber on the T/CU chart). Do not use them for standard "success" or "error" states unless tied to buffer health.
*   **Implementation:** Use the brand's primary UI palette (blues, violets, neutral grays) for all standard charts. Reserve Red, Yellow, and Green *strictly and exclusively* for Buffer Status and Constraint Alert components.
*   **Positive/negative deltas:** Use `text-primary` (blue) for positive changes and `text-destructive` for negative — never green/red.

## 5. Glossary & Calculation Logic
When writing logic, creating variables, or defining props, use TOC-standard terminology and math:
*   `throughput` ($T): Sales Revenue minus Truly Variable Costs (TVC).
*   `investment` ($I): Money tied up in things intended to be sold (Inventory, Equipment, Facilities).
*   `operatingExpense` ($OE): Money spent turning $I into $T (Labor, Marketing, Rent).
*   `netProfit` ($NP): `$T - $OE`
*   `roi`: `($T - $OE) / $I`
*   `tcu` (T/CU): Throughput per Constraint Unit (Throughput divided by the time the product consumes on the bottleneck resource).

## 6. Visual Design System (Fizzy-Inspired)

The UI follows a design language inspired by [Basecamp's Fizzy](https://github.com/basecamp/fizzy): **clean, content-first soft minimalism** with no glassmorphism, no heavy gradients, and no decorative blurs. Depth comes from layered shadows and typography weight, not visual effects.

### 6.1 Typography

*   **Font stack (system fonts — no web font imports):**
    ```
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif
    ```
*   **Heading font:** Same as body (`--font-heading: var(--font-sans)`)
*   **Body line-height:** `1.375`
*   **Key weights:**
    *   `font-black` (900) — page titles, KPI values, pricing numbers, brand name
    *   `font-bold` (700) — card titles, section headings, nav group labels
    *   `font-semibold` (600) — buttons, active nav items, labels
    *   `font-medium` (500) — nav items, metadata
*   **Type scale (use `text-[...]` for Fizzy sizing):**
    *   `text-[0.7rem]` — micro-copy, footnotes
    *   `text-[0.75rem]` — labels, badges, uppercase section headers
    *   `text-[0.85rem]` — body text, nav items, form inputs
    *   `text-[1rem]` — card titles, feature headings
    *   `text-[1.1rem]` — emphasized values, constraint names
    *   `text-[1.5rem]` — page titles, KPI values
    *   `text-[1.8rem]` — landing section headings
    *   `text-[2.5rem]` — hero/pricing large numbers
*   **Sidebar nav group headings:** `text-[0.7rem] font-bold uppercase tracking-wider text-sidebar-foreground/40`

### 6.2 Color System (OKLCH)

All colors use the **OKLCH color space** for perceptual uniformity. The primary hue family is **ink blue-gray (hue ~260)**.

#### Light Mode (`:root`)
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(1 0 0)` | Page background (white) |
| `--foreground` | `oklch(0.26 0.02 260)` | Primary text (dark ink) |
| `--primary` | `oklch(0.57 0.19 260)` | Links, active states, CTA fills |
| `--primary-foreground` | `oklch(1 0 0)` | Text on primary fills |
| `--muted-foreground` | `oklch(0.55 0.02 260)` | Secondary text, labels |
| `--border` | `oklch(0.92 0.005 260)` | Card borders, dividers |
| `--destructive` | `oklch(0.59 0.19 38)` | Error, negative values (hue ~38 = red) |
| `--card` | `oklch(1 0 0)` | Card backgrounds (opaque white) |

#### Dark Mode (`.dark`)
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.20 0.0195 232)` | Deep blue-gray canvas |
| `--foreground` | `oklch(0.96 0.005 260)` | Light text |
| `--primary` | `oklch(0.70 0.15 260)` | Brighter blue for dark bg |
| `--card` | `oklch(0.25 0.018 232)` | Elevated card surface |
| `--border` | `oklch(0.35 0.015 232)` | Subtle dividers |

#### Chart Colors (brand palette, NOT traffic-light)
| Token | Value | Purpose |
|-------|-------|---------|
| `--chart-1` | `oklch(0.57 0.19 260)` | Blue (primary) |
| `--chart-2` | `oklch(0.55 0.162 147)` | Teal/green (muted, NOT traffic-light green) |
| `--chart-3` | `oklch(0.59 0.19 38)` | Coral/warm |
| `--chart-4` | `oklch(0.66 0.12 90)` | Gold |
| `--chart-5` | `oklch(0.60 0.15 292)` | Violet |

#### T/CU Tier Colors (from `design-tokens.ts`)
| Tier | Color | Token |
|------|-------|-------|
| Top | `#3b63d9` (blue) | `colors.tcuTop` |
| Mid | `#7c6cc4` (violet) | `colors.tcuMid` |
| Low | `#9b8ab0` (muted purple) | `colors.tcuLow` |

**NEVER** use green/amber/red for T/CU tiers.

### 6.3 Shadows (Progressive Multi-Layer)

Fizzy uses a 4-layer progressive shadow instead of a single `box-shadow`. Use the `fizzy-shadow` utility class or `var(--shadow)`.

**Light mode:**
```css
--shadow:
  0 0 0 1px oklch(0% 0 0 / 5%),
  0 0.2em 0.2em oklch(0% 0 0 / 5%),
  0 0.4em 0.4em oklch(0% 0 0 / 5%),
  0 0.8em 0.8em oklch(0% 0 0 / 5%);
```

**Dark mode:** Higher opacity, tighter spread:
```css
--shadow:
  0 0 0 1px oklch(0% 0 0 / 42%),
  0 0.2em 1.6em -0.8em oklch(0% 0 0 / 60%),
  0 0.4em 2.4em -1em oklch(0% 0 0 / 70%),
  0 0.8em 1.2em -1.6em oklch(0% 0 0 / 90%);
```

### 6.4 Border Radius

| Context | Value | Tailwind |
|---------|-------|----------|
| Buttons | `99rem` | `fizzy-pill` or `rounded-[99rem]` |
| Cards | `0.5em` | `rounded-[0.5em]` |
| Panels (large containers) | `1em` | `fizzy-panel` |
| Nav items | `0.3em` | `rounded-[0.3em]` |
| Inputs | `0.5em` | `rounded-[0.5em]` |

**Rule:** Buttons are ALWAYS pill-shaped (`99rem`). Cards use subtle rounding (`0.5em`). Never use `rounded-xl` or `rounded-2xl` on standard components.

### 6.5 Buttons

*   **Shape:** Always pill (`border-radius: 99rem`)
*   **Weight:** `font-semibold` (600)
*   **Hover:** `filter: brightness(0.9)` in light mode, `brightness(1.25)` in dark mode — NOT background color changes
*   **Disabled:** `opacity: 0.3`, `pointer-events: none`
*   **Transition:** `transition-[filter] duration-100` (100ms, filter only)
*   **Variants:**
    *   `default` — filled primary bg, white text
    *   `outline` — 1px border, bg-background
    *   `ghost` — transparent, hover bg-muted
    *   `destructive` — destructive/10 bg, destructive text

### 6.6 Cards

*   **Background:** `bg-card` (opaque, no transparency or backdrop-blur)
*   **Border:** `border border-border` (1px solid)
*   **Shadow:** `fizzy-shadow` (4-layer progressive)
*   **Radius:** `rounded-[0.5em]`
*   **No hover lift** — no `hover:-translate-y`. Use `hover:brightness-[0.98]` if hover feedback is needed.

### 6.7 Sidebar Navigation

*   **Background:** Light canvas (`--sidebar: oklch(0.98 0.003 260)`)
*   **Items grouped** by TOC business function with uppercase `0.7rem` section headings
*   **Active item:** `bg-sidebar-accent font-semibold` with `text-primary` icon
*   **Inactive item:** `text-sidebar-foreground/65`, hover → `bg-sidebar-accent`
*   **Item padding:** `px-2.5 py-[0.4em]`
*   **Item radius:** `rounded-[0.3em]`
*   **Brand mark:** Small square icon (`w-7 h-7 rounded-[0.3em] bg-primary`) + `font-black` label

### 6.8 Header

*   **Height:** `h-12`
*   **Background:** `bg-background` (solid, no blur/glass)
*   **Border:** `border-b border-border`
*   **Buttons:** Pill-shaped outline buttons with `gap-1.5`

### 6.9 KPI Cards (Dashboard Row 1)

*   **Border + shadow:** `border border-border fizzy-shadow`
*   **Radius:** `rounded-[0.5em]`
*   **Title:** `text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground`
*   **Value:** `text-[1.5rem] font-black tracking-tight`
*   **Micro-copy:** `text-[0.75rem] text-muted-foreground`
*   **Icon:** Small, muted (`h-4 w-4 text-muted-foreground/60`), no colored backgrounds
*   **Trend colors:** `trend="neutral"` on all KPI cards — NEVER use green/red for KPI trends (violates traffic-light rule)

### 6.10 Charts (Recharts)

*   **Grid lines:** `stroke="oklch(0.92 0.005 260)"` (subtle ink-lightest)
*   **Bar colors:** Use OKLCH brand palette, fade by rank (opacity or lightness shift). Never green/amber for good/bad.
*   **Area chart lines:** `oklch(0.57 0.19 260)` (primary blue) for $T, `oklch(0.60 0.15 292)` (violet) for $OE
*   **Fill opacity:** `0.15` for area charts
*   **Tooltip:** Default Recharts tooltip, no custom styling needed
*   **Legend position:** Default (bottom)

### 6.11 Utility Classes (defined in `globals.css`)

| Class | Purpose |
|-------|---------|
| `fizzy-shadow` | Apply `var(--shadow)` progressive shadow |
| `fizzy-panel` | Card bg + border + 1em radius + shadow (for large panels) |
| `fizzy-pill` | `border-radius: 99rem` (pill shape) |

### 6.12 What NOT to Do

*   **No glassmorphism:** No `backdrop-filter: blur()`, no `bg-card/80%` transparency, no glass-card class
*   **No gradient backgrounds:** No `gradient-warm`, `gradient-hero`, `bg-gradient-to-r`
*   **No gradient buttons:** Buttons use flat `bg-primary`, not gradient fills
*   **No hover lift:** No `hover:-translate-y-0.5` on cards or buttons
*   **No Google Fonts imports:** System font stack only
*   **No serif headings:** `--font-heading` equals `--font-sans`
*   **No decorative blobs:** No radial gradient backgrounds, no blur circles
*   **No inset shadows:** No `inset 0 1px 0` glow effects
*   **No colored icon backgrounds:** KPI icons are plain, not wrapped in colored circles/squares
