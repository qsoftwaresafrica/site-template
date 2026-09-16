import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Save, X } from "lucide-react";
import { adminListTeam, saveTeamMember, deleteTeamMember } from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, ImagePicker, run } from "@/components/admin/ui";

type Draft = {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photo_id: string | null;
  photo_url: string | null;
  order_index: number;
};

const empty: Draft = {
  name: "",
  role: "",
  bio: "",
  photo_id: null,
  photo_url: null,
  order_index: 0,
};

export const Route = createFileRoute("/super/team")({
  loader: () => adminListTeam(),
  component: TeamAdmin,
});

function TeamAdmin() {
  const rows = Route.useLoaderData();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);

  async function save() {
    if (!draft) return;
    const ok = await run(() => saveTeamMember({ data: draft }), "Team member saved");
    if (ok) {
      setDraft(null);
      await router.invalidate();
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this team member?")) return;
    if (await run(() => deleteTeamMember({ data: { id } }), "Team member deleted")) await router.invalidate();
  }

  return (
    <>
      <PageHeading
        title="Team"
        description="People shown on the team page."
        action={
          <button
            onClick={() => setDraft({ ...empty, order_index: rows.length })}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New member
          </button>
        }
      />

      {draft ? (
        <div className="mb-6">
          <Panel
            title={draft.id ? "Edit member" : "New member"}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={() => void save()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <input
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Role / title">
                <input
                  className={inputClass}
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
              </Field>
              <Field label="Order">
                <input
                  type="number"
                  className={inputClass}
                  value={draft.order_index}
                  onChange={(e) => setDraft({ ...draft, order_index: Number(e.target.value) })}
                />
              </Field>
              <ImagePicker
                mediaId={draft.photo_id}
                imageUrl={draft.photo_url ?? null}
                onChange={(id) => setDraft({ ...draft, photo_id: id })}
              />
              <div className="md:col-span-2">
                <Field label="Photo URL" hint="Used if no image is uploaded.">
                  <input
                    className={inputClass}
                    value={draft.photo_url ?? ""}
                    onChange={(e) => setDraft({ ...draft, photo_url: e.target.value || null })}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Short bio">
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={draft.bio}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row: any) => (
          <article key={row.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  {row.photo_url ? (
                    <img src={row.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      {row.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{row.name}</h3>
                  <p className="text-xs text-muted-foreground">{row.role || "—"}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{row.bio}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  setDraft({
                    id: row.id,
                    name: row.name,
                    role: row.role ?? "",
                    bio: row.bio ?? "",
                    photo_id: row.photo_id,
                    photo_url: row.photo_url,
                    order_index: row.order_index ?? 0,
                  })
                }
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                Edit
              </button>
              <button
                onClick={() => void remove(row.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </article>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        ) : null}
      </div>
    </>
  );
}
