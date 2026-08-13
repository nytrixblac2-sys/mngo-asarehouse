import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getVisibleProperties } from "@/lib/properties";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { WorkspaceGateScreen } from "@/components/workspace-gate-screen";

/**
 * Root of every authenticated route. Computes effectiveUser/effectiveCanEdit
 * once here and threads them down as props — context/03-code-standards.md:
 * "Owner preview mode sets effectiveUser and effectiveCanEdit at the App
 * root and threads them down as props — do not read from Zustand for role
 * checks inside individual screens." Preview mode itself isn't built yet
 * (context/06-progress-tracker.md Next Up), so both currently just equal
 * the real signed-in user; that stage only needs to change what these two
 * are computed from, not every consumer of them.
 *
 * Also gates on Workspace.status (prisma/schema.prisma WorkspaceStatus doc
 * comment) — a direct Prisma call here, same exception as
 * getVisibleProperties (Architecture Decision 19: one-time shell chrome,
 * not data any screen computes allocations/balances from). Every role is
 * blocked, including the workspace's own Account Owner, until a platform
 * admin approves the workspace at /admin.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  // A user still on their manager-issued one-time invite password
  // (app/api/users/route.ts) can't use the app until they set their own —
  // checked here, ahead of the workspace-status gate below, so it applies
  // regardless of workspace state. /change-password itself lives outside
  // this route group, so it's never subject to this redirect.
  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: user.workspaceId },
    select: { id: true, name: true, slug: true, type: true, status: true, actionPinHash: true },
  });
  if (workspace.status !== "ACTIVE") {
    return <WorkspaceGateScreen status={workspace.status} />;
  }

  const properties = await getVisibleProperties(user);

  // Passed down as TopBar/TabsSidebar's initial workspace data (Architecture
  // Decision 96) — same reasoning as `properties` below: without this, the
  // nav briefly renders the wrong workspace-type shape on every refresh,
  // while useWorkspace()'s client fetch is still in flight.
  return (
    <AppShell
      properties={properties}
      workspace={{ id: workspace.id, name: workspace.name, slug: workspace.slug, type: workspace.type, hasPin: !!workspace.actionPinHash }}
      realUser={user}
    >
      {children}
    </AppShell>
  );
}
