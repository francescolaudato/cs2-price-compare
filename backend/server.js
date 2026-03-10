const express = require("express");
const cors = require("cors");
const axios = require("axios");
const NodeCache = require("node-cache");

const app = express();
const PORT = 3001;

// --- Caches ---
const skinsCache = new NodeCache({ stdTTL: 86400 }); // 24h for item DB
const skinportCache = new NodeCache({ stdTTL: 3600 }); // 1h for Skinport
const steamCache = new NodeCache({ stdTTL: 60 }); // 1min for Steam prices

// --- Middleware ---
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

// --- Input sanitization helper ---
function sanitizeString(str, maxLen = 200) {
  if (typeof str !== "string") return "";
  // Strip control characters, limit length
  return str.replace(/[\x00-\x1F\x7F]/g, "").slice(0, maxLen);
}

// --- Simple in-memory rate limiter (per IP, per route) ---
const rateLimitMap = new Map();
function rateLimit(req, res, maxReq = 20, windowMs = 60000) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const key = `${ip}:${req.path}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count++;
  }
  rateLimitMap.set(key, entry);
  if (entry.count > maxReq) {
    res.status(429).json({ error: "Too many requests, please slow down." });
    return false;
  }
  return true;
}

// --- Axios instance with timeout ---
const http = axios.create({ timeout: 8000 });

// --- Helpers ---

/**
 * Fetch and cache the full skins database from ByMykel's CSGO-API.
 */
async function getSkinsDatabase() {
  const cached = skinsCache.get("skins");
  if (cached) return cached;

  console.log("[Cache] Fetching skins database from ByMykel API...");
  const { data } = await http.get(
    "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json"
  );
  skinsCache.set("skins", data);
  console.log(`[Cache] Stored ${data.length} skins.`);
  return data;
}

/**
 * Fetch and cache Skinport items list.
 */
async function getSkinportItems() {
  const cached = skinportCache.get("skinport");
  if (cached) return cached;

  console.log("[Cache] Fetching Skinport items...");
  const { data } = await http.get(
    "https://api.skinport.com/v1/items?app_id=730&currency=EUR&tradable=0"
  );
  skinportCache.set("skinport", data);
  console.log(`[Cache] Stored ${data.length} Skinport items.`);
  return data;
}

/**
 * Parse Steam price string like "€19,50" or "$19.50" into a float.
 */
function parseSteamPrice(priceStr) {
  if (!priceStr) return null;
  // Remove currency symbols and spaces, replace comma decimal separator
  const cleaned = priceStr.replace(/[^0-9,\.]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Build the Steam market URL for a skin.
 */
function steamUrl(marketHashName) {
  return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName)}`;
}

/**
 * Build the Skinport URL for a skin.
 */
function skinportUrl(marketHashName) {
  // Skinport uses hyphens and lowercased slugs, but the direct search link works too
  return `https://skinport.com/market?search=${encodeURIComponent(marketHashName)}`;
}

/**
 * Build the CSFloat URL for a skin.
 */
function csfloatUrl(marketHashName) {
  return `https://csfloat.com/db?market_hash_name=${encodeURIComponent(marketHashName)}`;
}

/**
 * Build the DMarket URL for a skin.
 */
function dmarketUrl(marketHashName) {
  return `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(marketHashName)}`;
}

// =====================
//  ROUTES
// =====================

/**
 * GET /api/items/search?q=QUERY
 * Search skins by name (case-insensitive, partial match).
 */
app.get("/api/items/search", async (req, res) => {
  if (!rateLimit(req, res, 30, 60000)) return;
  try {
    const raw = sanitizeString(req.query.q || "").trim().toLowerCase();
    if (!raw || raw.length < 2) {
      return res.json([]);
    }

    // Normalize: strip special chars so "ak47" matches "AK-47", "ak searing" matches "AK-47 | Searing Rage"
    const normalize = (s) =>
      s.toLowerCase().replace(/[\|\-_\s]+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

    // Split query into individual tokens — ALL must be present (order-independent)
    const tokens = normalize(raw).split(" ").filter(Boolean);

    const skins = await getSkinsDatabase();

    const results = skins
      .filter((skin) => {
        // Build one combined searchable string per skin
        const haystack = normalize(
          [skin.name, skin.weapon?.name, skin.pattern?.name].filter(Boolean).join(" ")
        );
        return tokens.every((token) => haystack.includes(token));
      })
      .slice(0, 30);

    res.json(results);
  } catch (err) {
    console.error("[/api/items/search] Error:", err.message);
    res.status(500).json({ error: "Failed to search items" });
  }
});

/**
 * GET /api/items/popular
 * Return top 20 Skinport items by min_price (descending), enriched with skin DB data.
 */
app.get("/api/items/popular", async (req, res) => {
  if (!rateLimit(req, res, 10, 60000)) return;
  try {
    const [skinportItems, skinsDb] = await Promise.all([
      getSkinportItems(),
      getSkinsDatabase(),
    ]);

    // Build a lookup map from market_hash_name to skinDB entry (base name without wear)
    const skinMap = {};
    for (const skin of skinsDb) {
      if (skin.name) {
        skinMap[skin.name.toLowerCase()] = skin;
      }
    }

    // Sort Skinport items by min_price desc (expensive = popular/notable)
    const sorted = [...skinportItems]
      .filter((item) => item.min_price && item.min_price > 5)
      .sort((a, b) => (b.min_price || 0) - (a.min_price || 0))
      .slice(0, 20);

    // Enrich with skin DB data for image/rarity
    const enriched = sorted.map((item) => {
      // Try to find the base skin (strip wear suffix)
      const baseName = item.market_hash_name
        ? item.market_hash_name.replace(
            /\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,
            ""
          )
        : "";
      const skinData = skinMap[baseName.toLowerCase()] || null;

      return {
        market_hash_name: item.market_hash_name,
        min_price: item.min_price,
        currency: "EUR",
        quantity: item.quantity,
        skinData,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error("[/api/items/popular] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch popular items" });
  }
});

/**
 * GET /api/prices?name=MARKET_HASH_NAME
 * Fetch prices from Steam, Skinport, CSFloat, Buff163 in parallel.
 */
app.get("/api/prices", async (req, res) => {
  if (!rateLimit(req, res, 20, 60000)) return;
  try {
    const name = sanitizeString(req.query.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "name parameter is required" });
    }

    // --- Steam ---
    const steamPromise = (async () => {
      const cacheKey = `steam:${name}`;
      const cached = steamCache.get(cacheKey);
      if (cached !== undefined) return cached;

      try {
        const { data } = await http.get(
          `https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=${encodeURIComponent(name)}`
        );
        const price = parseSteamPrice(data.lowest_price || data.median_price);
        const result = {
          market: "Steam",
          price,
          currency: "EUR",
          url: steamUrl(name),
          available: price !== null,
          logo: "steam",
        };
        steamCache.set(cacheKey, result);
        return result;
      } catch (e) {
        console.warn("[Steam] Error:", e.message);
        return {
          market: "Steam",
          price: null,
          currency: "EUR",
          url: steamUrl(name),
          available: false,
          logo: "steam",
        };
      }
    })();

    // --- Skinport ---
    const skinportPromise = (async () => {
      try {
        const items = await getSkinportItems();
        const item = items.find(
          (i) =>
            i.market_hash_name &&
            i.market_hash_name.toLowerCase() === name.toLowerCase()
        );
        if (item && item.min_price) {
          return {
            market: "Skinport",
            price: item.min_price,
            currency: "EUR",
            url: skinportUrl(name),
            available: true,
            logo: "skinport",
          };
        }
        return {
          market: "Skinport",
          price: null,
          currency: "EUR",
          url: skinportUrl(name),
          available: false,
          logo: "skinport",
        };
      } catch (e) {
        console.warn("[Skinport] Error:", e.message);
        return {
          market: "Skinport",
          price: null,
          currency: "EUR",
          url: skinportUrl(name),
          available: false,
          logo: "skinport",
        };
      }
    })();

    // --- CSFloat (requires CSFLOAT_API_KEY env variable) ---
    const csfloatPromise = (async () => {
      const apiKey = process.env.CSFLOAT_API_KEY;
      if (!apiKey) {
        return {
          market: "CSFloat",
          price: null,
          currency: "EUR",
          url: csfloatUrl(name),
          available: false,
          logo: "csfloat",
          reason: "no_api_key",
        };
      }
      try {
        const { data } = await http.get(
          `https://csfloat.com/api/v1/listings?market_hash_name=${encodeURIComponent(name)}&sort_by=lowest_price&limit=3`,
          { headers: { Authorization: apiKey } }
        );
        const listings = data?.data || data;
        if (Array.isArray(listings) && listings.length > 0) {
          const priceUSD = listings[0].price / 100;
          const priceEUR = Math.round(priceUSD * 0.92 * 100) / 100;
          return {
            market: "CSFloat",
            price: priceEUR,
            currency: "EUR",
            url: csfloatUrl(name),
            available: true,
            logo: "csfloat",
          };
        }
        return { market: "CSFloat", price: null, currency: "EUR", url: csfloatUrl(name), available: false, logo: "csfloat" };
      } catch (e) {
        console.warn("[CSFloat] Error:", e.message);
        return { market: "CSFloat", price: null, currency: "EUR", url: csfloatUrl(name), available: false, logo: "csfloat" };
      }
    })();

    // --- DMarket (public API, no auth required) ---
    const dmarketPromise = (async () => {
      try {
        const { data } = await http.get(
          `https://api.dmarket.com/exchange/v1/market/items?gameId=a8db&title=${encodeURIComponent(name)}&currency=EUR&limit=5&orderBy=price&orderDir=asc`
        );
        const items = data?.objects || [];
        if (items.length > 0) {
          // DMarket price is in cents (EUR)
          const priceEUR = Math.round((items[0].price?.EUR || items[0].extra?.suggestedPrice?.EUR || 0) / 100 * 100) / 100;
          if (priceEUR > 0) {
            return {
              market: "DMarket",
              price: priceEUR,
              currency: "EUR",
              url: dmarketUrl(name),
              available: true,
              logo: "dmarket",
            };
          }
        }
        return { market: "DMarket", price: null, currency: "EUR", url: dmarketUrl(name), available: false, logo: "dmarket" };
      } catch (e) {
        console.warn("[DMarket] Error:", e.message);
        return { market: "DMarket", price: null, currency: "EUR", url: dmarketUrl(name), available: false, logo: "dmarket" };
      }
    })();

    // Wait for all in parallel
    const [steam, skinport, csfloat, dmarket] = await Promise.all([
      steamPromise,
      skinportPromise,
      csfloatPromise,
      dmarketPromise,
    ]);

    const prices = [steam, skinport, csfloat, dmarket];

    // Find cheapest available
    const available = prices.filter((p) => p.available && p.price !== null);
    let cheapest = null;
    if (available.length > 0) {
      const min = available.reduce((a, b) => (a.price < b.price ? a : b));
      cheapest = min.market;
    }

    res.json({ name, prices, cheapest });
  } catch (err) {
    console.error("[/api/prices] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CS2 Price Comparison Backend running on http://localhost:${PORT}`);
  // Pre-warm caches
  getSkinsDatabase().catch((e) => console.error("Pre-warm skins failed:", e.message));
  getSkinportItems().catch((e) => console.error("Pre-warm skinport failed:", e.message));
});
