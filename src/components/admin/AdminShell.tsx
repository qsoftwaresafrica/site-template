import { useState, type ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Image as ImageIcon,
  Newspaper,
  Users,
  UserCog,
  Share2,
  Phone,
  Inbox,
  Presentation,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { site } from "@/lib/site";
import { adminLogout, type AdminUser } from "@/lib/admin.functions";

const NAV = [
  { to: "/super/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/super/services", label: "Services", icon: Briefcase },
  { to: "/super/blog", label: "Blog studio", icon: Newspaper },
  { to: "/super/gallery", label: "Gallery", icon: ImageIcon },
  { to: "/super/hero", label: "Hero", icon: Presentation },
  { to: "/super/contacts", label: "Contacts", icon: Phone },
  { to: "/super/socials", label: "Socials", icon: Share2 },
  { to: "/super/team", label: "Team", icon: Users },
  { to: "/super/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/super/users", label: "Users", icon: UserCog },
] as const;

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await adminLogout();
    await router.invalidate();
    router.navigate({ to: "/super/login", replace: true });
  }

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card p-4 lg:flex">
          <Brand />
          <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View live site
          </a>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <div className="relative h-full w-72 max-w-[85%] overflow-y-auto bg-card p-4">
              <div className="flex items-center justify-between">
                <Brand />
                <button onClick={() => setOpen(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6">{nav}</div>
            </div>
          </div>
        ) : null}

        <div className="flex min-h-screen w-full flex-col lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdropblur">
            <button
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
              <button
                onClick={() => void signOut()}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <img src={site.brand.logo} alt="" className="h-8 w-8 rounded" />
      <div className="leading-tight">
        <p className="font-display text-sm font-black">{site.brand.name}</p>
        <p className="text-[11px] text-muted-foreground">Control panel</p>
      </div>
    </div>
  );
}
