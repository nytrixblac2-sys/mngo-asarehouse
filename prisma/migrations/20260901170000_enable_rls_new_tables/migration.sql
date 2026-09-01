-- Enable Row Level Security on tables created after the initial enable_rls
-- migration (20260730150106). Same reasoning as that migration: RLS enabled
-- with zero policies = deny-all for Supabase's public REST API (anon /
-- authenticated roles). Prisma connects as the table owner (postgres role)
-- which bypasses RLS by Postgres default, so application behaviour is
-- unchanged — these ALTER TABLE statements only close the public REST surface.
--
-- Tables covered here:
--   ScheduleStatusEvent  — added in 20260801133017_schedule_status_and_notes
--   RateLimitBucket      — added in 20260812085213_security_hardening
--   ShopOrder            — added in 20260901113317_add_shop_feature
--   ShopOrderItem        — added in 20260901113317_add_shop_feature
--   _prisma_migrations   — Prisma's own migration-tracking table; flagged by
--                          Supabase Advisor as a public read-exposure risk.
--                          Locking it down hides schema-version history from
--                          the anon role. Prisma still writes to it freely
--                          because it connects as the owner role.

ALTER TABLE "public"."ScheduleStatusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RateLimitBucket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShopOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShopOrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
