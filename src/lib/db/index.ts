import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Lazy-init so importing this module doesn't crash during build when DATABASE_URL
// isn't set (e.g. landing-page-only Vercel preview deploys).
let _client: ReturnType<typeof postgres> | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

function getClient() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure your Supabase Postgres connection string."
    );
  }
  if (!_client) {
    _client = postgres(connectionString, { prepare: false });
    _db = drizzle(_client, { schema });
  }
  return _db!;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, prop) {
    const client = getClient();
    // @ts-expect-error proxy passthrough
    return client[prop];
  },
});
