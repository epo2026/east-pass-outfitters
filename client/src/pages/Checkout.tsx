import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCart, lineKey } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import type { Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, ShoppingBag, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  address: z.string().min(3, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(2, "Required"),
  zip: z.string().min(3, "Required"),
});
type FormValues = z.infer<typeof formSchema>;

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const shipping = subtotal >= 75 ? 0 : 7.95;
  const tax = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "FL",
      zip: "",
    },
  });

  const checkout = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/checkout", { ...values, items });
      return (await res.json()) as Order;
    },
    onSuccess: (order) => {
      clear();
      navigate(`/order/${order.orderNumber}`);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "We couldn't place your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (items.length === 0 && !checkout.isPending) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="font-display text-xl font-700">Your cart is empty</h1>
        <p className="text-sm text-muted-foreground">Add some gear before you check out.</p>
        <Link href="/tackle"><Button>Shop tackle</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>
      <h1 className="mb-6 font-display text-2xl font-700 sm:text-3xl">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Form */}
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => checkout.mutate(v))} className="space-y-6">
              <section>
                <h2 className="mb-3 text-sm font-700 uppercase tracking-wider text-muted-foreground">Contact</h2>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@email.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section>
                <h2 className="mb-3 text-sm font-700 uppercase tracking-wider text-muted-foreground">Shipping address</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} data-testid="input-firstName" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} data-testid="input-lastName" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="mt-4">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Harbor Blvd" {...field} data-testid="input-address" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} data-testid="input-city" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} data-testid="input-state" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="zip" render={({ field }) => (
                    <FormItem><FormLabel>ZIP</FormLabel><FormControl><Input {...field} data-testid="input-zip" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-700 uppercase tracking-wider text-muted-foreground">Payment</h2>
                <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5 font-600 text-foreground"><Lock className="h-4 w-4" /> Demo checkout</p>
                  <p className="mt-1">This is a demo store — no payment is collected and no card is charged. Placing the order shows the full confirmation flow.</p>
                </div>
              </section>

              <Button type="submit" size="lg" className="w-full text-base" disabled={checkout.isPending} data-testid="button-place-order">
                {checkout.isPending ? "Placing order…" : `Place order · ${formatPrice(total)}`}
              </Button>
            </form>
          </Form>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-xl border border-card-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 text-sm font-700 uppercase tracking-wider text-muted-foreground">Order summary</h2>
          <ul className="flex flex-col gap-3" role="list">
            {items.map((i) => (
              <li key={lineKey(i)} className="flex gap-3">
                <div className="relative">
                  <img src={i.image} alt={i.name} className="h-14 w-14 rounded-md border border-card-border object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-700 text-primary-foreground">{i.qty}</span>
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="line-clamp-2 text-xs font-600">{i.name}</p>
                  {(i.size || i.color) && (
                    <p className="text-xs text-muted-foreground">{[i.color, i.size].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <span className="text-xs font-600">{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-600" data-testid="text-summary-subtotal">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-600">{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax (est.)</span><span className="font-600">{formatPrice(tax)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base"><span className="font-700">Total</span><span className="font-700" data-testid="text-summary-total">{formatPrice(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
