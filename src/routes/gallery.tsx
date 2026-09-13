import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { site, pageTitle } from "@/lib/site";
import { listGallery } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { imageOf } from "@/components/site/Icon";
import { PageBanner } from "@/components/site/PageBanner";

export const Route = createFileRoute("/gallery")({
  loader: () => listGallery(),
  head: () => {
    const title = pageTitle("Gallery");
    const description = `Photos from the work, events and clients of ${site.brand.legalName}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/gallery" },
      ],
      links: [{ rel: "canonical", href: "/gallery" }],
    };
  },
  component: GalleryPage,
});

function monthKey(d?: string | null) {
  if (!d) return "Undated";
  return new Date(d).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function GalleryPage() {
  const photos = Route.useLoaderData();
  const [active, setActive] = useState<number | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, typeof photos>();
    for (const p of photos) {
      const key = monthKey(p.posted_on);
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()];
  }, [photos]);

  const flat = photos;
  const current = active !== null ? flat[active] : null;

  return (
    <>
      <PageBanner title="Gallery" crumb="Gallery" />

      <section className="container-page py-16">
        {groups.length === 0 ? (
          <p className="surface-card p-8 text-sm text-muted-foreground">No photos yet.</p>
        ) : null}

        {groups.map(([label, items]) => (
          <div key={label} className="mb-14">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="font-display text-xl font-black">{label}</h2>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{items.length} photos</span>
            </div>

            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
              {items.map((p, i) => {
                const src = imageOf(p.media_id, p.image_url);
                if (!src) return null;
                const index = flat.indexOf(p);
                return (
                  <Reveal key={p.id} delay={Math.min(i, 8) * 50} className="break-inside-avoid">
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      className="group block w-full overflow-hidden rounded-xl"
                    >
                      <img
                        src={src}
                        alt={p.caption ?? "Gallery photo"}
                        width={p.width ?? undefined}
                        height={p.height ?? undefined}
                        loading="lazy"
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {p.caption ? (
                        <span className="block bg-secondary px-3 py-2 text-left text-xs text-secondary-foreground">
                          {p.caption}
                        </span>
                      ) : null}
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {current ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-ink/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setActive(null)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-ink-foreground"
          >
            <X size={20} />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-h-full max-w-4xl">
            <img
              src={imageOf(current.media_id, current.image_url) as string}
              alt={current.caption ?? "Gallery photo"}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
            {current.caption ? (
              <figcaption className="mt-3 text-center text-sm text-ink-foreground/80">
                {current.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </>
  );
}
