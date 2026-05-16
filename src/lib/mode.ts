/**
 * Demo mode controls whether the /app workspace reads from a real Supabase
 * Postgres or from the in-memory demo dataset. It is ON by default so the
 * deployed preview shows a complete product without any infra configured.
 *
 * - `DATABASE_URL` unset                  → demo mode (forced)
 * - `NEXT_PUBLIC_SUPABASE_URL` unset      → demo mode (forced)
 * - `CLEARPOST_DEMO_MODE=false`           → live mode (requires both above)
 * - default                               → demo mode
 */
export function isDemoMode(): boolean {
  if (!process.env.DATABASE_URL) return true;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true;
  if (process.env.CLEARPOST_DEMO_MODE === "false") return false;
  return true;
}

export const DEMO_ORG = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Acme Manufacturing Ltd.",
  province: "ON",
  employeeCountBucket: "100-249",
} as const;
