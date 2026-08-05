"use client";

import { Eye } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { C } from "@/lib/colors";
import { useAppStore } from "@/store/use-app-store";
import { useProperties } from "@/lib/queries/properties";
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
  realUser,
  children,
}: {
  properties: Property[];
  realUser: User;
  children: ReactNode;
}) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const activePropertyId = useAppStore((s) => s.activePropertyId);
  const previewUser = useAppStore((s) => s.previewUser);
  const exitPreview = useAppStore((s) => s.exitPreview);
  // Reactive so the accent theme color updates the moment a property is
  // created/recolored/deleted, not just after a page reload — same fix as
  // TopBar/TabsSidebar (lib/queries/properties.ts useProperties doc comment).
  const properties = useProperties(initialProperties).data ?? initialProperties;

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
          className="flex items-center justify-between px-6 py-2.5 flex-shrink-0"
          style={{ background: "#FEF9C3", borderBottom: "1px solid #FDE68A" }}
        >
          <div className="flex items-center gap-2">
            <Eye size={14} style={{ color: "#92400E" }} />
            <p className="text-xs font-semibold" style={{ color: "#92400E" }}>
              Previewing as {previewUser.name} — Owner view only
            </p>
          </div>
          <button
            onClick={exitPreview}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "#92400E", color: "#fff" }}
          >
            Exit preview
          </button>
        </div>
      )}
      <TopBar
        properties={properties}
        effectiveUser={effectiveUser}
        effectiveCanEdit={effectiveCanEdit}
        realUser={realUser}
        realCanEdit={realCanEdit}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <TabsSidebar
            effectiveUser={effectiveUser}
            effectiveCanEdit={effectiveCanEdit}
            realUser={realUser}
            realCanEdit={realCanEdit}
            properties={properties}
          />
        )}
        <div className="flex-1 p-8 overflow-y-auto">
          <EffectiveUserProvider value={{ effectiveUser, effectiveCanEdit }}>{children}</EffectiveUserProvider>
        </div>
      </div>
    </div>
  );
}
