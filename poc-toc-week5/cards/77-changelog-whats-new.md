# Card #77: Build in-app changelog and "What's New" notification system

**Fizzy URL**: https://fizzy.sapta.com/1/cards/77  
**Time Estimate**: 3 hours

---

## Goal
Customers always know what's new. Reduces churn by making improvements visible. Establishes release discipline.

## Step 1: Migration 21
File: `supabase/migrations/21-changelog.sql`
```sql
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  published_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT false
);
-- Public, no RLS
```

## Step 2: Public changelog page
File: `src/app/changelog/page.tsx`
Server component. Fetch all is_published=true entries DESC by published_at.
Each entry: version badge, category badge (color-coded), title, date, expandable content.
Link from landing page footer and Settings.

## Step 3: Sidebar "What's New" badge
```typescript
const lastSeen = localStorage.getItem("last_seen_changelog_at") || "1970-01-01"
const newEntries = await supabase.from("changelog_entries")
  .select("id").eq("is_published", true).gt("published_at", lastSeen)
// Show badge with count in sidebar nav
// Click -> Sheet showing last 5 entries + "Mark all read" button
```

## Step 4: Admin publish endpoints
POST /admin/api/changelog -> create entry (is_published=false)
PATCH /admin/api/changelog/{id}/publish -> set is_published=true

## Step 5: Seed 5 Week 5 entries
```sql
INSERT INTO public.changelog_entries (version, title, summary, content, category, is_published) VALUES
('1.1.0', 'AI Insights', 'Claude-powered weekly TOC recommendations', '...', 'feature', true),
('1.1.1', 'Amazon + Meesho', 'Connect Amazon India and import Meesho CSV', '...', 'feature', true),
('1.1.2', 'Shopify OAuth', 'One-click Shopify connection, no Custom App needed', '...', 'improvement', true),
('1.1.3', 'White-label', 'Custom branding and domain for Scale plan', '...', 'feature', true),
('1.1.4', 'Admin Dashboard', 'Internal MRR, usage, and sync health dashboard', '...', 'improvement', true);
```

## Step 6: Git tag
```bash
git tag v1.1.0 && git push origin main --tags
```

## Done When
- /changelog renders all published entries publicly
- Sidebar badge shows new entry count since last visit
- Mark-all-read clears badge
- Admin can publish entries via API
- 5 v1.1.x entries visible
- npx next build passes
