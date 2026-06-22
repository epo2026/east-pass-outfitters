import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { SPECIES_META, type Species } from "@/lib/catalog";
import { CHARTER_TRIPS, formatTripPrice } from "@/lib/charters";
import { ProductCard } from "@/components/ProductCard";
import { assetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Fish, Shirt, Anchor, Truck, Sparkles, Waves, Clock } from "lucide-react";

const speciesKeys = Object.keys(SPECIES_META) as Species[];

// Hero CTA styling. All three buttons share a hover-driven highlight: whichever
// button is hovered becomes the solid primary; the rest stay glassy outlines.
// The "default" button is solid only while nothing in the group is hovered, so
// Shop Tackle reads as the initial highlight without locking the highlight to it.
const HERO_OUTLINE =
  "border-white/40 bg-white/10 text-white backdrop-blur-sm hover:border-transparent hover:bg-primary hover:text-primary-foreground";
const HERO_DEFAULT_SOLID =
  "[.group:not(:hover)_&]:border-transparent [.group:not(:hover)_&]:bg-primary [.group:not(:hover)_&]:text-primary-foreground";
function heroBtn(kind?: "default") {
  return `text-base transition-colors ${HERO_OUTLINE}${
    kind === "default" ? " " + HERO_DEFAULT_SOLID : ""
  }`;
}

export default function Home() {
  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const featured = products?.filter((p) => p.bestseller).slice(0, 8) ?? [];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={assetUrl("/img/hero.png")}
            alt="East Pass inlet at Destin, Florida"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(198_55%_8%/0.82)] via-[hsl(198_55%_10%/0.55)] to-transparent" />
        </div>
        <div className="relative mx-auto flex min-h-[78vh] max-w-[1200px] flex-col justify-center px-4 py-20 sm:px-6">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-500 uppercase tracking-wider text-white backdrop-blur-sm">
            <Waves className="h-3.5 w-3.5" /> Emerald Coast · Florida
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-700 leading-[1.05] text-white sm:text-5xl md:text-[3.5rem]">
            Gear up for what you're chasing.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Original fishing and boating apparel, plus saltwater tackle organized
            by target species. From the flats to the bluewater, we've got the
            Emerald Coast covered.
          </p>
          <div className="group mt-8 flex flex-wrap gap-3">
            <Link href="/tackle">
              <Button
                size="lg"
                variant="outline"
                className={heroBtn("default")}
                data-testid="button-hero-tackle"
              >
                <Fish className="mr-2 h-5 w-5" /> Shop Tackle
              </Button>
            </Link>
            <Link href="/apparel">
              <Button
                size="lg"
                variant="outline"
                className={heroBtn()}
                data-testid="button-hero-apparel"
              >
                <Shirt className="mr-2 h-5 w-5" /> Shop Apparel
              </Button>
            </Link>
            <Link href="/charter">
              <Button
                size="lg"
                variant="outline"
                className={heroBtn()}
                data-testid="button-hero-charter"
              >
                <Anchor className="mr-2 h-5 w-5" /> Book a Charter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-border bg-sidebar">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 py-6 sm:px-6 md:grid-cols-4">
          {[
            { icon: Sparkles, title: "Original designs", text: "Apparel designed on the Emerald Coast" },
            { icon: Fish, title: "Shop by species", text: "Tackle sorted by what you target" },
            { icon: Anchor, title: "Locally run", text: "Anglers serving anglers" },
            { icon: Truck, title: "Free shipping", text: "On every order over $75" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-700">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* THREE MAIN CATEGORIES */}
      <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Three ways to get on the water</p>
          <h2 className="mt-2 font-display text-2xl font-700 sm:text-3xl">Tackle, apparel & charters</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/tackle",
              img: "/img/tackle-flatlay.png",
              eyebrow: "Shop Tackle",
              title: "By target species",
              text: "Rigs, lures, and terminal tackle sorted by what you're chasing.",
              testid: "card-cat-tackle",
              cta: "Shop tackle",
            },
            {
              href: "/apparel",
              img: "/img/apparel-hero.png",
              eyebrow: "Shop Apparel",
              title: "Original designs",
              text: "UPF 50+ shirts, hats, and hoodies designed on the Emerald Coast.",
              testid: "card-cat-apparel",
              cta: "Shop apparel",
            },
            {
              href: "/charter",
              img: "/img/charter-hero.png",
              eyebrow: "Book a Charter",
              title: "Get on the water",
              text: "Inshore, nearshore, and offshore trips with local captains.",
              testid: "card-cat-charter",
              cta: "View trips",
            },
          ].map((c) => (
            <Link key={c.href} href={c.href} data-testid={c.testid}>
              <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-card-border hover-elevate">
                <img
                  src={assetUrl(c.img)}
                  alt={c.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(198_55%_8%/0.92)] via-[hsl(198_55%_8%/0.35)] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-xs font-700 uppercase tracking-[0.15em] text-white/80">{c.eyebrow}</p>
                  <h3 className="mt-1 font-display text-xl font-700 text-white">{c.title}</h3>
                  <p className="mt-1.5 text-xs text-white/80">{c.text}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-600 text-white">
                    {c.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SHOP BY SPECIES */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">The tackle shop</p>
            <h2 className="mt-2 font-display text-2xl font-700 sm:text-3xl">Shop by target species</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Tell us what you're after and we'll point you to the rigs, lures, and
              terminal tackle that put fish in the boat.
            </p>
          </div>
          <Link href="/tackle">
            <Button variant="ghost" className="text-primary" data-testid="button-all-tackle">
              All tackle <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {speciesKeys.map((s) => {
            const meta = SPECIES_META[s];
            return (
              <Link key={s} href={`/tackle/${s}`} data-testid={`card-species-${s}`}>
                <div className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-card-border hover-elevate">
                  <img
                    src={assetUrl(meta.image)}
                    alt={meta.label}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(198_55%_8%/0.92)] via-[hsl(198_55%_8%/0.25)] to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-display text-xl font-700 text-white">{meta.label}</h3>
                    <p className="mt-0.5 text-xs font-500 text-white/80">{meta.tagline}</p>
                    <p className="mt-2 text-xs font-600 text-white/95">{meta.species}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-600 text-white">
                      Shop {meta.label} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* APPAREL BANNER */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="relative h-[360px] overflow-hidden rounded-2xl border border-card-border sm:h-[400px]">
          <img
            src={assetUrl("/img/apparel-hero.png")}
            alt="East Pass Emerald Coast apparel"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(198_55%_8%/0.92)] via-[hsl(198_55%_8%/0.55)] to-transparent" />
          <div className="relative flex h-full flex-col justify-center p-8 sm:p-12">
            <p className="text-xs font-700 uppercase tracking-[0.2em] text-white/80">East Pass apparel</p>
            <h2 className="mt-2 max-w-md font-display text-2xl font-700 leading-tight text-white sm:text-3xl">
              Original designs, built for the water
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/85">
              UPF 50+ performance shirts, hats, and hoodies designed on the
              Emerald Coast, ready to wear from the flats to the dock bar.
            </p>
            <Link href="/apparel" className="mt-6">
              <Button size="lg" data-testid="button-banner-apparel">
                Shop apparel <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CHARTER OVERVIEW */}
      <section className="mx-auto mt-16 max-w-[1200px] px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Book a charter</p>
            <h2 className="mt-2 font-display text-2xl font-700 sm:text-3xl">Get on the water with a local captain</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              From the bays to the bluewater, our guided trips cover the whole
              Emerald Coast. Gear, bait, and licenses are always included.
            </p>
          </div>
          <Link href="/charter">
            <Button variant="ghost" className="text-primary" data-testid="button-all-charters">
              All charters <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHARTER_TRIPS.map((t) => (
            <Link key={t.slug} href="/charter" data-testid={`card-charter-${t.slug}`}>
              <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-card-border hover-elevate">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={assetUrl(t.image)}
                    alt={t.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.7rem] font-700 uppercase tracking-wide text-foreground backdrop-blur-sm">
                    {t.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-base font-700">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.target}</p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {t.duration}
                    </span>
                    <span className="text-sm font-700 text-primary">
                      {formatTripPrice(t.fromPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Crew favorites</p>
          <h2 className="mt-2 font-display text-2xl font-700 sm:text-3xl">Emerald Coast bestsellers</h2>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
