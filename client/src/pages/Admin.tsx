import { useState } from "react";
import { useAdmin, AdminProvider } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Lock, LogOut, LayoutDashboard, Package, Boxes, ShoppingCart, BarChart3 } from "lucide-react";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

function LoginScreen() {
  const { login } = useAdmin();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(password);
    } catch (err) {
      toast({
        title: "Login failed",
        description: (err as Error).message || "Incorrect password",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm"
        data-testid="form-admin-login"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-700 text-foreground">Admin Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            East Pass Outfitters dashboard
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            data-testid="input-admin-password"
          />
        </div>
        <Button
          type="submit"
          className="mt-6 w-full"
          disabled={busy || !password}
          data-testid="button-admin-login"
        >
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { logout } = useAdmin();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-700 text-foreground">Dashboard</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          data-testid="button-admin-logout"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="mr-2 h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Boxes className="mr-2 h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingCart className="mr-2 h-4 w-4" /> Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>
        <TabsContent value="products">
          <AdminProducts />
        </TabsContent>
        <TabsContent value="inventory">
          <AdminInventory />
        </TabsContent>
        <TabsContent value="orders">
          <AdminOrders />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminInner() {
  const { isAuthed } = useAdmin();
  return isAuthed ? <Dashboard /> : <LoginScreen />;
}

export default function Admin() {
  return (
    <AdminProvider>
      <AdminInner />
    </AdminProvider>
  );
}
