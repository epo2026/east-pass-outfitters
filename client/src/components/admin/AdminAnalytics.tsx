import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminRequest } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Range = "7d" | "30d" | "90d" | "all";

interface Summary {
  revenue: number;
  paidOrders: number;
  totalOrders: number;
  avgOrderValue: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  beginCheckouts: number;
  sessions: number;
  conversionRate: number;
}
interface FunnelStep { step: string; count: number; }
interface StatusCount { status: string; count: number; }
interface SummaryResponse {
  summary: Summary;
  funnel: FunnelStep[];
  ordersByStatus: StatusCount[];
}
interface TimePoint { date: string; revenue: number; orders: number; [k: string]: unknown; }
interface TopProduct { productId: number; name: string; unitsSold: number; revenue: number; [k: string]: unknown; }

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-700 text-foreground" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

const RANGES: { value: Range; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

export function AdminAnalytics() {
  const [range, setRange] = useState<Range>("30d");

  const summaryQ = useQuery<SummaryResponse>({
    queryKey: ["/api/admin/analytics/summary", range],
    queryFn: async () =>
      (await adminRequest("GET", `/api/admin/analytics/summary?range=${range}`)).json(),
  });
  const seriesQ = useQuery<TimePoint[]>({
    queryKey: ["/api/admin/analytics/timeseries", range],
    queryFn: async () =>
      (await adminRequest("GET", `/api/admin/analytics/timeseries?range=${range}`)).json(),
  });
  const topQ = useQuery<TopProduct[]>({
    queryKey: ["/api/admin/analytics/top-products", range],
    queryFn: async () =>
      (await adminRequest("GET", `/api/admin/analytics/top-products?range=${range}&limit=10`)).json(),
  });

  const s = summaryQ.data?.summary;
  const funnel = summaryQ.data?.funnel ?? [];
  const series = seriesQ.data ?? [];
  const top = topQ.data ?? [];

  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Range:</span>
        {RANGES.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant={range === r.value ? "default" : "outline"}
            onClick={() => setRange(r.value)}
            data-testid={`range-${r.value}`}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* KPIs */}
      {summaryQ.isLoading || !s ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={DollarSign} label="Revenue" value={formatPrice(s.revenue)} sub={`${s.paidOrders} paid orders`} />
          <Kpi icon={ShoppingBag} label="Avg Order" value={formatPrice(s.avgOrderValue)} sub="per paid order" />
          <Kpi icon={Users} label="Sessions" value={String(s.sessions)} sub={`${s.pageViews} page views`} />
          <Kpi icon={TrendingUp} label="Conversion" value={`${s.conversionRate}%`} sub="sessions to purchase" />
        </div>
      )}

      {/* Sales over time */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-600 text-foreground">Revenue over time</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => downloadCsv(`sales-${range}.csv`, series)}
            disabled={series.length === 0}
            data-testid="export-sales"
          >
            <Download className="mr-1.5 h-4 w-4" /> CSV
          </Button>
        </div>
        {seriesQ.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : series.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No sales in this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(v: number, n: string) => (n === "revenue" ? formatPrice(v) : v)}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Behavior funnel */}
        <Card className="p-5">
          <h3 className="mb-4 font-600 text-foreground">Customer behavior funnel</h3>
          {summaryQ.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="space-y-3">
              {funnel.map((f) => (
                <div key={f.step}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{f.step}</span>
                    <span className="font-600 text-foreground" data-testid={`funnel-${f.step.toLowerCase().replace(/\s+/g, "-")}`}>
                      {f.count}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top products */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-600 text-foreground">Top products by revenue</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => downloadCsv(`top-products-${range}.csv`, top)}
              disabled={top.length === 0}
              data-testid="export-top-products"
            >
              <Download className="mr-1.5 h-4 w-4" /> CSV
            </Button>
          </div>
          {topQ.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : top.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No sales yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, top.length * 34)}>
              <BarChart data={top} layout="vertical" margin={{ left: 12, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  formatter={(v: number) => formatPrice(v)}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
