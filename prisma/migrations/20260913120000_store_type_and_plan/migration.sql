-- STORE workspace type + real, enforced plan tiers + inventory tracking.
-- See prisma/schema.prisma's WorkspaceType/WorkspacePlan/Workspace.plan/
-- MenuItem.stockQuantity/StockAdjustment doc comments for the full design
-- rationale. Two things worth calling out about this specific migration:
--
-- 1. Every workspace that already exists at the moment this runs is
--    backfilled to plan = ENTERPRISE (unrestricted), not left at the new
--    column's FREE default. Both real, live workspaces (Oak & Co./Asare
--    House, Escape3Points) were already using full financial history,
--    more than 2 staff accounts, etc. before this field existed --
--    defaulting them to FREE would be a live regression the moment
--    enforcement ships, not a real reflection of what they've actually
--    been using. Only a workspace created AFTER this migration gets the
--    column's real default of FREE.
-- 2. Plan enforcement itself isn't wired up anywhere yet by this
--    migration alone -- this just adds the field. It's deliberately
--    scoped to gate STORE-workspace features only (current-month
--    financials, no public storefront link, current-month stock history)
--    once that logic ships in a later stage -- RENTAL/HOSTEL's own
--    stated pricing limits (property/staff counts) are a separate,
--    later audit, not bundled into this work.

-- AlterEnum
ALTER TYPE "WorkspaceType" ADD VALUE 'STORE';

-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE';

UPDATE "Workspace" SET "plan" = 'ENTERPRISE';

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "stockQuantity" INTEGER;

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAdjustment_workspaceId_idx" ON "StockAdjustment"("workspaceId");

-- CreateIndex
CREATE INDEX "StockAdjustment_menuItemId_idx" ON "StockAdjustment"("menuItemId");

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
