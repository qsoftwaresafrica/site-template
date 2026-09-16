import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save, Plus, Trash2 } from "lucide-react";
import { getSetting, saveSetting } from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, run } from "@/components/admin/ui";
import type { ContactSettings } from "@/lib/public.functions";

const fallback: ContactSettings = {
  companyName: "",
  addressLines: [],
  phones: [],
  emails: [],
  hours: [],
  map: { enabled: true, query: "", zoom: 15 },
};

export const Route = createFileRoute("/super/contacts")({
  loader: async () => ((await getSetting({ data: { key: "contacts" } })) as ContactSettings) ?? fallback,
  component: ContactsAdmin,
});

function ContactsAdmin() {
  const loaded = Route.useLoaderData();
  const [contacts, setContacts] = useState<ContactSettings>({ ...fallback, ...(loaded ?? {}) });

  const patch = (patch: Partial<ContactSettings>) => setContacts({ ...contacts, ...patch });

  return (
    <>
      <PageHeading
        title="Contacts"
        description="Company contact details shown on the website."
        action={
          <button
            onClick={() => void run(() => saveSetting({ data: { key: "contacts", value: contacts } }), "Contacts saved")}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        }
      />

      <div className="space-y-6">
        <Panel title="Company">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name">
              <input
                className={inputClass}
                value={contacts.companyName}
                onChange={(e) => patch({ companyName: e.target.value })}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Address">
          <Field label="Address lines" hint="One line per entry.">
            <textarea
              rows={4}
              className={inputClass}
              value={contacts.addressLines.join("\n")}
              onChange={(e) =>
                patch({
                  addressLines: e.target.value
                    .split("\n")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </Panel>

        <Panel title="Communication">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Phone numbers" hint="One per line.">
              <textarea
                rows={3}
                className={inputClass}
                value={contacts.phones.join("\n")}
                onChange={(e) =>
                  patch({
                    phones: e.target.value
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Email addresses" hint="One per line.">
              <textarea
                rows={3}
                className={inputClass}
                value={contacts.emails.join("\n")}
                onChange={(e) =>
                  patch({
                    emails: e.target.value
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Working hours"
          description="Shown on the contact page."
          action={
            <button
              onClick={() =>
                patch({
                  hours: [...contacts.hours, { label: "", value: "" }],
                })
              }
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <Plus className="h-4 w-4" /> Add row
            </button>
          }
        >
          <div className="space-y-3">
            {contacts.hours.map((hour, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Field label="Label">
                  <input
                    className={inputClass}
                    value={hour.label}
                    onChange={(e) => {
                      const next = [...contacts.hours];
                      next[index] = { ...next[index], label: e.target.value };
                      patch({ hours: next });
                    }}
                  />
                </Field>
                <Field label="Hours">
                  <input
                    className={inputClass}
                    value={hour.value}
                    onChange={(e) => {
                      const next = [...contacts.hours];
                      next[index] = { ...next[index], value: e.target.value };
                      patch({ hours: next });
                    }}
                  />
                </Field>
                <button
                  onClick={() =>
                    patch({
                      hours: contacts.hours.filter((_, i) => i !== index),
                    })
                  }
                  className="mt-6 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {contacts.hours.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hours yet.</p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Map">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={contacts.map.enabled}
                onChange={(e) => patch({ map: { ...contacts.map, enabled: e.target.checked } })}
              />
              Show map
            </label>
            <Field label="Map query" className="md:col-span-2">
              <input
                className={inputClass}
                value={contacts.map.query}
                onChange={(e) => patch({ map: { ...contacts.map, query: e.target.value } })}
              />
            </Field>
            <Field label="Zoom">
              <input
                type="number"
                className={inputClass}
                value={contacts.map.zoom}
                onChange={(e) => patch({ map: { ...contacts.map, zoom: Number(e.target.value) } })}
              />
            </Field>
          </div>
        </Panel>
      </div>
    </>
  );
}
