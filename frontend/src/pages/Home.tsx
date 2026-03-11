import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Crosshair,
  Zap,
  Globe,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import { SkinCard, PopularSkinCard, SkinCardSkeleton } from "../components/SkinCard";
import PriceTable from "../components/PriceTable";
import type { Skin, PopularItem } from "../types";
import { getPopularItems, searchItems } from "../lib/api";

// --- Hero section ---
function Hero({ onExampleClick }: { onExampleClick: (name: string) => void }) {
  const examples = ["AK-47 | Redline", "AWP | Dragon Lore", "M4A4 | Howl"];
  return (
    <div className="text-center space-y-4 mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-medium mb-2">
        <Zap className="h-3 w-3" />
        Real-time price comparison across 4 markets
      </div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
        CS2 Skin{" "}
        <span className="price-shine">Price Compare</span>
      </h1>
      <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
        Find the cheapest CS2 skins across Steam, Skinport, Waxpeer, and DMarket instantly.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground">Try:</span>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onExampleClick(ex)}
            className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Markets bar ---
function MarketsBar() {
  const markets = [
    { name: "Steam", color: "#66c0f4", desc: "Official market" },
    { name: "Skinport", color: "#e85d26", desc: "No-trade skins" },
    { name: "Waxpeer", color: "#22c55e", desc: "P2P marketplace" },
    { name: "DMarket", color: "#9b59b6", desc: "P2P marketplace" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
      {markets.map((m) => (
        <div
          key={m.name}
          className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border bg-secondary/50 hover:border-foreground/20 transition-colors"
        >
          <span className="text-sm font-bold" style={{ color: m.color }}>
            {m.name}
          </span>
          <span className="text-[10px] text-muted-foreground">{m.desc}</span>
        </div>
      ))}
    </div>
  );
}

type PriceFilter = "all" | "under50" | "50-200" | "over200";
type CategoryFilter =
  | "all"
  | "weapons" | "ak47" | "awp" | "m4" | "pistols" | "smg"
  | "knives"
  | "cases"
  | "stickers"
  | "agents";

const WEAPON_PREFIXES: Record<string, CategoryFilter> = {
  "AK-47": "ak47",
  "AWP": "awp",
  "M4A4": "m4",
  "M4A1-S": "m4",
  "Glock-18": "pistols",
  "Desert Eagle": "pistols",
  "USP-S": "pistols",
  "Five-SeveN": "pistols",
  "P250": "pistols",
  "Tec-9": "pistols",
  "CZ75-Auto": "pistols",
  "Dual Berettas": "pistols",
  "P2000": "pistols",
  "R8 Revolver": "pistols",
  "MP9": "smg",
  "MAC-10": "smg",
  "MP7": "smg",
  "MP5-SD": "smg",
  "PP-Bizon": "smg",
  "UMP-45": "smg",
  "P90": "smg",
};

function getItemCategory(name: string): CategoryFilter {
  if (name.startsWith("★")) return "knives";
  if (name.startsWith("Sticker |")) return "stickers";
  if (/\b(Case|Capsule)\b/.test(name) && !name.includes(" | ")) return "cases";
  if (
    name.includes(" | ") &&
    !/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/.test(name)
  )
    return "agents";
  // Check specific weapon
  for (const [prefix, cat] of Object.entries(WEAPON_PREFIXES)) {
    if (name.startsWith(prefix + " |") || name.startsWith(prefix + " (")) return cat;
  }
  return "weapons";
}

// --- Filters bar for popular section ---
function PopularFilters({
  categoryFilter,
  priceFilter,
  onCategoryChange,
  onPriceChange,
}: {
  categoryFilter: CategoryFilter;
  priceFilter: PriceFilter;
  onCategoryChange: (c: CategoryFilter) => void;
  onPriceChange: (p: PriceFilter) => void;
}) {
  const categories: { value: CategoryFilter; label: string; group?: string }[] = [
    { value: "all", label: "All" },
    { value: "ak47", label: "AK-47", group: "weapons" },
    { value: "awp", label: "AWP", group: "weapons" },
    { value: "m4", label: "M4A4 / M4A1-S", group: "weapons" },
    { value: "pistols", label: "Pistols", group: "weapons" },
    { value: "smg", label: "SMGs", group: "weapons" },
    { value: "weapons", label: "Other weapons", group: "weapons" },
    { value: "knives", label: "Knives" },
    { value: "cases", label: "Cases" },
    { value: "stickers", label: "Stickers" },
    { value: "agents", label: "Agents" },
  ];

  const priceOptions: { value: PriceFilter; label: string }[] = [
    { value: "all", label: "All prices" },
    { value: "under50", label: "< €50" },
    { value: "50-200", label: "€50–€200" },
    { value: "over200", label: "> €200" },
  ];

  const pill = (active: boolean) =>
    `text-xs px-2.5 py-1 rounded-full border transition-colors ${
      active
        ? "border-amber-500 bg-amber-500/10 text-amber-400"
        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
    }`;

  return (
    <div className="space-y-2 mb-5 p-3 rounded-xl border border-border bg-secondary/30">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button key={c.value} onClick={() => onCategoryChange(c.value)} className={pill(categoryFilter === c.value)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Price filter */}
      <div className="flex flex-wrap gap-1.5">
        {priceOptions.map((opt) => (
          <button key={opt.value} onClick={() => onPriceChange(opt.value)} className={pill(priceFilter === opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Main Home component ---
export default function Home() {
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [triggeredSearch, setTriggeredSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const {
    data: popularItems = [],
    isLoading: popularLoading,
    isError: popularError,
  } = useQuery<PopularItem[]>({
    queryKey: ["popular"],
    queryFn: getPopularItems,
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: searchResults = [],
    isLoading: searchLoading,
  } = useQuery<Skin[]>({
    queryKey: ["search", triggeredSearch],
    queryFn: () => searchItems(triggeredSearch),
    enabled: triggeredSearch.trim().length >= 2,
    staleTime: 1000 * 30,
  });

  // Apply filters
  const filteredPopularItems = useMemo(() => {
    return popularItems.filter((item) => {
      if (categoryFilter !== "all") {
        const cat = getItemCategory(item.market_hash_name);
        const weaponCats = new Set<CategoryFilter>(["ak47", "awp", "m4", "pistols", "smg", "weapons"]);
        // "weapons" group matches all weapon sub-categories
        if (categoryFilter === "weapons") {
          if (!weaponCats.has(cat)) return false;
        } else if (cat !== categoryFilter) {
          return false;
        }
      }
      if (priceFilter === "under50" && item.min_price >= 50) return false;
      if (priceFilter === "50-200" && (item.min_price < 50 || item.min_price > 200)) return false;
      if (priceFilter === "over200" && item.min_price <= 200) return false;
      return true;
    });
  }, [popularItems, categoryFilter, priceFilter]);

  const visibleItems = filteredPopularItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPopularItems.length;

  const handleSelectSkin = useCallback((skin: Skin) => {
    setSelectedSkin(skin);
    setDialogOpen(true);
  }, []);

  const handleExampleClick = useCallback((name: string) => {
    setTriggeredSearch(name);
  }, []);

  const isSearchMode = triggeredSearch.trim().length >= 2;

  const handlePopularClick = useCallback(
    (item: PopularItem) => {
      if (item.skinData) {
        setSelectedSkin(item.skinData);
        setDialogOpen(true);
      } else {
        const baseName = item.market_hash_name.replace(
          /\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,
          ""
        );
        const parts = baseName.split(" | ");
        const weaponName = parts[0] || baseName;
        const patternName = parts[1] || "";
        const wearMatch = item.market_hash_name.match(
          /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/
        );
        const wearFull = wearMatch ? wearMatch[1] : "";
        const WEAR_IDS: Record<string, string> = {
          "Factory New": "factory_new",
          "Minimal Wear": "minimal_wear",
          "Field-Tested": "field_tested",
          "Well-Worn": "well_worn",
          "Battle-Scarred": "battle_scarred",
        };
        const wearId = wearFull ? WEAR_IDS[wearFull] : "field_tested";
        const fakeSkin: Skin = {
          id: item.market_hash_name,
          name: baseName,
          description: "",
          weapon: { id: "", name: weaponName },
          pattern: { name: patternName },
          min_float: 0,
          max_float: 1,
          rarity: { id: "", name: "", color: "#aaaaaa" },
          stattrak: false,
          wears: wearId ? [{ id: wearId, name: wearFull }] : [],
          image: "",
        };
        setSelectedSkin(fakeSkin);
        setDialogOpen(true);
      }
    },
    []
  );

  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) + (priceFilter !== "all" ? 1 : 0);

  // Reset pagination when filters change
  const handleCategoryChange = (c: CategoryFilter) => { setCategoryFilter(c); setVisibleCount(20); };
  const handlePriceChange = (p: PriceFilter) => { setPriceFilter(p); setVisibleCount(20); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Hero onExampleClick={handleExampleClick} />

      <div className="mb-10">
        <SearchBar onSelect={handleSelectSkin} />
      </div>

      <MarketsBar />

      {isSearchMode ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold">
                Results for{" "}
                <span className="text-amber-400">"{triggeredSearch}"</span>
              </h2>
              {searchResults.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({searchResults.length} found)
                </span>
              )}
            </div>
            <button
              onClick={() => setTriggeredSearch("")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>

          {searchLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkinCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!searchLoading && searchResults.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Crosshair className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No skins found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((skin: Skin) => (
                <SkinCard
                  key={skin.id}
                  skin={skin}
                  onClick={() => handleSelectSkin(skin)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold">Popular Skins</h2>
              <span className="text-xs text-muted-foreground">via Skinport</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                Updated hourly
              </div>
              {!popularLoading && popularItems.length > 0 && (
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-400"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-amber-500 text-zinc-950 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {popularError && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Failed to load popular skins. Make sure the backend is running.</span>
            </div>
          )}

          {showFilters && (
            <PopularFilters
              categoryFilter={categoryFilter}
              priceFilter={priceFilter}
              onCategoryChange={handleCategoryChange}
              onPriceChange={handlePriceChange}
            />
          )}

          {popularLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <SkinCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!popularLoading && visibleItems.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {visibleItems.map((item) => (
                  <PopularSkinCard
                    key={item.market_hash_name}
                    item={item}
                    onClick={() => handlePopularClick(item)}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setVisibleCount((c) => c + 20)}
                    className="px-5 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    Load more ({filteredPopularItems.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}

          {!popularLoading && filteredPopularItems.length === 0 && !popularError && (
            <div className="text-center py-16 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">
                {popularItems.length === 0 ? "No popular items found" : "No items match your filters"}
              </p>
              <p className="text-sm mt-1">
                {popularItems.length === 0
                  ? "The backend may still be loading data"
                  : "Try adjusting your filters"}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { handleCategoryChange("all"); handlePriceChange("all"); }}
                  className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <PriceTable
        skin={selectedSkin}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
