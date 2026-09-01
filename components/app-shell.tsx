"use client";

import { Eye } from "lucide-react";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { C } from "@/lib/colors";
import { useAppStore } from "@/store/use-app-store";
import { useProperties } from "@/lib/queries/properties";
import type { WorkspaceInfo } from "@/lib/queries/workspace";
import type { Property, User } from "@/lib/types";
import { TopBar } from "./top-bar";
import { TabsSidebar } from "./tabs-sidebar";
import { EffectiveUserProvider } from "./effective-user-context";

/** context/07-mockup.jsx withAlpha. */
function withAlpha(hex: string, alpha: number) {
  if (!hex || hex[0] !== "#") return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The App Shell — top bar + optional pinned sidebar + content. Sets
 * --accent / --accent-soft on this root wrapper from the active property's
 * color, per context/02-architecture-context.md "Property Theming Model":
 * switching the active property repaints every accent-colored element
 * without a page reload, since every consumer reads the CSS variable
 * rather than a hardcoded color.
 *
 * Owner preview mode (Architecture Decision 1) is computed here, not in
 * the server layout: `realUser` is the actual signed-in session (from
 * app/(app)/layout.tsx, via requireUser()), and `effectiveUser` substitutes
 * a Zustand-held preview target everywhere the rest of the app reads
 * "the current user" — nav, canEdit, the properties list. ProfileModal
 * (view profile, invite, preview-as, sign out) is the one exception: it's
 * always about *your own* account, so it reads realUser/realCanEdit
 * directly, never the effective ones — see components/profile-modal.tsx.
 */
export function AppShell({
  properties: initialProperties,
  workspace,
  realUser,
  children,
}: {
  properties: Property[];
  workspace: WorkspaceInfo;
  realUser: User;
  children: ReactNode;
}) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const activePropertyId = useAppStore((s) => s.activePropertyId);
  const setActivePropertyId = useAppStore((s) => s.setActivePropertyId);
  const previewUser = useAppStore((s) => s.previewUser);
  const exitPreview = useAppStore((s) => s.exitPreview);
  // Reactive so the accent theme color updates the moment a property is
  // created/recolored/deleted, not just after a page reload — same fix as
  // TopBar/TabsSidebar (lib/queries/properties.ts useProperties doc comment).
  const properties = useProperties(initialProperties).data ?? initialProperties;

  // Self-heals activePropertyId in two cases, both localStorage-persisted
  // (Architecture Decision 57) so both can go stale across a reload:
  //
  // 1. Exactly one property (every real workspace, since Architecture
  //    Decision 94 capped "Add property" at one per workspace) — always
  //    pin activePropertyId to that property's id, never "all" and never
  //    a stale id. There's nothing to switch between, so there's nothing
  //    for the user to have to notice or fix.
  // 2. More than one property (no current workspace, but not assumed
  //    impossible) — only correct a genuinely stale id (one that matches
  //    no visible property) back to "all"; a real "all" selection is left
  //    alone. Case 1 above didn't exist yet the day this was first
  //    written — a stale id silently filtered Bookings/Dashboard/
  //    Financials/Issues down to zero results everywhere, with no error
  //    shown anywhere, since the property switcher's own label falls back
  //    to "All properties" for an unmatched id (components/property-
  //    switcher.tsx) even though every other consumer was reading the
  //    raw stale value. Real incident, 2026-08-07: a manager saw zero
  //    bookings in a workspace that actually had several.
  //
  // Runs once properties have loaded; does nothing while the list is
  // still empty (initial fetch, or a genuinely brand-new workspace) so it
  // can't race a legitimate state to a false reset.
  useEffect(() => {
    if (properties.length === 0) return;
    if (properties.length === 1) {
      if (activePropertyId !== properties[0].id) setActivePropertyId(properties[0].id);
      return;
    }
    if (activePropertyId === "all") return;
    if (properties.some((p) => p.id === activePropertyId)) return;
    setActivePropertyId("all");
  }, [activePropertyId, properties, setActivePropertyId]);

  const realCanEdit = realUser.role === "ACCOUNT_OWNER" || realUser.role === "CO_MANAGER";
  const effectiveUser: User = previewUser ?? realUser;
  const effectiveCanEdit = !previewUser && realCanEdit;

  const activeProperty = properties.find((p) => p.id === activePropertyId);
  const accent = activeProperty?.color ?? "#111111";
  const accentSoft = withAlpha(accent, 0.1);

  const shellStyle = {
    background: C.bg,
    height: "100vh",
    "--accent": accent,
    "--accent-soft": accentSoft,
  } as CSSProperties;

  return (
    <div className="flex flex-col w-full" style={shellStyle}>
      {previewUser && (
        <div
          className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{ background: "#FEF9C3", borderBottom: "1px solid #FDE68A" }}
        >
          <div className="flex items-center gap-2">
            <Eye size={14} style={{ color: "#92400E" }} />
            <p className="text-xs font-semibold" style={{ color: "#92400E" }}>
              Previewing as {previewUser.name}
            </p>
          </div>
          <button
            onClick={exitPreview}
            className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: "#92400E", color: "#fff" }}
          >
            Exit
          </button>
        </div>
      )}
      <TopBar
        properties={properties}
        workspace={workspace}
        effectiveUser={effectiveUser}
        effectiveCanEdit={effectiveCanEdit}
        realUser={realUser}
        realCanEdit={realCanEdit}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile backdrop — tapping it closes the sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {sidebarOpen && (
          <TabsSidebar
            effectiveUser={effectiveUser}
            effectiveCanEdit={effectiveCanEdit}
            realUser={realUser}
            realCanEdit={realCanEdit}
            properties={properties}
            workspace={workspace}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
          <EffectiveUserProvider value={{ effectiveUser, effectiveCanEdit }}>{children}</EffectiveUserProvider>
        </div>
      </div>
    </div>
  );
}
