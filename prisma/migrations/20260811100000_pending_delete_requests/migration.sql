-- AlterTable: Booking/Order deletion becomes a pending-request/approval
-- flow for anyone but the ACCOUNT_OWNER, replacing PIN-gating for
-- deletion specifically (Architecture Decision 99). deletedAt stays null
-- while a request is pending; the ACCOUNT_OWNER approving finalizes it,
-- rejecting just clears these two.
ALTER TABLE "Booking" ADD COLUMN     "deleteRequestedAt" TIMESTAMP(3),
ADD COLUMN     "deleteRequestedBy" TEXT;

ALTER TABLE "Order" ADD COLUMN     "deleteRequestedAt" TIMESTAMP(3),
ADD COLUMN     "deleteRequestedBy" TEXT;
