# ⚡ Hybrid Energy Dashboard

Real-time energy monitoring dashboard for Sigenergy solar + battery systems.
Built with React (Vite) + Tailwind + Recharts on the frontend, and Node.js (Express)
as a middleware API layer connecting to the Sigenergy OpenAPI.

---

## Architecture

```
Browser (React/Vite)
   └── GET /api/*  ──►  Express Backend  ──►  Sigenergy OpenAPI
                         (transforms)         openapi-apac.sigencloud.com
```

### Data Flow

| Sigenergy Field      | Dashboard Slot       | Notes                              |
|----------------------|----------------------|------------------------------------|
| `pvPower`            | Generator Load (kW)  | Solar PV generation                |
| `batteryPower` (>0)  | Charging (kW)        | Battery absorbing power            |
| `batteryPower` (<0)  | Battery Load (kW)    | Battery discharging to load        |
| `batterySoc`         | Battery SOC (%)      | State of charge                    |
| `loadPower`          | Load (kW)            | Total consumption                  |
| `gridPower`          | Grid (kW)            | +export / −import                  |

---

## Prerequisites

- Node.js ≥ 18
- Sigenergy OpenAPI credentials (App Key + App Secret)
  → Obtain from: **Control Center → Settings → App Key / App Secret**
- Your system must be **onboarded** to the OpenAPI platform

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set your SIGEN_APP_KEY + SIGEN_APP_SECRET
npm run dev
# Backend starts on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL can remain empty for dev (Vite proxies /api → localhost:4000)
npm run dev
# Frontend starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Required
SIGEN_APP_KEY=your_app_key
SIGEN_APP_SECRET=your_app_secret

# Optional
SIGEN_BASE_URL=https://openapi-apac.sigencloud.com
PORT=4000
FRONTEND_URL=http://localhost:5173

# Optional: Google Geocoding for GPS coordinates on Location tab
GEOCODE_API_KEY=your_google_geocoding_key

# Optional: Supabase for historical data caching
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Frontend (`frontend/.env`)

```env
# Leave empty in development (Vite proxy handles /api → localhost:4000)
# In production, set to your backend URL:
# VITE_API_BASE_URL=https://your-backend.example.com
VITE_API_BASE_URL=
```

---

## API Endpoints (Backend → Frontend)

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | `/api/vessels`            | List all onboarded power stations    |
| GET    | `/api/realtime/:systemId` | Real-time energy flow snapshot       |
| GET    | `/api/history/:systemId`  | Historical data (days/level/date)    |
| GET    | `/api/location/:systemId` | Address + geocoded GPS coordinates   |
| GET    | `/health`                 | Server health check                  |

### Realtime Response Shape

```json
{
  "generator": {
    "status": "ON",
    "load_kw": 3.2,
    "supply_kw": 2.1,
    "charging_kw": 1.1
  },
  "battery": {
    "status": "CHARGING",
    "load_kw": 0,
    "charge_kw": 1.1,
    "soc_percent": 72.5
  },
  "grid": {
    "power_kw": -0.5,
    "importing": true,
    "exporting": false
  },
  "load": {
    "power_kw": 1.8,
    "ev_kw": 0
  },
  "system": {
    "mode": "GENERATOR_CHARGING",
    "is_gen_on": true,
    "last_update": "2026-04-10T09:30:00.000Z",
    "daily_pv_kwh": 12.4
  }
}
```

---

## Sigenergy API Reference (used endpoints)

All endpoints require `Authorization: Bearer <token>` header.

| Purpose              | Path                                  | Method |
|----------------------|---------------------------------------|--------|
| Get token (key auth) | `/openapi/auth/token`                 | POST   |
| System list          | `/openapi/system/list/page`           | POST   |
| Energy flow          | `/openapi/realtime/system/energyflow` | POST   |
| System realtime      | `/openapi/realtime/system`            | POST   |
| Device list          | `/openapi/device/list`                | POST   |
| Device realtime      | `/openapi/realtime/device`            | POST   |
| System history       | `/openapi/history/system`             | POST   |

> **Note**: Exact API paths may vary — confirm in the Sigenergy Developer Portal.
> If a path returns 404, check the portal for the correct endpoint prefix.

---

## Features

- ✅ Real-time energy flow visualization (SVG ship canvas)
- ✅ 5-second polling with countdown timer
- ✅ Battery SOC color indicator (green/amber/red)
- ✅ Solar vs Battery runtime sparklines
- ✅ 7D / 14D / 30D runtime summary bar chart
- ✅ Location tab with OpenStreetMap (dark theme)
- ✅ Skeleton loading states
- ✅ Error states with friendly messages
- ✅ Token caching (avoids re-auth on every request)
- ✅ Response caching (respects Sigenergy rate limits)
- ✅ Vessel search / filter in sidebar

---

## Production Build

```bash
# Frontend
cd frontend
npm run build
# Output: frontend/dist/ — deploy to any static host (Netlify, Vercel, etc.)

# Backend
cd backend
NODE_ENV=production npm start
# Deploy to: Railway, Render, Fly.io, EC2, etc.
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `SIGEN_APP_KEY not set` warning | Add credentials to `backend/.env` |
| 401 Unauthorized from Sigenergy | Check App Key/Secret, ensure system is onboarded |
| Rate limit errors (429) | API allows 1 call/5 min per station; backend caches responses |
| Map shows wrong location | Set `GEOCODE_API_KEY` in backend `.env` for GPS geocoding |
| No vessels shown | Confirm systems are onboarded in Sigenergy Control Center |
| History data empty | Sigenergy history requires `level=Month` for multi-day data |
