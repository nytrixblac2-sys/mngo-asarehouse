"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@/lib/types";

/**
 * context/03-code-standards.md: "Owner preview mode sets effectiveUser and
 * effectiveCanEdit at the App root and threads them down as props — do not
 * read from Zustand for role checks inside individual screens." Preview
 * state (once built) is client-only Zustand, so "the App root" has to mean
 * a Client Component (AppShell) — a Server Component page re-deriving its
 * own role from the real session would ignore preview mode entirely.
 * Screens read effectiveUser/effectiveCanEdit from here, never compute
 * their own.
 */
interface EffectiveUserContextValue {
  effectiveUser: User;
  effectiveCanEdit: boolean;
}

const EffectiveUserContext = createContext<EffectiveUserContextValue | null>(null);

export function EffectiveUserProvider({
  value,
  children,
}: {
  value: EffectiveUserContextValue;
  children: ReactNode;
}) {
  return <EffectiveUserContext.Provider value={value}>{children}</EffectiveUserContext.Provider>;
}

export function useEffectiveUser(): EffectiveUserContextValue {
  const ctx = useContext(EffectiveUserContext);
  if (!ctx) throw new Error("useEffectiveUser must be used within EffectiveUserProvider");
  return ctx;
}
