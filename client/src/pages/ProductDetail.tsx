import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { formatPrice, productColors, productSizes, productTags, SPECIES_META, type Species } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Truck, Shield, Sparkles, Check, ChevronRight, ShoppingBag } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug;
  const { addItem } = useCart();
  const [, navigate] = useLocation();

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["/api/products", slug],
    enabled: !!slug,
  });

  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) return <NotFound />;

  const sizes = productSizes(product);
  const colors = productColors(product);
  const tags = productTags(product);
  const needsSize = sizes.length > 1;
  const needsColor = colors.length > 1;
  const canAdd = (!needsSize || size) && (!needsColor || color);

  const speciesMeta = product.species ? SPECIES_META[product.species as Species] : null;

  const handleAdd = () => {
    if (!canAdd) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      qty: 1,
      size: size ?? sizes[0],
      color: color ?? colors[0],
      image: product.image,
      type: product.type,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {product.type === "tackle" ? (
          <>
            <Link href="/tackle" className="hover:text-primary">Tackle</Link>
            {speciesMeta && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={`/tackle/${product.species}`} className="hover:text-primary">{speciesMeta.label}</Link>
              </>
            )}
          </>
        ) : (
          <Link href="/apparel" className="hover:text-primary">Apparel</Link>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Image */}
        <div className="relative overflow-hidden rounded-xl border border-card-border bg-muted">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
          <div className="absolute left-4 top-4 flex flex-col gap-1.5">
            {product.bestseller && <Badge className="border-0 bg-primary text-primary-foreground">Bestseller</Badge>}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground">{product.brand}</p>
          <h1 className="mt-1.5 font-display text-2xl font-700 leading-tight sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
              <span className="font-600">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-700">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t} variant="outline" className="font-500">{t}</Badge>
              ))}
            </div>
          )}

          {/* Color */}
          {colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-600">
                Color{needsColor && !color ? <span className="text-destructive"> *</span> : color ? <span className="font-400 text-muted-foreground"> · {color}</span> : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      (color ?? (colors.length === 1 ? colors[0] : undefined)) === c
                        ? "border-primary bg-accent font-600 text-accent-foreground"
                        : "border-border bg-card hover-elevate"
                    }`}
                    data-testid={`option-color-${c}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {sizes.length > 1 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-600">
                Size{!size ? <span className="text-destructive"> *</span> : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-12 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      size === s
                        ? "border-primary bg-accent font-600 text-accent-foreground"
                        : "border-border bg-card hover-elevate"
                    }`}
                    data-testid={`option-size-${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              className="flex-1 text-base"
              disabled={!canAdd}
              onClick={handleAdd}
              data-testid="button-add-to-cart"
            >
              {added ? (
                <><Check className="mr-2 h-5 w-5" /> Added to cart</>
              ) : (
                <><ShoppingBag className="mr-2 h-5 w-5" /> Add to cart · {formatPrice(product.price)}</>
              )}
            </Button>
          </div>
          {!canAdd && (
            <p className="mt-2 text-xs text-destructive" data-testid="text-select-options">
              Please select {needsColor && !color ? "a color" : ""}{needsColor && !color && needsSize && !size ? " and " : ""}{needsSize && !size ? "a size" : ""}.
            </p>
          )}

          {/* Reassurance */}
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" /> Free shipping over $75
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" /> Secure checkout
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Locally run on the coast
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
