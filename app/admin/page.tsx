import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/colors";
import { signOut } from "@/app/(app)/actions";
import { setWorkspaceStatus, setWorkspacePaid } from "./actions";

function formatLastSeen(dt: Date | null | undefined): { label: string; dot: string } {
  if (!dt) return { label: "Never active", dot: "#9CA3AF" };
  const minutes = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (minutes < 5) return { label: "Online now", dot: "#10B981" };
  if (minutes < 60) return { label: `${minutes}m ago`, dot: C.teal };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { label: `${hours}h ago`, dot: C.text };
  const days = Math.floor(hours / 24);
  if (days === 1) return { label: "Yesterday", dot: C.muted };
  if (days < 7) return { label: `${days} days ago`, dot: C.muted };
  return { label: `${days}d ago`, dot: "#9CA3AF" };
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: C.amberSoft, text: C.amber },
  ACTIVE:   { bg: C.tealSoft,  text: C.teal  },
  REJECTED: { bg: "rgba(220,38,38,0.1)", text: "#DC2626" },
};
const STATUS_ORDER: Record<string, number> = { PENDING: 0, ACTIVE: 1, REJECTED: 2 };

export default async function AdminPage() {
  await requireAdmin();

  const workspaces = await prisma.workspace.findMany({
    include: {
      accountOwner: true,
      users: {
        select: { name: true, email: true, role: true, lastSeenAt: true },
        orderBy: { lastSeenAt: "desc" },
      },
      _count: {
        select: {
          properties: true,
          bookings:   { where: { deletedAt: null } },
          expenses:   true,
          orders:     { where: { deletedAt: null } },
          shopOrders: true,
          teamMembers: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  workspaces.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  // Summary totals
  const totalActive     = workspaces.filter((w) => w.status === "ACTIVE").length;
  const totalPending    = workspaces.filter((w) => w.status === "PENDING").length;
  const totalProperties = workspaces.reduce((s, w) => s + w._count.properties, 0);
  const totalBookings   = workspaces.reduce((s, w) => s + w._count.bookings, 0);
  const totalUsers      = workspaces.reduce((s, w) => s + w.users.length, 0);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-4xl mx-auto p-6 md:p-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: C.teal }}>Platform Admin</div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>Workspaces</h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}` }}
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Summary bar */}
        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          {[
            { label: "Total",      value: workspaces.length },
            { label: "Active",     value: totalActive,      accent: true },
            { label: "Pending",    value: totalPending,     warn: totalPending > 0 },
            { label: "Properties", value: totalProperties },
            { label: "Users",      value: totalUsers },
          ].map(({ label, value, accent, warn }) => (
            <div
              key={label}
              className="rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="text-2xl font-bold" style={{ color: accent ? C.teal : warn ? C.amber : C.text }}>{value}</div>
              <div className="text-xs font-medium" style={{ color: C.muted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Workspace cards */}
        {workspaces.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>No workspaces yet.</p>
        )}

        <div className="flex flex-col gap-4">
          {workspaces.map((w) => {
            const statusStyle = STATUS_STYLE[w.status];

            // Last seen = most recent lastSeenAt across all users (already sorted desc)
            const latestSeen = w.users.find((u) => u.lastSeenAt)?.lastSeenAt;
            const { label: seenLabel, dot: seenDot } = formatLastSeen(latestSeen);

            // Feature adoption
            const features: { label: string; active: boolean }[] = [
              { label: "Bookings",  active: w._count.bookings > 0 },
              { label: "Expenses",  active: w._count.expenses > 0 },
              { label: "Team",      active: w._count.teamMembers > 0 },
              { label: "Orders",    active: w.type === "HOSTEL" && w._count.orders > 0 },
              { label: "Shop",      active: w.type === "RENTAL" && w.hasShop },
            ].filter((f) => w.type === "HOSTEL" ? f.label !== "Shop" : f.label !== "Orders");

            return (
              <div
                key={w.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                {/* Top strip: badges + actions */}
                <div
                  className="flex items-center justify-between gap-3 px-5 py-3 flex-wrap"
                  style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: statusStyle.bg, color: statusStyle.text }}
                    >
                      {w.status}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: C.border, color: C.text }}
                    >
                      {w.type}
                    </span>
                    {w.paid && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: C.tealSoft, color: C.teal }}
                      >
                        Paid
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {w.status === "PENDING" && (
                      <>
                        <form action={setWorkspaceStatus}>
                          <input type="hidden" name="workspaceId" value={w.id} />
                          <input type="hidden" name="status" value="ACTIVE" />
                          <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.teal, color: "#fff" }}>
                            Approve
                          </button>
                        </form>
                        <form action={setWorkspaceStatus}>
                          <input type="hidden" name="workspaceId" value={w.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                            Reject
                          </button>
                        </form>
                      </>
                    )}
                    {w.status === "ACTIVE" && (
                      <form action={setWorkspaceStatus}>
                        <input type="hidden" name="workspaceId" value={w.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                          Suspend
                        </button>
                      </form>
                    )}
                    {w.status === "REJECTED" && (
                      <form action={setWorkspaceStatus}>
                        <input type="hidden" name="workspaceId" value={w.id} />
                        <input type="hidden" name="status" value="ACTIVE" />
                        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.teal, color: "#fff" }}>
                          Reactivate
                        </button>
                      </form>
                    )}
                    <form action={setWorkspacePaid}>
                      <input type="hidden" name="workspaceId" value={w.id} />
                      <input type="hidden" name="paid" value={w.paid ? "false" : "true"} />
                      <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
                        {w.paid ? "Mark unpaid" : "Mark paid"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Main content */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Name + last seen */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-bold truncate" style={{ color: C.text }}>{w.name}</p>
                      <p className="text-sm mt-0.5 truncate" style={{ color: C.muted }}>
                        {w.accountOwner
                          ? `${w.accountOwner.name} · ${w.accountOwner.email}`
                          : "No owner"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seenDot }} />
                      <span className="text-xs font-medium" style={{ color: C.muted }}>{seenLabel}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Properties", value: w._count.properties },
                      { label: "Bookings",   value: w._count.bookings   },
                      { label: "Users",      value: w.users.length      },
                      { label: w.type === "HOSTEL" ? "Orders" : "Expenses",
                        value: w.type === "HOSTEL" ? w._count.orders : w._count.expenses },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: C.bg, border: `1px solid ${C.border}` }}
                      >
                        <div className="text-base font-bold" style={{ color: C.text }}>{value}</div>
                        <div className="text-xs" style={{ color: C.muted }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Feature adoption + joined date */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {features.map(({ label, active }) => (
                        <span
                          key={label}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: active ? C.tealSoft : C.bg,
                            color: active ? C.teal : C.muted,
                            border: `1px solid ${active ? "transparent" : C.border}`,
                          }}
                        >
                          {active ? "✓ " : ""}{label}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs flex-shrink-0" style={{ color: C.muted }}>
                      Joined {fmt(w.createdAt)}
                    </p>
                  </div>

                  {/* Users list (if more than just the owner) */}
                  {w.users.length > 1 && (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${C.border}` }}
                    >
                      {w.users.map((u, i) => {
                        const { label: uLabel, dot: uDot } = formatLastSeen(u.lastSeenAt);
                        return (
                          <div
                            key={u.email}
                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                            style={{
                              borderTop: i > 0 ? `1px solid ${C.border}` : undefined,
                              background: i === 0 ? C.bg : undefined,
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: uDot }} />
                              <span className="text-xs font-semibold truncate" style={{ color: C.text }}>{u.name}</span>
                              <span className="text-xs truncate" style={{ color: C.muted }}>{u.role.replace(/_/g, " ")}</span>
                            </div>
                            <span className="text-xs flex-shrink-0" style={{ color: C.muted }}>{uLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center pb-4" style={{ color: C.muted }}>
          Last seen refreshes automatically as users browse the app.
        </p>
      </div>
    </div>
  );
}
