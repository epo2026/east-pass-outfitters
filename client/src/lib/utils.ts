import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Resolve a static asset path against the Vite base URL so images load
// correctly when the site is served from a subpath (e.g. proxied previews).
// Leading-slash paths like "/img/hero.webp" would otherwise resolve to the
// domain root and 404. Leaves absolute (http) and data URLs untouched.
export function assetUrl(src: string): string {
  if (!src || /^(https?:|data:|blob:)/.test(src)) return src;
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "") + "/" + src.replace(/^\//, "");
}
