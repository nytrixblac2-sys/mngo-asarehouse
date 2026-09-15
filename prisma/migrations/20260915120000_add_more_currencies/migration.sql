-- Adds NGN/USD/GBP/ZAR/KES to the Currency enum (GHS/EUR already existed)
-- and a generic prevBalancesOther JSON map on Property for every currency
-- besides GHS/EUR, which keep their existing dedicated prevBalanceGhs/
-- prevBalanceEur columns untouched. Both changes are purely additive —
-- no existing data is modified, no existing column is dropped or
-- retyped. Driven by a real signup attempt for a Nigeria-based shop that
-- had no way to pick NGN.

-- Postgres requires each new enum value added in its own statement outside
-- any transaction that also tries to *use* it — this migration only adds
-- them, nothing here references the new values yet, so this is safe.
ALTER TYPE "Currency" ADD VALUE 'NGN';
ALTER TYPE "Currency" ADD VALUE 'USD';
ALTER TYPE "Currency" ADD VALUE 'GBP';
ALTER TYPE "Currency" ADD VALUE 'ZAR';
ALTER TYPE "Currency" ADD VALUE 'KES';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "prevBalancesOther" JSONB NOT NULL DEFAULT '{}';
