import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Save, Trash2, X } from "lucide-react";
import { adminListUsers, saveUser, deleteUser } from "@/lib/admin.functions";
import { Field, inputClass, ImagePicker, PageHeading, Panel, run } from "@/components/admin/ui";
import { imageOf } from "@/components/site/Icon";

type Draft = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  photo_id: string | null;
  password: string;
  active: boolean;
};

const empty: Draft = {
  name: "",
  email: "",
  phone: "",
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
    const payload = {
      ...draft,
      phone: draft.phone || null,
      ...(draft.password ? { password: draft.password } : {}),
    };
    if (!draft.password) delete (payload as { password?: string }).password;
    if (await run(() => saveUser({ data: payload }), "User saved")) {
      setDraft(null);
      await router.invalidate();
    }
  }

  return (
    <>
      <PageHeading
        title="Users"
        description="People who can sign in to this control panel."
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
                  onClick={() => void save()}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-semibold"
                >
                  <X className="h-4 w-4" /> Cancel
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
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </Field>
              <Field label="Role">
                <select
                  className={inputClass}
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                >
                  <option value="admin">Administrator</option>
                  <option value="editor">Editor</option>
                </select>
              </Field>
              <Field
                label="Password"
                hint={draft.id ? "Leave empty to keep the current password." : "At least 8 characters."}
              >
                <input
                  type="password"
                  className={inputClass}
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                />
              </Field>
              <div className="space-y-4">
                <ImagePicker
                  label="Photo (optional)"
                  mediaId={draft.photo_id}
                  onChange={(photo_id) => setDraft({ ...draft, photo_id })}
                />
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  />
                  Account active
                </label>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      <Panel title="All users">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">User</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-border bg-muted">
                        {imageOf(row.photo_id, null) ? (
                          <img
                            src={imageOf(row.photo_id, null)!}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 capitalize">{row.role}</td>
                  <td className="py-3">{row.active ? "Active" : "Disabled"}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() =>
                        setDraft({
                          id: row.id,
                          name: row.name,
                          email: row.email,
                          phone: row.phone ?? "",
                          role: row.role ?? "editor",
                          photo_id: row.photo_id ?? null,
                          password: "",
                          active: Boolean(row.active),
                        })
                      }
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ${row.name}?`)) return;
                        if (await run(() => deleteUser({ data: { id: row.id } }), "User deleted"))
                          await router.invalidate();
                      }}
                      className="ml-2 rounded-md border border-border px-2 py-1.5 text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
