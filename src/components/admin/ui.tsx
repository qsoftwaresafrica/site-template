import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Upload, Loader2, X } from "lucide-react";
import { imageOf } from "@/components/site/Icon";
import { filePayload } from "@/lib/admin-client";
import { uploadMedia } from "@/lib/admin.functions";

export const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-black tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Uploads a picked image into the media table and returns its id. */
export function ImagePicker({
  mediaId,
  imageUrl,
  onChange,
  onDimensions,
  label = "Image",
}: {
  mediaId?: string | null;
  imageUrl?: string | null;
  onChange: (id: string | null) => void;
  onDimensions?: (width: number, height: number) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const preview = imageOf(mediaId, imageUrl ?? null);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const payload = await filePayload(file);
      const { id } = await uploadMedia({ data: payload });
      onChange(id);
      if (payload.width && payload.height) {
        onDimensions?.(payload.width, payload.height);
      }
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : null}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>{busy ? "Uploading" : "Choose file"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
        </label>
        {preview ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

export async function run(action: () => Promise<unknown>, message: string) {
  try {
    await action();
    toast.success(message);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Something went wrong");
    return false;
  }
}
