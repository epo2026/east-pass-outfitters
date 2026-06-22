import { useState, useMemo } from "react";
import type { Product } from "@shared/schema";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

interface ShopLayoutProps {
  title: string;
  description: string;
  bannerImage: string;
  eyebrow?: string;
  products: Product[];
  isLoading: boolean;
  /** facet chips: { key, label } */
  facets?: { key: string; label: string }[];
  /** returns true if product is in this facet */
  facetMatch?: (p: Product, key: string) => boolean;
}

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

export function ShopLayout({
  title,
  description,
  bannerImage,
  eyebrow,
  products,
  isLoading,
  facets,
  facetMatch,
}: ShopLayoutProps) {
  const [activeFacet, setActiveFacet] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const visible = useMemo(() => {
    let list = products;
    if (facets && facetMatch && activeFacet !== "all") {
      list = list.filter((p) => facetMatch(p, activeFacet));
    }
    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        sorted.sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
    }
    return sorted;
  }, [products, facets, facetMatch, activeFacet, sort]);

  return (
    <div>
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img src={bannerImage} alt={title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(198_55%_8%/0.88)] via-[hsl(198_55%_10%/0.6)] to-[hsl(198_55%_10%/0.3)]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-16">
          {eyebrow && (
            <p className="text-xs font-700 uppercase tracking-[0.2em] text-white/80">{eyebrow}</p>
          )}
          <h1 className="mt-2 font-display text-3xl font-700 text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">{description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {facets && (
              <>
                <button
                  onClick={() => setActiveFacet("all")}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-500 transition-colors ${
                    activeFacet === "all"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground/80 hover-elevate"
                  }`}
                  data-testid="facet-all"
                >
                  All
                </button>
                {facets.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFacet(f.key)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-500 transition-colors ${
                      activeFacet === f.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground/80 hover-elevate"
                    }`}
                    data-testid={`facet-${f.key}`}
                  >
                    {f.label}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-[170px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground" data-testid="text-result-count">
          {visible.length} {visible.length === 1 ? "product" : "products"}
        </p>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
            <p className="font-600">No products here yet</p>
            <p className="text-sm text-muted-foreground">Try a different category.</p>
            <Button variant="outline" onClick={() => setActiveFacet("all")}>
              Show all
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
