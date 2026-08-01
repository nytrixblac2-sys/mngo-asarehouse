import { create } from "zustand";
import type { WorkspaceUser } from "@/lib/users";

/**
 * Active property selection + owner preview mode —
 * context/02-architecture-context.md "Property Theming Model" / store/
 * file organisation note in context/03-code-standards.md ("store/ —
 * Zustand: active property, preview user, navigation history"). "all"
 * means the "All properties" view. Deliberately not persisted to
 * localStorage — resets per session, matching the mockup's default of
 * 'all' on load.
 *
 * previewUser: Architecture Decision 1 — client-side only, never touches
 * the Supabase session. Cleared on sign-out (components/app-shell.tsx
 * calls exitPreview before submitting the sign-out form) so a fresh
 * sign-in never inherits a stale preview.
 */
interface AppStore {
  activePropertyId: string | "all";
  setActivePropertyId: (id: string | "all") => void;
  previewUser: WorkspaceUser | null;
  setPreviewUser: (user: WorkspaceUser) => void;
  exitPreview: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activePropertyId: "all",
  setActivePropertyId: (id) => set({ activePropertyId: id }),
  previewUser: null,
  setPreviewUser: (user) => set({ previewUser: user, activePropertyId: "all" }),
  exitPreview: () => set({ previewUser: null }),
}));
