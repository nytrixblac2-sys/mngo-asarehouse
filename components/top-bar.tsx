"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, PanelLeft, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { C } from "@/lib/colors";
import { getNavItems } from "@/lib/nav";
import { useAppStore } from "@/store/use-app-store";
import { useProperties } from "@/lib/queries/properties";
import { useWorkspace, type WorkspaceInfo } from "@/lib/queries/workspace";
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
  workspace: initialWorkspace,
  effectiveUser,
  effectiveCanEdit,
  realUser,
  realCanEdit,
  sidebarOpen,
  setSidebarOpen,
}: {
  properties: Property[];
  workspace: WorkspaceInfo;
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("mngo-theme"); } catch {}
    const initial = (stored === "dark" || stored === "light") ? stored : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  // Close menu when tapping outside (covers both desktop and mobile)
  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [menuOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("mngo-theme", next); } catch {}
  }
  const exitPreview = useAppStore((s) => s.exitPreview);
  const pathname = usePathname();
  const router = useRouter();
  // Seeded with the server-rendered prop so the nav never briefly renders
  // the wrong workspace-type shape on refresh — see useWorkspace's doc
  // comment (Architecture Decision 96).
  const workspace = useWorkspace(initialWorkspace).data ?? initialWorkspace;
  const allNavItems = getNavItems(workspace?.type, workspace?.hasShop);
  // Same HOSTEL owner-only inversion as tabs-sidebar.tsx — see its comment
  // and Architecture Decision 87.
  const isHostelNonOwner = workspace?.type === "HOSTEL" && effectiveUser.role !== "ACCOUNT_OWNER";
  const navItems = allNavItems.filter((i) => {
    if (i.key === "team" && !effectiveCanEdit) return false;
    if (i.key === "financials" && isHostelNonOwner) return false;
    return true;
  });
  // Reactive, cache-invalidated list — seeded with the server-rendered
  // prop so there's no loading flash, but updates instantly on
  // create/edit/delete instead of needing a full page reload.
  const properties = useProperties(initialProperties).data ?? initialProperties;
  const workspaceName = workspace?.name ?? "Management";

  return (
    <div className="flex items-center gap-1 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="relative" ref={menuRef}>
        <button
          className="p-2 rounded-lg"
          style={{ color: C.text }}
          title="Menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Menu size={18} />
        </button>
        {menuOpen && (
          <div
            className="absolute left-0 top-full w-48 rounded-xl p-2 z-30"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
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
                className="block w-full text-sm px-3 py-2.5 rounded-lg"
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
            {effectiveCanEdit && !isHostelNonOwner && (
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

      <div style={{ marginLeft: "auto" }}>
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.22)",
            color: "#0D9488", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.18s",
          }}
        >
          {theme === "dark" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>

      {showProfile && (
        <ProfileModal
          realUser={realUser}
          realCanEdit={realCanEdit}
          properties={properties}
          onClose={() => setShowProfile(false)}
        />
      )}
      {effectiveCanEdit && !isHostelNonOwner && showReportModal && (
        <GenerateReportModal
          properties={properties}
          managementLabel={workspaceName}
          isHostel={workspace?.type === "HOSTEL"}
          isAccountOwner={effectiveUser.role === "ACCOUNT_OWNER"}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
