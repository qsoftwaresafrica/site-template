import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { adminMe } from "@/lib/admin.functions";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/super")({
  beforeLoad: async ({ location }) => {
    const user = await adminMe();
    const onLogin = location.pathname === "/super/login";
    if (!user && !onLogin) throw redirect({ to: "/super/login" });
    if (user && onLogin) throw redirect({ to: "/super/dashboard" });
    return { user };
  },
  head: () => ({
    meta: [{ title: "Control panel" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  if (!user) return <Outlet />;
  return (
    <AdminShell user={user}>
      <Outlet />
    </AdminShell>
  );
}
