#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  Throughput OS — Development Environment"
echo "=========================================="

# Detect mode: local Docker Supabase or remote
if [ "$1" = "--local" ]; then
  MODE="local"
elif [ -f "$PROJECT_DIR/supabase/docker-compose.yml" ] && docker compose version > /dev/null 2>&1 && [ "$1" = "--docker" ]; then
  MODE="local"
else
  MODE="remote"
fi

if [ "$MODE" = "local" ]; then
  echo ""
  echo "[1/3] Starting local Supabase (Docker)..."
  cd "$PROJECT_DIR/supabase"
  docker compose up -d
  echo "      Waiting for database..."
  until docker compose exec -T db pg_isready -U supabase_admin -d postgres > /dev/null 2>&1; do
    sleep 2
  done
  echo "      Database ready!"
  sleep 3
  cd "$PROJECT_DIR"
  SUPABASE_URL="http://localhost:8000"
  STUDIO_URL="http://localhost:3001"
else
  echo ""
  echo "[1/3] Using remote Supabase at https://supabase.1in3in5.org"
  SUPABASE_URL="https://supabase.1in3in5.org"
  STUDIO_URL="https://supabase.1in3in5.org"
fi

# Start FastAPI backend
echo ""
echo "[2/3] Starting FastAPI backend (port 8080)..."
cd "$PROJECT_DIR/backend" && uv run fastapi dev app/main.py --port 8080 &
BACKEND_PID=$!
sleep 3

# Start Next.js frontend
echo ""
echo "[3/3] Starting Next.js frontend (port 3000)..."
cd "$PROJECT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  All services running:"
echo ""
echo "  Frontend:         http://localhost:3000"
echo "  Network:          http://10.1.34.200:3000"
echo "  FastAPI docs:     http://localhost:8080/docs"
echo "  Supabase:         $SUPABASE_URL"
if [ "$MODE" = "local" ]; then
echo "  Supabase Studio:  $STUDIO_URL"
echo "  PostgreSQL:       localhost:5432"
fi
echo "=========================================="
echo ""
echo "  Press Ctrl+C to stop all services"
echo "  Use --docker flag to start local Supabase"
echo ""

# Clean shutdown on Ctrl+C
cleanup() {
  echo ""
  echo "Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  if [ "$MODE" = "local" ]; then
    cd "$PROJECT_DIR/supabase" && docker compose down
  fi
  echo "All stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM
wait
