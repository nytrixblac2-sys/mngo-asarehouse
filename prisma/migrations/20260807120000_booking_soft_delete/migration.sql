-- AlterTable: Booking becomes soft-deletable, PIN-gated, same pattern as
-- Order (Architecture Decision 79) — now applied to every workspace, not
-- just HOSTEL orders (Architecture Decision 93).
ALTER TABLE "Booking" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "deleteReason" TEXT;
