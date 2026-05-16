import Link from "next/link";
import { Sparkles } from "lucide-react";

export function DemoBanner({ orgName }: { orgName: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span>
          <strong>Demo mode.</strong> You're viewing seeded data for{" "}
          <span className="text-foreground">{orgName}</span>. Set{" "}
          <code className="rounded bg-secondary px-1 py-0.5 text-xs">DATABASE_URL</code> +{" "}
          <code className="rounded bg-secondary px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> in Vercel to
          switch this workspace to live data.
        </span>
      </div>
      <Link href="/signup" className="text-xs font-medium text-primary hover:underline">
        Start your own workspace →
      </Link>
    </div>
  );
}
