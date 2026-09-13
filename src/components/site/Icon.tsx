import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

function toPascal(name: string) {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/** Renders any lucide icon by its kebab-case name coming from the database/config. */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const registry = Lucide as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Cmp = registry[toPascal(name)] ?? Lucide.Circle;
  return <Cmp {...props} />;
}

export const socialIcons: Record<string, string> = {
  facebook: "facebook",
  twitter: "twitter",
  x: "twitter",
  linkedin: "linkedin",
  instagram: "instagram",
  youtube: "youtube",
  whatsapp: "message-circle",
  tiktok: "music",
  telegram: "send",
  github: "github",
};

export function mediaUrl(id?: string | null) {
  return id ? `/api/public/media/${id}` : null;
}

export function imageOf(mediaId?: string | null, url?: string | null) {
  return mediaUrl(mediaId) ?? url ?? null;
}
