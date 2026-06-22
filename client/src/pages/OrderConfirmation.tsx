import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { formatPrice, parseJsonArray } from "@/lib/catalog";
import { assetUrl } from "@/lib/utils";
import type { CartItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Package, Mail } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function OrderConfirmation() {
  const [, params] = useRoute("/order/:orderNumber");
  const orderNumber = params?.orderNumber;

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ["/api/orders", orderNumber],
    enabled: !!orderNumber,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-2/3" />
        <Skeleton className="mt-8 h-40 w-full" />
      </div>
    );
  }

  if (isError || !order) return <NotFound />;

  const items = parseJsonArray(order.items) as unknown as CartItem[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-700 sm:text-3xl">Thanks, {order.firstName}!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order is confirmed. Tight lines from the Emerald Coast.
        </p>
        <p className="mt-4 rounded-full bg-muted px-4 py-1.5 text-sm font-600" data-testid="text-order-number">
          Order {order.orderNumber}
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-card-border bg-card p-5">
        <ul className="flex flex-col gap-4" role="list">
          {items.map((i, idx) => (
            <li key={idx} className="flex gap-3">
              <img src={assetUrl(i.image)} alt={i.name} className="h-16 w-16 rounded-md border border-card-border object-cover" />
              <div className="flex-1">
                <p className="text-sm font-600">{i.name}</p>
                {(i.size || i.color) && (
                  <p className="text-xs text-muted-foreground">{[i.color, i.size].filter(Boolean).join(" · ")}</p>
                )}
                <p className="text-xs text-muted-foreground">Qty {i.qty}</p>
              </div>
              <span className="text-sm font-600">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-600">{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-600">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-600">{formatPrice(order.tax)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-base"><span className="font-700">Total</span><span className="font-700" data-testid="text-order-total">{formatPrice(order.total)}</span></div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <Mail className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-600">Confirmation sent</p>
            <p className="text-xs text-muted-foreground">{order.email}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <Package className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-600">Ships to</p>
            <p className="text-xs text-muted-foreground">{order.city}, {order.state} {order.zip}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/"><Button variant="outline" data-testid="button-back-home">Back to shop</Button></Link>
      </div>
    </div>
  );
}
