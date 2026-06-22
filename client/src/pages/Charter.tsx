import { CHARTER_TRIPS, tripBookingHref, formatTripPrice } from "@/lib/charters";
import { Button } from "@/components/ui/button";
import { Anchor, Users, Clock, Check, Waves, Phone, Mail } from "lucide-react";
import { assetUrl } from "@/lib/utils";

export default function Charter() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={assetUrl("/img/charter-hero.webp")}
            alt="Center-console charter boat running the Emerald Coast"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(198_55%_8%/0.85)] via-[hsl(198_55%_10%/0.55)] to-transparent" />
        </div>
        <div className="relative mx-auto flex min-h-[56vh] max-w-[1200px] flex-col justify-center px-4 py-20 sm:px-6">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-500 uppercase tracking-wider text-white backdrop-blur-sm">
            <Waves className="h-3.5 w-3.5" /> Book a Charter · Emerald Coast
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-700 leading-[1.05] text-white sm:text-5xl">
            Get on the water with us.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Inshore flats, nearshore reefs, or a full day in the bluewater — pick
            a trip below and we'll get you booked. Local captains, top gear, and the
            best spots on the Emerald Coast.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#trips" onClick={(e) => { e.preventDefault(); document.getElementById("trips")?.scrollIntoView({ behavior: "smooth" }); }}>
              <Button size="lg" className="text-base" data-testid="button-hero-view-trips">
                <Anchor className="mr-2 h-5 w-5" /> View Trips
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* TRIPS */}
      <section id="trips" className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Our charters</p>
          <h2 className="mt-2 font-display text-2xl font-700 sm:text-3xl">Choose your trip</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Prices are per trip and include gear, bait, and your Florida fishing
            license. Tap a trip to request your dates.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {CHARTER_TRIPS.map((trip) => (
            <div
              key={trip.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card hover-elevate"
              data-testid={`card-trip-${trip.slug}`}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={assetUrl(trip.image)}
                  alt={trip.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(198_55%_8%/0.55)] to-transparent" />
                <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground">
                  {trip.category}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-700">{trip.name}</h3>
                    <p className="mt-0.5 text-xs font-500 text-muted-foreground">{trip.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">from</p>
                    <p className="font-display text-lg font-700 text-primary" data-testid={`text-price-${trip.slug}`}>
                      {formatTripPrice(trip.fromPrice)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{trip.description}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-500 text-foreground/80">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {trip.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> Up to {trip.capacity}
                  </span>
                </div>

                <p className="mt-3 text-xs font-600 text-foreground/90">{trip.target}</p>

                <ul className="mt-4 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground" role="list">
                  {trip.includes.map((inc) => (
                    <li key={inc} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> {inc}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <a href={tripBookingHref(trip)} data-testid={`button-book-${trip.slug}`}>
                    <Button className="w-full">
                      <Anchor className="mr-2 h-4 w-4" /> Request This Trip
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT BAND */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="rounded-2xl border border-card-border bg-sidebar p-8 text-center sm:p-12">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Ready to fish?</p>
          <h2 className="mt-2 font-display text-2xl font-700 sm:text-3xl">Let's get you booked</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Have a date in mind or want a custom trip? Reach out and we'll line up
            the right charter for your crew. More trips are added through the season.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="mailto:eastpassoutfitters@gmail.com?subject=Charter%20request" data-testid="button-contact-email">
              <Button size="lg">
                <Mail className="mr-2 h-4 w-4" /> Email Us
              </Button>
            </a>
            <a href="tel:+18505551234" data-testid="button-contact-phone">
              <Button size="lg" variant="outline">
                <Phone className="mr-2 h-4 w-4" /> Call the Dock
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
