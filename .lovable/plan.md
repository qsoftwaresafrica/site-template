# Admin (/super) — end-to-end build plan

Status legend: [ ] todo, [x] done

## Context (read this first, then continue)

Stack: TanStack Start v1, file routes in `src/routes`, server fns via `createServerFn`.
DB access: `src/lib/db.server.ts` -> `db()` (service_role, RLS deny-all, env driven by `DB_PROVIDER`).
Auth: `src/lib/auth.server.ts` — bcryptjs + `site_sessions` cookie `partner_admin_session`;
exports `hashPassword`, `verifyPassword`, `signIn`, `currentUser`, `requireUser`, `signOut`.
Public data fns: `src/lib/public.functions.ts`. Theme/config: `src/config/site.json` + `src/lib/site.ts`.
Media served at `/api/public/media/$id` (bytea, hex `\x` encoded).
Icons: lucide only via `src/components/site/Icon.tsx`. No emojis. Toasts: `sonner`.

Tables: media, site_users, site_sessions, services, articles, gallery_photos,
team_members, inquiries, socials, settings(key,value json: `hero`,`contacts`,`about`).

Rules: every admin server fn starts with `await requireUser()` (dynamic import of
`./auth.server`). Never import `*.server` at module scope in `.functions.ts`.
Uploads: browser reads file -> base64 -> server fn converts to hex `\x..` and inserts into `media`.

## Tasks

- [x] 1. `src/lib/admin.functions.ts` — auth (login/logout/me), settings (hero/contacts/about),
      services CRUD, articles CRUD (+slug, status, publish), gallery CRUD (max 85),
      team CRUD, users CRUD, socials upsert, inquiries list/mark/delete, media upload.
- [x] 2. `src/components/admin/AdminShell.tsx` — sidebar nav (lucide icons), topbar with
      user + sign out, responsive drawer. Plus small shared inputs (`Field`, `Toolbar`).
- [x] 3. `src/routes/super.tsx` layout: beforeLoad -> `me()`; if no user and path !== `/super/login`
      redirect to `/super/login`. `src/routes/super.index.tsx` -> redirect `/super/dashboard`.
      `head()` with `robots: noindex`.
- [x] 4. `super.login.tsx` — email/password form, redirects to dashboard.
- [x] 5. `super.dashboard.tsx` — counts (services, articles, photos, inquiries unread, team, users) + recent inquiries.
- [x] 6. `super.services.tsx` — list + create/edit dialog (slug, title, summary, body, icon,
      highlights[], order, published, image upload).
- [x] 7. `super.hero.tsx` — mode toggle slideshow/solid, animateText switch, autoplayMs, overlay,
      solid token, slides list (upload image, title, subtitle, CTA).
- [x] 8. `super.contacts.tsx` — company name, address lines, phones, emails, hours, map config.
- [x] 9. `super.socials.tsx` — enable toggle + url per platform, ordering.
- [x] 10. `super.team.tsx` — name, role, bio, photo upload, order.
- [x] 11. `super.users.tsx` — create/edit users (name, email, password, phone, photo, role, active).
- [x] 12. `super.gallery.tsx` — upload (max 85 enforced), caption, category, posted_on, delete.
- [x] 13. `super.inquiries.tsx` — list, expand message, mark handled, delete.
- [x] 14. `super.blog.index.tsx` — studio: list articles w/ status filter + search, new article.
- [x] 15. `super.blog.article.$id.tsx` — rich text editor (contentEditable toolbar: headings, bold,
      italic, list, quote, link, image), excerpt, tags, author, cover upload, slug, preview tab,
      save draft / publish.
- [x] 16. Seed an admin user (migration) + document credentials to the user.
- [x] 17. Verify: `bunx tsgo --noEmit`, curl each `/super/*` route, fix issues.

## Notes / decisions

- Article body stored as HTML string; public `blog.$slug.tsx` renders with `prose-article`.
- Rich editor is custom (document.execCommand-based) to avoid new deps.
- Admin user seed: email `admin@qsotwares.co.tz`, password `Admin@2026` (bcrypt hash in migration).
