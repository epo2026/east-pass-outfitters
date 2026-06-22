import type { Product } from "@shared/schema";

export type Species = "inshore" | "offshore" | "pelagic" | "piersurf";

export const SPECIES_META: Record<
  Species,
  { label: string; tagline: string; species: string; image: string }
> = {
  inshore: {
    label: "Inshore",
    tagline: "Flats, bays & oyster bars",
    species: "Redfish · Trout · Flounder",
    image: "/img/cat-inshore.png",
  },
  offshore: {
    label: "Offshore",
    tagline: "Wrecks, ledges & bluewater",
    species: "Snapper · Grouper · Mahi",
    image: "/img/cat-offshore.png",
  },
  pelagic: {
    label: "Pelagic",
    tagline: "Trolling & nearshore runs",
    species: "King Mackerel · Cobia · Tuna",
    image: "/img/cat-pelagic.png",
  },
  piersurf: {
    label: "Pier & Surf",
    tagline: "Beaches, piers & the wash",
    species: "Pompano · Spanish Mackerel",
    image: "/img/cat-piersurf.png",
  },
};

export const APPAREL_CATEGORIES: Record<string, string> = {
  shirts: "Shirts & Sun Protection",
  hats: "Hats",
  outerwear: "Outerwear & Shorts",
  accessories: "Accessories",
};

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function productSizes(p: Product): string[] {
  return parseJsonArray(p.sizes);
}
export function productColors(p: Product): string[] {
  return parseJsonArray(p.colors);
}
export function productTags(p: Product): string[] {
  return parseJsonArray(p.tags);
}
