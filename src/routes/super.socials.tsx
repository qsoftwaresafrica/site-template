import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Save, Trash2 } from "lucide-react";
import { adminListSocials, saveSocials, deleteSocial } from "@/lib/admin.functions";
import { inputClass, PageHeading, Panel, run } from "@/components/admin/ui";
import { Icon, socialIcons } from "@/components/site/Icon";

const PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "twitter",
  "youtube",
  "whatsapp",
  "tiktok",
];

type Row = { id?: string; platform: string; url: string; enabled: boolean; order_index: number };

export const Route = createFileRoute("/super/socials")({
  loader: () => adminListSocials(),
  component: SocialsAdmin,
});

function SocialsAdmin() {
  const loaded = Route.useLoaderData();
  const router = useRouter();

  const initial: Row[] = PLATFORMS.map((platform, index) => {
    const existing = loaded.find((r) => r.platform === platform);
    return existing
      ? {
          id: existing.id,
          platform,
          url: existing.url ?? "",
          enabled: Boolean(existing.enabled),
          order_index: existing.order_index ?? index,
        }
      : { platform, url: "", enabled: false, order_index: index };
  });

  const [rows, setRows] = useState<Row[]>(initial);

  async function save() {
    const ok = await run(
      () => saveSocials({ data: { rows: rows.filter((r) => r.url || r.id) } }),
      "Social links saved",
    );
    if (ok) await router.invalidate();
  }

  return (
    <>
      <PageHeading
        title="Social media"
        description="Turn a platform on, paste its link, and the icon appears across the site."
        action={
          <button
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        }
      />

      <Panel title="Platforms">
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.platform} className="flex flex-wrap items-center gap-3">
              <span className="flex w-40 shrink-0 items-center gap-2 text-sm font-semibold capitalize">
                <Icon name={socialIcons[row.platform] ?? "link"} size={16} />
                {row.platform}
              </span>
              <input
                className={`${inputClass} max-w-md flex-1`}
                placeholder="https://"
                value={row.url}
                onChange={(e) =>
                  setRows(rows.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) =>
                    setRows(rows.map((r, j) => (j === i ? { ...r, enabled: e.target.checked } : r)))
                  }
                />
                Show
              </label>
              {row.id ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Remove ${row.platform}?`)) return;
                    if (await run(() => deleteSocial({ data: { id: row.id! } }), "Removed"))
                      await router.invalidate();
                  }}
                  className="rounded-md border border-border px-2 py-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
