import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { adminRequest } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import type { Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OrderItem {
  productId?: number;
  name: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
  image?: string;
}

const STATUS_OPTIONS = [
  "all",
  "pending",
  "paid",
  "fulfilled",
  "shipped",
  "payment_failed",
  "refunded",
] as const;

// Allowed next-status actions shown per order.
const ACTIONS = ["paid", "fulfilled", "shipped", "refunded"] as const;

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
    case "fulfilled":
    case "shipped":
      return "default";
    case "pending":
      return "secondary";
    case "payment_failed":
    case "refunded":
      return "destructive";
    default:
      return "outline";
  }
}

function parseItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function AdminOrders() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const queryUrl =
    statusFilter === "all"
      ? "/api/admin/orders"
      : `/api/admin/orders?status=${encodeURIComponent(statusFilter)}`;

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders", statusFilter],
    queryFn: async () => {
      const res = await adminRequest("GET", queryUrl);
      return res.json();
    },
  });

  const sorted = useMemo(
    () => (orders ? [...orders].sort((a, b) => b.createdAt - a.createdAt) : []),
    [orders],
  );

  const changeStatus = async (orderNumber: string, status: string) => {
    setBusy(orderNumber + status);
    try {
      await adminRequest(
        "PATCH",
        `/api/admin/orders/${encodeURIComponent(orderNumber)}/status`,
        { status },
      );
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: `Marked ${status}`, description: `Order ${orderNumber}` });
    } catch (err) {
      toast({ title: "Update failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-700 text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {orders ? `${orders.length} orders` : "Loading..."}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-order-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No orders {statusFilter !== "all" ? `with status "${statusFilter}"` : "yet"}.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((o) => {
              const items = parseItems(o.items as unknown);
              const isOpen = !!expanded[o.orderNumber];
              return (
                <>
                  <TableRow key={o.orderNumber} data-testid={`row-order-${o.orderNumber}`}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          setExpanded((e) => ({ ...e, [o.orderNumber]: !e[o.orderNumber] }))
                        }
                        data-testid={`button-expand-${o.orderNumber}`}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{o.orderNumber}</TableCell>
                    <TableCell>
                      <div className="font-500">{o.firstName} {o.lastName}</div>
                      <div className="text-xs text-muted-foreground">{o.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-600">{formatPrice(o.total)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(o.status)} className="capitalize" data-testid={`badge-status-${o.orderNumber}`}>
                        {o.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {ACTIONS.filter((a) => a !== o.status).map((a) => (
                          <Button
                            key={a}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs capitalize"
                            disabled={busy === o.orderNumber + a}
                            onClick={() => changeStatus(o.orderNumber, a)}
                            data-testid={`button-mark-${a}-${o.orderNumber}`}
                          >
                            {a}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={o.orderNumber + "-detail"} className="bg-muted/30">
                      <TableCell colSpan={7}>
                        <div className="space-y-3 px-2 py-2">
                          <div className="text-sm text-muted-foreground">
                            Ship to: {o.address}, {o.city}, {o.state} {o.zip}
                          </div>
                          <div className="space-y-1">
                            {items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span>
                                  {it.qty} × {it.name}
                                  {it.size ? ` (${it.size})` : ""}
                                  {it.color ? ` · ${it.color}` : ""}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatPrice(it.price * it.qty)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col items-end gap-0.5 border-t border-border pt-2 text-sm">
                            <span className="text-muted-foreground">Subtotal {formatPrice(o.subtotal)}</span>
                            <span className="text-muted-foreground">Shipping {formatPrice(o.shipping)}</span>
                            <span className="text-muted-foreground">Tax {formatPrice(o.tax)}</span>
                            <span className="font-700">Total {formatPrice(o.total)}</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
