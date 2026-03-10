import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Crosshair,
  Zap,
  Globe,
  AlertCircle,
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
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-100 tracking-tight leading-none">
        CS2 Skin{" "}
        <span className="price-shine">Price Compare</span>
      </h1>
      <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto">
        Find the cheapest CS2 skins across Steam, Skinport, CSFloat, and DMarket instantly.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="text-xs text-zinc-600">Try:</span>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onExampleClick(ex)}
            className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:border-amber-500/40 hover:text-amber-400 transition-colors"
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
    { name: "CSFloat", color: "#3b82f6", desc: "P2P listings" },
    { name: "DMarket", color: "#9b59b6", desc: "P2P marketplace" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
      {markets.map((m) => (
        <div
          key={m.name}
          className="flex flex-col items-center gap-1 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors"
        >
          <span
            className="text-sm font-bold"
            style={{ color: m.color }}
          >
            {m.name}
          </span>
          <span className="text-[10px] text-zinc-500">{m.desc}</span>
        </div>
      ))}
    </div>
  );
}

// --- Main Home component ---
export default function Home() {
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggeredSearch, setTriggeredSearch] = useState("");

  // Popular items query
  const {
    data: popularItems = [],
    isLoading: popularLoading,
    isError: popularError,
  } = useQuery<PopularItem[]>({
    queryKey: ["popular"],
    queryFn: getPopularItems,
    staleTime: 1000 * 60 * 10, // 10min
  });

  // Search results (triggered by example clicks or direct searches)
  const {
    data: searchResults = [],
    isLoading: searchLoading,
  } = useQuery<Skin[]>({
    queryKey: ["search", triggeredSearch],
    queryFn: () => searchItems(triggeredSearch),
    enabled: triggeredSearch.trim().length >= 2,
    staleTime: 1000 * 30,
  });

  const handleSelectSkin = useCallback((skin: Skin) => {
    setSelectedSkin(skin);
    setDialogOpen(true);
  }, []);

  const handleExampleClick = useCallback((name: string) => {
    setTriggeredSearch(name);
  }, []);

  // Determine view mode
  const isSearchMode = triggeredSearch.trim().length >= 2;

  // Handle popular item click — find skin from skinData or open with minimal info
  const handlePopularClick = useCallback(
    (item: PopularItem) => {
      if (item.skinData) {
        setSelectedSkin(item.skinData);
        setDialogOpen(true);
      } else {
        // Create a minimal skin object from market_hash_name
        const baseName = item.market_hash_name.replace(
          /\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,
          ""
        );
        const parts = baseName.split(" | ");
        const weaponName = parts[0] || baseName;
        const patternName = parts[1] || "";

        // Find the wear
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <Hero onExampleClick={handleExampleClick} />

      {/* Search bar */}
      <div className="mb-10">
        <SearchBar onSelect={handleSelectSkin} />
      </div>

      {/* Markets bar */}
      <MarketsBar />

      {/* Content area */}
      {isSearchMode ? (
        /* Search results */
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold text-zinc-200">
                Results for{" "}
                <span className="text-amber-400">"{triggeredSearch}"</span>
              </h2>
              {searchResults.length > 0 && (
                <span className="text-xs text-zinc-500">
                  ({searchResults.length} found)
                </span>
              )}
            </div>
            <button
              onClick={() => setTriggeredSearch("")}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
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
            <div className="text-center py-16 text-zinc-500">
              <Crosshair className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No skins found</p>
              <p className="text-sm mt-1">
                Try a different search term
              </p>
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
        /* Popular skins */
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold text-zinc-200">
                Popular Skins
              </h2>
              <span className="text-xs text-zinc-500">via Skinport</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Globe className="h-3 w-3" />
              Updated hourly
            </div>
          </div>

          {popularError && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                Failed to load popular skins. Make sure the backend is running.
              </span>
            </div>
          )}

          {popularLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <SkinCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!popularLoading && popularItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {popularItems.map((item) => (
                <PopularSkinCard
                  key={item.market_hash_name}
                  item={item}
                  onClick={() => handlePopularClick(item)}
                />
              ))}
            </div>
          )}

          {!popularLoading && popularItems.length === 0 && !popularError && (
            <div className="text-center py-16 text-zinc-500">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No popular items found</p>
              <p className="text-sm mt-1">
                The backend may still be loading data
              </p>
            </div>
          )}
        </section>
      )}

      {/* Price comparison dialog */}
      <PriceTable
        skin={selectedSkin}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
