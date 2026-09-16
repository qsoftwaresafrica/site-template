import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash2, Mail, MailOpen } from "lucide-react";
import { adminListInquiries, setInquiryHandled, deleteInquiry } from "@/lib/admin.functions";
import { Field, PageHeading, Panel, run } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin-client";

export const Route = createFileRoute("/super/inquiries")({
  loader: () => adminListInquiries(),
  component: InquiriesAdmin,
});

function InquiriesAdmin() {
  const rows = Route.useLoaderData();
  const router = useRouter();

  async function toggleHandled(id: string, handled: boolean) {
    if (await run(() => setInquiryHandled({ data: { id, handled: !handled } }), "Updated")) await router.invalidate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this inquiry permanently?")) return;
    if (await run(() => deleteInquiry({ data: { id } }), "Inquiry deleted")) await router.invalidate();
  }

  return (
    <>
      <PageHeading title="Inquiries" description="Messages sent from the contact page." />
      <Panel>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inquiries yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row: any) => (
              <div key={row.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{row.name}</p>
                    <span className="text-xs text-muted-foreground">· {row.email}</span>
                  </div>
                  <p className="text-sm font-medium">{row.subject || "No subject"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(row.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleHandled(row.id, row.handled)}
                    className={`inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted ${
                      row.handled ? "text-muted-foreground" : "text-primary"
                    }`}
                  >
                    {row.handled ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    {row.handled ? "Reopen" : "Mark handled"}
                  </button>
                  <button
                    onClick={() => remove(row.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
