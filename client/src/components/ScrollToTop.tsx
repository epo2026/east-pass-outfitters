import { useEffect } from "react";
import { useLocation } from "wouter";
import { track } from "@/lib/track";

export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Track storefront page views (skip the admin dashboard).
    if (!location.startsWith("/admin")) {
      track("page_view", { path: location });
    }
  }, [location]);

  return null;
}
