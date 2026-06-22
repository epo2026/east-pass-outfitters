import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import type { Product } from "@shared/schema";
import { ShopLayout } from "@/components/ShopLayout";
import {
  SPECIES_META,
  FISH_SPECIES,
  findFish,
  productMatchesFish,
  type Species,
} from "@/lib/catalog";
import NotFound from "@/pages/not-found";

export default function FishPage() {
  const [, params] = useRoute("/tackle/:species/:fish");
  const species = params?.species as Species | undefined;
  const fishSlug = params?.fish;

  const meta = species ? SPECIES_META[species] : undefined;
  const fish = species && fishSlug ? findFish(species, fishSlug) : undefined;

  const { data, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  if (!meta || !species || !fish) return <NotFound />;

  const list = (data ?? []).filter(
    (p) => p.type === "tackle" && p.species === species && productMatchesFish(p, fish)
  );

  // Sibling fish in the same category for quick switching
  const siblings = FISH_SPECIES[species].filter((f) => f.slug !== fish.slug);

  const breadcrumb = (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
      <nav className="text-xs text-muted-foreground">
        <Link href="/tackle" className="hover:text-primary">Tackle</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/tackle/${species}`} className="hover:text-primary">{meta.label}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{fish.label}</span>
      </nav>
    </div>
  );

  const otherFish = (
    <section className="border-b border-border bg-sidebar">
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-700 uppercase tracking-wider text-muted-foreground">
            Other {meta.label} species:
          </span>
          {siblings.map((f) => (
            <Link
              key={f.slug}
              href={`/tackle/${species}/${f.slug}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-500 text-foreground/80 hover-elevate"
              data-testid={`chip-fish-${f.slug}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <ShopLayout
      breadcrumb={breadcrumb}
      eyebrow={`${meta.label} · ${fish.label}`}
      title={`${fish.label} Tackle`}
      description={`${fish.blurb}. Tackle hand-picked for ${fish.label.toLowerCase()} on the Emerald Coast.`}
      bannerImage={meta.image}
      products={list}
      isLoading={isLoading}
    >
      {otherFish}
    </ShopLayout>
  );
}
