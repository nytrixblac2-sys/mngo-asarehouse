import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This installed @prisma/config version's Datasource type only has `url`
// and `shadowDatabaseUrl` — no `directUrl` slot. The CLI (migrate/studio)
// needs the *direct* (non-pooled) connection, so that's what goes here.
// The running app uses the pooled DATABASE_URL instead, configured
// separately in lib/prisma.ts's driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
