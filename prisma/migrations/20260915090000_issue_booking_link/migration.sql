-- AlterTable: Issue gains an optional booking link, so an issue tied to a
-- specific guest's stay can be shown across that whole stay on the
-- Bookings calendar, not just the single day it was logged.
ALTER TABLE "Issue" ADD COLUMN     "bookingId" UUID;

-- CreateIndex
CREATE INDEX "Issue_bookingId_idx" ON "Issue"("bookingId");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
