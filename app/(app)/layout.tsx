import type { ReactNode } from "react";
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

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: user.workspaceId },
    select: { status: true },
  });
  if (workspace.status !== "ACTIVE") {
    return <WorkspaceGateScreen status={workspace.status} />;
  }

  const properties = await getVisibleProperties(user);

  return (
    <AppShell properties={properties} realUser={user}>
      {children}
    </AppShell>
  );
}
