import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { ShopLayout } from "@/components/ShopLayout";
import { APPAREL_CATEGORIES } from "@/lib/catalog";

const facets = Object.entries(APPAREL_CATEGORIES).map(([key, label]) => ({ key, label }));

export default function Apparel() {
  const { data, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const apparel = (data ?? []).filter((p) => p.type === "apparel");

  return (
    <ShopLayout
      eyebrow="Original designs"
      title="Emerald Coast Apparel"
      description="UPF 50+ performance shirts, hats, hoodies, and more — our own Emerald Coast designs, built for long days on the water."
      bannerImage="/img/apparel-hero.png"
      products={apparel}
      isLoading={isLoading}
      facets={facets}
      facetMatch={(p, key) => p.apparelCategory === key}
    />
  );
}
