-- Airbnb iCal sync — two new nullable columns.
--
-- Property.airbnbICalUrl: the Airbnb "Export calendar" URL for this listing.
-- Set once in the Property profile modal; the hourly cron job at
-- /api/cron/sync-airbnb uses it to auto-create/cancel bookings.
--
-- Booking.icalUid: Airbnb's stable reservation UID from the iCal feed.
-- Null for every manually entered booking. Unique so the cron job can
-- upsert safely — same UID on repeated syncs = same booking, no duplicates.
-- When icalUid IS NOT NULL and amount = 0, the booking shows up in the
-- dashboard "needs pricing" banner until the manager sets the amount.

ALTER TABLE "public"."Property" ADD COLUMN "airbnbICalUrl" TEXT;

ALTER TABLE "public"."Booking" ADD COLUMN "icalUid" TEXT;
CREATE UNIQUE INDEX "Booking_icalUid_key" ON "public"."Booking"("icalUid");
