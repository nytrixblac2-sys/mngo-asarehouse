-- CreateEnum
CREATE TYPE "MenuStation" AS ENUM ('KITCHEN', 'BAR');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'MOMO', 'CARD');

-- AlterEnum
ALTER TYPE "IssueType" ADD VALUE 'ROOM_DIRTY';

-- AlterTable: Workspace gains the owner-set action PIN (bcrypt hash only).
ALTER TABLE "Workspace" ADD COLUMN     "actionPinHash" TEXT;

-- AlterTable: Booking gains checkout payment method.
ALTER TABLE "Booking" ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable: MenuItem gains an explicit station, backfilled from the
-- current category set (Escape3Points' known categories at the time this
-- migration was written) rather than left to infer from free text later.
ALTER TABLE "MenuItem" ADD COLUMN     "station" "MenuStation" NOT NULL DEFAULT 'KITCHEN';

UPDATE "MenuItem"
SET "station" = 'BAR'
WHERE "category" IN ('Drinks', 'Beer', 'Locals', 'Soft Drinks', 'Cocktails', 'Liquor', 'New Drinks');

-- AlterTable: Order gains independent per-station fulfillment status and
-- soft-delete fields.
ALTER TABLE "Order" ADD COLUMN     "kitchenStatus" "IssueStatus",
ADD COLUMN     "barStatus" "IssueStatus",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "deleteReason" TEXT;

-- AlterTable: OrderItem snapshots station at order time, same as it
-- already snapshots name/price/currency. Backfilled from each item's
-- current MenuItem station for any orders placed before this migration.
ALTER TABLE "OrderItem" ADD COLUMN     "station" "MenuStation" NOT NULL DEFAULT 'KITCHEN';

UPDATE "OrderItem" oi
SET "station" = mi."station"
FROM "MenuItem" mi
WHERE oi."menuItemId" = mi."id";

-- AlterTable: Issue gains an optional room link, used by the auto-created
-- ROOM_DIRTY issue on checkout.
ALTER TABLE "Issue" ADD COLUMN     "roomId" UUID;

-- CreateIndex
CREATE INDEX "Issue_roomId_idx" ON "Issue"("roomId");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
