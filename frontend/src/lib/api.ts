import axios from "axios";
import type { Skin, SkinPrices, PopularItem } from "../types";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export async function searchItems(q: string): Promise<Skin[]> {
  if (!q || q.trim().length < 2) return [];
  const { data } = await api.get<Skin[]>("/items/search", {
    params: { q: q.trim() },
  });
  return data;
}

export async function getPopularItems(): Promise<PopularItem[]> {
  const { data } = await api.get<PopularItem[]>("/items/popular");
  return data;
}

export async function getPrices(name: string): Promise<SkinPrices> {
  const { data } = await api.get<SkinPrices>("/prices", {
    params: { name },
  });
  return data;
}
