#!/bin/bash
# ─── Hybrid Energy Dashboard — Quick Start ────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT_DIR/backend"
FRONTEND="$ROOT_DIR/frontend"

echo ""
echo "⚡  Hybrid Energy Dashboard"
echo "────────────────────────────────────────"

# ── Install dependencies ──────────────────────────────────────────────────────
echo "📦  Installing backend dependencies..."
cd "$BACKEND" && npm install --silent

echo "📦  Installing frontend dependencies..."
cd "$FRONTEND" && npm install --silent

# ── .env check ───────────────────────────────────────────────────────────────
if [ ! -f "$BACKEND/.env" ]; then
  echo ""
  echo "⚠   backend/.env not found — copying from .env.example"
  echo "    → Edit backend/.env and set SIGEN_APP_KEY + SIGEN_APP_SECRET"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
fi

if [ ! -f "$FRONTEND/.env" ]; then
  cp "$FRONTEND/.env.example" "$FRONTEND/.env"
fi

# ── Start both servers ────────────────────────────────────────────────────────
echo ""
echo "🚀  Starting servers..."
echo "    Backend  → http://localhost:4000"
echo "    Frontend → http://localhost:5173"
echo ""

# Start backend in background
cd "$BACKEND" && node server.js &
BACKEND_PID=$!

# Start frontend in foreground
cd "$FRONTEND" && npm run dev

# Kill backend when frontend exits
kill $BACKEND_PID 2>/dev/null
echo "Servers stopped."
