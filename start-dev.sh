#!/bin/bash
PROJECT_DIR="$HOME/throughput-os"
echo "Starting Throughput OS..."
echo "Supabase: https://supabase.1in3in5.org (remote)"

# Start FastAPI backend
echo "Starting FastAPI on port 8080..."
cd "$PROJECT_DIR/backend" && uv run fastapi dev app/main.py --port 8080 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start Next.js frontend
echo "Starting Next.js on port 3000..."
cd "$PROJECT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Throughput OS running ==="
echo "Frontend:  http://localhost:3000"
echo "Network:   http://10.1.34.200:3000"
echo "FastAPI:   http://localhost:8080"
echo "Supabase:  https://supabase.1in3in5.org"
echo ""
echo "Press Ctrl+C to stop"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
