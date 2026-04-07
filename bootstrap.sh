#!/usr/bin/env bash
#
# OptiThru one-shot bootstrap.
# Run after `docker compose up -d` on a fresh deployment.
#
# Idempotent — safe to re-run.

set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example to .env and fill in secrets."
  exit 1
fi

# Load .env so we can use ANON_KEY etc. below
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "==> Waiting for db, auth, kong to be healthy..."
for svc in db auth kong; do
  until docker compose ps "$svc" --format json 2>/dev/null | grep -q '"Health":"healthy"'; do
    sleep 2
  done
  echo "    $svc: healthy"
done

echo "==> Applying migrations (idempotent)..."
docker compose exec -T db psql -U supabase_admin -h localhost -d postgres \
  < supabase/migrations/apply-all-safe.sql > /dev/null

echo "==> Seeding demo data (Shankara Naturals)..."
docker compose exec -T db psql -U supabase_admin -h localhost -d postgres \
  < supabase/seed/demo.sql > /dev/null

echo "==> Creating demo user (demo@optithru.com / demo1234)..."
SIGNUP_RESPONSE=$(docker compose exec -T frontend wget -q -O- \
  'http://kong:8000/auth/v1/signup' \
  --post-data='{"email":"demo@optithru.com","password":"demo1234"}' \
  --header="apikey: ${ANON_KEY}" \
  --header='Content-Type: application/json' 2>&1 || true)

if echo "$SIGNUP_RESPONSE" | grep -q '"id"'; then
  echo "    Created"
elif echo "$SIGNUP_RESPONSE" | grep -qi 'already'; then
  echo "    Already exists"
else
  echo "    Signup response: $SIGNUP_RESPONSE"
fi

echo "==> Linking demo user to Shankara organization..."
docker compose exec -T db psql -U supabase_admin -h localhost -d postgres -c "
  INSERT INTO public.organization_members (user_id, organization_id, role)
  SELECT id, 'a0000000-0000-0000-0000-000000000001', 'owner'
  FROM auth.users WHERE email = 'demo@optithru.com'
  ON CONFLICT DO NOTHING;
" > /dev/null

echo
echo "==> Bootstrap complete for OptiThru."
echo
echo "Demo login: https://${APP_URL#https://}/login"
echo "  Email:    demo@optithru.com"
echo "  Password: demo1234"

# ── Fizzy bootstrap ──
if docker compose ps kanban-service --format json 2>/dev/null | grep -q '"State":"running"'; then
  echo
  echo "==> Fizzy kanban detected. Checking for Strategic Kanban board..."

  EXISTING_BOARD=$(docker compose exec -T kanban-service bin/rails runner \
    "puts Board.find_by(name: 'Strategic Kanban')&.id || ''" 2>/dev/null | tail -1 | tr -d '\r\n ')

  if [ -z "$EXISTING_BOARD" ]; then
    echo "    No Strategic Kanban board yet. To finish Fizzy setup:"
    echo
    echo "    1. Open https://${APP_URL#https://}/dashboard/production once in your browser"
    echo "       (This triggers SSO and creates the Fizzy account.)"
    echo
    echo "    2. Run:"
    echo "       ACCOUNT=\$(docker compose exec -T kanban-service bin/rails runner 'puts Account.first.id')"
    echo "       docker compose exec kanban-service bin/rails toc:create_board ACCOUNT_ID=\$ACCOUNT"
    echo
    echo "    3. Create a write-permission access token:"
    echo "       docker compose exec -T kanban-service bin/rails runner \\"
    echo "         \"puts Identity.find_by(email_address: 'demo@optithru.com').access_tokens.create!(description: 'OptiThru', permission: 'write').token\""
    echo
    echo "    4. Update .env with FIZZY_ACCESS_TOKEN, FIZZY_BOARD_ID, FIZZY_ACCOUNT_SLUG"
    echo "       then: docker compose up -d backend"
  else
    echo "    Strategic Kanban board exists: $EXISTING_BOARD"
    echo "    If FIZZY_ACCESS_TOKEN / FIZZY_BOARD_ID are not in .env, see Step 3-4 above."
  fi
fi

echo
echo "==> Done."
