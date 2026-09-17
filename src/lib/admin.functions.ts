import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { dbProvider } from "./db.server";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  photo_id: string | null;
};

async function guard() {
  const { requireUser } = await import("./auth.server");
  return requireUser();
}

async function client() {
  const { db } = await import("./db.server");
  return db();
}

/* ---------------------------------------------------------------- auth --- */

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { signIn } = await import("./auth.server");
    const user = await signIn(data.email, data.password);
    if (!user) return { ok: false as const, error: "Invalid email or password." };
    return { ok: true as const, user };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { signOut } = await import("./auth.server");
  await signOut();
  return { ok: true };
});

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  const { currentUser } = await import("./auth.server");
  return (await currentUser()) as AdminUser | null;
});

/* --------------------------------------------------------------- media --- */

function toHex(base64: string) {
  const bin = atob(base64);
  let out = "\\x";
  for (let i = 0; i < bin.length; i++) out += bin.charCodeAt(i).toString(16).padStart(2, "0");
  return out;
}

export const uploadMedia = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        filename: z.string().max(200),
        mime: z.string().max(100),
        base64: z.string().max(14_000_000),
        alt: z.string().max(300).optional(),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const bytes = Buffer.from(data.base64, "base64");
    const { data: row, error } = await (await client())
      .from("media")
      .insert({
        filename: data.filename,
        mime: data.mime,
        bytes,
        byte_size: bytes.length,
        alt: data.alt ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

/* ------------------------------------------------------------ settings --- */

export const getSetting = createServerFn({ method: "GET" })
  .validator((d: { key: string }) => z.object({ key: z.string().max(60) }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { data: row } = await (await client())
      .from("settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    return (row?.value ?? null) as Json;
  });

export const saveSetting = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ key: z.string().max(60), value: z.any() }).parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const { error } = await (await client())
      .from("settings")
      .upsert({ key: data.key, value: data.value as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------ profile --- */

export const saveMyProfile = createServerFn({ method: "POST" })
  .validator(
    (d: unknown) =>
      z
        .object({
          name: z.string().min(1).max(160),
          email: z.string().email().max(200),
          phone: z.string().max(60).nullable().optional(),
          photo_id: z.string().uuid().nullable().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await guard();
    const c = await client();
    const { error } = await c
      .from("site_users")
      .update({
        name: data.name,
        email: data.email.trim().toLowerCase(),
        phone: data.phone ?? null,
        photo_id: data.photo_id ?? null,
      })
      .eq("id", me.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .validator(
    (d: unknown) =>
      z
        .object({
          oldPassword: z.string().min(1).max(200),
          newPassword: z.string().min(8).max(200),
          confirmPassword: z.string().min(8).max(200),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.newPassword !== data.confirmPassword) {
      throw new Error("New passwords do not match.");
    }
    const me = await guard();
    const { hashPassword, verifyPassword } = await import("./auth.server");
    const c = await client();
    const { data: row } = await c
      .from("site_users")
      .select("password_hash")
      .eq("id", me.id)
      .maybeSingle();
    if (!row || !verifyPassword(data.oldPassword, row.password_hash)) {
      throw new Error("Current password is incorrect.");
    }
    const { error } = await c
      .from("site_users")
      .update({ password_hash: hashPassword(data.newPassword) })
      .eq("id", me.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ------------------------------------------------------------ services --- */

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  summary: z.string().max(600).default(""),
  body: z.string().max(40000).default(""),
  icon: z.string().max(60).default("briefcase"),
  image_id: z.string().uuid().nullable().optional(),
  highlights: z.array(z.string().max(200)).default([]),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const adminListServices = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const { data: rows, count } = await (await client())
      .from("services")
      .select("id,slug,title,summary,body,icon,image_id,highlights,order_index,published", { count: "exact" })
      .order("order_index")
      .range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveService = createServerFn({ method: "POST" })
  .validator((d: unknown) => serviceSchema.parse(d))
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const payload = { ...data, updated_at: new Date().toISOString() };
    const { error } = data.id
      ? await c.from("services").update(payload).eq("id", data.id)
      : await c.from("services").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("services").delete().eq("id", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------ articles --- */

const articleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(240),
  excerpt: z.string().max(800).default(""),
  body: z.string().max(400000).default(""),
  cover_id: z.string().uuid().nullable().optional(),
  cover_url: z.string().max(600).nullable().optional(),
  tags: z.array(z.string().max(60)).default([]),
  author: z.string().max(120).default("Editorial Team"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const adminListArticles = createServerFn({ method: "GET" })
  .validator((d: { q?: string; status?: string; page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        q: z.string().max(120).optional(),
        status: z.string().max(20).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let query = (await client())
      .from("articles")
      .select("id,slug,title,excerpt,body,status,author,tags,cover_id,cover_url,published_at,updated_at", { count: "exact" })
      .order("updated_at", { ascending: false });
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
    }
    const { data: rows, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const adminGetArticle = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { data: row } = await (await client())
      .from("articles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    return row;
  });

export const createArticle = createServerFn({ method: "POST" }).handler(async () => {
  await guard();
  const stamp = Date.now().toString(36);
  const { data, error } = await (await client())
    .from("articles")
    .insert({ slug: `untitled-${stamp}`, title: "Untitled article", status: "draft" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
});

export const saveArticle = createServerFn({ method: "POST" })
  .validator((d: unknown) => articleSchema.parse(d))
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const payload: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    if (data.status === "published") {
      const { data: prev } = await c
        .from("articles")
        .select("published_at")
        .eq("id", data.id ?? "")
        .maybeSingle();
      payload["published_at"] = prev?.published_at ?? new Date().toISOString();
    }
    const { error } = data.id
      ? await c.from("articles").update(payload).eq("id", data.id)
      : await c.from("articles").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("articles").delete().eq("id", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------- gallery --- */

export const adminListGallery = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number; q?: string; category?: string } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
        q: z.string().max(120).optional(),
        category: z.string().max(80).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let query = (await client())
      .from("gallery_photos")
      .select("id,media_id,image_url,caption,category,width,height,posted_on", { count: "exact" })
      .order("posted_on", { ascending: false });
    if (data.category && data.category !== "all") query = query.eq("category", data.category);
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`caption.ilike.%${term}%,category.ilike.%${term}%`);
    }
    const { data: rows, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const savePhoto = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        media_id: z.string().uuid().nullable().optional(),
        image_url: z.string().max(600).nullable().optional(),
        caption: z.string().max(300).default(""),
        category: z.string().max(80).default("General"),
        width: z.number().int().nullable().optional(),
        height: z.number().int().nullable().optional(),
        posted_on: z.string().max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    if (!data.id) {
      const { count } = await c.from("gallery_photos").select("id", { count: "exact", head: true });
      if ((count ?? 0) >= 85) throw new Error("Gallery is full (85 photos maximum).");
    }
    const { error } = data.id
      ? await c.from("gallery_photos").update(data).eq("id", data.id)
      : await c.from("gallery_photos").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("gallery_photos").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------------------------------------------------------------- team --- */

export const adminListTeam = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const { data: rows, count } = await (await client())
      .from("team_members")
      .select("id,name,role,bio,photo_id,photo_url,order_index", { count: "exact" })
      .order("order_index")
      .range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveTeamMember = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        role: z.string().max(160).default(""),
        bio: z.string().max(2000).default(""),
        photo_id: z.string().uuid().nullable().optional(),
        photo_url: z.string().max(600).nullable().optional(),
        order_index: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const { error } = data.id
      ? await c.from("team_members").update(data).eq("id", data.id)
      : await c.from("team_members").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTeamMember = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("team_members").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------------------------------------------------------------- users --- */

export const adminListUsers = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number; q?: string } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
        q: z.string().max(120).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const q = data.q?.trim();

    let query = (await client()).from("site_users").select("*", { count: "exact" });

    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

    const { data: rows, count } = await query
      .order("created_at")
      .range((page - 1) * pageSize, page * pageSize - 1);

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveUser = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        email: z.string().email().max(200),
        phone: z.string().max(60).nullable().optional(),
        role: z.string().max(40).default("editor"),
        photo_id: z.string().uuid().nullable().optional(),
        password: z.string().max(200).optional(),
        active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const { hashPassword } = await import("./auth.server");
    const c = await client();
    const base = {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      phone: data.phone ?? null,
      role: data.role,
      photo_id: data.photo_id ?? null,
      active: data.active,
    };
    if (data.id) {
      const patch: Record<string, unknown> = { ...base };
      if (data.password) patch["password_hash"] = hashPassword(data.password);
      const { error } = await c.from("site_users").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      if (!data.password || data.password.length < 8)
        throw new Error("A password of at least 8 characters is required.");
      const { error } = await c
        .from("site_users")
        .insert({ ...base, password_hash: hashPassword(data.password) });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const me = await guard();
    if (me.id === data.id) throw new Error("You cannot delete your own account.");
    await (await client()).from("site_users").delete().eq("id", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------- socials --- */

export const adminListSocials = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const { data: rows, count } = await (await client())
      .from("socials")
      .select("id,platform,url,enabled,order_index,icon", { count: "exact" })
      .order("order_index")
      .range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveSocials = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        rows: z.array(
          z.object({
            id: z.string().uuid().optional(),
            platform: z.string().min(1).max(60),
            url: z.string().max(400).default(""),
            enabled: z.boolean().default(false),
            order_index: z.number().int().default(0),
            icon: z.string().default("link"),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    if (dbProvider() === "local" && typeof (c as any).transaction === "function") {
      await (c as any).transaction(async (tx: any) => {
        for (const row of data.rows) {
          const { error } = row.id
            ? await tx.from("socials").update(row).eq("id", row.id)
            : await tx.from("socials").insert(row);
          if (error) throw new Error(error.message);
        }
      });
    } else {
      for (const row of data.rows) {
        const { error } = row.id
          ? await c.from("socials").update(row).eq("id", row.id)
          : await c.from("socials").insert(row);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true };
  });

export const deleteSocial = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("socials").delete().eq("id", data.id);
    return { ok: true };
  });

/* ----------------------------------------------------------- inquiries --- */

export const adminListInquiries = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number; from?: string; to?: string; q?: string } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
        from: z.string().max(20).optional(),
        to: z.string().max(20).optional(),
        q: z.string().max(120).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const from = data.from;
    const to = data.to;
    const q = data.q?.trim();

    let query = (await client()).from("inquiries").select("*");

    if (from) query = query.gte("created_at", from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,subject.ilike.%${q}%`);

    const { data: rows, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const setInquiryHandled = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), handled: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("inquiries").update({ handled: data.handled }).eq("id", data.id);
    return { ok: true };
  });

export const deleteInquiry = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("inquiries").delete().eq("id", data.id);
    return { ok: true };
  });

/* ----------------------------------------------------------- dashboard --- */

export const adminStats = createServerFn({ method: "GET" }).handler(async () => {
  await guard();
  const c = await client();
  const head = { count: "exact" as const, head: true };
  const [services, articles, drafts, photos, team, users, inquiries, unread] = await Promise.all([
    c.from("services").select("id", head),
    c.from("articles").select("id", head).eq("status", "published"),
    c.from("articles").select("id", head).eq("status", "draft"),
    c.from("gallery_photos").select("id", head),
    c.from("team_members").select("id", head),
    c.from("site_users").select("id", head),
    c.from("inquiries").select("id", head),
    c.from("inquiries").select("id", head).eq("handled", false),
  ]);
  const { data: recent } = await c
    .from("inquiries")
    .select("id,name,email,subject,created_at,handled")
    .order("created_at", { ascending: false })
    .limit(5);
  return {
    services: services.count ?? 0,
    articles: articles.count ?? 0,
    drafts: drafts.count ?? 0,
    photos: photos.count ?? 0,
    team: team.count ?? 0,
    users: users.count ?? 0,
    inquiries: inquiries.count ?? 0,
    unread: unread.count ?? 0,
    recent: recent ?? [],
  };
});
