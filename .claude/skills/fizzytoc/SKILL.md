---
name: integrate-toc-kanban
description: Integrate the Fizzy-based TOC Strategic Kanban into a host application with Docker, SSO, and dashboard widget linking
user-invocable: true
---

# Integrate TOC Strategic Kanban into a Host Application

This skill walks you through integrating the Theory of Constraints (TOC) Strategic Kanban — built on the Fizzy engine — into an existing application. The kanban runs as a separate Docker service, authenticates users via SSO token exchange, and connects to your dashboard widgets for insight-to-action workflows.

## Prerequisites

- The host application (your dashboard/ERP/throughput OS) is running and has user authentication
- Docker and Docker Compose are available on the deployment target
- The Fizzy TOC kanban source is available at `https://github.com/saptainc/fizzy` (branch: `toc-strategic-kanban`)

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Host Application (Dashboard / Throughput OS)                    │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │ Buffer Alert  │   │  Constraint  │   │  Financial Metrics  │  │
│  │  Widget       │   │   Widget     │   │   ($T, $I, $OE)     │  │
│  │  [+ Action]   │   │  [+ Action]  │   │                     │  │
│  └──────┬───────┘   └──────┬───────┘   └─────────────────────┘  │
│         │                  │                                     │
│         └────────┬─────────┘                                     │
│                  ▼                                                │
│         POST /api/kanban/toc/actions                             │
│         (creates linked TOC card)                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  <iframe src="...?embed=true">                           │    │
│  │   ┌──────────┬────────────┬───────┬─────────┬─────────┐ │    │
│  │   │ Backlog  │ Full Kit   │ Ready │ Active  │ Impact  │ │    │
│  │   │          │  (Prep)    │       │  Focus  │ Review  │ │    │
│  │   │          │            │       │ WIP: 3  │         │ │    │
│  │   ├──────────┼────────────┼───────┼─────────┼─────────┤ │    │
│  │   │ Swimlane: VP Ops                                   │ │    │
│  │   │ Swimlane: VP Eng                                   │ │    │
│  │   │ Swimlane: VP Sales                                 │ │    │
│  │   └────────────────────────────────────────────────────┘ │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [📋 Active Tasks Drawer]  ← global header icon                 │
└──────────────────────────────────────────────────────────────────┘

        ▲                          │
        │ Nginx Proxy              │
        │ /api/kanban/* ──────►    ▼

┌──────────────────────────────────────────────────────────────────┐
│  kanban-service (Docker container)                               │
│  Fizzy + TOC extensions                                          │
│  - Full Kitting Gate (blocks Ready without complete kit)         │
│  - WIP Limits per column (default: 3 for Active Focus)          │
│  - TOC steps: exploit, subordinate, elevate, protect-buffer     │
│  - Target metrics: $T (throughput), $I (inventory), $OE (opex)  │
│  - Linked entities: constraints, buffers, products               │
└──────────────────────────────────────────────────────────────────┘
```

## Step 1: Clone and Configure the Kanban Service

```bash
# Clone the Fizzy repo with TOC extensions
git clone -b toc-strategic-kanban https://github.com/saptainc/fizzy.git ./services/kanban

# Generate secrets
export FIZZY_EMBED_SECRET=$(openssl rand -hex 32)
echo "FIZZY_EMBED_SECRET=$FIZZY_EMBED_SECRET" >> .env
```

## Step 2: Docker Compose Setup

The kanban service runs alongside the host application — both are containers in the same `docker-compose.yml`. The host app container communicates with the kanban container over a shared Docker network. Two networking options are available:

### Option A: Default Bridge Network (simple, port-mapped)

Both the host app and kanban service share Docker's default bridge network. Containers reach each other by service name. The kanban is also exposed on the host via port mapping.

```yaml
services:
  app:
    # ... your host application container ...
    environment:
      KANBAN_INTERNAL_URL: http://kanban-service  # Container-to-container
      FIZZY_EMBED_SECRET: ${FIZZY_EMBED_SECRET}

  kanban-service:
    build:
      context: ./services/kanban
      dockerfile: services/kanban/Dockerfile
    ports:
      - "3006:80"
    environment:
      RAILS_MASTER_KEY: ${RAILS_MASTER_KEY}
      FIZZY_EMBED_SECRET: ${FIZZY_EMBED_SECRET}
      CSP_FRAME_ANCESTORS: ${APP_ORIGIN:-http://localhost:3000}
      FIZZY_EMBED_ALLOWED_ORIGINS: ${APP_ORIGIN:-http://localhost:3000}
    volumes:
      - kanban_storage:/rails/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/up"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped

volumes:
  kanban_storage:
```

With this setup:
- The host app container reaches the kanban at `http://kanban-service` (Docker DNS) for backend calls like `POST /embed/session` and `POST /toc/actions`
- The browser reaches the kanban at `http://localhost:3006` for iframe embedding
- Set `CSP_FRAME_ANCESTORS` to the origin the browser sees your host app on

### Option B: Existing Macvlan Network (dedicated LAN IPs)

If your host app already runs on a macvlan network with its own LAN IP, add the kanban service to the same network. Both containers get their own IPs and are directly reachable by other hosts on the network.

First, identify your existing macvlan network:

```bash
docker network ls --filter driver=macvlan
```

Then reference it as an external network in your `docker-compose.yml`:

```yaml
services:
  app:
    # ... your host application container ...
    environment:
      KANBAN_INTERNAL_URL: http://${KANBAN_IP:-192.168.1.101}  # Direct IP
      FIZZY_EMBED_SECRET: ${FIZZY_EMBED_SECRET}
    networks:
      lan:
        ipv4_address: ${APP_IP:-192.168.1.100}

  kanban-service:
    build:
      context: ./services/kanban
      dockerfile: services/kanban/Dockerfile
    environment:
      RAILS_MASTER_KEY: ${RAILS_MASTER_KEY}
      FIZZY_EMBED_SECRET: ${FIZZY_EMBED_SECRET}
      CSP_FRAME_ANCESTORS: http://${APP_IP:-192.168.1.100}:3000
      FIZZY_EMBED_ALLOWED_ORIGINS: http://${APP_IP:-192.168.1.100}:3000
    volumes:
      - kanban_storage:/rails/storage
    networks:
      lan:
        ipv4_address: ${KANBAN_IP:-192.168.1.101}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/up"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped

networks:
  lan:
    external: true
    name: ${MACVLAN_NETWORK_NAME:-macvlan_lan}  # Your existing macvlan network

volumes:
  kanban_storage:
```

**Environment variables** (set in `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_IP` | `192.168.1.100` | Host app container's LAN IP |
| `KANBAN_IP` | `192.168.1.101` | Kanban container's LAN IP |
| `MACVLAN_NETWORK_NAME` | `macvlan_lan` | Name of the existing macvlan network on the host |

With this setup:
- Both containers are on the same macvlan network and reach each other by IP
- The host app calls the kanban at `http://192.168.1.101` for backend SSO and API calls
- The browser loads the kanban iframe from `http://192.168.1.101` directly
- Other hosts on the LAN can reach both containers at their respective IPs
- No port mapping needed — each container has its own IP

**Notes:**
- The macvlan network must already exist on the Docker host. If it doesn't, create it:
  ```bash
  docker network create -d macvlan \
    --subnet=192.168.1.0/24 \
    --gateway=192.168.1.1 \
    -o parent=eth0 \
    macvlan_lan
  ```
- Both `APP_IP` and `KANBAN_IP` must be free on the LAN and excluded from your DHCP pool
- The Docker host cannot reach macvlan containers by default. Add a shim interface if needed:
  ```bash
  sudo ip link add macvlan-shim link eth0 type macvlan mode bridge
  sudo ip addr add 192.168.1.99/32 dev macvlan-shim
  sudo ip link set macvlan-shim up
  sudo ip route add 192.168.1.100/32 dev macvlan-shim
  sudo ip route add 192.168.1.101/32 dev macvlan-shim
  ```
- Update `CSP_FRAME_ANCESTORS` to match the origin the browser uses to access the host app (including port if non-standard)

## Step 3: Nginx Proxy Configuration

Route `/api/kanban/*` from your app to the kanban container:

```nginx
upstream kanban_backend {
    server kanban-service:80;
}

location /api/kanban/ {
    rewrite ^/api/kanban/(.*) /$1 break;

    proxy_pass http://kanban_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Fizzy-Embed $http_x_fizzy_embed;

    # WebSocket support for Turbo Streams
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Step 4: SSO Token Exchange

Your backend generates an HMAC-signed token and exchanges it for a Fizzy session. This is how the host app's users seamlessly access the kanban without a separate login.

### Token Format

`base64(header).base64(payload).hmac_sha256_hex`

### Token Payload

```json
{
  "email": "vp-ops@company.com",
  "name": "VP Operations",
  "account_name": "My Company",
  "role": "admin",
  "exp": 1711584000
}
```

### Role Mapping

| Host App Role | Fizzy Role | Kanban Capabilities |
|---------------|------------|---------------------|
| Admin / Executive | `owner` | Full board management, WIP limit config |
| Department Head | `admin` | Manage cards, view all swimlanes |
| Team Member | `member` | View board, update assigned cards |

### Token Generation

#### Ruby
```ruby
def generate_kanban_token(user, secret)
  header = Base64.urlsafe_encode64({ alg: "HS256" }.to_json, padding: false)
  payload = Base64.urlsafe_encode64({
    email: user.email,
    name: user.name,
    account_name: "My Company",
    role: user.executive? ? "owner" : (user.department_head? ? "admin" : "member"),
    exp: 5.minutes.from_now.to_i
  }.to_json, padding: false)
  sig = OpenSSL::HMAC.hexdigest("SHA256", secret, "#{header}.#{payload}")
  "#{header}.#{payload}.#{sig}"
end
```

#### Python
```python
import hmac, hashlib, base64, json, time

def generate_kanban_token(user, secret):
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({
        "email": user.email,
        "name": user.name,
        "account_name": "My Company",
        "role": "admin" if user.is_department_head else "member",
        "exp": int(time.time()) + 300
    }).encode()).decode().rstrip("=")
    sig = hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).hexdigest()
    return f"{header}.{payload}.{sig}"
```

#### Node.js
```javascript
function generateKanbanToken(user, secret) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    email: user.email,
    name: user.name,
    account_name: "My Company",
    role: user.isDepartmentHead ? "admin" : "member",
    exp: Math.floor(Date.now() / 1000) + 300
  })).toString("base64url");
  const sig = require("crypto").createHmac("sha256", secret).update(`${header}.${payload}`).digest("hex");
  return `${header}.${payload}.${sig}`;
}
```

### Session Exchange

```
POST /api/kanban/embed/session
Content-Type: application/json

{ "embed_token": "<token>" }
```

Response:
```json
{
  "transfer_url": "https://kanban.example.com/session/transfers/...",
  "embed_url": "/12345678/boards",
  "session_token": "...",
  "account_id": 12345678
}
```

## Step 5: Initialize a TOC Board

After the kanban service is running, create a TOC board with the standard columns:

```bash
# Via rake task inside the container
docker compose exec kanban-service bin/rails toc:create_board \
  NAME="Strategic Kanban" \
  ACCOUNT_ID=<account-id>
```

Or via the API:

```
POST /api/kanban/{account_id}/toc/boards/{board_id}/setup
Authorization: Bearer <access_token>
```

This creates the five TOC columns:
- **Backlog** — all potential initiatives
- **Full Kitting (Prep)** — gathering prerequisites
- **Ready** — full kit complete, waiting for capacity
- **Active Focus** — WIP-limited (default: 3), the constraint
- **Impact Review** — measuring $T/$I/$OE impact

## Step 6: Embed the Kanban Board

### Standard Board View (iframe)
```html
<iframe
  id="kanban-frame"
  src=""
  style="width: 100%; height: 700px; border: none;"
  allow="clipboard-write"
></iframe>

<script>
async function loadKanban() {
  const res = await fetch("/api/kanban-session", { method: "POST" });
  const data = await res.json();
  document.getElementById("kanban-frame").src = data.transfer_url + "?embed=true";
}
loadKanban();
</script>
```

### Swimlane View (JSON API for custom rendering)
```
GET /api/kanban/{account_id}/toc/boards/{board_id}/swimlane
Authorization: Bearer <access_token>
```

Returns columns, assignees with active focus counts, and cards grouped by column and assignee — ideal for rendering a custom swimlane UI in your dashboard framework.

## Step 7: Connect Dashboard Widgets (Insight-to-Action)

Add a `+ Action` button to your dashboard widgets (Buffer Alerts, Constraint Status, etc.) that creates a TOC card linked to the underlying entity:

```
POST /api/kanban/toc/actions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "board_id": "<board-id>",
  "action": {
    "title": "Exploit bottleneck: CNC Mill #3",
    "toc_step": "exploit",
    "target_metric": "throughput",
    "linked_entity": {
      "type": "constraint",
      "id": "cnc-mill-3",
      "name": "CNC Mill #3"
    }
  }
}
```

### TOC Step Values
| Value | Meaning |
|-------|---------|
| `exploit` | Maximize output of the constraint |
| `subordinate` | Align everything else to the constraint |
| `elevate` | Invest to increase constraint capacity |
| `protect_buffer` | Protect time/stock/capacity buffers |

### Target Metric Values
| Value | Dashboard Label | Meaning |
|-------|----------------|---------|
| `throughput` | $T | Rate of generating money through sales |
| `inventory` | $I | Money tied up in the system |
| `operating_expense` | $OE | Money spent to turn inventory into throughput |

### Linked Entity Types
| Type | Use Case |
|------|----------|
| `constraint` | Link to an identified bottleneck |
| `buffer` | Link to a buffer alert (drum-buffer-rope) |
| `product` | Link to a product/SKU in the system |

## Step 8: Global Task Drawer

Add a task status icon to your app's global header that opens a slide-out drawer showing the current user's active focus tasks:

```
GET /api/kanban/toc/drawer
Authorization: Bearer <access_token>
```

Returns:
```json
{
  "my_active_cards": [
    {
      "id": "...",
      "number": 42,
      "title": "Exploit bottleneck: CNC Mill #3",
      "board": "Strategic Kanban",
      "toc_step": "exploit",
      "target_metric": "throughput",
      "url": "https://kanban.example.com/cards/42"
    }
  ],
  "total_active": 7
}
```

Or load the Fizzy-rendered drawer in a turbo frame:
```html
<turbo-frame id="toc_drawer" src="/api/kanban/toc/drawer" loading="lazy"></turbo-frame>
```

## TOC Flow Rules (Enforced by the Engine)

These rules are enforced server-side — they cannot be bypassed through the UI or API:

| Rule | Behavior |
|------|----------|
| **Full Kitting Gate** | Cards cannot move to "Ready" unless `is_full_kit_complete` is `true` |
| **WIP Limits** | "Active Focus" column has a capacity cap (default: 3). Moving a card in when full returns a validation error |
| **Swimlane Visibility** | Cards are grouped by assignee to surface per-person overload |

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `RAILS_MASTER_KEY` | Yes | Fizzy encryption key (from `config/master.key`) |
| `FIZZY_EMBED_SECRET` | Yes | Shared HMAC secret for SSO tokens |
| `CSP_FRAME_ANCESTORS` | Yes | Host app origin(s) for iframe embedding |
| `FIZZY_EMBED_ALLOWED_ORIGINS` | Yes | Same as CSP_FRAME_ANCESTORS |
| `APP_ORIGIN` | No | Convenience var for bridge mode (defaults to `http://localhost:3000`) |
| `APP_IP` | Macvlan only | Host app container's LAN IP |
| `KANBAN_IP` | Macvlan only | Kanban container's LAN IP |
| `MACVLAN_NETWORK_NAME` | Macvlan only | Name of the existing macvlan network on the Docker host |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Container won't start | Check `RAILS_MASTER_KEY` is set; run `docker compose logs kanban-service` |
| "Embedding not configured" | Set `FIZZY_EMBED_SECRET` env var |
| "Invalid or expired embed token" | Verify secret matches between host app and kanban, check token `exp` |
| iframe refused to display | Set `CSP_FRAME_ANCESTORS` to your app's origin |
| "Full Kit must be complete" | Set `is_full_kit_complete: true` on the card before moving to Ready |
| "WIP limit reached" | Move a card out of Active Focus first, or increase the column's `wip_limit` |
| Swimlane shows no cards | Ensure cards have assignees; unassigned cards appear in the "Unassigned" row |
| `+ Action` returns 401 | Use a valid Bearer token or embed session token |
