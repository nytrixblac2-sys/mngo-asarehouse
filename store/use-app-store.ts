import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkspaceUser } from "@/lib/users";
import type { Currency } from "@/lib/types";

const today = new Date();

/** Bookings screen's own navigated state — which month/view/day/week the
 * user is currently looking at. Persisted so a refresh doesn't bounce back
 * to the real current month — user feedback, 2026-08-05: "everytime i
 * refresh the page and i am on the booking it takes me to the month... it
 * should stay on the page that i was on." */
export interface BookingsViewState {
  view: "Day" | "Week" | "Month" | "Per stay";
  year: number;
  month: number; // 0-indexed
  selectedDay: number | null;
  weekStart: number;
}

/** Financials screen's own navigated state — same reasoning as
 * BookingsViewState, applied to every page with a month selector or
 * remembered tab/currency choice, per the user's "let this be true for
 * every page." */
export interface FinancialsViewState {
  year: number;
  month: number;
  tab: "owner" | "oakco";
  ownerCurrency: Currency;
  oakCurrency: Currency;
  ownerSub: "income" | "expenses";
  oakcoSub: "income" | "expenses";
}

export interface DashboardViewState {
  periodKey: "Week" | "Month" | "Year";
  chartCurrency: Currency;
  /** Which series the finance card's bar chart shows — user request,
   * 2026-08-19: owners (ACCOUNT_OWNER/PROPERTY_OWNER) can switch between
   * Income and Expenses instead of the chart always defaulting to
   * Expenses. Co-Managers never see this card at all (see
   * app/(app)/dashboard/page.tsx), so this only ever applies to owners. */
  financeView: "income" | "expenses";
}

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
 * bookingsView/financialsView/dashboardView extend the same reasoning to
 * every page's own navigated state (month, view type, tab, currency
 * toggle, selected day) — user feedback, 2026-08-05.
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
  bookingsView: BookingsViewState;
  setBookingsView: (patch: Partial<BookingsViewState>) => void;
  financialsView: FinancialsViewState;
  setFinancialsView: (patch: Partial<FinancialsViewState>) => void;
  dashboardView: DashboardViewState;
  setDashboardView: (patch: Partial<DashboardViewState>) => void;
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
      bookingsView: {
        view: "Month",
        year: today.getFullYear(),
        month: today.getMonth(),
        selectedDay: null,
        weekStart: 1,
      },
      setBookingsView: (patch) => set((state) => ({ bookingsView: { ...state.bookingsView, ...patch } })),
      financialsView: {
        year: today.getFullYear(),
        month: today.getMonth(),
        tab: "owner",
        ownerCurrency: "GHS",
        oakCurrency: "GHS",
        ownerSub: "income",
        oakcoSub: "income",
      },
      setFinancialsView: (patch) => set((state) => ({ financialsView: { ...state.financialsView, ...patch } })),
      dashboardView: {
        periodKey: "Month",
        chartCurrency: "GHS",
        financeView: "expenses",
      },
      setDashboardView: (patch) => set((state) => ({ dashboardView: { ...state.dashboardView, ...patch } })),
    }),
    {
      name: "mngo-app-store",
      partialize: (state) => ({
        activePropertyId: state.activePropertyId,
        sidebarOpen: state.sidebarOpen,
        bookingsView: state.bookingsView,
        financialsView: state.financialsView,
        dashboardView: state.dashboardView,
      }),
    }
  )
);
