import { Link } from "wouter";
import { SPECIES_META, type Species } from "@/lib/catalog";
import { BLOG_POSTS, postsBySpecies, type BlogPost } from "@/lib/blog";
import { assetUrl } from "@/lib/utils";
import { ArrowRight, Clock, MapPin } from "lucide-react";

const speciesKeys = Object.keys(SPECIES_META) as Species[];

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} data-testid={`card-post-${post.slug}`}>
      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-card-border bg-card hover-elevate">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={assetUrl(post.image)}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.7rem] font-700 uppercase tracking-wide text-foreground backdrop-blur-sm">
            {post.fish}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-base font-700 leading-snug group-hover:text-primary">
            {post.title}
          </h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.readMinutes} min read
            </span>
            <span className="flex items-center gap-1 font-600 text-primary">
              Read guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Blog() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={assetUrl("/img/cat-inshore.webp")}
          alt="Fishing the Emerald Coast"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(198_55%_8%/0.92)] via-[hsl(198_55%_10%/0.6)] to-[hsl(198_55%_10%/0.3)]" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-700 uppercase tracking-[0.2em] text-white/80">The Logbook</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-700 text-white sm:text-4xl">
            How and where to target Emerald Coast fish
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/85 sm:text-base">
            Field-tested guides from the crew, organized by where you fish, from
            the grass flats to the bluewater. Pick your water, learn the bite,
            then grab the tackle to match.
          </p>
        </div>
      </section>

      {/* Category jump links */}
      <section className="border-b border-border bg-sidebar">
        <div className="mx-auto flex max-w-[1200px] flex-wrap gap-2 px-4 py-4 sm:px-6">
          {speciesKeys.map((s) => (
            <a
              key={s}
              href={`#cat-${s}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`cat-${s}`)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-card-border bg-card px-3.5 py-1.5 text-xs font-600 text-foreground/80 transition-colors hover:border-primary hover:text-primary"
              data-testid={`jump-${s}`}
            >
              {SPECIES_META[s].label}
            </a>
          ))}
        </div>
      </section>

      {/* Posts grouped by species category */}
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {speciesKeys.map((s) => {
          const posts = postsBySpecies(s);
          if (posts.length === 0) return null;
          const meta = SPECIES_META[s];
          return (
            <section key={s} id={`cat-${s}`} className="scroll-mt-24 py-12">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-700 uppercase tracking-[0.2em] text-primary">
                    <MapPin className="h-3.5 w-3.5" /> {meta.tagline}
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl font-700">{meta.label}</h2>
                </div>
                <Link href={`/tackle/${s}`}>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-600 text-primary hover:underline"
                    data-testid={`link-blog-shop-${s}`}
                  >
                    Shop {meta.label} tackle <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="h-4" />
    </div>
  );
}
