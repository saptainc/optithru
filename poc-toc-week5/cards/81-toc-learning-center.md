# Card #81: Build in-app TOC Learning Center with interactive modules and contextual glossary

**Fizzy URL**: https://fizzy.sapta.com/1/cards/81  
**Time Estimate**: 4 hours

---

## Goal
5 short learning modules + contextual glossary tooltips. Reduces the "I don't understand TOC" barrier to activation.

## Step 1: Migration 24
File: `supabase/migrations/24-learning.sql`
```sql
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  duration_minutes int NOT NULL,
  order_index int NOT NULL,
  content_type text NOT NULL DEFAULT 'article',
  content jsonb NOT NULL,
  is_published boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.learning_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  module_slug text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, module_slug)
);
```

## Step 2: Seed 5 modules
```sql
INSERT INTO public.learning_modules (slug, title, description, duration_minutes, order_index, content_type, content) VALUES
('what-is-throughput', 'What is Throughput Accounting?',
 'T vs Revenue and why the difference matters', 5, 1, 'article',
 '{"sections": [{"heading": "Revenue is vanity, T is sanity", "body": "T = Revenue minus Truly Variable Costs only. NOT salaries or rent."}, {"heading": "The flip", "body": "High revenue product may have lower T than a cheaper product with less variable cost."}]}'),

('constraint-concept', 'The Constraint Concept',
 'What a constraint is and how to identify yours', 4, 2, 'article',
 '{"sections": [{"heading": "Every system has one bottleneck", "body": "The constraint limits total output. For most DTC brands it is ad budget."}, {"heading": "5 focusing steps", "body": "1. Identify. 2. Exploit. 3. Subordinate. 4. Elevate. 5. Repeat."}]}'),

('reading-tcu-rankings', 'Reading Your T/CU Rankings',
 'Guided tour of your rankings page', 3, 3, 'interactive',
 '{"tour_steps": [{"element": "#rankings-table", "content": "Products ranked by T/CU - highest to lowest. This is your priority list."}, {"element": "#constraint-dropdown", "content": "Change constraint to see rankings shift."}]}'),

('first-what-if', 'Your First What-If Scenario',
 'Guided walkthrough of the simulator', 6, 4, 'interactive',
 '{"tour_steps": [{"element": "#what-if-tabs", "content": "Choose a scenario type."}, {"element": "#budget-slider", "content": "Drag to reallocate budget. Watch Delta-T update."}]}'),

('buffer-management', 'Understanding Buffer Management',
 'Green/yellow/red zones explained', 4, 5, 'article',
 '{"sections": [{"heading": "What is a buffer?", "body": "A quantity cushion upstream of your constraint. Absorbs variability."}, {"heading": "The zones", "body": "Green (>66%): healthy. Yellow (33-66%): monitor. Red (<33%): act now."}]}');
```

## Step 3: /dashboard/learn page
File: `src/app/dashboard/learn/page.tsx`

- Progress bar: X of 5 completed
- Grid of module cards: icon, title, duration badge, green checkmark if completed
- Click -> modal with article sections OR interactive tour overlay
- Mark complete: upsert into learning_progress on "Complete" click or tour finish

## Step 4: Contextual glossary tooltips
File: `src/lib/glossary.ts`
```typescript
export const glossary: Record<string, string> = {
  "T/CU": "Throughput per Constraint Unit - ranks products by how much profit each unit of your scarce resource generates",
  "Buffer": "A quantity cushion upstream of your constraint to absorb variability and prevent stockouts",
  "T": "Throughput = Revenue minus Truly Variable Costs (materials, commissions, packaging only)",
  "OE": "Operating Expense - costs that do not vary with output (salaries, rent, fixed overheads)",
  "NP": "Net Profit = Throughput minus Operating Expense",
  "I": "Inventory / Investment - working capital tied up in unsold stock",
}
```

```typescript
// GlossaryTerm component
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>{children} <QuestionMarkCircleIcon /></TooltipTrigger>
    <TooltipContent>{glossary[term]}</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Step 5: Onboarding integration
After first sync in /onboarding, show:
"Before you explore your dashboard, take 5 min to understand T/CU."
[Start Learning ->] links to /dashboard/learn?start=what-is-throughput

## Done When
- 5 modules seeded, accessible at /dashboard/learn
- Each module marks complete on interaction
- Glossary tooltips on T/CU, Buffer, NP, T, I, OE throughout dashboard
- Progress bar shows X of 5 completed
- Module completion rates visible in admin dashboard
