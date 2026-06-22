import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { ShopLayout } from "@/components/ShopLayout";
import { SPECIES_META, FISH_SPECIES, type Species } from "@/lib/catalog";

const speciesKeys = Object.keys(SPECIES_META) as Species[];
const facets = speciesKeys.map((key) => ({ key, label: SPECIES_META[key].label }));

export default function Tackle() {
  const { data, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const tackle = (data ?? []).filter((p) => p.type === "tackle");

  return (
    <ShopLayout
      eyebrow="Shop by target species"
      title="The Tackle Shop"
      description="Lures, rigs, and terminal tackle sorted by what you're chasing — from grass-flat redfish to bluewater snapper. Hand-picked by anglers who fish the Emerald Coast."
      bannerImage="/img/tackle-flatlay.webp"
      products={tackle}
      isLoading={isLoading}
      facets={facets}
      facetMatch={(p, key) => p.species === key}
    >
      {/* Category + fish-species browse map */}
      <section className="border-b border-border bg-sidebar">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Browse by category</p>
          <h2 className="mt-1.5 font-display text-xl font-700">Pick your water, then your fish</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {speciesKeys.map((s) => (
              <div
                key={s}
                className="rounded-xl border border-card-border bg-card p-5"
                data-testid={`block-cat-${s}`}
              >
                <Link
                  href={`/tackle/${s}`}
                  className="font-display text-base font-700 hover:text-primary"
                  data-testid={`link-tackle-cat-${s}`}
                >
                  {SPECIES_META[s].label}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{SPECIES_META[s].tagline}</p>
                <ul className="mt-3 flex flex-col gap-1.5" role="list">
                  {FISH_SPECIES[s].map((f) => (
                    <li key={f.slug}>
                      <Link
                        href={`/tackle/${s}/${f.slug}`}
                        className="text-sm text-foreground/80 hover:text-primary"
                        data-testid={`link-tackle-fish-${s}-${f.slug}`}
                      >
                        {f.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ShopLayout>
  );
}
