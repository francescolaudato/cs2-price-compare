import { useState } from "react";
import { ExternalLink, Tag, ChevronRight, Zap } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import type { Skin, PopularItem } from "../types";
import { WEAR_MAP } from "../types";

// --- Skeleton for loading state ---
export function SkinCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-1/3 mt-2" />
      </CardContent>
    </Card>
  );
}

// --- Popular item card (from Skinport) ---
interface PopularCardProps {
  item: PopularItem;
  onClick: () => void;
}

export function PopularSkinCard({ item, onClick }: PopularCardProps) {
  const [imgError, setImgError] = useState(false);
  const skin = item.skinData;

  // Extract wear from market_hash_name
  const wearMatch = item.market_hash_name.match(
    /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/
  );
  const wearLabel = wearMatch ? wearMatch[1] : null;

  // Build short wear code
  const wearShort = wearLabel
    ? Object.entries(WEAR_MAP).find(([, v]) => v.full === wearLabel)?.[1]?.short
    : null;

  return (
    <Card
      className="overflow-hidden card-hover cursor-pointer group border-zinc-800 hover:border-zinc-600 transition-colors"
      onClick={onClick}
    >
      {/* Image area */}
      <div className="relative h-40 bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
        {skin?.image && !imgError ? (
          <img
            src={skin.image}
            alt={item.market_hash_name}
            className="h-32 w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <Tag className="h-8 w-8" />
            <span className="text-xs">No image</span>
          </div>
        )}

        {/* Wear badge */}
        {wearShort && (
          <div className="absolute top-2 left-2">
            <span className="text-xs px-1.5 py-0.5 bg-zinc-950/80 rounded text-zinc-300 font-mono border border-zinc-700">
              {wearShort}
            </span>
          </div>
        )}

        {/* Rarity strip */}
        {skin?.rarity?.color && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ backgroundColor: skin.rarity.color }}
          />
        )}
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <p className="text-sm font-semibold text-zinc-100 truncate leading-tight">
          {item.market_hash_name.replace(
            /\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,
            ""
          )}
        </p>
        {skin?.rarity && (
          <p
            className="text-xs mt-0.5 font-medium truncate"
            style={{ color: skin.rarity.color }}
          >
            {skin.rarity.name}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between mt-2.5">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
              From
            </p>
            <p className="text-base font-bold text-amber-400">
              €{item.min_price.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 group-hover:text-amber-400 transition-colors">
            <span>Compare</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Regular skin card (from search results) ---
interface SkinCardProps {
  skin: Skin;
  onClick: () => void;
}

export function SkinCard({ skin, onClick }: SkinCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card
      className="overflow-hidden card-hover cursor-pointer group border-zinc-800 hover:border-zinc-600 transition-colors"
      onClick={onClick}
    >
      {/* Image area */}
      <div className="relative h-40 bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
        {skin.image && !imgError ? (
          <img
            src={skin.image}
            alt={skin.name}
            className="h-32 w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <Tag className="h-8 w-8" />
            <span className="text-xs">No image</span>
          </div>
        )}

        {/* StatTrak badge */}
        {skin.stattrak && (
          <div className="absolute top-2 left-2">
            <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 font-medium flex items-center gap-1">
              <Zap className="h-3 w-3" />
              ST
            </span>
          </div>
        )}

        {/* Wears count */}
        {skin.wears && skin.wears.length > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-1.5 py-0.5 bg-zinc-950/80 rounded text-zinc-400 border border-zinc-700">
              {skin.wears.length}W
            </span>
          </div>
        )}

        {/* Rarity strip */}
        {skin.rarity?.color && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ backgroundColor: skin.rarity.color }}
          />
        )}
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <p className="text-sm font-semibold text-zinc-100 truncate leading-tight">
          {skin.name}
        </p>
        {skin.rarity && (
          <p
            className="text-xs mt-0.5 font-medium"
            style={{ color: skin.rarity.color }}
          >
            {skin.rarity.name}
          </p>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex gap-1 flex-wrap">
            {skin.wears?.slice(0, 3).map((w) => (
              <span
                key={w.id}
                className="text-[10px] px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono"
              >
                {WEAR_MAP[w.id]?.short || w.name.slice(0, 2)}
              </span>
            ))}
            {(skin.wears?.length || 0) > 3 && (
              <span className="text-[10px] px-1 py-0.5 text-zinc-500">
                +{skin.wears.length - 3}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500 group-hover:text-amber-400 transition-colors">
            <span>Prices</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
