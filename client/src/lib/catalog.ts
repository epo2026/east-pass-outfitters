import type { Product } from "@shared/schema";

export type Species = "inshore" | "offshore" | "pelagic" | "piersurf";

export const SPECIES_META: Record<
  Species,
  { label: string; tagline: string; species: string; image: string }
> = {
  inshore: {
    label: "Inshore",
    tagline: "Flats, bays & oyster bars",
    species: "Redfish · Trout · Flounder · Snook",
    image: "/img/cat-inshore.webp",
  },
  offshore: {
    label: "Offshore",
    tagline: "Wrecks, ledges & bluewater",
    species: "Snapper · Grouper · Mahi · Tuna",
    image: "/img/cat-offshore.webp",
  },
  pelagic: {
    label: "Pelagic",
    tagline: "Trolling & nearshore runs",
    species: "King Mackerel · Cobia · Sailfish",
    image: "/img/cat-pelagic.webp",
  },
  piersurf: {
    label: "Pier & Surf",
    tagline: "Beaches, piers & the wash",
    species: "Pompano · Whiting · Spanish · Reds",
    image: "/img/cat-piersurf.webp",
  },
};

// Individual fish species native to the Emerald Coast (Choctawhatchee Bay & Gulf),
// grouped under each tackle category. `slug` is used in the URL (/tackle/:species/:fish).
// `match` lists the keywords we look for inside a product's tags/name to decide
// whether a tackle item is relevant to that fish.
export interface FishSpecies {
  slug: string;
  label: string;
  blurb: string;
  match: string[];
}

export const FISH_SPECIES: Record<Species, FishSpecies[]> = {
  inshore: [
    { slug: "redfish", label: "Redfish", blurb: "Red drum on the flats, bars & passes", match: ["redfish", "red drum"] },
    { slug: "speckled-trout", label: "Speckled Trout", blurb: "Spotted seatrout over the grass", match: ["trout", "speckled", "seatrout"] },
    { slug: "flounder", label: "Flounder", blurb: "Ambush fish in sandy pockets", match: ["flounder"] },
    { slug: "black-drum", label: "Black Drum", blurb: "Bottom feeders around oyster bars", match: ["black drum", "drum"] },
    { slug: "sheepshead", label: "Sheepshead", blurb: "Structure nibblers on the pilings", match: ["sheepshead"] },
    { slug: "jack-crevalle", label: "Jack Crevalle", blurb: "Bulldog brawlers that crash bait in the bay", match: ["jack", "crevalle"] },
    { slug: "ladyfish", label: "Ladyfish", blurb: "Acrobatic skipjacks, great light-tackle fun", match: ["ladyfish", "skipjack"] },
    { slug: "mangrove-snapper", label: "Mangrove Snapper", blurb: "Gray snapper around docks & passes", match: ["mangrove", "gray snapper", "snapper"] },
    { slug: "tripletail", label: "Tripletail", blurb: "Sight-fish them off buoys & floats", match: ["tripletail"] },
    { slug: "snook", label: "Snook", blurb: "Linesiders pushing into warm pockets", match: ["snook", "linesider"] },
    { slug: "tarpon", label: "Tarpon", blurb: "Silver kings rolling the bay in summer", match: ["tarpon", "silver king"] },
    { slug: "gulf-flounder", label: "Gulf Flounder", blurb: "Gigging & jigging the sandy edges", match: ["flounder", "gulf flounder"] },
  ],
  offshore: [
    { slug: "red-snapper", label: "Red Snapper", blurb: "The Emerald Coast's signature reef fish", match: ["red snapper", "snapper"] },
    { slug: "gag-grouper", label: "Gag Grouper", blurb: "Hard-pulling bottom bruisers", match: ["grouper", "gag"] },
    { slug: "red-grouper", label: "Red Grouper", blurb: "Tasty grouper on the live bottom", match: ["grouper", "red grouper"] },
    { slug: "amberjack", label: "Amberjack", blurb: "Reef donkeys around the wrecks", match: ["amberjack", "reef donkey"] },
    { slug: "mahi-mahi", label: "Mahi-Mahi", blurb: "Dolphin on the weed lines & rips", match: ["mahi", "dolphin"] },
    { slug: "vermilion-snapper", label: "Vermilion Snapper", blurb: "Mingo snapper on the deep ledges", match: ["vermilion", "mingo", "snapper"] },
    { slug: "mangrove-snapper", label: "Mangrove Snapper", blurb: "Gray snapper stacked on the reefs", match: ["mangrove", "gray snapper", "snapper"] },
    { slug: "scamp-grouper", label: "Scamp Grouper", blurb: "Prized deep-ledge grouper", match: ["scamp", "grouper"] },
    { slug: "triggerfish", label: "Gray Triggerfish", blurb: "Bait-stealers worth the fight", match: ["trigger", "triggerfish"] },
    { slug: "yellowfin-tuna", label: "Yellowfin Tuna", blurb: "Bluewater tuna on the deep troll", match: ["yellowfin", "tuna"] },
    { slug: "wahoo", label: "Wahoo", blurb: "High-speed trolling for stripes", match: ["wahoo", "hoo"] },
    { slug: "swordfish", label: "Swordfish", blurb: "Deep-drop the canyons at the edge", match: ["sword", "swordfish"] },
  ],
  pelagic: [
    { slug: "king-mackerel", label: "King Mackerel", blurb: "Smoker kings on the troll", match: ["king mackerel", "king"] },
    { slug: "spanish-mackerel", label: "Spanish Mackerel", blurb: "Fast nearshore mackerel action", match: ["spanish"] },
    { slug: "cobia", label: "Cobia", blurb: "Sight-cast the spring migration", match: ["cobia", "ling"] },
    { slug: "blackfin-tuna", label: "Blackfin Tuna", blurb: "Tuna & bonito busting bait", match: ["tuna", "bonito"] },
    { slug: "sailfish", label: "Sailfish", blurb: "Lit-up billfish on the kite spread", match: ["sailfish", "sail", "billfish"] },
    { slug: "blue-marlin", label: "Blue Marlin", blurb: "The bluewater grand slam target", match: ["marlin", "blue marlin", "billfish"] },
    { slug: "little-tunny", label: "Bonito", blurb: "Little tunny that crush nearshore bait", match: ["bonito", "little tunny", "false albacore"] },
    { slug: "barracuda", label: "Barracuda", blurb: "Toothy ambushers on the reefs", match: ["barracuda", "cuda"] },
    { slug: "shark", label: "Sharks", blurb: "Blacktips & spinners on the troll", match: ["shark", "blacktip", "spinner"] },
  ],
  piersurf: [
    { slug: "pompano", label: "Pompano", blurb: "The silver surfers of the wash", match: ["pompano"] },
    { slug: "whiting", label: "Whiting", blurb: "Steady surf action on the beach", match: ["whiting", "surf"] },
    { slug: "spanish-mackerel", label: "Spanish Mackerel", blurb: "Gotcha plugs off the rails", match: ["spanish", "pier"] },
    { slug: "bluefish", label: "Bluefish", blurb: "Toothy schoolers in the surf", match: ["bluefish", "blues"] },
    { slug: "surf-redfish", label: "Redfish", blurb: "Bull reds cruising the trough", match: ["redfish", "red drum", "surf"] },
    { slug: "king-mackerel-pier", label: "King Mackerel", blurb: "Live-bait kings off the pier end", match: ["king", "king mackerel", "pier"] },
    { slug: "black-drum-surf", label: "Black Drum", blurb: "Cut bait on the bottom in the wash", match: ["black drum", "drum", "surf"] },
    { slug: "flounder-surf", label: "Flounder", blurb: "Pick the sandy pockets near structure", match: ["flounder", "surf"] },
    { slug: "cobia-pier", label: "Cobia", blurb: "Spotted from the rails each spring", match: ["cobia", "ling", "pier"] },
    { slug: "sheepshead-pier", label: "Sheepshead", blurb: "Fiddler crabs on the pilings", match: ["sheepshead", "pier"] },
    { slug: "king-whiting", label: "Gulf Kingfish", blurb: "Sea mullet feeding in the suds", match: ["whiting", "kingfish", "sea mullet", "surf"] },
  ],
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

/** Find the fish-species metadata for a given category + fish slug. */
export function findFish(species: Species, fishSlug: string): FishSpecies | undefined {
  return FISH_SPECIES[species]?.find((f) => f.slug === fishSlug);
}

/** Decide whether a tackle product is relevant to a specific fish, using tags + name. */
export function productMatchesFish(p: Product, fish: FishSpecies): boolean {
  const haystack = [p.name, ...parseJsonArray(p.tags)].join(" ").toLowerCase();
  return fish.match.some((kw) => haystack.includes(kw.toLowerCase()));
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
