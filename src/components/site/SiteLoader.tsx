import { useEffect, useState } from "react";
import { site } from "@/lib/site";

const STORAGE_KEY = "site-loader-shown";
const MIN_DISPLAY_MS = 2000;
const FADE_OUT_MS = 500;

export function SiteLoader() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(STORAGE_KEY);
  });
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (!visible) return;

    sessionStorage.setItem(STORAGE_KEY, "1");

    const hideTimer = window.setTimeout(() => {
      setHiding(true);
      window.setTimeout(() => setVisible(false), FADE_OUT_MS);
    }, MIN_DISPLAY_MS);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity ${
        hiding ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-5">
        <img
          src={site.brand.logo}
          alt={`${site.brand.legalName} logo`}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 object-contain"
          style={{ animation: "loader-float 2s ease-in-out infinite" }}
        />
        <div className="text-center">
          <span className="shimmer-text block font-brand text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            {site.brand.shortName || site.brand.name}
          </span>
          <span
            className="mt-1.5 block text-sm text-muted-foreground sm:text-base"
            style={{ animation: "loader-fade-in 0.8s ease-out 0.3s both" }}
          >
            {site.brand.tagline}
          </span>
        </div>
      </div>
    </div>
  );
}
