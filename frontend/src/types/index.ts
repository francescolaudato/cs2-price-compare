export interface Skin {
  id: string;
  name: string;
  description: string;
  weapon: { id: string; name: string };
  pattern: { name: string };
  min_float: number;
  max_float: number;
  rarity: { id: string; name: string; color: string };
  stattrak: boolean;
  wears: { id: string; name: string }[];
  image: string;
}

export interface MarketPrice {
  market: string;
  price: number | null;
  currency: string;
  url: string;
  available: boolean;
  logo: string;
}

export interface SkinPrices {
  name: string;
  prices: MarketPrice[];
  cheapest: string | null;
}

export interface PopularItem {
  market_hash_name: string;
  min_price: number;
  currency: string;
  quantity: number;
  skinData: Skin | null;
}

export const WEAR_MAP: Record<string, { short: string; full: string }> = {
  factory_new: { short: "FN", full: "Factory New" },
  minimal_wear: { short: "MW", full: "Minimal Wear" },
  field_tested: { short: "FT", full: "Field-Tested" },
  well_worn: { short: "WW", full: "Well-Worn" },
  battle_scarred: { short: "BS", full: "Battle-Scarred" },
};

export const WEAR_ORDER = [
  "factory_new",
  "minimal_wear",
  "field_tested",
  "well_worn",
  "battle_scarred",
];
