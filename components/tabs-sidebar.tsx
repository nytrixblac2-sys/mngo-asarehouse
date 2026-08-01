"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/colors";
import { NAV_ITEMS } from "@/lib/nav";
import { useAppStore } from "@/store/use-app-store";
import type { Property, User } from "@/lib/types";
import { signOut } from "@/app/(app)/actions";
import { ProfileModal } from "./profile-modal";

/** context/07-mockup.jsx TabsSidebar, minus "Generate report" — still
 * out of scope (PDF export is V2, context/01-project-overview.md). */
export function TabsSidebar({
  effectiveCanEdit,
  realUser,
  realCanEdit,
  properties,
}: {
  effectiveCanEdit: boolean;
  realUser: User;
  realCanEdit: boolean;
  properties: Property[];
}) {
  const [showProfile, setShowProfile] = useState(false);
  const exitPreview = useAppStore((s) => s.exitPreview);
  const pathname = usePathname();
  const navItems = effectiveCanEdit ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.key !== "team");

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
    </div>
  );
}
