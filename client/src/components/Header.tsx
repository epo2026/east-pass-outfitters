import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Menu, Sun, Moon, Fish, Shirt } from "lucide-react";
import { SPECIES_META, type Species } from "@/lib/catalog";

const speciesKeys = Object.keys(SPECIES_META) as Species[];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Link
        href="/apparel"
        onClick={onNavigate}
        className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
        data-testid="link-nav-apparel"
      >
        Apparel
      </Link>
      <Link
        href="/tackle"
        onClick={onNavigate}
        className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
        data-testid="link-nav-tackle"
      >
        Tackle
      </Link>
      {speciesKeys.map((s) => (
        <Link
          key={s}
          href={`/tackle/${s}`}
          onClick={onNavigate}
          className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
          data-testid={`link-nav-${s}`}
        >
          {SPECIES_META[s].label}
        </Link>
      ))}
      <Link
        href="/about"
        onClick={onNavigate}
        className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
        data-testid="link-nav-about"
      >
        Our Story
      </Link>
    </>
  );
}

export function Header() {
  const { count, setOpen } = useCart();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      {/* Announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs font-500 py-1.5 px-4">
        Free shipping on orders over $75 · Custom apparel printed on the Emerald Coast
      </div>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-foreground" data-testid="link-home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setOpen(true)}
            aria-label="Open cart"
            data-testid="button-open-cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-700 text-primary-foreground"
                data-testid="text-cart-count"
              >
                {count}
              </span>
            )}
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mb-8 mt-2 text-foreground">
                <Logo />
              </div>
              <div className="mb-6 flex items-center gap-2 text-xs font-600 uppercase tracking-wider text-muted-foreground">
                <Shirt className="h-3.5 w-3.5" /> Shop
              </div>
              <nav className="flex flex-col gap-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
              <Button
                className="mt-8 w-full"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/tackle");
                }}
                data-testid="button-mobile-shop"
              >
                <Fish className="mr-2 h-4 w-4" /> Shop by Species
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
