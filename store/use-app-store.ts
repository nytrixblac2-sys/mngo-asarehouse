import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkspaceUser } from "@/lib/users";

/**
 * Active property selection + owner preview mode —
 * context/02-architecture-context.md "Property Theming Model" / store/
 * file organisation note in context/03-code-standards.md ("store/ —
 * Zustand: active property, preview user, navigation history"). "all"
 * means the "All properties" view.
 *
 * activePropertyId and sidebarOpen are persisted to localStorage
 * (superseding an earlier decision to reset activePropertyId every
 * session, matching the mockup's default) — user feedback, 2026-08:
 * losing your selected property, and separately the sidebar toggle, on
 * every refresh was surprising in real daily use, even though it matched
 * the mockup's own (untested-across-reloads) default.
 *
 * previewUser is deliberately NOT persisted — Architecture Decision 1:
 * client-side only, never touches the Supabase session, and must not
 * survive a reload/new session (a manager reopening the app later should
 * never silently still be "in preview"). Cleared on sign-out too
 * (components/app-shell.tsx calls exitPreview before submitting the
 * sign-out form) so a fresh sign-in never inherits a stale preview.
 */
interface AppStore {
  activePropertyId: string | "all";
  setActivePropertyId: (id: string | "all") => void;
  previewUser: WorkspaceUser | null;
  setPreviewUser: (user: WorkspaceUser) => void;
  exitPreview: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activePropertyId: "all",
      setActivePropertyId: (id) => set({ activePropertyId: id }),
      previewUser: null,
      setPreviewUser: (user) => set({ previewUser: user, activePropertyId: "all" }),
      exitPreview: () => set({ previewUser: null }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "mngo-app-store",
      partialize: (state) => ({ activePropertyId: state.activePropertyId, sidebarOpen: state.sidebarOpen }),
    }
  )
);
