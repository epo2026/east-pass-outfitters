import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { adminRequest } from "@/lib/admin";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, AlertTriangle } from "lucide-react";

export function AdminInventory() {
  const { toast } = useToast();
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Per-row "set to" input drafts, keyed by product id.
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const lowStock = (products ?? []).filter(
    (p) => p.stockQty <= p.lowStockThreshold,
  );

  const mutate = async (id: number, body: { qty?: number; delta?: number }) => {
    setBusyId(id);
    try {
      await adminRequest("POST", `/api/admin/products/${id}/stock`, body);
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (err) {
      toast({ title: "Update failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const adjust = (id: number, delta: number) => mutate(id, { delta });

  const setExact = (id: number) => {
    const raw = drafts[id];
    const qty = Number(raw);
    if (raw === undefined || raw === "" || Number.isNaN(qty) || qty < 0) {
      toast({ title: "Enter a valid quantity", variant: "destructive" });
      return;
    }
    mutate(id, { qty }).then(() =>
      setDrafts((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Low-stock summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Low stock
            <Badge variant="secondary" className="ml-1" data-testid="text-lowstock-count">
              {isLoading ? "…" : lowStock.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Everything is above its low-stock threshold.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge
                  key={p.id}
                  variant={p.stockQty === 0 ? "destructive" : "outline"}
                  data-testid={`badge-lowstock-${p.id}`}
                >
                  {p.name}: {p.stockQty}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock editor */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">On hand</TableHead>
              <TableHead className="text-center">Adjust</TableHead>
              <TableHead className="w-[220px]">Set exact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {products?.map((p) => {
              const low = p.stockQty <= p.lowStockThreshold;
              return (
                <TableRow key={p.id} data-testid={`row-inventory-${p.id}`}>
                  <TableCell>
                    <div className="font-500">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      threshold {p.lowStockThreshold}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={low ? "font-700 text-destructive" : "font-600"}
                      data-testid={`text-stock-${p.id}`}
                    >
                      {p.stockQty}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={busyId === p.id || p.stockQty === 0}
                        onClick={() => adjust(p.id, -1)}
                        data-testid={`button-dec-${p.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={busyId === p.id}
                        onClick={() => adjust(p.id, 1)}
                        data-testid={`button-inc-${p.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-24"
                        placeholder={String(p.stockQty)}
                        value={drafts[p.id] ?? ""}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                        }
                        data-testid={`input-setstock-${p.id}`}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8"
                        disabled={busyId === p.id}
                        onClick={() => setExact(p.id)}
                        data-testid={`button-setstock-${p.id}`}
                      >
                        Set
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
