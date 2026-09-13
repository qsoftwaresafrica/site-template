import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function PageBanner({
  title,
  crumb,
  image,
}: {
  title: string;
  crumb: string;
  image?: string | null;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      {image ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
          />
          <div className="absolute inset-0 bg-ink/75" />
        </>
      ) : (
        <div className="absolute inset-0 bg-ink" />
      )}
      <div className="container-page relative py-16 sm:py-20">
        <h1 className="font-display text-3xl font-black text-ink-foreground sm:text-4xl">
          {title}
        </h1>
        <nav aria-label="Breadcrumb" className="mt-3 flex items-center gap-1 text-xs text-ink-foreground/75">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight size={13} />
          <span className="text-primary">{crumb}</span>
        </nav>
      </div>
    </section>
  );
}
