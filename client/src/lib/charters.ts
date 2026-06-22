// Placeholder charter trips. Shaped to map cleanly onto a FareHarbor
// marketplace item so these can later be replaced/augmented by live API data.
// FareHarbor exposes items with: pk (id), name, description, duration,
// capacity, headline price, images, and a booking URL. We mirror that here.

export interface CharterTrip {
  /** Stable slug; maps to FareHarbor item shortname/pk later */
  slug: string;
  /** FareHarbor item pk placeholder (null until connected) */
  fareharborItemId: number | null;
  name: string;
  category: "Inshore" | "Nearshore" | "Offshore" | "Pier & Surf";
  tagline: string;
  description: string;
  /** e.g. "Half day (4 hrs)" */
  duration: string;
  /** Max guests */
  capacity: number;
  /** Headline "from" price in USD */
  fromPrice: number;
  target: string;
  includes: string[];
  image: string;
  /** Booking deep-link; FareHarbor URL once connected, mailto fallback for now */
  bookingUrl: string | null;
}

const CONTACT_EMAIL = "eastpassoutfitters@gmail.com";

function inquiryMailto(tripName: string): string {
  const subject = encodeURIComponent(`Charter request: ${tripName}`);
  const body = encodeURIComponent(
    `Hi East Pass Outfitters,\n\nI'd like to book the "${tripName}" charter.\n\nPreferred date(s): \nParty size: \nName: \nPhone: \n\nThanks!`
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export const CHARTER_TRIPS: CharterTrip[] = [
  {
    slug: "inshore-bay-trip",
    fareharborItemId: null,
    name: "Inshore Bay Trip",
    category: "Inshore",
    tagline: "Flats, bays & oyster bars",
    description:
      "A relaxed run through Choctawhatchee Bay and the back lagoons chasing redfish, speckled trout, and flounder. Perfect for families, first-timers, and light-tackle anglers.",
    duration: "Half day (4 hrs)",
    capacity: 4,
    fromPrice: 450,
    target: "Redfish · Trout · Flounder",
    includes: ["Rods, reels & tackle", "Bait & ice", "FL fishing license", "Catch cleaning"],
    image: "/img/cat-inshore.webp",
    bookingUrl: null,
  },
  {
    slug: "nearshore-reef-trip",
    fareharborItemId: null,
    name: "Nearshore Reef Trip",
    category: "Nearshore",
    tagline: "Wrecks, reefs & ledges",
    description:
      "Run a few miles out to the artificial reefs and ledges for bottom fish and hard-pulling Spanish and king mackerel. A great mix of action and variety without a long ride.",
    duration: "Half day (5 hrs)",
    capacity: 6,
    fromPrice: 650,
    target: "Snapper · Spanish · King Mackerel",
    includes: ["All gear & tackle", "Bait & ice", "FL fishing license", "Catch cleaning"],
    image: "/img/cat-pelagic.webp",
    bookingUrl: null,
  },
  {
    slug: "offshore-bluewater-trip",
    fareharborItemId: null,
    name: "Offshore Bluewater Trip",
    category: "Offshore",
    tagline: "Deep drops & trolling spreads",
    description:
      "A full day in the bluewater trolling and bottom fishing for snapper, grouper, mahi, and whatever else is biting. Built for serious anglers who want their shot at a cooler-filler.",
    duration: "Full day (8 hrs)",
    capacity: 6,
    fromPrice: 1450,
    target: "Snapper · Grouper · Mahi · Tuna",
    includes: ["Premium offshore gear", "Bait, ice & drinks", "FL fishing license", "Catch cleaning"],
    image: "/img/cat-offshore.webp",
    bookingUrl: null,
  },
  {
    slug: "pier-surf-guided-trip",
    fareharborItemId: null,
    name: "Pier & Surf Guided Trip",
    category: "Pier & Surf",
    tagline: "Beaches, piers & the wash",
    description:
      "A walk-and-wade guided trip along the Emerald Coast beaches and piers for pompano, Spanish mackerel, and whiting. No boat required — just bring sunscreen and a good attitude.",
    duration: "Half day (4 hrs)",
    capacity: 4,
    fromPrice: 350,
    target: "Pompano · Spanish Mackerel · Whiting",
    includes: ["Surf rods & rigs", "Bait & sand spikes", "FL fishing license", "On-the-beach coaching"],
    image: "/img/cat-piersurf.webp",
    bookingUrl: null,
  },
];

/** Resolve the best booking link: live FareHarbor URL if connected, else email request. */
export function tripBookingHref(trip: CharterTrip): string {
  return trip.bookingUrl ?? inquiryMailto(trip.name);
}

export function formatTripPrice(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
