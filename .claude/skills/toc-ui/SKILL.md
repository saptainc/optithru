---
description: Architecture, UI/UX, and domain rules for the OptiThru Theory of Constraints (TOC) and Throughput Accounting dashboard.
tags: [ui, ux, dashboard, toc, throughput-accounting, layout, routing]
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

*   **ð Overview (The Scoreboard)**
    *   `/dashboard` - Executive Dashboard
    *   `/financials` - Throughput Accounting P&L
*   **ð Sales & Market (Exploit)**
    *   `/sales/t-cu` - Products by T/CU (Throughput per Constraint Unit)
    *   `/sales/channels` - Channel Performance
    *   `/sales/orders` - Orders List
*   **⚙️ Operations & Flow (Subordinate)**
    *   `/ops/constraint` - Constraint Center (Active bottleneck monitoring)
    *   `/ops/buffers` - Buffer Management (Stock & time buffers)
    *   `/ops/kanban` - Production Kanban
*   **ð Strategy (Elevate)**
    *   `/strategy/simulate` - Simulate / What-If Scenarios
*   **ð ️ System Admin** *(Grouped visually at the bottom)*
    *   `/admin/integrations` - Integrations / Import
    *   `/admin/settings` - Users & Settings

## 3. Dashboard Layout Component Hierarchy (`/dashboard`)
**Rule:** The main dashboard layout must strictly follow a top-to-bottom hierarchy: **Macro Financials ➡️ Immediate Threats ➡️ Profit Drivers ➡️ Trends.**

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
    *   ð´ `Red` = Expedite / Danger / Imminent Stockout
    *   ð¡ `Yellow` = Monitor closely / Replenishment needed
    *   ð¢ `Green` = Safe / Do nothing
*   **Constraint:** NEVER use Red, Yellow, or Green for general data visualization (e.g., do not color the top product green and bottom product amber on the T/CU chart). Do not use them for standard "success" or "error" states unless tied to buffer health.
*   **Implementation:** Use the brand's primary UI palette (blues, purples, oranges, neutral grays) for all standard charts. Reserve Red, Yellow, and Green *strictly and exclusively* for Buffer Status and Constraint Alert components.

## 5. Glossary & Calculation Logic
When writing logic, creating variables, or defining props, use TOC-standard terminology and math:
*   `throughput` ($T): Sales Revenue minus Truly Variable Costs (TVC).
*   `investment` ($I): Money tied up in things intended to be sold (Inventory, Equipment, Facilities).
*   `operatingExpense` ($OE): Money spent turning $I into $T (Labor, Marketing, Rent).
*   `netProfit` ($NP): `$T - $OE`
*   `roi`: `($T - $OE) / $I`
*   `tcu` (T/CU): Throughput per Constraint Unit (Throughput divided by the time the product consumes on the bottleneck resource).
