import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ShoppingBag, Menu, Sun, Moon, Fish, Shirt, Anchor, ChevronDown } from "lucide-react";
import { SPECIES_META, FISH_SPECIES, type Species } from "@/lib/catalog";

const speciesKeys = Object.keys(SPECIES_META) as Species[];

// Desktop tackle dropdown: Tackle -> 4 categories -> fish species under each
function TackleMenu() {
  const [, navigate] = useLocation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 text-sm font-500 text-foreground/80 hover:text-foreground transition-colors focus:outline-none"
        data-testid="link-nav-tackle"
      >
        Tackle <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => navigate("/tackle")} data-testid="link-tackle-all">
          <Fish className="mr-2 h-4 w-4" /> All Tackle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
          Shop by category
        </DropdownMenuLabel>
        {speciesKeys.map((s) => (
          <DropdownMenuSub key={s}>
            <DropdownMenuSubTrigger data-testid={`subtrigger-${s}`}>
              {SPECIES_META[s].label}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-56">
                <DropdownMenuItem
                  onClick={() => navigate(`/tackle/${s}`)}
                  data-testid={`link-cat-${s}`}
                >
                  All {SPECIES_META[s].label}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  Target species
                </DropdownMenuLabel>
                {FISH_SPECIES[s].map((f) => (
                  <DropdownMenuItem
                    key={f.slug}
                    onClick={() => navigate(`/tackle/${s}/${f.slug}`)}
                    data-testid={`link-fish-${s}-${f.slug}`}
                  >
                    {f.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopNav() {
  return (
    <>
      <TackleMenu />
      <Link
        href="/apparel"
        className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
        data-testid="link-nav-apparel"
      >
        Apparel
      </Link>
      <Link
        href="/blog"
        className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
        data-testid="link-nav-blog"
      >
        Blog
      </Link>
      <Link
        href="/charter"
        className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
        data-testid="link-nav-charter"
      >
        Book a Charter
      </Link>
      <Link
        href="/about"
        className="text-sm font-500 text-foreground/80 hover:text-foreground transition-colors"
        data-testid="link-nav-about"
      >
        Our Story
      </Link>
    </>
  );
}

const mRow =
  "flex w-full items-center justify-between py-3.5 text-[0.95rem] font-600 text-foreground transition-colors hover:text-primary";

// Mobile nav: clean accordion. Subheadings (categories + fish) stay hidden
// until the Tackle row is tapped; each category expands to its fish on tap.
function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const [tackleOpen, setTackleOpen] = useState(false);
  const [openCat, setOpenCat] = useState<Species | null>(null);

  return (
    <div className="flex flex-col divide-y divide-border">
      {/* Tackle accordion */}
      <div>
        <button
          type="button"
          onClick={() => setTackleOpen((v) => !v)}
          className={mRow}
          aria-expanded={tackleOpen}
          data-testid="button-mnav-tackle"
        >
          Tackle
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              tackleOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {tackleOpen && (
          <div className="pb-2">
            <Link
              href="/tackle"
              onClick={onNavigate}
              className="block py-2 pl-3 text-sm font-500 text-foreground/80 hover:text-primary"
              data-testid="link-mnav-tackle-all"
            >
              All Tackle
            </Link>
            {speciesKeys.map((s) => {
              const isOpen = openCat === s;
              return (
                <div key={s}>
                  <button
                    type="button"
                    onClick={() => setOpenCat(isOpen ? null : s)}
                    className="flex w-full items-center justify-between py-2 pl-3 text-sm font-500 text-foreground/80 transition-colors hover:text-primary"
                    aria-expanded={isOpen}
                    data-testid={`button-mnav-cat-${s}`}
                  >
                    {SPECIES_META[s].label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-0.5 pb-1.5 pl-6">
                      <Link
                        href={`/tackle/${s}`}
                        onClick={onNavigate}
                        className="py-1.5 text-[0.8rem] font-500 text-muted-foreground hover:text-primary"
                        data-testid={`link-mnav-cat-${s}`}
                      >
                        All {SPECIES_META[s].label}
                      </Link>
                      {FISH_SPECIES[s].map((f) => (
                        <Link
                          key={f.slug}
                          href={`/tackle/${s}/${f.slug}`}
                          onClick={onNavigate}
                          className="py-1.5 text-[0.8rem] text-muted-foreground hover:text-primary"
                          data-testid={`link-mnav-fish-${s}-${f.slug}`}
                        >
                          {f.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/apparel"
        onClick={onNavigate}
        className={mRow}
        data-testid="link-mnav-apparel"
      >
        Apparel
      </Link>

      <Link
        href="/blog"
        onClick={onNavigate}
        className={mRow}
        data-testid="link-mnav-blog"
      >
        Blog
      </Link>

      <Link
        href="/charter"
        onClick={onNavigate}
        className={mRow}
        data-testid="link-mnav-charter"
      >
        Book a Charter
      </Link>
      <Link
        href="/about"
        onClick={onNavigate}
        className={mRow}
        data-testid="link-mnav-about"
      >
        Our Story
      </Link>
    </div>
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
        Free shipping on orders over $75 · Original apparel designed on the Emerald Coast
      </div>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-foreground" data-testid="link-home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <DesktopNav />
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
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <div className="mb-4 mt-2 text-foreground">
                <Logo />
              </div>
              <nav>
                <MobileNav onNavigate={() => setMobileOpen(false)} />
              </nav>
              <div className="mt-8 flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/charter");
                  }}
                  data-testid="button-mobile-charter"
                >
                  <Anchor className="mr-2 h-4 w-4" /> Book a Charter
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/tackle");
                  }}
                  data-testid="button-mobile-shop"
                >
                  <Fish className="mr-2 h-4 w-4" /> Shop Tackle
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/apparel");
                  }}
                  data-testid="button-mobile-apparel"
                >
                  <Shirt className="mr-2 h-4 w-4" /> Shop Apparel
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
