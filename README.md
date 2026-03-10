# CS2 Skin Price Comparison

A real-time CS2 skin price comparison app that fetches prices from Steam, Skinport, Waxpeer, and DMarket.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query + React Router
- **Backend**: Express.js (Node.js) as an API proxy with caching

## Setup & Running

### 1. Install all dependencies

```bash
# From the project root
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

Or run all at once:

```bash
npm run install:all
```

### 2. Start the development servers

```bash
# From the project root — starts both backend (port 3001) and frontend (port 5173)
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

## API Routes (Backend — port 3001)

| Route | Description |
|-------|-------------|
| `GET /api/items/search?q=QUERY` | Search skins by name (autocomplete) |
| `GET /api/items/popular` | Top 20 most valuable Skinport items |
| `GET /api/prices?name=MARKET_HASH_NAME` | Prices from all 4 markets in parallel |
| `GET /api/health` | Health check |

## Features

- **Autocomplete search** with 300ms debounce across 10,000+ CS2 skins
- **Popular skins** grid from Skinport's live inventory
- **Wear selector** (FN / MW / FT / WW / BS) per skin
- **StatTrak toggle** where available
- **Price comparison** across Steam, Skinport, Waxpeer, and DMarket
- **Cheapest market** highlighted in green with savings calculation
- **Direct buy links** to each marketplace
- Dark CS2-inspired theme with amber accents

## Caching Strategy

| Data | TTL |
|------|-----|
| Skins database (ByMykel) | 24 hours |
| Skinport items list | 1 hour |
| Steam price lookups | 60 seconds |

## Notes

- **Waxpeer** prices are in USD and converted to EUR at ~0.92 rate
- **DMarket** prices are in USD and converted to EUR at ~0.92 rate
- For production, use a real exchange rate API instead of hardcoded conversion rates
- Steam rate-limits its Market API aggressively — the 60s cache helps mitigate this

## Project Structure

```
cs2-skin-comparison/
├── package.json          # Root: runs both servers with concurrently
├── backend/
│   ├── package.json
│   └── server.js         # Express API proxy with all routes
└── frontend/
    ├── src/
    │   ├── components/   # Header, SearchBar, SkinCard, PriceTable
    │   ├── components/ui/ # Shadcn-style UI components
    │   ├── pages/        # Home page
    │   ├── lib/          # API client, utilities
    │   └── types/        # TypeScript interfaces
    └── ...config files
```
