# Fizzy Integration Handoff Document

> How to integrate the Fizzy kanban board engine into any application.

**Repository:** `github.com/saptainc/fizzy` (branch: `toc-strategic-kanban`)
**Architecture:** Subdomain iframe + HMAC SSO token exchange
**Runtime:** Ruby on Rails, Docker, SQLite/MySQL

---

## 1. Project Status Summary

### OptiThru (Host Application)
OptiThru is a Theory of Constraints / Throughput Accounting SaaS for beauty e-commerce. All Week 1-5 features are implemented and deployed:

- **8 Docker services** running on macvlan network (DB, Auth, REST, Kong, Studio, Backend, Frontend, Kanban)
- **16 dashboard pages** (KPIs, products, rankings, channels, buffers, constraints, financials, simulator, demo, production/kanban)
- **FastAPI backend** with 14 routers including Shopify sync, PDF export, AI insights, and kanban integration
- **20 SQL migrations** with RPC functions for TOC calculations
- **Fizzy kanban** fully integrated via subdomain iframe at `kanban.shankara.sapta.com`

### Fizzy Integration in OptiThru
Fizzy is included as a **git submodule** at `services/kanban/` pointing to `saptainc/fizzy` branch `toc-strategic-kanban`. It runs as a Docker service with its own macvlan IP, accessible via Nginx Proxy Manager on a dedicated subdomain. The host app's FastAPI backend handles SSO token generation and session exchange; the Next.js frontend renders Fizzy in an iframe on the `/dashboard/production` page.

---

## 2. What Is Fizzy?

Fizzy is a collaborative kanban/project management app originally built by 37signals (Basecamp). Key characteristics:

- **Multi-tenant** via URL path: `/{account_id}/boards/...`
- **Passwordless auth** with magic links and session cookies
- **Rich board UI** with columns, cards, comments, assignments, entropy (auto-postpone)
- **Embed-ready** with HMAC SSO tokens and iframe support
- **Self-contained** Rails app with SQLite or MySQL, background jobs via Solid Queue

The `toc-strategic-kanban` branch adds TOC-specific features: swimlane boards organized by TOC steps (Identify, Exploit, Subordinate, Elevate, Repeat), flow gates, and a drawer API for surfacing active cards in host applications.

---

## 3. Integration Architecture

```
┌──────────────────────────────────────────────────────┐
│  Host Application                                    │
│                                                      │
│  Browser ──→ Frontend (your framework)               │
│                │                                     │
│                │ 1. User clicks "Kanban" tab          │
│                │ 2. Frontend calls backend             │
│                ▼                                     │
│  Backend ──→ Generate HMAC embed token               │
│                │                                     │
│                │ 3. POST /embed/session               │
│                │    (server-to-server, Docker DNS)    │
│                ▼                                     │
│  Fizzy ────→ Validates token, provisions user        │
│                │ Returns { transfer_url, ... }       │
│                │                                     │
│                │ 4. Frontend loads iframe              │
│                ▼                                     │
│  ┌────────────────────────────────────────┐          │
│  │  <iframe src="transfer_url?embed=true">│          │
│  │    Full Fizzy board UI rendered here   │          │
│  └────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────┘
```

**Why subdomain + iframe (not path-prefix proxying):**
- Fizzy's `SCRIPT_NAME`-based account scoping breaks under reverse-proxy path prefixes
- Asset pipeline ignores `SCRIPT_NAME` env var
- Cookie scope mismatches across proxy paths
- Turbo morph + CSP nonce conflicts
- Subdomain approach requires **zero modifications** to Fizzy source code

---

## 4. Step-by-Step Integration Guide

### 4.1 Add Fizzy to Your Project

**Option A: Git submodule (recommended)**
```bash
git submodule add -b toc-strategic-kanban \
  https://github.com/saptainc/fizzy.git services/kanban
```

**Option B: Standalone clone**
```bash
git clone -b toc-strategic-kanban \
  https://github.com/saptainc/fizzy.git
```

### 4.2 Docker Compose Service

Add to your `docker-compose.yml`:

```yaml
services:
  kanban-service:
    build:
      context: ./services/kanban   # or wherever you cloned it
      dockerfile: Dockerfile
    environment:
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}           # openssl rand -hex 64
      FIZZY_EMBED_SECRET: ${FIZZY_EMBED_SECRET}     # openssl rand -hex 32
      CSP_FRAME_ANCESTORS: ${APP_URL}               # e.g. https://myapp.example.com
      FIZZY_EMBED_ALLOWED_ORIGINS: ${APP_URL}
      BASE_URL: ${KANBAN_URL}                       # e.g. https://kanban.myapp.example.com
      FORCE_SSL: "false"                            # SSL terminated by reverse proxy
    volumes:
      - kanban_storage:/rails/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/up"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  kanban_storage:
```

Fizzy listens on port 80 inside the container.

### 4.3 Generate Required Secrets

```bash
# Shared secret for HMAC token signing (must match in Fizzy + your backend)
export FIZZY_EMBED_SECRET=$(openssl rand -hex 32)

# Rails secret for Fizzy internals
export SECRET_KEY_BASE=$(openssl rand -hex 64)
```

### 4.4 Reverse Proxy / DNS Setup

Fizzy must run on its own **subdomain** (not a path prefix). Configure your reverse proxy (Nginx, Caddy, Traefik, NPM, etc.):

| Setting | Value |
|---------|-------|
| Domain | `kanban.yourapp.example.com` |
| Forward to | `kanban-service:80` (Docker DNS) or the container's IP |
| SSL | Terminate at proxy, `FORCE_SSL=false` in container |
| WebSockets | **Enable** (required for Turbo Streams / ActionCable) |

### 4.5 Backend: Token Generation + Session Exchange

Your backend needs one endpoint that:
1. Authenticates the current user (your app's auth)
2. Generates an HMAC-SHA256 signed embed token
3. POSTs it to Fizzy's `/embed/session` endpoint (server-to-server)
4. Returns the `transfer_url` to your frontend

**Token format:** `base64url(header).base64url(payload).hmac_hex_signature`

**Payload fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `email` | Yes | User's email (unique identifier in Fizzy) |
| `name` | Yes | Display name |
| `account_name` | Yes* | Organization name (auto-creates if not found) |
| `account_external_id` | Yes* | Or use existing Fizzy account ID |
| `role` | No | `member` (default), `admin`, or `owner` |
| `exp` | Recommended | Unix timestamp, 5 minutes from now |

*One of `account_name` or `account_external_id` is required.

#### Python Example

```python
import hmac, hashlib, base64, json, time
import httpx

FIZZY_EMBED_SECRET = "your-secret"
KANBAN_INTERNAL_URL = "http://kanban-service"  # Docker service name
KANBAN_PUBLIC_URL = "https://kanban.myapp.example.com"

def generate_embed_token(email: str, name: str, account_name: str, role: str = "admin"):
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({
        "email": email,
        "name": name,
        "account_name": account_name,
        "role": role,
        "exp": int(time.time()) + 300,
    }).encode()).decode().rstrip("=")
    signature = hmac.new(
        FIZZY_EMBED_SECRET.encode(),
        f"{header}.{payload}".encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{header}.{payload}.{signature}"

async def create_kanban_session(email, name, org_name):
    token = generate_embed_token(email, name, org_name)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{KANBAN_INTERNAL_URL}/embed/session",
            json={"embed_token": token}
        )
    data = resp.json()
    # Rewrite internal URL to public URL
    data["transfer_url"] = data["transfer_url"].replace(
        KANBAN_INTERNAL_URL, KANBAN_PUBLIC_URL
    )
    return data  # { transfer_url, embed_url, session_token, account_id }
```

#### Node.js Example

```javascript
const crypto = require("crypto");

function generateEmbedToken(user, secret) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    email: user.email,
    name: user.name,
    account_name: user.orgName,
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 300,
  })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("hex");
  return `${header}.${payload}.${signature}`;
}

async function createKanbanSession(user) {
  const token = generateEmbedToken(user, process.env.FIZZY_EMBED_SECRET);
  const resp = await fetch(`${process.env.KANBAN_INTERNAL_URL}/embed/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embed_token: token }),
  });
  const data = await resp.json();
  data.transfer_url = data.transfer_url.replace(
    process.env.KANBAN_INTERNAL_URL,
    process.env.KANBAN_PUBLIC_URL
  );
  return data;
}
```

#### Ruby Example

```ruby
def generate_embed_token(user, secret)
  header = Base64.urlsafe_encode64({ alg: "HS256" }.to_json, padding: false)
  payload = Base64.urlsafe_encode64({
    email: user.email,
    name: user.name,
    account_name: "My Company",
    role: "admin",
    exp: 5.minutes.from_now.to_i
  }.to_json, padding: false)
  signature = OpenSSL::HMAC.hexdigest("SHA256", secret, "#{header}.#{payload}")
  "#{header}.#{payload}.#{signature}"
end
```

### 4.6 Frontend: Iframe Embed

#### React Example

```tsx
"use client";
import { useEffect, useState } from "react";

export function KanbanEmbed({ height = "calc(100vh - 120px)" }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/kanban/session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`, // your auth
          },
        });
        if (!res.ok) throw new Error("Session failed");
        const data = await res.json();
        setSrc(data.transfer_url + "?embed=true");
      } catch (e) {
        setError("Failed to load kanban board");
      }
    }
    loadSession();
  }, []);

  if (error) return <div>{error}</div>;
  if (!src) return <div>Loading boards...</div>;

  return (
    <iframe
      src={src}
      style={{ width: "100%", height, border: "none" }}
      allow="clipboard-write"
    />
  );
}
```

#### Vanilla HTML/JS Example

```html
<iframe id="kanban" style="width:100%; height:600px; border:none;" allow="clipboard-write"></iframe>
<script>
fetch("/api/kanban/session", { method: "POST" })
  .then(r => r.json())
  .then(d => document.getElementById("kanban").src = d.transfer_url + "?embed=true");
</script>
```

**`?embed=true` behavior:** Hides Fizzy's sidebar navigation so only the board content is visible inside the iframe.

### 4.7 First-Run Initialization

After `docker compose up -d`:

1. **Trigger SSO once** — visit your kanban page to create the first Fizzy account via embed token exchange
2. **Create a board** (optional, for TOC-specific setup):
   ```bash
   docker compose exec kanban-service bin/rails toc:create_board ACCOUNT_ID=<uuid>
   ```
3. **Create an API access token** — for server-side board/card operations:
   - Log into Fizzy directly at `https://kanban.yourapp.example.com`
   - Go to Settings → Access Tokens → Create (read+write)
4. **Set additional env vars** (if using the board API):
   ```bash
   FIZZY_ACCESS_TOKEN=<token-from-step-3>
   FIZZY_BOARD_ID=<uuid-of-your-board>
   FIZZY_ACCOUNT_SLUG=1   # usually "1" for first account
   ```

---

## 5. Optional: Board API Integration

Beyond iframe embedding, you can call Fizzy's API from your backend to create/move cards programmatically (e.g., from dashboard action buttons or automated workflows).

### API Endpoints (via Fizzy's REST API)

All calls require `Authorization: Bearer <FIZZY_ACCESS_TOKEN>` header.

| Action | Method | URL |
|--------|--------|-----|
| List boards | GET | `/{account_slug}/boards.json` |
| Get board | GET | `/{account_slug}/boards/{board_id}.json` |
| Create card | POST | `/{account_slug}/boards/{board_id}/cards.json` |
| Move card | PATCH | `/{account_slug}/boards/{board_id}/cards/{card_id}/move.json` |

### Example: Create a Card from Your Backend

```python
async def create_kanban_card(title: str, description: str, column_id: str = None):
    url = f"{KANBAN_INTERNAL_URL}/{FIZZY_ACCOUNT_SLUG}/boards/{FIZZY_BOARD_ID}/cards.json"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json={
            "card": {
                "title": title,
                "description": description,
                "column_id": column_id,  # omit for default/backlog
            }
        }, headers={"Authorization": f"Bearer {FIZZY_ACCESS_TOKEN}"})
    return resp.json()
```

### Example: Task Drawer (Surface Active Cards in Host UI)

OptiThru implements a "Task Drawer" — a slide-out panel in the host app header that shows the current user's assigned cards fetched from Fizzy's API. This lets users see their kanban tasks without switching to the iframe.

---

## 6. Environment Variables Reference

### Fizzy Container

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY_BASE` | Yes | Rails secret (64-char hex) |
| `FIZZY_EMBED_SECRET` | Yes | Shared HMAC secret (32-char hex) |
| `CSP_FRAME_ANCESTORS` | Yes | Host app origin(s), space-separated |
| `FIZZY_EMBED_ALLOWED_ORIGINS` | Yes | Same as CSP_FRAME_ANCESTORS |
| `BASE_URL` | Yes | Public URL of this Fizzy instance |
| `FORCE_SSL` | No | `false` when SSL terminated by proxy |

### Host App Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `FIZZY_EMBED_SECRET` | Yes | Must match Fizzy's secret |
| `KANBAN_INTERNAL_URL` | Yes | Docker DNS name (e.g., `http://kanban-service`) |
| `KANBAN_URL` | Yes | Public subdomain URL |
| `FIZZY_ACCESS_TOKEN` | For API | Bearer token for board/card operations |
| `FIZZY_BOARD_ID` | For API | UUID of the target board |
| `FIZZY_ACCOUNT_SLUG` | For API | Account path segment (usually `"1"`) |

---

## 7. User Mapping

| Host App Concept | Fizzy Concept | Notes |
|------------------|---------------|-------|
| Email address | `Identity.email_address` | Global unique identifier |
| Display name | `User.name` | Per-account |
| User role | `User.role` | owner / admin / member |
| Organization | `Account` | By `account_name` or `account_external_id` |

- Users are **auto-provisioned** on first embed access
- If a Fizzy identity with that email already exists, it's linked automatically
- Role is set on first join; subsequent embeds don't downgrade

---

## 8. Security Considerations

- **FIZZY_EMBED_SECRET** is the trust anchor — keep it server-side only
- Embed tokens should expire in **5 minutes** (single-use for session creation)
- Transfer URLs are time-limited (**4 hours**) and single-use
- Set `CSP_FRAME_ANCESTORS` to **only** your app's origin — never `*`
- The `/embed/session` endpoint skips CSRF (server-to-server calls)
- Always call Fizzy's embed endpoint from your **backend**, never from the browser

---

## 9. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Embedding not configured" | Missing secret | Set `FIZZY_EMBED_SECRET` on Fizzy container |
| "Invalid or expired embed token" | Secret mismatch or clock skew | Verify secrets match; check server clocks |
| iframe blank / "refused to connect" | CSP blocking | Set `CSP_FRAME_ANCESTORS` to your app's origin |
| iframe loads but no boards | Account not created yet | Trigger SSO once to auto-provision |
| WebSocket errors in console | Proxy not forwarding WS | Enable WebSocket support in reverse proxy |
| "Refused to display in a frame" | X-Frame-Options | Ensure CSP_FRAME_ANCESTORS is set correctly |
| Cards not appearing via API | Wrong access token or board ID | Verify `FIZZY_ACCESS_TOKEN` and `FIZZY_BOARD_ID` |
| Transfer URL points to internal host | URL not rewritten | Replace `KANBAN_INTERNAL_URL` with `KANBAN_URL` in response |

---

## 10. Dead Ends (Don't Try These)

These approaches were attempted during OptiThru integration and **failed**:

1. **Path-prefix reverse proxying** (`/kanban/` → Fizzy) — Fizzy's `SCRIPT_NAME` extraction breaks routing, assets don't load
2. **Native React rendering** (importing Fizzy components into host) — Fizzy is a Rails monolith, not a component library
3. **`embed_mode=true` in Fizzy** — Strips too much UI; better to show full Fizzy in iframe (override `embed_mode?` to return `false` in `app/controllers/concerns/embeddable.rb` if needed)
4. **Shared cookie auth** — Different frameworks, different session stores; HMAC token exchange is the correct pattern

---

## 11. Repository Structure (Key Files for Integration)

```
fizzy/                                    # The Fizzy repo
├── Dockerfile                            # Production Docker build
├── app/
│   └── controllers/
│       ├── embed/
│       │   └── sessions_controller.rb    # SSO token verification + session creation
│       └── concerns/
│           └── embeddable.rb             # embed_mode? toggle
├── config/
│   └── initializers/
│       └── content_security_policy.rb    # CSP_FRAME_ANCESTORS config
└── .claude/skills/
    └── embed-fizzy/SKILL.md              # Claude Code skill for integration
```

The `embed/sessions_controller.rb` is the critical file — it handles token verification, user provisioning, and session creation. Everything else in Fizzy runs unmodified.
