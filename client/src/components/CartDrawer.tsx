import { useLocation } from "wouter";
import { useCart, lineKey } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { assetUrl } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

const FREE_SHIP_THRESHOLD = 75;

export function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, updateQty, subtotal, count } = useCart();
  const [, navigate] = useLocation();

  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);

  const goToCheckout = () => {
    setOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5" /> Your Cart{count > 0 ? ` (${count})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-600">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Find your next favorite shirt or rig.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                navigate("/tackle");
              }}
              data-testid="button-empty-shop"
            >
              Start shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {remaining > 0 ? (
                <div className="mb-4 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
                  You're <span className="font-700">{formatPrice(remaining)}</span> away from free shipping.
                </div>
              ) : (
                <div className="mb-4 rounded-md bg-accent px-3 py-2 text-xs font-600 text-accent-foreground">
                  You've unlocked free shipping.
                </div>
              )}

              <ul className="flex flex-col gap-4" role="list">
                {items.map((item) => {
                  const key = lineKey(item);
                  return (
                    <li key={key} className="flex gap-3" data-testid={`cart-item-${item.productId}`}>
                      <img
                        src={assetUrl(item.image)}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-md border border-card-border object-cover"
                      />
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <p className="text-sm font-600 leading-snug">{item.name}</p>
                          <button
                            onClick={() => removeItem(key)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove item"
                            data-testid={`button-remove-${item.productId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {(item.size || item.color) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center rounded-md border border-border">
                            <button
                              className="px-2 py-1 text-muted-foreground hover:text-foreground"
                              onClick={() => updateQty(key, item.qty - 1)}
                              aria-label="Decrease quantity"
                              data-testid={`button-decrease-${item.productId}`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-7 text-center text-sm font-600" data-testid={`text-qty-${item.productId}`}>
                              {item.qty}
                            </span>
                            <button
                              className="px-2 py-1 text-muted-foreground hover:text-foreground"
                              onClick={() => updateQty(key, item.qty + 1)}
                              aria-label="Increase quantity"
                              data-testid={`button-increase-${item.productId}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-700">{formatPrice(item.price * item.qty)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-border px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-700" data-testid="text-cart-subtotal">{formatPrice(subtotal)}</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Shipping & tax calculated at checkout.
              </p>
              <Button className="w-full" size="lg" onClick={goToCheckout} data-testid="button-checkout">
                Checkout
              </Button>
              <Button
                variant="ghost"
                className="mt-1 w-full"
                onClick={() => setOpen(false)}
                data-testid="button-continue-shopping"
              >
                Continue shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
