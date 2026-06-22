import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import type { Product } from "@shared/schema";
import { ShopLayout } from "@/components/ShopLayout";
import { SPECIES_META, type Species } from "@/lib/catalog";
import NotFound from "@/pages/not-found";

export default function SpeciesPage() {
  const [, params] = useRoute("/tackle/:species");
  const species = params?.species as Species | undefined;
  const meta = species ? SPECIES_META[species] : undefined;

  const { data, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  if (!meta) return <NotFound />;

  const list = (data ?? []).filter((p) => p.type === "tackle" && p.species === species);

  return (
    <div>
      <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
        <nav className="text-xs text-muted-foreground">
          <Link href="/tackle" className="hover:text-primary">Tackle</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{meta.label}</span>
        </nav>
      </div>
      <ShopLayout
        eyebrow={meta.species}
        title={`${meta.label} Tackle`}
        description={`${meta.tagline}. Everything you need to target ${meta.species.toLowerCase().replace(/ · /g, ", ")} on the Emerald Coast.`}
        bannerImage={meta.image}
        products={list}
        isLoading={isLoading}
      />
    </div>
  );
}
