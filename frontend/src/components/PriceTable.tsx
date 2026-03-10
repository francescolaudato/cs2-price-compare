import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Zap,
  Shield,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { Skin, MarketPrice } from "../types";
import { WEAR_MAP, WEAR_ORDER } from "../types";
import { getPrices } from "../lib/api";
import { formatPrice } from "../lib/utils";

// --- Market logo components (SVG-free text badges) ---
const MARKET_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  steam: {
    label: "Steam",
    color: "#66c0f4",
    bg: "rgba(102,192,244,0.08)",
    border: "rgba(102,192,244,0.2)",
  },
  skinport: {
    label: "Skinport",
    color: "#e85d26",
    bg: "rgba(232,93,38,0.08)",
    border: "rgba(232,93,38,0.2)",
  },
  csfloat: {
    label: "CSFloat",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
  },
  dmarket: {
    label: "DMarket",
    color: "#9b59b6",
    bg: "rgba(155,89,182,0.08)",
    border: "rgba(155,89,182,0.2)",
  },
};

function MarketBadge({ logo }: { logo: string }) {
  const meta = MARKET_META[logo] || {
    label: logo,
    color: "#aaa",
    bg: "rgba(170,170,170,0.08)",
    border: "rgba(170,170,170,0.2)",
  };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide"
      style={{
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
    >
      {meta.label}
    </span>
  );
}

function PriceRow({
  price,
  isCheapest,
}: {
  price: MarketPrice;
  isCheapest: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        isCheapest
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      }`}
    >
      {/* Market info */}
      <div className="flex items-center gap-3">
        <MarketBadge logo={price.logo} />
        {isCheapest && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
            <TrendingDown className="h-3 w-3" />
            Cheapest
          </span>
        )}
        {!price.available && (
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <AlertCircle className="h-3 w-3" />
            {(price as MarketPrice & { reason?: string }).reason === "no_api_key"
              ? "API key required"
              : "Unavailable"}
          </span>
        )}
      </div>

      {/* Price + CTA */}
      <div className="flex items-center gap-3">
        <span
          className={`text-lg font-bold ${
            isCheapest
              ? "text-emerald-400"
              : price.available
              ? "text-zinc-100"
              : "text-zinc-600"
          }`}
        >
          {price.available && price.price !== null
            ? formatPrice(price.price, price.currency)
            : "—"}
        </span>
        {price.available && (
          <a
            href={price.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant={isCheapest ? "default" : "outline"}
              className="gap-1.5 text-xs"
            >
              Buy
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

// --- Loading skeleton for price table ---
function PriceTableSkeleton() {
  return (
    <div className="space-y-2 mt-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// --- Wear tabs ---
function WearTabs({
  wears,
  selected,
  onChange,
}: {
  wears: { id: string; name: string }[];
  selected: string;
  onChange: (id: string) => void;
}) {
  // Sort by WEAR_ORDER
  const sorted = [...wears].sort(
    (a, b) => WEAR_ORDER.indexOf(a.id) - WEAR_ORDER.indexOf(b.id)
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((wear) => {
        const meta = WEAR_MAP[wear.id];
        const isSelected = selected === wear.id;
        return (
          <button
            key={wear.id}
            onClick={() => onChange(wear.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSelected
                ? "bg-amber-500 text-zinc-950 border-amber-500 shadow-lg shadow-amber-500/20"
                : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {meta?.short || wear.name}
            <span
              className={`ml-1 hidden sm:inline text-[10px] font-normal ${
                isSelected ? "text-zinc-800" : "text-zinc-500"
              }`}
            >
              {meta?.full || wear.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// --- Main PriceTable Dialog ---
interface PriceTableProps {
  skin: Skin | null;
  open: boolean;
  onClose: () => void;
}

export default function PriceTable({ skin, open, onClose }: PriceTableProps) {
  const [selectedWear, setSelectedWear] = useState<string>("");
  const [stattrak, setStattrak] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Default wear when skin changes
  const getDefaultWear = (s: Skin) => {
    if (!s.wears || s.wears.length === 0) return "";
    const sorted = [...s.wears].sort(
      (a, b) => WEAR_ORDER.indexOf(a.id) - WEAR_ORDER.indexOf(b.id)
    );
    // Default to Field-Tested if available, otherwise first
    const ft = sorted.find((w) => w.id === "field_tested");
    return ft ? ft.id : sorted[0].id;
  };

  // Build market hash name
  const buildMarketHashName = (): string => {
    if (!skin) return "";
    const wearLabel =
      skin.wears && selectedWear
        ? skin.wears.find((w) => w.id === selectedWear)?.name || ""
        : "";

    let name = skin.name;
    if (stattrak) {
      name = `StatTrak™ ${name}`;
    }
    if (wearLabel) {
      name = `${name} (${wearLabel})`;
    }
    return name;
  };

  const marketHashName = buildMarketHashName();

  const {
    data: priceData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["prices", marketHashName],
    queryFn: () => getPrices(marketHashName),
    enabled: open && !!marketHashName && marketHashName.length > 0,
    staleTime: 1000 * 60, // 1 min
    retry: 1,
  });

  // Reset state when skin changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  // Set default wear when skin loads
  const handleSkinChange = (s: Skin | null) => {
    if (s) {
      setSelectedWear(getDefaultWear(s));
      setStattrak(false);
      setImgError(false);
    }
  };

  if (skin && selectedWear === "" && skin.wears?.length > 0) {
    handleSkinChange(skin);
  }

  if (!skin) return null;

  const availablePrices =
    priceData?.prices.filter((p) => p.available && p.price !== null) || [];
  const savings =
    availablePrices.length >= 2
      ? Math.max(...availablePrices.map((p) => p.price!)) -
        Math.min(...availablePrices.map((p) => p.price!))
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{skin.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Skin header */}
          <div className="flex gap-4">
            {/* Image */}
            <div className="relative flex-shrink-0 h-28 w-44 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden">
              {skin.image && !imgError ? (
                <img
                  src={skin.image}
                  alt={skin.name}
                  className="h-24 w-full object-contain drop-shadow-lg"
                  onError={() => setImgError(true)}
                />
              ) : (
                <Shield className="h-10 w-10 text-zinc-600" />
              )}
              {skin.rarity?.color && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: skin.rarity.color }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-start gap-2">
                <h2 className="text-xl font-bold text-zinc-100 leading-tight">
                  {stattrak && (
                    <span className="text-orange-400 mr-1">StatTrak™</span>
                  )}
                  {skin.name}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {skin.rarity && (
                  <Badge
                    variant="outline"
                    style={{
                      color: skin.rarity.color,
                      borderColor: `${skin.rarity.color}40`,
                      background: `${skin.rarity.color}10`,
                    }}
                  >
                    {skin.rarity.name}
                  </Badge>
                )}
                {skin.stattrak && (
                  <Badge variant="stattrak">
                    <Zap className="h-3 w-3 mr-1" />
                    StatTrak Available
                  </Badge>
                )}
              </div>

              {skin.description && (
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {skin.description}
                </p>
              )}

              {/* Float range */}
              {skin.min_float !== undefined && skin.max_float !== undefined && (
                <p className="text-xs text-zinc-500">
                  Float:{" "}
                  <span className="text-zinc-300">
                    {skin.min_float.toFixed(2)} – {skin.max_float.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Controls */}
          <div className="space-y-3">
            {/* Wear selector */}
            {skin.wears && skin.wears.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Wear
                </label>
                <WearTabs
                  wears={skin.wears}
                  selected={selectedWear}
                  onChange={setSelectedWear}
                />
              </div>
            )}

            {/* StatTrak toggle */}
            {skin.stattrak && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  StatTrak™
                </label>
                <button
                  onClick={() => setStattrak((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    stattrak ? "bg-orange-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      stattrak ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                {stattrak && (
                  <span className="text-xs text-orange-400 font-medium">
                    Enabled
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Market hash name pill */}
          {marketHashName && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium flex-shrink-0">
                Searching
              </span>
              <span className="text-xs text-zinc-300 font-mono truncate">
                {marketHashName}
              </span>
            </div>
          )}

          <Separator />

          {/* Price comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Price Comparison
              </h3>
              <div className="flex items-center gap-2">
                {savings !== null && savings > 0 && (
                  <span className="text-xs text-emerald-400 font-medium">
                    Save up to {formatPrice(savings, "EUR")}
                  </span>
                )}
                <button
                  onClick={() => refetch()}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="Refresh prices"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {isLoading && <PriceTableSkeleton />}

            {isError && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Failed to fetch prices. Please try again.</span>
                <button
                  onClick={() => refetch()}
                  className="ml-auto underline hover:no-underline text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            {priceData && !isLoading && (
              <div className="space-y-2">
                {priceData.prices.map((price) => (
                  <PriceRow
                    key={price.market}
                    price={price}
                    isCheapest={priceData.cheapest === price.market}
                  />
                ))}

                {availablePrices.length === 0 && (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    No price data available for this skin/wear combination.
                  </div>
                )}

                {/* Summary */}
                {availablePrices.length > 0 && priceData.cheapest && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Best deal on{" "}
                      <span className="font-bold">{priceData.cheapest}</span>
                      {savings !== null && savings > 0 && (
                        <span className="ml-1">
                          — saves you {formatPrice(savings, "EUR")} vs most
                          expensive
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-zinc-600 text-center">
            Prices are approximate and may vary. EUR conversion is estimated.
            Always verify before purchasing.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
