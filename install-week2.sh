#!/bin/bash
# ============================================================
# Week 2 Setup Script for Throughput OS
# Run this on the server: bash install-week2.sh
# ============================================================

PROJECT_DIR="$HOME/throughput-os"

echo "=== Throughput OS: Week 2 Setup ==="
echo "Project: $PROJECT_DIR"
echo ""

# 1. Copy CLAUDE.md to project root
echo "[1/3] Installing CLAUDE.md..."
cp CLAUDE.md "$PROJECT_DIR/CLAUDE.md"
echo "  → $PROJECT_DIR/CLAUDE.md"

# 2. Copy SQL migrations
echo "[2/3] Installing SQL migration files..."
mkdir -p "$PROJECT_DIR/supabase/migrations"
for f in supabase/migrations/*.sql; do
  cp "$f" "$PROJECT_DIR/$f"
  echo "  → $PROJECT_DIR/$f"
done

# 3. Remind about manual steps
echo ""
echo "[3/3] Manual steps remaining:"
echo ""
echo "  A. Apply SQL migrations via Supabase Studio SQL Editor:"
echo "     Open https://supabase.1in3in5.org → SQL Editor"
echo "     Paste and run each file in order:"
echo "       1. supabase/migrations/07-rpc-functions.sql"
echo "       2. supabase/migrations/08-tcu-rankings.sql"
echo "       3. supabase/migrations/09-channel-tcu.sql"
echo "       4. supabase/migrations/10-buffer-management.sql"
echo "       5. supabase/migrations/11-dollar-days.sql"
echo ""
echo "  B. Start Claude Code in the project directory:"
echo "     cd $PROJECT_DIR"
echo "     claude"
echo ""
echo "  C. Give Claude Code this prompt:"
echo '     "Read CLAUDE.md and execute Week 2 cards 36-45 in order.'
echo '      For each card, create all files listed, apply SQL via'
echo '      Supabase Studio, and verify the build passes before'
echo '      moving to the next card."'
echo ""
echo "=== Setup complete ==="
