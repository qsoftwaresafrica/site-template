import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

export type HeroSlide = {
  url: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type HeroSettings = {
  mode: "slideshow" | "solid";
  autoplayMs: number;
  animateText: boolean;
  overlay: number;
  solidToken: string;
  slides: HeroSlide[];
};

export type ContactSettings = {
  companyName: string;
  addressLines: string[];
  phones: string[];
  emails: string[];
  hours: { label: string; value: string }[];
  map: { enabled: boolean; query: string; zoom: number };
};

export type AboutSettings = {
  heading: string;
  paragraphs: string[];
  highlight: string;
  image: string;
};

export type Social = { platform: string; url: string; enabled: boolean };

export type Bootstrap = {
  origin: string;
  hero: HeroSettings;
  contacts: ContactSettings;
  about: AboutSettings;
  socials: Social[];
  hasArticles: boolean;
  hasPhotos: boolean;
  services: { slug: string; title: string }[];
};

export function requestOrigin(): string {
  const req = getRequest();
  const url = new URL(req.url);
  const forwarded = url.hostname === "localhost" ? getRequestHeader("x-forwarded-host") : null;
  return forwarded ? `https://${forwarded}` : url.origin;
}

export const getBootstrap = createServerFn({ method: "GET" }).handler(
  async (): Promise<Bootstrap> => {
    const { db } = await import("./db.server");
    const client = db();

    const [settings, socials, services, articles, photos] = await Promise.all([
      client.from("settings").select("key,value"),
      client.from("socials").select("platform,url,enabled").order("order_index"),
      client
        .from("services")
        .select("slug,title")
        .eq("published", true)
        .order("order_index"),
      client.from("articles").select("id").eq("status", "published").limit(1),
      client.from("gallery_photos").select("id").limit(1),
    ]);

    const map = new Map((settings.data ?? []).map((r) => [r.key, r.value]));

    return {
      origin: requestOrigin(),
      hero: map.get("hero") as HeroSettings,
      contacts: map.get("contacts") as ContactSettings,
      about: map.get("about") as AboutSettings,
      socials: ((socials.data ?? []) as Social[]).filter((s) => s.enabled && s.url),
      hasArticles: (articles.data ?? []).length > 0,
      hasPhotos: (photos.data ?? []).length > 0,
      services: services.data ?? [],
    };
  },
);

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("services")
    .select("id,slug,title,summary,icon,image_id,order_index")
    .eq("published", true)
    .order("order_index");
  return data ?? [];
});

export const getService = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const client = db();
    const { data: service } = await client
      .from("services")
      .select("id,slug,title,summary,body,icon,image_id,highlights")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!service) return null;
    const { data: others } = await client
      .from("services")
      .select("slug,title,summary,icon")
      .eq("published", true)
      .neq("slug", data.slug)
      .order("order_index")
      .limit(3);
    return { service, others: others ?? [] };
  });

export const listArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string; page?: number } | undefined) =>
    z
      .object({ q: z.string().max(120).optional(), page: z.number().int().min(1).max(500).optional() })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const pageSize = 6;
    const page = data.page ?? 1;
    let query = db()
      .from("articles")
      .select("id,slug,title,excerpt,cover_url,cover_id,author,tags,published_at", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,body.ilike.%${term}%`);
    }

    const { data: rows, count } = await query;
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const listRecentArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("articles")
    .select("slug,title,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);
  return data ?? [];
});

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const client = db();
    const { data: article } = await client
      .from("articles")
      .select("id,slug,title,excerpt,body,cover_url,cover_id,author,tags,published_at")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!article) return null;
    const { data: more } = await client
      .from("articles")
      .select("slug,title,excerpt,published_at")
      .eq("status", "published")
      .neq("slug", data.slug)
      .order("published_at", { ascending: false })
      .limit(3);
    return { article, more: more ?? [], origin: requestOrigin() };
  });

export const listGallery = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("gallery_photos")
    .select("id,media_id,image_url,caption,category,width,height,posted_on")
    .order("posted_on", { ascending: false })
    .limit(85);
  return data ?? [];
});

export const listTeam = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("team_members")
    .select("id,name,role,bio,photo_id,photo_url")
    .order("order_index");
  return data ?? [];
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        subject: z.string().trim().max(150).default(""),
        message: z.string().trim().min(5).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { error } = await db().from("inquiries").insert(data);
    if (error) return { ok: false as const, error: "Your message could not be sent. Please try again." };
    return { ok: true as const };
  });
