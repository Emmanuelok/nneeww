import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  AlarmClock,
  Users,
  Archive,
  ShieldCheck,
  Settings,
  Leaf,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/postings", label: "Postings", icon: ClipboardList },
  { href: "/app/notifications", label: "45-day inbox", icon: AlarmClock, accent: true },
  { href: "/app/candidates", label: "Candidates", icon: Users },
  { href: "/app/vault", label: "Retention vault", icon: Archive },
  { href: "/app/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  active,
  pageTitle,
  pageDescription,
  actions,
  children,
}: {
  active: string;
  pageTitle: string;
  pageDescription?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary/20">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border/60 bg-background lg:flex lg:flex-col">
        <Link href="/app" className="flex h-14 items-center gap-2 border-b border-border/60 px-5 text-sm font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="h-3.5 w-3.5" />
          </span>
          ClearPost
        </Link>
        <nav className="flex-1 space-y-0.5 p-3 text-sm">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? active === item.href : active.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors " +
                  (isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground")
                }
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.accent && !isActive && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-medium text-destructive">
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Acme Manufacturing</span>
            <Badge variant="success" className="text-[10px]">Trial</Badge>
          </div>
          <p className="mt-1">Ontario · 100–249 employees</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link href="/app" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="h-3.5 w-3.5" />
          </span>
          ClearPost
        </Link>
        <nav className="flex items-center gap-3 text-xs text-muted-foreground">
          {NAV.slice(0, 4).map((item) => {
            const isActive = item.exact ? active === item.href : active.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "text-foreground font-medium" : "hover:text-foreground"}
              >
                {item.label.replace(" inbox", "")}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="lg:pl-60">
        <div className="container max-w-6xl py-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
              {pageDescription && (
                <p className="mt-1 text-sm text-muted-foreground">{pageDescription}</p>
              )}
            </div>
            {actions}
          </div>
          {children}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            ClearPost is a compliance operations tool. Not legal advice. Confirm with HR counsel.
          </p>
        </div>
      </main>
    </div>
  );
}
