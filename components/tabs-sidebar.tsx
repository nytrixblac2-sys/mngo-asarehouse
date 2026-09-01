"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { C } from "@/lib/colors";
import { getNavItems } from "@/lib/nav";
import { useAppStore } from "@/store/use-app-store";
import { useProperties } from "@/lib/queries/properties";
import { useWorkspace, type WorkspaceInfo } from "@/lib/queries/workspace";
import type { Property, User } from "@/lib/types";
import { signOut } from "@/app/(app)/actions";
import { ProfileModal } from "./profile-modal";
import { GenerateReportModal } from "./generate-report-modal";

/** context/07-mockup.jsx TabsSidebar. "Generate report" restored per user
 * decision 2026-08-03 (was previously left out — PDF export was V2). */
export function TabsSidebar({
  effectiveUser,
  effectiveCanEdit,
  realUser,
  realCanEdit,
  properties: initialProperties,
  workspace: initialWorkspace,
}: {
  effectiveUser: User;
  effectiveCanEdit: boolean;
  realUser: User;
  realCanEdit: boolean;
  properties: Property[];
  workspace: WorkspaceInfo;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const exitPreview = useAppStore((s) => s.exitPreview);
  const pathname = usePathname();
  // Seeded with the server-rendered prop so the nav never briefly renders
  // the wrong workspace-type shape on refresh — see useWorkspace's doc
  // comment (Architecture Decision 96).
  const workspace = useWorkspace(initialWorkspace).data ?? initialWorkspace;
  const allNavItems = getNavItems(workspace?.type, workspace?.hasShop);
  // Team is hidden from the Property Owner nav (RENTAL). Financials is
  // hidden from anyone but the ACCOUNT_OWNER on a HOSTEL workspace — the
  // manager (Janet) shouldn't see the owner's financial internals, a
  // HOSTEL-specific inversion of the usual effectiveCanEdit gate
  // (Architecture Decision 87, refining Decision 85). Team itself stays
  // visible to a HOSTEL manager — she manages staff and needs the
  // roster — but the payment amounts inside it are owner-only, gated at
  // the page level (app/(app)/team/page.tsx), not hidden from the nav.
  // RENTAL is untouched.
  const isHostelNonOwner = workspace?.type === "HOSTEL" && effectiveUser.role !== "ACCOUNT_OWNER";
  const navItems = allNavItems.filter((i) => {
    if (i.key === "team" && !effectiveCanEdit) return false;
    if (i.key === "financials" && isHostelNonOwner) return false;
    return true;
  });
  const properties = useProperties(initialProperties).data ?? initialProperties;
  const workspaceName = workspace?.name ?? "Management";

  return (
    <div className="flex-shrink-0 flex flex-col p-3" style={{ width: 200, height: "100%", borderRight: `1px solid ${C.border}` }}>
      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="block w-full text-left text-sm px-3 py-2.5 rounded-xl"
            style={{
              color: pathname === item.href ? "var(--accent, #111111)" : C.text,
              fontWeight: pathname === item.href ? 700 : 500,
              background: pathname === item.href ? "var(--accent-soft, rgba(0,0,0,0.07))" : "transparent",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-1 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        {effectiveCanEdit && !isHostelNonOwner && (
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full text-left text-sm px-3 py-2.5 rounded-xl flex items-center gap-2"
            style={{ color: C.text, fontWeight: 500 }}
          >
            <FileText size={14} /> Generate report
          </button>
        )}
        <button
          onClick={() => setShowProfile(true)}
          className="w-full text-left text-sm px-3 py-2.5 rounded-xl"
          style={{ color: C.text, fontWeight: 500 }}
        >
          View profile
        </button>
        <form action={signOut}>
          <button
            type="submit"
            onClick={() => exitPreview()}
            className="w-full text-left text-sm px-3 py-2.5 rounded-xl"
            style={{ color: C.muted, fontWeight: 500 }}
          >
            Sign out
          </button>
        </form>
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
