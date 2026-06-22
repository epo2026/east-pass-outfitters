import { SPECIES_META, type Species } from "@/lib/catalog";

// Static blog content. Organized by the same Species categories the tackle shop
// uses (inshore / offshore / pelagic / piersurf) so the journal mirrors the
// "shop by where you fish" structure. Each post is a how/where guide for a
// target species on the Emerald Coast.

export interface BlogSection {
  heading: string;
  /** Paragraphs of prose. */
  body?: string[];
  /** Optional bullet list rendered after the body. */
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Tackle category this post lives under. */
  species: Species;
  /** Headline fish (display only). */
  fish: string;
  /** Optional fish-page slug to deep-link "Shop tackle for this fish". */
  fishSlug?: string;
  excerpt: string;
  /** "Best window" callout. */
  bestTime: string;
  readMinutes: number;
  image: string;
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  // ---------- INSHORE ----------
  {
    slug: "redfish-choctawhatchee-flats",
    title: "Chasing Redfish on the Choctawhatchee Flats",
    species: "inshore",
    fish: "Redfish",
    fishSlug: "redfish",
    excerpt:
      "Where to find tailing reds in the bay and the simple presentations that get them to eat.",
    bestTime: "Fall through early winter, low incoming tide",
    readMinutes: 6,
    image: "/img/cat-inshore.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Choctawhatchee Bay holds redfish year-round, but the back lagoons, grass flats, and oyster-lined shorelines on the north side are where you will consistently find them feeding. Look for sandy potholes inside the grass, the edges of oyster bars, and any creek mouth dumping bait into the bay on a falling tide.",
          "In the cooler months, reds school up and push onto shallow mud flats that warm fast in the afternoon sun. On a calm, sunny day you can sight-fish wakes and tailing fish in less than two feet of water.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "Keep it simple. A weedless gold spoon or a soft plastic on a light jighead covers most situations. When fish are spooky in skinny water, slow down and lead the fish, letting the bait sink and twitching it just enough to draw a strike.",
          "If you would rather soak bait, a live shrimp or cut mullet under a popping cork over a grass flat is hard to beat. Pop it a couple of times, let it sit, and watch the cork disappear.",
        ],
        bullets: [
          "Gold weedless spoon for covering water",
          "Paddletail on a 1/8 oz jighead for potholes",
          "Live shrimp under a popping cork for numbers",
          "7-foot medium spinning rod, 10-15 lb braid, 20 lb leader",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Wind is your friend on pressured flats. A light chop breaks up your profile and gives you a few extra feet before a red spooks. Save the glass-calm mornings for the spots no one else can reach.",
        ],
      },
    ],
  },
  {
    slug: "speckled-trout-grass-flats",
    title: "Speckled Trout on the Grass Flats",
    species: "inshore",
    fish: "Speckled Trout",
    fishSlug: "speckled-trout",
    excerpt:
      "Dialing in depth, tide, and lure choice for a steady trout bite over turtle grass.",
    bestTime: "Spring and fall, first two hours of daylight",
    readMinutes: 5,
    image: "/img/cat-inshore.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Speckled trout relate to grass. The deeper turtle-grass flats in three to six feet of water hold the bigger fish, while schools of cookie-cutter keepers stack up on the shallow grass edges at first light. Drop-offs where a flat falls into a channel are reliable all season.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "A soft plastic under a popping cork is the most forgiving setup on the coast, and it flat-out catches trout. Set your leader so the bait rides just above the grass. For larger gator trout, throw a topwater plug at dawn and hold on.",
        ],
        bullets: [
          "Popping cork + soft plastic shrimp imitation",
          "Topwater walking bait at first light for big fish",
          "Suspending twitchbait when the water cools",
          "Fish the moving water around tide changes",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Trout have soft mouths. Fish a slightly slower, sweeping hookset rather than a hard snap, and back your drag off a touch so you don't pull the hook on the jump.",
        ],
      },
    ],
  },
  {
    slug: "flounder-passes-and-pockets",
    title: "Flounder in the Passes and Sandy Pockets",
    species: "inshore",
    fish: "Flounder",
    fishSlug: "flounder",
    excerpt:
      "How to work bottom structure and the fall run for doormat flounder around the inlets.",
    bestTime: "October fall run, last of the outgoing tide",
    readMinutes: 5,
    image: "/img/cat-inshore.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Flounder are ambush predators that bury in sand next to structure and wait. Focus on the sandy pockets along jetties, dock pilings, bridge shadows, and the edges of passes where current funnels bait. During the fall run, fish stage near the inlets before pushing out to the Gulf to spawn.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "Slow is the name of the game. Drag a jighead tipped with a soft plastic or a live mud minnow along the bottom, pausing often. When you feel the distinctive 'thump' and weight, drop your rod tip, let the fish turn the bait, then come tight.",
        ],
        bullets: [
          "Jighead + finesse soft plastic or live mud minnow",
          "Carolina rig with a live finger mullet near structure",
          "Drag slow and pause; let the fish eat before you set",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Work the down-current side of any piling or rock. Flounder sit facing into the current and wait for the bait to wash to them, so your presentation should drift naturally with the flow.",
        ],
      },
    ],
  },

  // ---------- OFFSHORE ----------
  {
    slug: "red-snapper-emerald-coast-reefs",
    title: "Red Snapper on the Emerald Coast Reefs",
    species: "offshore",
    fish: "Red Snapper",
    fishSlug: "red-snapper",
    excerpt:
      "Finding live bottom, rigging for big sows, and getting bit when the reef is crowded.",
    bestTime: "Open-season summer days, slack tide windows",
    readMinutes: 7,
    image: "/img/cat-offshore.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Destin and Pensacola sit on one of the richest red snapper fisheries in the country. Public reefs and wrecks hold fish, but the better-class sows live on the less-pressured spots: isolated rock piles, ledges, and the down-current edge of any structure. A good bottom machine that marks the fish stacked off the structure is worth its weight in gold.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "Drop a knocker rig or a Carolina rig with a fresh cigar minnow, hardtail, or cut bonito straight down to the fish. The biggest snapper often sit just off the bottom, so don't be afraid to crank up a few turns once your bait settles. When the bite is tough, scale down your leader and pin a live bait through the nose.",
        ],
        bullets: [
          "Knocker rig with a 6-8 oz egg sinker for current",
          "5/0-7/0 circle hook; let the fish load the rod",
          "Live hardtails or cigar minnows for the big girls",
          "Heavy spinning or conventional, 50-65 lb braid",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Chum the water column with a few chunks before you drop. Getting the snapper fired up and rising off the structure means you hook them higher in the water and have a better shot at turning their head before they rock you up.",
        ],
      },
    ],
  },
  {
    slug: "gag-grouper-ledges-and-wrecks",
    title: "Gag Grouper on the Ledges and Wrecks",
    species: "offshore",
    fish: "Gag Grouper",
    fishSlug: "gag-grouper",
    excerpt:
      "The heavy tackle and fast-cranking technique you need to keep a gag out of the rocks.",
    bestTime: "Cooler months as gags move shallower",
    readMinutes: 6,
    image: "/img/cat-offshore.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Gag grouper love high-relief structure: rock ledges, large wrecks, and limestone bottom. As the water cools in fall and winter, gags move into shallower nearshore numbers, putting them in reach of more boats. Look for the biggest, ugliest structure on your chart and the fish that mark tight to it.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "Grouper fishing is a power game. The moment a gag eats, it tries to bury you in the rocks, so you fish heavy gear and lock the drag. A large live bait, a trolled deep-diving plug along a ledge, or a heavy jig all produce. When one eats, crank hard and fast for the first ten feet, no matter what.",
        ],
        bullets: [
          "80-100 lb braid with a heavy mono leader",
          "Live pinfish or large cigar minnows on a fish-finder rig",
          "Trolling deep plugs to locate fish along ledges",
          "Stout conventional outfit; don't give an inch",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Know the regulations before you go. Gag seasons and size limits change, so check current Gulf rules and only keep what's legal. A healthy released fish is the next angler's keeper.",
        ],
      },
    ],
  },
  {
    slug: "mahi-mahi-weed-lines",
    title: "Mahi-Mahi on the Weed Lines",
    species: "offshore",
    fish: "Mahi-Mahi",
    fishSlug: "mahi-mahi",
    excerpt:
      "Running the bluewater, reading weed lines and rips, and keeping a school boatside.",
    bestTime: "Late spring through summer, blue water close to shore",
    readMinutes: 6,
    image: "/img/cat-offshore.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Mahi are the bluewater bonus fish. When clean blue water pushes within running range, look for floating weed lines, rips, current edges, and any debris or buoy. A frigatebird working overhead is a flashing neon sign that fish are below. Mahi roam, so cover water until you find the structure that's holding bait.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "Troll small skirted ballyhoo or feathers along weed lines to find a school, then switch to casting. Once you hook one, leave it in the water boatside; the rest of the school will stay with it, and you can pitch baits to fired-up fish. Light spinning gear with bucktails or chunks of cut bait keeps the chaos going.",
        ],
        bullets: [
          "Troll skirted ballyhoo to locate the school",
          "Keep one hooked fish in the water to hold the school",
          "Pitch bucktails or cut bait on light spinning gear",
          "Bump up to heavier leader for the bigger bulls",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Carry a cooler of cut bait and a couple of spinning rods rigged and ready before you ever leave the dock. When you run up on a school, seconds matter, and fumbling with rigging is how you watch fish swim off.",
        ],
      },
    ],
  },

  // ---------- PELAGIC ----------
  {
    slug: "king-mackerel-slow-trolling",
    title: "Slow-Trolling Live Bait for King Mackerel",
    species: "pelagic",
    fish: "King Mackerel",
    fishSlug: "king-mackerel",
    excerpt:
      "Stinger rigs, bait spreads, and the nearshore numbers that hold smoker kings.",
    bestTime: "Spring and fall migrations, nearshore",
    readMinutes: 6,
    image: "/img/cat-pelagic.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "King mackerel follow the bait. In spring and fall they push along the beaches and stack up on nearshore wrecks, reefs, and bait pods within a few miles of the pass. Find the bait, mark fish underneath it, and you have found the kings. Frigatebirds and diving terns will lead you right to them.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "Slow-trolling live bait is the deadly method. Pin a live cigar minnow, hardtail, or menhaden on a stinger rig and idle through the bait at just enough speed to keep the baits swimming. The trailing treble of the stinger catches the short-strikers that kings are famous for.",
        ],
        bullets: [
          "Wire stinger rig with a nose hook and trailing treble",
          "Live cigar minnows, hardtails, or menhaden",
          "Idle-speed troll through bait pods",
          "Set a flat line and a downrigger or weighted bait deep",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Use a long, light wire leader. Kings have a mouth full of teeth that slice mono instantly, but too heavy a wire kills the bait's action and cuts your bites. Single-strand No. 4 wire is a good all-around starting point.",
        ],
      },
    ],
  },
  {
    slug: "cobia-spring-sight-fishing",
    title: "Sight-Fishing Cobia on the Spring Run",
    species: "pelagic",
    fish: "Cobia",
    fishSlug: "cobia",
    excerpt:
      "Spotting cobia along the beach and making the cast count before they spook.",
    bestTime: "March through April, clear sunny days",
    readMinutes: 5,
    image: "/img/cat-pelagic.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "The spring cobia migration is one of the Emerald Coast's signature events. On clear, sunny days the fish cruise just off the beach, often within sight of the sand. Anglers run the beachfront from a tower or stand high on the bow scanning the surface, while pier fishermen wait for them to come within casting range.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "When you spot a fish, lead it and put a bright eel jig or a live eel right in its path. Cobia are curious and will often follow and inspect a bait before committing, so keep it moving and be ready for a second cast. If one follows but won't eat, throw a different color or a live bait to seal the deal.",
        ],
        bullets: [
          "Bright cobia jigs (chartreuse, pink) ready on deck",
          "Live eels or large pinfish as a follow-up bait",
          "High vantage point and polarized glasses are essential",
          "Lead the fish; never cast right on top of it",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Always keep a pitch bait rigged and ready. Cobia frequently travel in pairs or small groups, so after you hook one, there may be a second fish hanging close that will eat a quick follow-up cast.",
        ],
      },
    ],
  },

  // ---------- PIER & SURF ----------
  {
    slug: "pompano-surf-fishing",
    title: "Surf Fishing for Pompano",
    species: "piersurf",
    fish: "Pompano",
    fishSlug: "pompano",
    excerpt:
      "Reading the beach, finding the troughs, and rigging for the silver surfers of the wash.",
    bestTime: "Spring and fall, moving tide",
    readMinutes: 6,
    image: "/img/cat-piersurf.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Pompano feed in the wash, rooting sand fleas and small crustaceans out of the moving sand. The key is reading the beach: look for the darker, deeper troughs running parallel to the shore between sandbars, and the cuts where water funnels back out. Those troughs are pompano highways.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "A two- or three-hook pompano rig with small circle hooks, tipped with fresh sand fleas, fresh shrimp, or Fishbites, is the standard. Use a pyramid sinker heavy enough to hold in the current. Fan your rods out at different distances to find the trough the fish are using, then concentrate your spread there.",
        ],
        bullets: [
          "Pompano rig with #1-#2 circle hooks and a pyramid sinker",
          "Fresh sand fleas, shrimp, or Fishbites for bait",
          "Long surf rods to reach beyond the first bar",
          "Sand spikes to hold rods while you wait for the bite",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Catch your own sand fleas in the wash with a rake right where you're fishing. Fresh local fleas almost always out-fish anything store-bought, and digging for them tells you the food source is there.",
        ],
      },
    ],
  },
  {
    slug: "spanish-mackerel-from-the-pier",
    title: "Catching Spanish Mackerel from the Pier",
    species: "piersurf",
    fish: "Spanish Mackerel",
    fishSlug: "spanish-mackerel",
    excerpt:
      "Fast retrieves, flashy lures, and timing the bait schools off the rails.",
    bestTime: "Warm months, early morning bait schools",
    readMinutes: 4,
    image: "/img/cat-piersurf.png",
    sections: [
      {
        heading: "Where to look",
        body: [
          "Spanish mackerel show up wherever bait schools push against the pier or beach in the warmer months. Watch for nervous water, showering glass minnows, and birds diving on the surface. When the bait is around, the macks won't be far behind, slashing through it.",
        ],
      },
      {
        heading: "How to target them",
        body: [
          "Spanish want a fast-moving, flashy target. A Gotcha plug or a small silver spoon ripped quickly through the bait triggers reaction strikes. Keep your retrieve fast and erratic. Because of their teeth, a short, light wire or a heavier fluorocarbon leader saves you lures without killing the bite.",
        ],
        bullets: [
          "Gotcha plugs and small chrome spoons",
          "Fast, erratic retrieve through the bait",
          "Short wire or 30 lb fluoro leader for the teeth",
          "Light spinning gear for long casts and fun fights",
        ],
      },
      {
        heading: "Local tip",
        body: [
          "Get there at first light. The morning bite as bait pushes against the structure is usually the most consistent window, and the crowds thin out the macks' aggression as the sun climbs.",
        ],
      },
    ],
  },
];

export function postsBySpecies(species: Species): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.species === species);
}

export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function speciesLabel(species: Species): string {
  return SPECIES_META[species].label;
}
