import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { ShopLayout } from "@/components/ShopLayout";
import { SPECIES_META, type Species } from "@/lib/catalog";

const facets = (Object.keys(SPECIES_META) as Species[]).map((key) => ({
  key,
  label: SPECIES_META[key].label,
}));

export default function Tackle() {
  const { data, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const tackle = (data ?? []).filter((p) => p.type === "tackle");

  return (
    <ShopLayout
      eyebrow="Shop by target species"
      title="The Tackle Shop"
      description="Lures, rigs, and terminal tackle sorted by what you're chasing — from grass-flat redfish to bluewater snapper. Drop-shipped fast to the Emerald Coast."
      bannerImage="/img/tackle-flatlay.png"
      products={tackle}
      isLoading={isLoading}
      facets={facets}
      facetMatch={(p, key) => p.species === key}
    />
  );
}
