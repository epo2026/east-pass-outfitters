import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import type { Product } from "@shared/schema";
import { ShopLayout } from "@/components/ShopLayout";
import { SPECIES_META, FISH_SPECIES, type Species } from "@/lib/catalog";
import { ArrowRight } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function SpeciesPage() {
  const [, params] = useRoute("/tackle/:species");
  const species = params?.species as Species | undefined;
  const meta = species ? SPECIES_META[species] : undefined;

  const { data, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  if (!meta || !species) return <NotFound />;

  const list = (data ?? []).filter((p) => p.type === "tackle" && p.species === species);
  const fish = FISH_SPECIES[species];

  const breadcrumb = (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
      <nav className="text-xs text-muted-foreground">
        <Link href="/tackle" className="hover:text-primary">Tackle</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{meta.label}</span>
      </nav>
    </div>
  );

  const fishStrip = (
    <section className="border-b border-border bg-sidebar">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Shop by target species</p>
        <h2 className="mt-1.5 font-display text-xl font-700">
          {meta.label} fish of the Emerald Coast
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fish.map((f) => (
            <Link
              key={f.slug}
              href={`/tackle/${species}/${f.slug}`}
              data-testid={`card-fish-${f.slug}`}
            >
              <div className="group flex items-center justify-between gap-3 rounded-xl border border-card-border bg-card p-4 hover-elevate">
                <div>
                  <p className="font-display text-base font-700">{f.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.blurb}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <ShopLayout
      breadcrumb={breadcrumb}
      eyebrow={meta.species}
      title={`${meta.label} Tackle`}
      description={`${meta.tagline}. Everything you need to target ${meta.species.toLowerCase().replace(/ · /g, ", ")} on the Emerald Coast.`}
      bannerImage={meta.image}
      products={list}
      isLoading={isLoading}
    >
      {fishStrip}
    </ShopLayout>
  );
}
