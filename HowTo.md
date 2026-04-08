# OptiThru Deployment HowTo (NixOS)

End-to-end procedure for deploying OptiThru + Fizzy TOC Kanban on a fresh NixOS host.

The non-NixOS-specific parts (clone, build, bootstrap, NPM, Fizzy) are also covered in the `deploy-optithru` and `fizzy-optithru-integration` Claude skills under `.claude/skills/`. This document focuses on what's different on NixOS and walks through the full procedure end-to-end.

---

## Prerequisites

- A fresh NixOS host with network access
- A user with `sudo` rights
- A LAN with at least 8 free IPs in a contiguous /29 (e.g., `10.1.45.1`–`10.1.45.8`)
- DNS control to create A records for `shankara.sapta.com` and `kanbanshankara.sapta.com`
- Either nginx-proxy-manager (NPM) running somewhere on the same LAN, or willing to run it on the same host
- A GitHub personal access token with read access to the `saptainc/optithru` and `saptainc/fizzy` private repos

---

## 1. NixOS configuration

Edit `/etc/nixos/configuration.nix` (or split into a module). Add or merge:

```nix
{ config, pkgs, ... }:

{
  # ── Docker ──
  virtualisation.docker = {
    enable = true;
    enableOnBoot = true;
    autoPrune.enable = true;
    daemon.settings = {
      "default-address-pool" = [
        { "base" = "172.30.0.0/16"; "size" = 24; }
      ];
    };
  };

  # ── Packages needed for deployment ──
  environment.systemPackages = with pkgs; [
    git
    git-lfs
    openssl
    curl
    wget
    docker-compose      # 'docker compose' subcommand also works via the docker plugin
    jq
    htop
    tmux
  ];

  # ── User in docker group (replace 'hari' with your user) ──
  users.users.hari.extraGroups = [ "docker" "wheel" ];

  # ── SSH ──
  services.openssh = {
    enable = true;
    settings.PasswordAuthentication = false;
    settings.PermitRootLogin = "no";
  };

  # ── Firewall ──
  # macvlan containers bypass the host's iptables, but you still want
  # the host itself reachable for SSH and (if NPM lives here) HTTP/HTTPS.
  networking.firewall = {
    enable = true;
    allowedTCPPorts = [
      22      # SSH
      80      # NPM HTTP
      443     # NPM HTTPS
      81      # NPM admin UI (if you run NPM on this host)
    ];
  };

  # ── Time / locale ──
  time.timeZone = "Asia/Kolkata";   # or your zone
  i18n.defaultLocale = "en_US.UTF-8";

  # ── Hostname ──
  networking.hostName = "optithru-host";
}
```

Apply:

```bash
sudo nixos-rebuild switch
```

Log out and back in so the docker group membership takes effect.

---

## 2. Identify and prepare the parent interface for macvlan

```bash
# Find the LAN interface name (usually eno1, ens18, enp1s0, etc.)
ip -o -4 addr | awk '{print $2, $4}'
```

Note the interface name — call it `<PARENT>`. Note its subnet and gateway too.

> **Note for NixOS:** if the parent is managed by `systemd-networkd` or `NetworkManager`, Docker can still create a macvlan over it, but you may want to ensure it stays up. With the default NixOS DHCP setup (`networking.useDHCP` or `networking.interfaces.<iface>.useDHCP`), this just works.

---

## 3. Create the macvlan network

```bash
# Adjust subnet/gateway/parent to match your LAN
docker network create -d macvlan \
  --subnet=10.1.0.0/16 \
  --gateway=10.1.0.1 \
  -o parent=<PARENT> \
  macvlansp6
```

Verify:

```bash
docker network ls --filter driver=macvlan
docker network inspect macvlansp6 --format '{{range .IPAM.Config}}{{.Subnet}} gw={{.Gateway}}{{end}}'
```

> **Reserve IPs `10.1.45.1`–`10.1.45.8` on your DHCP server** (or pick a different `IP_PREFIX` in the next step) so nothing else on the LAN takes them.

---

## 4. (Optional) Macvlan host shim

By design, the NixOS host **cannot** reach the macvlan container IPs directly — packets go out the parent NIC and never come back. If you need the host to reach `10.1.45.1`–`.8` (e.g., for `curl` testing or if NPM runs on the same host), add a shim interface:

```bash
sudo ip link add macvlan-shim link <PARENT> type macvlan mode bridge
sudo ip addr add 10.1.45.99/32 dev macvlan-shim
sudo ip link set macvlan-shim up
for i in 1 2 3 4 5 6 7 8; do
  sudo ip route add 10.1.45.$i/32 dev macvlan-shim
done
```

To make this persistent on NixOS, add to `configuration.nix`:

```nix
networking.interfaces.macvlan-shim = {
  virtual = true;
  virtualType = "macvlan";
  ipv4.addresses = [{ address = "10.1.45.99"; prefixLength = 32; }];
};
# Plus a oneshot systemd service that adds the per-IP routes
# (the simplest persistent approach).
```

If NPM runs on a **different** host on the same LAN, this shim is not needed — NPM reaches the macvlan IPs directly over the LAN.

---

## 5. Clone and configure OptiThru

```bash
sudo mkdir -p /opt && sudo chown $USER:users /opt
cd /opt
git clone --recurse-submodules \
  https://<USER>:<TOKEN>@github.com/saptainc/optithru.git optithru
cd optithru
```

If the Fizzy submodule didn't pull (private repo, no token in `.gitmodules`):

```bash
git config submodule.services/kanban.url \
  https://<USER>:<TOKEN>@github.com/saptainc/fizzy.git
git submodule update --init --recursive
```

Configure environment:

```bash
cp .env.example .env

# Generate the two secrets
echo "FIZZY_EMBED_SECRET → $(openssl rand -hex 32)"
echo "SECRET_KEY_BASE    → $(openssl rand -hex 64)"

# Edit .env and paste them in. Adjust IP_PREFIX if your LAN isn't 10.1.45.0/24.
nano .env
```

---

## 6. Build and start

```bash
docker compose build
docker compose up -d

# Watch services come up
docker compose ps
docker compose logs -f db auth kong   # ctrl-c when healthy
```

All 8 services should reach `(healthy)`. Studio sometimes shows `unhealthy` due to a flaky internal probe — that's harmless.

---

## 7. Bootstrap

```bash
./bootstrap.sh
```

This applies migrations, seeds the demo data (Shankara Naturals), creates the `demo@optithru.com / demo1234` user, and links them to the org. It will also tell you what manual Fizzy steps remain.

---

## 8. Configure nginx-proxy-manager

DNS A records (whatever DNS provider you use):

- `shankara.sapta.com` → public IP that NPM listens on
- `kanbanshankara.sapta.com` → same

In NPM, create two proxy hosts:

| Domain | Forward To | Port | Websockets | SSL |
|--------|-----------|------|:---:|-----|
| `shankara.sapta.com` | `10.1.45.7` | `3000` | ✅ | Let's Encrypt |
| `kanbanshankara.sapta.com` | `10.1.45.8` | `80` | ✅ | Let's Encrypt |

If NPM runs on the **same** NixOS host, you need the host shim from Step 4 (or run NPM as another docker-compose service on the macvlan with its own IP).

If NPM runs on a **different** host on the LAN, no shim is needed.

---

## 9. First-time Fizzy SSO + board init

```bash
# Open the production page in the browser once. This triggers the SSO
# call which creates the Fizzy account.
xdg-open https://shankara.sapta.com/dashboard/production
# (or just navigate to it manually)

# Then back on the host:
ACCOUNT=$(docker compose exec -T kanban-service bin/rails runner 'puts Account.first.id')
docker compose exec kanban-service bin/rails toc:create_board ACCOUNT_ID=$ACCOUNT

TOKEN=$(docker compose exec -T kanban-service bin/rails runner \
  "puts Identity.find_by(email_address: 'demo@optithru.com').access_tokens.create!(description: 'OptiThru', permission: 'write').token")
BOARD=$(docker compose exec -T kanban-service bin/rails runner \
  "puts Board.find_by(name: 'Strategic Kanban').id")

echo "FIZZY_ACCESS_TOKEN=$TOKEN"
echo "FIZZY_BOARD_ID=$BOARD"
echo "FIZZY_ACCOUNT_SLUG=1   # usually 1, verify with: Account.first.slug"
```

Update `.env` with these three values, then:

```bash
docker compose up -d backend
```

---

## 10. Smoke test

```bash
# From the host (only works if shim is in place; otherwise from another LAN host)
curl -sk https://shankara.sapta.com/ -o /dev/null -w "main app: %{http_code}\n"
curl -sk https://kanbanshankara.sapta.com/up -o /dev/null -w "kanban: %{http_code}\n"

# Demo login
echo "Open https://shankara.sapta.com/login and sign in as demo@optithru.com / demo1234"
```

---

## NixOS-specific gotchas

| Issue | Mitigation |
|-------|-----------|
| `docker: command not found` | `virtualisation.docker.enable = true;` requires `nixos-rebuild switch` and a logout/login |
| User can't run docker without sudo | Add user to `docker` group via `users.users.<name>.extraGroups` |
| Firewall blocks NPM | Open 80/443 (and 81 for NPM admin) in `networking.firewall.allowedTCPPorts` |
| Macvlan parent interface goes down on `nixos-rebuild` | Use `networking.useDHCP` or persistent interface config; avoid making it managed-and-then-orphaned |
| Host can't ping macvlan IPs | Add the shim from Step 4 (this is Linux behavior, not NixOS-specific) |
| `services/kanban` empty after clone | Submodule fetch failed (private repo). Rewrite the URL with a token via `git config submodule.services/kanban.url ...` and re-run `git submodule update --init --recursive` |
| `/opt/optithru` permission denied | `sudo chown $USER:users /opt/optithru` once after creating the parent dir |
| Docker storage fills `/var` | NixOS keeps `/var/lib/docker` on root by default; consider a separate dataset if you have many builds |
| `secret_key_base` missing on kanban startup | `SECRET_KEY_BASE` not set in `.env` — generate with `openssl rand -hex 64` |
| `JWSError JWSInvalidSignature` from PostgREST | `JWT_SECRET` doesn't match the demo keys — must be `super-secret-jwt-token-with-at-least-32-characters-long` (already in `.env.example`) |
| `embed_token invalid` from Fizzy | `FIZZY_EMBED_SECRET` differs between backend and kanban-service — both read from the same `.env`, so ensure both containers were restarted after editing `.env` |
| Cards can't be moved via API (401) | Fizzy access token has `permission: 'read'` — recreate with `permission: 'write'` (Step 9) |

---

## Steps 5–9 are identical on any Linux host

If you're not on NixOS, only Steps 1–4 change:

- **Step 1** → install `docker`, `docker-compose-plugin`, `git`, `openssl` via your distro's package manager and add your user to the `docker` group
- **Step 2** → same `ip` command
- **Step 3** → same `docker network create`
- **Step 4** → same shim, but persisted via `/etc/network/interfaces.d/` or systemd-networkd unit files

The rest of the procedure (clone, .env, build, bootstrap, NPM, SSO) is OS-agnostic.
