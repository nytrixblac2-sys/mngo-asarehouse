"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, PanelLeft, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { C } from "@/lib/colors";
import { getNavItems } from "@/lib/nav";
import { useAppStore } from "@/store/use-app-store";
import { useProperties } from "@/lib/queries/properties";
import { useWorkspace } from "@/lib/queries/workspace";
import type { Property, User } from "@/lib/types";
import { signOut } from "@/app/(app)/actions";
import { PropertySwitcher } from "./property-switcher";
import { ProfileModal } from "./profile-modal";
import { GenerateReportModal } from "./generate-report-modal";

/**
 * context/07-mockup.jsx TopBar, minus Search — still has nothing real to
 * search over. "Generate report" was originally left out for the same
 * reason PDF export was V2 (context/01-project-overview.md); restored here
 * per user decision 2026-08-03 to build PDF export.
 */
export function TopBar({
  properties: initialProperties,
  effectiveUser,
  effectiveCanEdit,
  realUser,
  realCanEdit,
  sidebarOpen,
  setSidebarOpen,
}: {
  properties: Property[];
  effectiveUser: User;
  effectiveCanEdit: boolean;
  realUser: User;
  realCanEdit: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const exitPreview = useAppStore((s) => s.exitPreview);
  const pathname = usePathname();
  const router = useRouter();
  const workspace = useWorkspace().data;
  const allNavItems = getNavItems(workspace?.type);
  const navItems = effectiveCanEdit ? allNavItems : allNavItems.filter((i) => i.key !== "team");
  // Reactive, cache-invalidated list — seeded with the server-rendered
  // prop so there's no loading flash, but updates instantly on
  // create/edit/delete instead of needing a full page reload.
  const properties = useProperties(initialProperties).data ?? initialProperties;
  const workspaceName = workspace?.name ?? "Management";

  return (
    <div className="flex items-center gap-1 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="relative" onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
        <button className="p-2 rounded-lg" style={{ color: C.text }} title="Menu">
          <Menu size={18} />
        </button>
        {menuOpen && (
          <div
            className="absolute left-0 top-full w-48 rounded-xl p-2 z-30"
            style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
          >
            <div className="px-3 py-2">
              <p className="text-sm font-semibold" style={{ color: C.text }}>
                {effectiveUser.name}
              </p>
              <p className="text-xs" style={{ color: C.muted }}>
                {effectiveCanEdit ? "Property Manager" : "Owner"}
              </p>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, margin: "6px 0" }} />
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block w-full text-left text-sm px-3 py-2 rounded-lg"
                style={{
                  color: pathname === item.href ? "var(--accent, #111111)" : C.text,
                  fontWeight: pathname === item.href ? 700 : 500,
                  background: pathname === item.href ? "var(--accent-soft, rgba(0,0,0,0.07))" : "transparent",
                }}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, margin: "6px 0" }} />
            {effectiveCanEdit && (
              <button
                onClick={() => { setShowReportModal(true); setMenuOpen(false); }}
                className="w-full text-left text-sm px-3 py-2 rounded-lg flex items-center gap-2"
                style={{ color: C.text, fontWeight: 500 }}
              >
                <FileText size={14} /> Generate report
              </button>
            )}
            <button
              onClick={() => { setShowProfile(true); setMenuOpen(false); }}
              className="w-full text-left text-sm px-3 py-2 rounded-lg"
              style={{ color: C.text, fontWeight: 500 }}
            >
              View profile
            </button>
            <form action={signOut}>
              <button
                type="submit"
                onClick={() => exitPreview()}
                className="w-full text-left text-sm px-3 py-2 rounded-lg"
                style={{ color: C.muted, fontWeight: 500 }}
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg"
        style={{
          color: sidebarOpen ? "var(--accent, #111111)" : C.text,
          background: sidebarOpen ? "var(--accent-soft, rgba(0,0,0,0.07))" : "transparent",
        }}
        title="Toggle sidebar"
      >
        <PanelLeft size={18} />
      </button>

      <button onClick={() => router.back()} className="p-2 rounded-lg" style={{ color: C.text }} title="Back">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => router.forward()} className="p-2 rounded-lg" style={{ color: C.text }} title="Forward">
        <ChevronRight size={18} />
      </button>

      <PropertySwitcher properties={properties} canEdit={effectiveCanEdit} />

      {showProfile && (
        <ProfileModal
          realUser={realUser}
          realCanEdit={realCanEdit}
          properties={properties}
          onClose={() => setShowProfile(false)}
        />
      )}
      {effectiveCanEdit && showReportModal && (
        <GenerateReportModal
          properties={properties}
          managementLabel={workspaceName}
          isHostel={workspace?.type === "HOSTEL"}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
