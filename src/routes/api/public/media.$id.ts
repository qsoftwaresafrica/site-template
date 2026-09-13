import { createFileRoute } from "@tanstack/react-router";

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("\\x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

export const Route = createFileRoute("/api/public/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response("Not found", { status: 404 });

        const { db } = await import("@/lib/db.server");
        const { data } = await db()
          .from("media")
          .select("bytes,mime")
          .eq("id", params.id)
          .maybeSingle();

        if (!data) return new Response("Not found", { status: 404 });

        const raw = data.bytes as unknown as string;
        const body = typeof raw === "string" ? hexToBytes(raw) : new Uint8Array(raw);

        return new Response(body as BodyInit, {
          headers: {
            "Content-Type": data.mime || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
