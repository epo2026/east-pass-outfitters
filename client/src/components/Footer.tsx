import { Link } from "wouter";
import { Logo } from "./Logo";
import { SPECIES_META, type Species } from "@/lib/catalog";
import { Anchor, MapPin } from "lucide-react";

const speciesKeys = Object.keys(SPECIES_META) as Species[];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-sidebar">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="text-foreground">
            <Logo />
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Custom apparel and saltwater tackle for the Emerald Coast. Shop by what
            you're chasing.
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Destin · Pensacola, Florida
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-700 uppercase tracking-wider text-muted-foreground">
            Shop Tackle
          </h4>
          <ul className="flex flex-col gap-2 text-sm" role="list">
            {speciesKeys.map((s) => (
              <li key={s}>
                <Link
                  href={`/tackle/${s}`}
                  className="text-foreground/80 hover:text-primary transition-colors"
                  data-testid={`link-footer-${s}`}
                >
                  {SPECIES_META[s].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-700 uppercase tracking-wider text-muted-foreground">
            Shop Apparel
          </h4>
          <ul className="flex flex-col gap-2 text-sm" role="list">
            <li><Link href="/apparel" className="text-foreground/80 hover:text-primary transition-colors">All Apparel</Link></li>
            <li><Link href="/apparel" className="text-foreground/80 hover:text-primary transition-colors">Sun Shirts</Link></li>
            <li><Link href="/apparel" className="text-foreground/80 hover:text-primary transition-colors">Hats</Link></li>
            <li><Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">Custom Orders</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-700 uppercase tracking-wider text-muted-foreground">
            Company
          </h4>
          <ul className="flex flex-col gap-2 text-sm" role="list">
            <li><Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">Our Story</Link></li>
            <li><a href="mailto:eastpassoutfitters@gmail.com" className="text-foreground/80 hover:text-primary transition-colors">Contact</a></li>
            <li><span className="text-foreground/80">Shipping & Returns</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p className="flex items-center gap-1.5">
            <Anchor className="h-3.5 w-3.5" /> © {new Date().getFullYear()} East Pass Outfitters. All rights reserved.
          </p>
          <p>Tight lines from the Emerald Coast.</p>
        </div>
      </div>
    </footer>
  );
}
