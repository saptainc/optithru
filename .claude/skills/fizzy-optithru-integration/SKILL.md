---
name: fizzy-optithru-integration
description: Integrate the Fizzy TOC Strategic Kanban into the OptiThru host application using a separate subdomain, SSO embed tokens, and an iframe. Captures the actual working architecture after rejecting path-prefix proxying and native React rendering approaches.
user-invocable: true
---

# Integrate Fizzy TOC Strategic Kanban into OptiThru

This skill documents the **working integration** of the Fizzy kanban (TOC Strategic Kanban branch) into the OptiThru host application. It captures the architectural decisions, the dead-ends to avoid, and the exact configuration that works.

## Architecture

```
Browser
   │
   ├── https://shankara.sapta.com           (OptiThru main app)
   │       │
   │       └── /dashboard/production
   │              └── <iframe src="https://kanbanshankara.sapta.com/...">
   │
   └── https://kanbanshankara.sapta.com     (Fizzy kanban — SEPARATE origin)
              │
              ▼
       NPM (external nginx-proxy-manager)
              │
              ▼
       Docker host : 3006 → kanban-service:80
```

**Key principle:** Fizzy runs on its **own subdomain**, NOT under a path prefix. Both apps are terminated by the same external nginx-proxy-manager, but as separate proxy hosts. The iframe loads Fizzy directly from its subdomain — no Next.js path rewriting, no Rack middleware, no `RAILS_RELATIVE_URL_ROOT`.

## Why Subdomain (Not Path Prefix)

We tried path-based proxying first (`shankara.sapta.com/kanban/*` → kanban-service) and it failed because:

1. **Fizzy uses `script_name` for account scoping** — URLs look like `/{account_slug}/boards`. Trying to also use `script_name` for a mount prefix conflicts with this.
2. **`script_name: nil` strips prefixes** — Fizzy's controllers explicitly use `script_name: nil` for global routes (session, transfers, login). Any URL prefix gets stripped.
3. **Asset pipeline ignores `SCRIPT_NAME`** — Even with Rack middleware setting `SCRIPT_NAME=/kanban`, asset URLs in HTML stayed at `/assets/...`.
4. **Cookie scope mismatch** — Path-scoped cookies on the iframe origin don't behave well across the proxy.
5. **Turbo morph loop** — Different CSP nonces between morphed pages caused infinite refresh loops.
6. **Fizzy `embed_mode?` hides the menu** — passing `?embed=true` cleans the UI but also removes the navigation (no way to switch boards).

The subdomain approach sidesteps **all** of these. Fizzy runs unmodified and serves its full native UI.

## Prerequisites

- OptiThru deployed and running (see `deploy-optithru` skill)
- DNS A record for `<kanban-host>.sapta.com` (e.g., `kanbanshankara.sapta.com`) pointing to the same IP as the main app
- Access to nginx-proxy-manager to add a new proxy host
- Fizzy source from `https://github.com/saptainc/fizzy` branch `toc-strategic-kanban` (private repo — needs token)

## Step 1: Clone Fizzy

```bash
cd /opt/optithru
git clone -b toc-strategic-kanban https://<USER>:<TOKEN>@github.com/saptainc/fizzy.git ./services/kanban
```

## Step 2: Generate Secrets

```bash
openssl rand -hex 32   # FIZZY_EMBED_SECRET
openssl rand -hex 64   # SECRET_KEY_BASE
```

Fizzy does NOT ship with `config/master.key`. Use `SECRET_KEY_BASE` env var instead — Rails reads it automatically and skips encrypted credentials.

## Step 3: Add Environment Variables

Add to `/opt/optithru/.env`:

```bash
# ── Fizzy TOC Kanban ──
KANBAN_URL=https://kanbanshankara.sapta.com
FIZZY_EMBED_SECRET=<from openssl rand -hex 32>
SECRET_KEY_BASE=<from openssl rand -hex 64>
FIZZY_ACCESS_TOKEN=  # populated in Step 7
FIZZY_BOARD_ID=      # populated in Step 7
FIZZY_ACCOUNT_SLUG=1
```

## Step 4: Add kanban-service to docker-compose.yml

```yaml
  kanban-service:
    build:
      context: ./services/kanban
      dockerfile: Dockerfile
    ports:
      - "3006:80"               # CRITICAL: published port for NPM to reach
    environment:
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      FIZZY_EMBED_SECRET: ${FIZZY_EMBED_SECRET}
      CSP_FRAME_ANCESTORS: ${APP_URL}        # https://shankara.sapta.com
      FIZZY_EMBED_ALLOWED_ORIGINS: ${APP_URL}
      BASE_URL: ${KANBAN_URL}                # https://kanbanshankara.sapta.com
      FORCE_SSL: "false"                     # SSL terminated by NPM
    volumes:
      - kanban_storage:/rails/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/up"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
```

Add to the `volumes:` section:
```yaml
volumes:
  db-data:
  kanban_storage:
```

The kanban-service is on the **default bridge network only** — no macvlan needed. Other containers reach it as `http://kanban-service:80` (Docker DNS), and external traffic goes through NPM → host:3006.

## Step 5: Configure nginx-proxy-manager

Create a new proxy host:

| Field | Value |
|-------|-------|
| Domain Names | `kanbanshankara.sapta.com` |
| Scheme | `http` |
| Forward Hostname/IP | `<docker host IP>` (same as the main app) |
| Forward Port | `3006` |
| Cache Assets | Off |
| Block Common Exploits | On |
| **Websockets Support** | **Enabled** ← REQUIRED for Turbo Streams / ActionCable |
| SSL | Request new Let's Encrypt cert, force SSL |

## Step 6: Backend Configuration & Router

**File:** `/opt/optithru/backend/app/config.py` — add fields:

```python
FIZZY_EMBED_SECRET: str = ""
KANBAN_INTERNAL_URL: str = "http://kanban-service"     # Docker DNS
KANBAN_URL: str = "https://kanbanshankara.sapta.com"   # Public URL
FIZZY_ACCESS_TOKEN: str = ""
FIZZY_BOARD_ID: str = ""
FIZZY_ACCOUNT_SLUG: str = "1"
```

**File:** `/opt/optithru/docker-compose.yml` — pass env vars to `backend` service:

```yaml
backend:
  environment:
    # ... existing ...
    FIZZY_EMBED_SECRET: ${FIZZY_EMBED_SECRET}
    KANBAN_INTERNAL_URL: http://kanban-service
    KANBAN_URL: ${KANBAN_URL}
    FIZZY_ACCESS_TOKEN: ${FIZZY_ACCESS_TOKEN}
    FIZZY_BOARD_ID: ${FIZZY_BOARD_ID}
    FIZZY_ACCOUNT_SLUG: ${FIZZY_ACCOUNT_SLUG}
```

**File (new):** `/opt/optithru/backend/app/routers/kanban.py`

Key endpoints:
- `POST /api/v1/kanban/session` — generates HMAC-signed embed token, exchanges with Fizzy `/embed/session`, **rewrites `transfer_url` to use `KANBAN_URL`** (the public subdomain)
- `POST /api/v1/kanban/cards` — create card on the TOC board (defaults to Backlog column)
- `POST /api/v1/kanban/cards/move` — move card via `POST /1/cards/{id}/triage.json` with `column_id`
- `POST /api/v1/kanban/toc/actions` — TOC action card from dashboard widgets
- `GET /api/v1/kanban/toc/drawer` — active focus tasks
- `GET /api/v1/kanban/board` — full swimlane JSON

The session endpoint **must** rewrite the transfer URL because Fizzy returns `https://kanban-service/...` (internal hostname) which the browser can't reach. Replace the host with `KANBAN_URL`:

```python
from urllib.parse import urlparse
parsed = urlparse(transfer_url)
data["transfer_url"] = f"{settings.KANBAN_URL}{parsed.path}"
```

**File:** `/opt/optithru/backend/app/main.py` — register router:

```python
from app.routers import ..., kanban
app.include_router(kanban.router, prefix="/api/v1")
```

## Step 7: Build, Start, and Initialize

```bash
cd /opt/optithru
docker compose build kanban-service backend
docker compose up -d kanban-service backend
```

**First-time SSO creates the Fizzy account.** Trigger a session from the frontend (or use httpx to call `/embed/session` directly with a signed token). After that:

```bash
# Get the account slug (which is the script_name like "1")
docker compose exec kanban-service bin/rails runner "puts Account.first.slug"

# Initialize the TOC board with 5 columns
docker compose exec kanban-service bin/rails toc:create_board ACCOUNT_ID=<account_id_uuid>

# Create an API access token for the integration user
docker compose exec kanban-service bin/rails runner "
  identity = Identity.find_by(email_address: 'demo@optithru.com')
  token = identity.access_tokens.create!(description: 'OptiThru Integration', permission: 'write')
  puts token.token
"
```

**CRITICAL:** The access token defaults to `permission: 'read'`. You **must** set it to `'write'` or POST/PATCH calls return 401.

Update `.env` with the values:
```bash
FIZZY_ACCESS_TOKEN=<token from above>
FIZZY_BOARD_ID=<board id from toc:create_board output>
FIZZY_ACCOUNT_SLUG=<slug from above, e.g. "1">
```

Then `docker compose up -d backend` to pick up the new env vars.

## Step 8: Frontend Integration

### Production Page Tabs
**File:** `/opt/optithru/frontend/src/app/dashboard/production/page.tsx`

Use a tabbed layout: "Strategic Kanban" (default, iframe) + "Resources" (existing).

**File (new):** `/opt/optithru/frontend/src/components/production/production-tabs.tsx`

```tsx
'use client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProductionResources } from '@/components/production/production-resources'
import { KanbanEmbed } from '@/components/production/kanban-embed'

export function ProductionTabs({ resources, organizationId }) {
  return (
    <Tabs defaultValue="kanban">
      <TabsList>
        <TabsTrigger value="kanban">Strategic Kanban</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>
      <TabsContent value="kanban"><KanbanEmbed /></TabsContent>
      <TabsContent value="resources">
        <ProductionResources initialResources={resources} organizationId={organizationId} />
      </TabsContent>
    </Tabs>
  )
}
```

### Kanban Embed Component
**File (new):** `/opt/optithru/frontend/src/components/production/kanban-embed.tsx`

Simple iframe that loads the SSO transfer URL. The transfer URL points to `https://kanbanshankara.sapta.com/session/transfers/...` which is fully on the kanban subdomain — no proxy paths, no cookie conflicts.

```tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function KanbanEmbed() {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  // ... fetch /api/v1/kanban/session, set iframeSrc to data.transfer_url + '?embed=true'
  return <iframe src={iframeSrc} className="w-full h-[700px] border-0 rounded-lg" allow="clipboard-write" />
}
```

### Global Task Drawer
**File (new):** `/opt/optithru/frontend/src/components/layout/task-drawer.tsx`

Slide-out drawer triggered from the header's "Tasks" button. Fetches `GET /api/v1/kanban/toc/drawer` and lists active focus cards.

**File:** `/opt/optithru/frontend/src/components/layout/header.tsx` — add a Tasks button next to the existing header buttons.

### "+ Action" Buttons on Dashboard Widgets
**File (new):** `/opt/optithru/frontend/src/components/dashboard/toc-action-button.tsx`

Reusable button that POSTs to `/api/v1/kanban/toc/actions` with the appropriate `toc_step`, `target_metric`, and `linked_entity`.

Add it to:
- `buffer-alerts.tsx` — `toc_step: "protect_buffer"`, `target_metric: "throughput"`, `linked_entity_type: "buffer"`
- `constraint-status.tsx` — `toc_step: "exploit"`, `target_metric: "throughput"`, `linked_entity_type: "constraint"`

## Step 9: Important — Disable Embed Mode

**Why:** We want users to see the **full native Fizzy UI** (top menu, navigation panel, board switching) — not the stripped embed view.

**File:** `/opt/optithru/services/kanban/app/controllers/concerns/embeddable.rb`

```ruby
module Embeddable
  extend ActiveSupport::Concern

  included do
    before_action :set_embed_mode
    helper_method :embed_mode?
  end

  private
    def embed_mode?
      false
    end

    def set_embed_mode
      @embed_mode = false
      cookies.delete(:fizzy_embed) if cookies[:fizzy_embed]
    end
end
```

`embed_mode?` always returns false, even if the URL has `?embed=true`. This keeps the full Fizzy UI visible inside the iframe (header, menu, board navigation, drag-and-drop, etc.).

## Step 10: Verify

1. `docker compose ps` — kanban-service shows healthy with `0.0.0.0:3006->80/tcp`
2. `curl http://localhost:3006/up` returns 200
3. `curl https://kanbanshankara.sapta.com/up` returns 200 (via NPM)
4. Log in to OptiThru, visit `/dashboard/production` — Strategic Kanban tab loads the Fizzy board with full UI inside an iframe
5. Drag-and-drop cards between columns works
6. Click the "+ Action" button on a buffer alert in `/dashboard` — a card appears in the kanban Backlog
7. Click the "Tasks" button in the header — drawer shows active focus cards

## Architecture Decisions — What NOT to Do

These approaches were tried and rejected:

| Approach | Why It Failed |
|---------|--------------|
| Proxy `shankara.sapta.com/kanban/*` to Fizzy via Next.js rewrites | Fizzy uses `script_name` for account scoping, conflicts with URL prefixing |
| `RAILS_RELATIVE_URL_ROOT=/kanban` | Fizzy generates many URLs with `script_name: nil` which strips the prefix |
| Rack middleware to strip `/kanban` and set `SCRIPT_NAME` | Fizzy's `SCRIPT_NAME` is the account slug, not a mount prefix — they collide |
| Native React kanban board calling Fizzy JSON API | Lose drag-and-drop, lose all the rich Fizzy UI features, lose real-time updates |
| Embed mode (`?embed=true`) with `embed_mode?` checks | Hides the menu and board navigation — users can't switch boards |
| `data-turbo="false"` on body | Caused refresh loops with morph mode + CSP nonce mismatches |

The **subdomain + iframe + full Fizzy UI** approach is the only one that gives users the complete native Fizzy experience.

## Demo Cards (Optional)

To populate the board with realistic TOC activity, see `services/kanban` rake or use httpx to POST cards directly. Important: **WIP limit on Active Focus = 3** is enforced server-side. **Full Kit Gate** prevents moving cards to "Ready" without `is_full_kit_complete = true`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway from NPM | Verify `kanban-service` healthy, port 3006 reachable from NPM (test with `curl http://<host>:3006/up`) |
| Iframe shows "Skip to main content" only | Assets blocked by CSP — verify `CSP_FRAME_ANCESTORS=https://shankara.sapta.com` and Websockets support enabled in NPM |
| Iframe shows Fizzy login page | Session cookie not being set — check that `KANBAN_URL` matches the actual public domain exactly |
| API calls return 401 | Access token has `permission: 'read'` — update to `'write'` |
| Cards go to "triage" instead of Backlog | Pass `column_id` when creating, OR use `POST /1/cards/{id}/triage.json` with `column_id` to move them |
| Cards can't move to "Ready" | TOC Full Kit Gate enforces `is_full_kit_complete = true` first — set it before moving |
| Cards rejected from "Active Focus" | WIP limit reached (default: 3) — move a card out first |
| `Identity.find_by_permissable_access_token` fails | Token must be `permission: 'write'` for non-GET requests |
| `secret_key_base` missing on container start | Set `SECRET_KEY_BASE` env var (Fizzy doesn't ship `config/master.key`) |
| `bin/rails toc:create_board` fails with "Account not found" | The account is created on first SSO; trigger SSO first, then use the actual account UUID (not "1") |

## Files Modified Summary

**Backend:**
- `/opt/optithru/backend/app/config.py` — Fizzy settings
- `/opt/optithru/backend/app/routers/kanban.py` — new router
- `/opt/optithru/backend/app/main.py` — register router

**Frontend:**
- `/opt/optithru/frontend/src/app/dashboard/production/page.tsx` — tabbed layout
- `/opt/optithru/frontend/src/components/production/production-tabs.tsx` — new
- `/opt/optithru/frontend/src/components/production/kanban-embed.tsx` — new (iframe)
- `/opt/optithru/frontend/src/components/layout/header.tsx` — Tasks button
- `/opt/optithru/frontend/src/components/layout/task-drawer.tsx` — new (slide-out)
- `/opt/optithru/frontend/src/components/dashboard/toc-action-button.tsx` — new
- `/opt/optithru/frontend/src/components/dashboard/buffer-alerts.tsx` — +Action buttons
- `/opt/optithru/frontend/src/components/dashboard/constraint-status.tsx` — +Action button
- `/opt/optithru/frontend/src/lib/kanban-actions.ts` — helper

**Fizzy (services/kanban):**
- `app/controllers/concerns/embeddable.rb` — `embed_mode?` always false

**Infrastructure:**
- `/opt/optithru/.env` — Fizzy env vars
- `/opt/optithru/docker-compose.yml` — kanban-service (port 3006), env vars on backend
