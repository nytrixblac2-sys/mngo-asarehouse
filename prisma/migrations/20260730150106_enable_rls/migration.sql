-- Enable Row Level Security on every table. This blocks Supabase's
-- auto-generated public REST API (PostgREST, used by the anon/authenticated
-- roles) from reading or writing any row, since no policies are defined
-- below — RLS enabled + zero policies = deny-all for those roles.
--
-- This does NOT restrict Prisma's own queries: Prisma connects as the
-- table owner (the `postgres` role in DATABASE_URL/DIRECT_URL), which
-- bypasses RLS by Postgres default, same as the service_role key used in
-- lib/supabase/admin.ts. Workspace and role scoping for the app's actual
-- data access is enforced in app/api route handlers, per
-- context/03-code-standards.md "API Routes" (verify session, workspace_id,
-- and role on every route) — RLS here is a second layer against the public
-- REST surface, not the primary access-control mechanism in this
-- Prisma-based architecture. See context/06-progress-tracker.md
-- Architecture Decisions for the full reasoning, including the caveat this
-- implies for context/02-architecture-context.md's stated invariant that
-- "no query can return data from another workspace regardless of
-- application-layer bugs."

ALTER TABLE "public"."Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."UserProperty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ManualIncome" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Issue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."IssueStatusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TeamMember" ENABLE ROW LEVEL SECURITY;