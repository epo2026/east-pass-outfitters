import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { formatPrice, productColors, productSizes } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Plus } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const hasOptions = productSizes(product).length > 1 || productColors(product).length > 1;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const colors = productColors(product);
    const sizes = productSizes(product);
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      qty: 1,
      size: sizes[0],
      color: colors[0],
      image: product.image,
      type: product.type,
    });
  };

  return (
    <Link href={`/product/${product.slug}`} data-testid={`card-product-${product.id}`}>
      <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-card-border bg-card hover-elevate">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.bestseller && (
              <Badge className="bg-primary text-primary-foreground border-0">Bestseller</Badge>
            )}
            {product.isCustom && (
              <Badge variant="secondary" className="border-0">Customizable</Badge>
            )}
            {product.compareAtPrice && (
              <Badge className="border-0 bg-destructive text-destructive-foreground">Sale</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs font-500 uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-600 leading-snug">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.shortDescription}</p>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-chart-4 text-chart-4" />
            <span className="font-600 text-foreground">{product.rating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-700">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
            {hasOptions ? (
              <Button size="sm" variant="outline" className="h-8" data-testid={`button-options-${product.id}`}>
                Options
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8"
                onClick={quickAdd}
                aria-label={`Add ${product.name} to cart`}
                data-testid={`button-quickadd-${product.id}`}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
