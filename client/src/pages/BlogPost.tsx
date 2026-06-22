import { useRoute, Link } from "wouter";
import { SPECIES_META } from "@/lib/catalog";
import { findPost, postsBySpecies } from "@/lib/blog";
import { assetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, Calendar, Fish } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const post = params?.slug ? findPost(params.slug) : undefined;

  if (!post) return <NotFound />;

  const meta = SPECIES_META[post.species];
  const related = postsBySpecies(post.species).filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={assetUrl(post.image)}
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(198_55%_8%/0.92)] via-[hsl(198_55%_10%/0.6)] to-[hsl(198_55%_10%/0.35)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <nav className="mb-4 text-xs text-white/80">
            <Link href="/blog" className="hover:text-white">The Logbook</Link>
            <span className="mx-1.5">/</span>
            <span>{meta.label}</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-700 uppercase tracking-wide text-white backdrop-blur-sm">
            <Fish className="h-3.5 w-3.5" /> {post.fish}
          </span>
          <h1 className="mt-3 font-display text-3xl font-700 leading-tight text-white sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/85">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {post.readMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Best window: {post.bestTime}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-base font-500 leading-relaxed text-foreground/90">{post.excerpt}</p>

        {post.sections.map((section) => (
          <section key={section.heading} className="mt-9">
            <h2 className="font-display text-xl font-700">{section.heading}</h2>
            {section.body?.map((para, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-4 flex flex-col gap-2" role="list">
                {section.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Shop CTA */}
        <div className="mt-12 rounded-2xl border border-card-border bg-sidebar p-6 sm:p-8">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-primary">Gear up</p>
          <h3 className="mt-2 font-display text-xl font-700">
            Tackle for {post.fish.toLowerCase()}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sorted the rigs, lures, and terminal tackle that put {post.fish.toLowerCase()} in
            the boat. Shop the {meta.label.toLowerCase()} selection.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {post.fishSlug && (
              <Link href={`/tackle/${post.species}/${post.fishSlug}`}>
                <Button data-testid="button-post-shop-fish">
                  Shop {post.fish} tackle <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href={`/tackle/${post.species}`}>
              <Button variant="outline" data-testid="button-post-shop-cat">
                All {meta.label} tackle
              </Button>
            </Link>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-lg font-700">More {meta.label.toLowerCase()} guides</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} data-testid={`link-related-${r.slug}`}>
                  <div className="group flex items-center gap-4 rounded-xl border border-card-border bg-card p-4 hover-elevate">
                    <img
                      src={assetUrl(r.image)}
                      alt={r.title}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-display text-sm font-700 leading-snug group-hover:text-primary">
                        {r.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{r.readMinutes} min read</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <Link href="/blog">
            <span className="inline-flex items-center gap-1.5 text-sm font-600 text-primary hover:underline" data-testid="link-back-blog">
              <ArrowLeft className="h-4 w-4" /> Back to The Logbook
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
