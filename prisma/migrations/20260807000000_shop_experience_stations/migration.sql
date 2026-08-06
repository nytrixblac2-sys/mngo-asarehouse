-- AlterEnum: SHOP and EXPERIENCE join KITCHEN/BAR as fulfillment stations
-- (Architecture Decision 91) — gift-shop purchases and bookable guest
-- experiences get the same ticket-tracking mechanism as food and drink.
ALTER TYPE "MenuStation" ADD VALUE 'SHOP';
ALTER TYPE "MenuStation" ADD VALUE 'EXPERIENCE';

-- AlterTable: Order gains independent fulfillment status for the two new
-- stations, same pattern as the existing kitchenStatus/barStatus.
ALTER TABLE "Order" ADD COLUMN     "shopStatus" "IssueStatus",
ADD COLUMN     "experienceStatus" "IssueStatus";

-- AlterTable: OrderItem.menuItemId becomes nullable with ON DELETE SET
-- NULL, fixing a real bug found while reseeding the menu — the FK was
-- previously required with no cascade, so deleting any MenuItem that had
-- ever actually been ordered failed with a raw foreign-key-violation
-- error, contradicting the app's own claim that historical orders are
-- unaffected by later menu edits (they're fully snapshotted independently
-- on OrderItem already — name/unitPrice/currency/station — so losing the
-- menuItemId link loses nothing meaningful).
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_menuItemId_fkey";
ALTER TABLE "OrderItem" ALTER COLUMN "menuItemId" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
