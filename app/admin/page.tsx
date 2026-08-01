import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/colors";
import { signOut } from "@/app/(app)/actions";
import { setWorkspaceStatus, setWorkspacePaid } from "./actions";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: C.amberSoft, text: C.amber },
  ACTIVE: { bg: C.tealSoft, text: C.teal },
  REJECTED: { bg: "rgba(220,38,38,0.1)", text: "#DC2626" },
};
const STATUS_ORDER: Record<string, number> = { PENDING: 0, ACTIVE: 1, REJECTED: 2 };

export default async function AdminPage() {
  await requireAdmin();

  const workspaces = await prisma.workspace.findMany({
    include: { accountOwner: true },
    orderBy: { createdAt: "desc" },
  });
  workspaces.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <div className="min-h-screen p-8" style={{ background: C.bg }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>Workspace requests</h1>
            <p className="text-sm mt-1" style={{ color: C.muted }}>
              New signups start pending — approve to give them access, reject to keep them out.
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs font-semibold px-3 py-2 rounded-full flex-shrink-0"
              style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}
            >
              Sign out
            </button>
          </form>
        </div>

        {workspaces.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>No workspaces yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {workspaces.map((w) => {
            const style = STATUS_STYLE[w.status];
            return (
              <div key={w.id} className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold truncate" style={{ color: C.text }}>{w.name}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: style.bg, color: style.text }}>
                      {w.status}
                    </span>
                    {w.paid && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: C.tealSoft, color: C.teal }}>
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-sm truncate" style={{ color: C.muted }}>
                    {w.accountOwner ? `${w.accountOwner.name} · ${w.accountOwner.email}` : "No owner"}
                  </p>
                  <p className="text-xs" style={{ color: C.muted }}>
                    Requested {w.createdAt.toISOString().slice(0, 10)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {w.status === "PENDING" && (
                    <>
                      <form action={setWorkspaceStatus}>
                        <input type="hidden" name="workspaceId" value={w.id} />
                        <input type="hidden" name="status" value="ACTIVE" />
                        <button type="submit" className="text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.teal, color: "#fff" }}>
                          Approve
                        </button>
                      </form>
                      <form action={setWorkspaceStatus}>
                        <input type="hidden" name="workspaceId" value={w.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button type="submit" className="text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                          Reject
                        </button>
                      </form>
                    </>
                  )}
                  {w.status === "ACTIVE" && (
                    <form action={setWorkspaceStatus}>
                      <input type="hidden" name="workspaceId" value={w.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button type="submit" className="text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                        Suspend
                      </button>
                    </form>
                  )}
                  {w.status === "REJECTED" && (
                    <form action={setWorkspaceStatus}>
                      <input type="hidden" name="workspaceId" value={w.id} />
                      <input type="hidden" name="status" value="ACTIVE" />
                      <button type="submit" className="text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.teal, color: "#fff" }}>
                        Reactivate
                      </button>
                    </form>
                  )}
                  <form action={setWorkspacePaid}>
                    <input type="hidden" name="workspaceId" value={w.id} />
                    <input type="hidden" name="paid" value={w.paid ? "false" : "true"} />
                    <button type="submit" className="text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
                      {w.paid ? "Mark unpaid" : "Mark paid"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
