import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { adminRequest } from "@/lib/admin";
import { formatPrice, parseJsonArray } from "@/lib/catalog";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

// The form mirrors productWriteSchema. Array fields (sizes/colors/tags) are
// edited as comma-separated text and split on save.
interface FormState {
  slug: string;
  name: string;
  type: "apparel" | "tackle";
  species: string;
  apparelCategory: string;
  brand: string;
  price: string;
  compareAtPrice: string;
  shortDescription: string;
  description: string;
  image: string;
  sizes: string;
  colors: string;
  tags: string;
  stockQty: string;
  lowStockThreshold: string;
  bestseller: boolean;
}

const EMPTY: FormState = {
  slug: "",
  name: "",
  type: "tackle",
  species: "",
  apparelCategory: "",
  brand: "",
  price: "",
  compareAtPrice: "",
  shortDescription: "",
  description: "",
  image: "",
  sizes: "",
  colors: "",
  tags: "",
  stockQty: "0",
  lowStockThreshold: "5",
  bestseller: false,
};

function productToForm(p: Product): FormState {
  return {
    slug: p.slug,
    name: p.name,
    type: (p.type as "apparel" | "tackle") || "tackle",
    species: p.species ?? "",
    apparelCategory: p.apparelCategory ?? "",
    brand: p.brand,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : "",
    shortDescription: p.shortDescription,
    description: p.description,
    image: p.image,
    sizes: parseJsonArray(p.sizes).join(", "),
    colors: parseJsonArray(p.colors).join(", "),
    tags: parseJsonArray(p.tags).join(", "),
    stockQty: String(p.stockQty),
    lowStockThreshold: String(p.lowStockThreshold),
    bestseller: !!p.bestseller,
  };
}

function csvToArray(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function AdminProducts() {
  const { toast } = useToast();
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm(productToForm(p));
    setOpen(true);
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      type: form.type,
      brand: form.brand.trim(),
      price: Number(form.price),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      stockQty: Number(form.stockQty) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      bestseller: form.bestseller,
      species: form.type === "tackle" ? form.species.trim() || null : null,
      apparelCategory:
        form.type === "apparel" ? form.apparelCategory.trim() || null : null,
      sizes: csvToArray(form.sizes),
      colors: csvToArray(form.colors),
      tags: csvToArray(form.tags),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
    };
    return payload;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim() || !form.brand.trim()) {
      toast({ title: "Missing fields", description: "Name, slug, and brand are required.", variant: "destructive" });
      return;
    }
    if (!form.price || Number.isNaN(Number(form.price))) {
      toast({ title: "Invalid price", description: "Enter a valid price.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await adminRequest("PATCH", `/api/admin/products/${editing.id}`, payload);
        toast({ title: "Product updated" });
      } else {
        await adminRequest("POST", "/api/admin/products", payload);
        toast({ title: "Product created" });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
    } catch (err) {
      toast({ title: "Save failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminRequest("DELETE", `/api/admin/products/${deleteTarget.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    } catch (err) {
      toast({ title: "Delete failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-700 text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products ? `${products.length} products` : "Loading..."}
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-product">
          <Plus className="mr-2 h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && products?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No products yet. Add your first one.
                </TableCell>
              </TableRow>
            )}
            {products?.map((p) => (
              <TableRow key={p.id} data-testid={`row-product-${p.id}`}>
                <TableCell className="font-500">{p.name}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{p.type}</TableCell>
                <TableCell className="text-muted-foreground">{p.brand}</TableCell>
                <TableCell className="text-right">{formatPrice(p.price)}</TableCell>
                <TableCell className="text-right">
                  <span className={p.stockQty <= p.lowStockThreshold ? "text-destructive font-600" : ""}>
                    {p.stockQty}
                  </span>
                  {!p.inStock && (
                    <Badge variant="outline" className="ml-2">Out</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(p)}
                      data-testid={`button-edit-product-${p.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(p)}
                      data-testid={`button-delete-product-${p.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add / edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4" data-testid="form-product">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="input-product-name" />
              </Field>
              <Field label="Slug">
                <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="url-friendly-id" data-testid="input-product-slug" />
              </Field>
              <Field label="Type">
                <Select value={form.type} onValueChange={(v) => set("type", v as "apparel" | "tackle")}>
                  <SelectTrigger data-testid="select-product-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tackle">Tackle</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Brand">
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} data-testid="input-product-brand" />
              </Field>
              {form.type === "tackle" ? (
                <Field label="Species (optional)">
                  <Input value={form.species} onChange={(e) => set("species", e.target.value)} placeholder="inshore / offshore / pelagic / piersurf" />
                </Field>
              ) : (
                <Field label="Apparel category (optional)">
                  <Input value={form.apparelCategory} onChange={(e) => set("apparelCategory", e.target.value)} placeholder="shirts / hats / outerwear / accessories" />
                </Field>
              )}
              <Field label="Price (USD)">
                <Input type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} data-testid="input-product-price" />
              </Field>
              <Field label="Compare-at price (optional)">
                <Input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
              </Field>
              <Field label="Stock qty">
                <Input type="number" value={form.stockQty} onChange={(e) => set("stockQty", e.target.value)} data-testid="input-product-stock" />
              </Field>
              <Field label="Low-stock threshold">
                <Input type="number" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} />
              </Field>
            </div>

            <Field label="Image URL">
              <Input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." data-testid="input-product-image" />
            </Field>
            <Field label="Short description">
              <Input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Sizes (comma-sep)">
                <Input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="S, M, L" />
              </Field>
              <Field label="Colors (comma-sep)">
                <Input value={form.colors} onChange={(e) => set("colors", e.target.value)} placeholder="Red, Blue" />
              </Field>
              <Field label="Tags (comma-sep)">
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="redfish, jig" />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.bestseller}
                onChange={(e) => set("bestseller", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Mark as bestseller
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} data-testid="button-save-product">
                {saving ? "Saving..." : editing ? "Save changes" : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{deleteTarget?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
