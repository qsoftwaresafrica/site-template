import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { site } from "@/lib/site";
import { adminLogin } from "@/lib/admin.functions";
import { Field, inputClass } from "@/components/admin/ui";

export const Route = createFileRoute("/super/login")({
  head: () => ({ meta: [{ title: "Sign in — Control panel" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await adminLogin({ data: { email, password } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await router.invalidate();
      router.navigate({ to: "/super/dashboard", replace: true });
    } catch {
      toast.error("Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-7 shadow-lg"
      >
        <div className="flex flex-col items-center text-center">
          <img src={site.brand.logo} alt="" className="h-12 w-12 rounded" decoding="async" />
          <h1 className="mt-3 font-display text-xl font-black">{site.brand.name} control panel</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage the website.</p>
        </div>
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Sign in
        </button>
      </form>
    </div>
  );
}
