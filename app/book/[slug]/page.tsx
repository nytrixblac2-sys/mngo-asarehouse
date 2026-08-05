import { prisma } from "@/lib/prisma";
import { serializeRoom } from "@/lib/rooms";
import { C } from "@/lib/colors";
import { PublicBookingForm } from "./public-booking-form";

/**
 * The first fully public, unauthenticated page in MNGO — a workspace's
 * guest-facing room booking page, reachable at /book/[slug] with no login.
 * Only ever shows a HOSTEL, ACTIVE workspace's active rooms; anything else
 * (RENTAL workspace, wrong/typo'd slug, suspended workspace) renders the
 * same "not available" state rather than leaking which case it was.
 */
export default async function PublicBookingPage({ params }: { params: { slug: string } }) {
  const workspace = await prisma.workspace.findUnique({ where: { slug: params.slug } });

  if (!workspace || workspace.type !== "HOSTEL" || workspace.status !== "ACTIVE") {
    return (
      <div className="flex w-full items-center justify-center py-16 px-6" style={{ background: C.bg, minHeight: "100vh" }}>
        <p className="text-sm" style={{ color: C.muted }}>This booking page isn&apos;t available.</p>
      </div>
    );
  }

  const rooms = await prisma.room.findMany({
    where: { workspaceId: workspace.id, active: true },
    orderBy: { pricePerNight: "asc" },
  });

  return (
    <div className="flex w-full items-center justify-center py-12 px-6" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <p className="text-xl font-bold" style={{ color: C.text }}>{workspace.name}</p>
          <p className="mt-1 text-xs font-medium text-center" style={{ color: C.muted }}>Book your stay</p>
        </div>
        <PublicBookingForm workspaceSlug={workspace.slug} rooms={rooms.map(serializeRoom)} />
      </div>
    </div>
  );
}
