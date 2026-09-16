import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Save, X } from "lucide-react";
import { adminListUsers, saveUser, deleteUser } from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, ImagePicker, run } from "@/components/admin/ui";

type Draft = {
  id?: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  photo_id: string | null;
  password?: string;
  active: boolean;
};

const empty: Draft = {
  name: "",
  email: "",
  phone: null,
  role: "editor",
  photo_id: null,
  password: "",
  active: true,
};

export const Route = createFileRoute("/super/users")({
  loader: () => adminListUsers(),
  component: UsersAdmin,
});

function UsersAdmin() {
  const rows = Route.useLoaderData();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);

  async function save() {
    if (!draft) return;
    const ok = await run(() => saveUser({ data: draft }), "User saved");
    if (ok) {
      setDraft(null);
      await router.invalidate();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    if (await run(() => deleteUser({ data: { id } }), "User deleted")) await router.invalidate();
  }

  return (
    <>
      <PageHeading
        title="Users"
        description="Admin accounts that can access this panel."
        action={
          <button
            onClick={() => setDraft({ ...empty })}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New user
          </button>
        }
      />

      {draft ? (
        <div className="mb-6">
          <Panel
            title={draft.id ? "Edit user" : "New user"}
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
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={draft.phone ?? ""}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })}
                />
              </Field>
              <Field label="Role">
                <select
                  className={inputClass}
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                >
                  <option value="editor">Editor</option>
                  <option value="super">Super admin</option>
                </select>
              </Field>
              <ImagePicker
                mediaId={draft.photo_id}
                onChange={(id) => setDraft({ ...draft, photo_id: id })}
              />
              <div className="space-y-4">
                <Field label={draft.id ? "New password (optional)" : "Password"}>
                  <input
                    type="text"
                    className={inputClass}
                    value={draft.password ?? ""}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                    placeholder={draft.id ? "Leave blank to keep current" : ""}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="divide-y divide-border">
          {rows.map((row: any) => (
            <div key={row.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.email} {row.phone ? `· ${row.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    row.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {row.active ? "Active" : "Disabled"}
                </span>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize bg-muted text-muted-foreground">
                  {row.role}
                </span>
                <button
                  onClick={() =>
                    setDraft({
                      id: row.id,
                      name: row.name,
                      email: row.email,
                      phone: row.phone,
                      role: row.role,
                      photo_id: row.photo_id,
                      active: row.active,
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
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No users yet.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
