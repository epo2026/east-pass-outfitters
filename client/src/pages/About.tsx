import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Fish, Shirt, Truck, Sparkles, Anchor, ArrowRight } from "lucide-react";
import { assetUrl } from "@/lib/utils";

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <img src={assetUrl("/img/hero.webp")} alt="East Pass inlet" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(198_55%_8%/0.9)] to-[hsl(198_55%_10%/0.4)]" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-white/80">Our story</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-700 text-white sm:text-4xl">
            Born at the pass, built for the coast.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/85 sm:text-base">
            East Pass Outfitters started where Choctawhatchee Bay meets the Gulf —
            the legendary East Pass at Destin. We're anglers first, outfitting the
            Emerald Coast with apparel and tackle we actually use.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-700">Anglers serving anglers</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            From sunrise topwater bites on the flats to a snapper drop over a deep
            ledge, we live for time on the water. We built East Pass Outfitters to
            make gearing up simple — sort tackle by the fish you're chasing, and
            wear apparel that holds up to sun, salt, and long runs offshore.
          </p>
          <p>
            Our apparel is designed right here on the coast — original artwork on
            quality performance gear built to hold up to sun, salt, and long runs
            offshore. Our tackle is hand-picked by people who fish these waters and
            shipped out fast, so you spend less time waiting and more time fishing.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-sidebar">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-14 sm:px-6 md:grid-cols-4">
          {[
            { icon: Fish, title: "Sorted by species", text: "Find tackle by what you target, not by guessing brands." },
            { icon: Sparkles, title: "Original designs", text: "Apparel designed and printed on the Emerald Coast." },
            { icon: Truck, title: "Fast shipping", text: "Quick fulfillment and free shipping over $75." },
            { icon: Anchor, title: "Locally rooted", text: "Built by people who fish these waters every week." },
          ].map((v) => (
            <div key={v.title} className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <v.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-700">{v.title}</p>
              <p className="text-xs text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-700">Ready to gear up?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Shop tackle by species or grab our latest Emerald Coast apparel.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/tackle"><Button size="lg"><Fish className="mr-2 h-5 w-5" /> Shop Tackle</Button></Link>
          <Link href="/apparel"><Button size="lg" variant="outline"><Shirt className="mr-2 h-5 w-5" /> Shop Apparel <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
