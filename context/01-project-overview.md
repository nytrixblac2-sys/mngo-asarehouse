# MNGO

## Overview

MNGO is a web-based booking tracking, reporting, and owner insights platform built for short-term rental property management companies. It gives property managers a single workspace to log bookings, track income and expenses across GHS and EUR accounts, schedule cleaning and maintenance, and manage issues — while giving property owners a separate read-only view of their investment's performance. The core design constraint is role-based access: the management company's internal financial cut (their percentage of each booking) is never visible to property owners at any layer. The reference implementation is Oak & Co., a management company in Accra that manages Asare House on behalf of its owners, Prince and Pamela.

## Goals

1. Track bookings across multiple sources (Airbnb and local/cash) with confirmed and expected payment states.
2. Manage GHS and EUR income as fully separate accounts with configurable per-currency allocation splits between owners, operations, and management.
3. Give property managers a private internal financial view that property owners can never access.
4. Give property owners a clean read-only dashboard showing their income, expenses, and property performance — without requiring the manager to send a monthly report.
5. Track issues and maintenance schedules with full status history and team assignment.
6. Support multi-property workspaces with per-property color theming, currency configuration, and allocation percentages.

## Core User Flow

1. Kwame (Account Owner) signs in and creates a workspace for Oak & Co.
2. Kwame adds Asare House as a property, sets currencies to GHS and EUR, and configures the 60/15/25 income allocation split.
3. Kwame invites Cecilia as Co-Manager and invites Prince and Pamela as Property Owners.
4. Cecilia logs a confirmed Airbnb booking in EUR and a local booking in GHS.
5. Cecilia logs expenses against the Owners, Operations, and Oak & Co. funds in the relevant currency.
6. Cecilia schedules a cleaning shift and logs a guest complaint issue with Open status.
7. Prince logs in and sees his Owner Report — income allocations, expense breakdown, and running balance — with no visibility into Oak & Co.'s share.
8. Kwame previews Prince's view from the Profile modal to verify what Prince will see before going live.
9. Cecilia confirms a booking payment; the record is timestamped and the financial totals update.
10. Kwame generates a monthly owner report for Prince and Pamela.

## Features

### Authentication and Roles

- Email/password login with role-based access enforced server-side.
- Four roles: Account Owner, Co-Manager, Property Owner, Team Member (V2).
- Property Owners log in to a structurally different view — the management fund tab is not hidden, it is not rendered.
- Account Owners can preview any Property Owner's exact view without changing their own session.
- Preview mode shows a persistent yellow banner with an Exit preview button.

### Bookings

- Four calendar views: Day (horizontal day strip), Week (7-day grid), Month (calendar grid), Per Stay (bento cards per booking).
- Month navigation with year wrapping (December → January, January → December).
- Booking detail modal with Edit, Delete, and Confirm payment (records `paid_at` date).
- Per Stay view: expand card to reveal actions, click guest name to open detail modal.
- Booking sources: Airbnb (EUR) and Local/Cash (GHS).

### Financials

- Separate GHS and EUR accounts — never mixed, never converted.
- Configurable income allocation per property per currency (owners %, operations %, management %).
- Owner Report tab: Owners Fund, Operations Fund, running balance, Income and Expenses sub-views.
- Oak & Co. Internal tab: Management Fund, team payment log, income and expenses sub-views.
- Independent GHS/EUR currency switcher per tab.
- Add income (manual entries: owner contributions, top-ups).
- Add expense with currency field; GHS expenses auto-apply 1% MoMo charge.
- Month switcher shared at the top of the Financials screen.

### Issues & Schedules

- Issues with three types: Guest Complaint, Maintenance, Note.
- Status lifecycle: Open → In Progress → Resolved (bidirectional).
- Every status change timestamped and stored in status history.
- Schedules with four types: Cleaning, Repair, Supervision, Training.
- Deep-link from Dashboard open issues banner → Issues & Schedules page with card auto-expanded.

### Dashboard

- Open issues banner (clickable, deep-links to Issues & Schedules).
- Upcoming schedules card (next 5 shifts).
- Upcoming stays card with Confirm payout button (managers) or status pill (owners).
- Comparison chart: expenses by period (Week / Month / Year) with delta stats.

### Properties and Team

- Multi-property support with color-coded theming via CSS custom properties.
- Property profile: color (save-gated), currencies, per-currency allocation %, rooms, facilities.
- Team management with payment history per member.
- Team members appear in schedule and expense assignment dropdowns.

## Scope

### In Scope

- Multi-role authentication with server-enforced access control.
- Bookings: create, edit, delete, confirm payment with timestamp.
- Financials: dual-currency accounts, configurable allocation, running balances.
- Issues tracking with full status history.
- Schedule management with team assignment.
- Property setup: color, currencies, allocation %, rooms, facilities.
- Dashboard with period comparison chart.
- Owner preview mode for managers.
- Multi-property workspace with property switcher.

### Out Of Scope

- PDF report generation (V2).
- Team member logins with shift-scoped access (V2).
- Airbnb payout API integration — all bookings are entered manually in V1.
- Google Calendar sync (V2).
- Mobile-native iOS and Android apps (V2).
- Multi-currency support beyond GHS and EUR (V2).
- Push and email notifications (V2).
- Billing and subscription management.

## Success Criteria

1. A manager can log a booking, confirm payment, and see the income split across all three funds in the correct currency.
2. A property owner can log in and see their income, expenses, and running balance with no visibility into the management fund at any layer.
3. Switching a property's color theme updates every accent-colored element across the entire app simultaneously.
4. An Account Owner can preview any Property Owner's exact view and exit back to full manager access without losing state.
5. GHS and EUR running balances update independently and never cross-contaminate.

## Current Product State (as of v1.1.1.1, 2026-09-14)

Everything above this section is the original V1 spec — still accurate for the RENTAL product's core (bookings, allocation splits, owner/manager roles), but the product has grown well past it since launch. This section is the up-to-date supplement; `06-progress-tracker.md`'s Version Log has the full blow-by-blow. Kept here, not folded into the sections above, so this file doesn't need a rewrite every time something ships — update this section (and the pricing figures especially) whenever it drifts from `app/pricing/page.tsx`, the actual source of truth for pricing copy.

### Workspace types today

- **RENTAL** — the original product described above (Oak & Co./Asare House). Optionally adds a guest-facing **Shop** (`Workspace.hasShop`) — a small in-house retail catalog (drinks, toiletries, souvenirs) guests browse and order from via a QR code tied to their stay, unrelated to the workspace's own subscription plan. Its Shop items never get inventory tracking — see STORE below.
- **HOSTEL** (Escape3Points) — priced rooms with server-computed nightly totals, a food & beverage menu with Kitchen/Bar order fulfillment, public guest self-service booking and stay-tracking, checkout receipts. No owner/operations/management income splits — a single Income/Expenses/Balance ledger instead.
- **STORE** (live, built 2026-09-13/14) — a third type for businesses that are only a shop or store (a friend's phone shop was the concrete driving example), with no bookings at all. Nav: Dashboard, Shop, Issues & Schedules, Team, Financials. Always exactly one location per workspace today (same one-property cap RENTAL already has, Architecture Decision 94), with branches planned for a later plan tier once a real customer needs one. Reuses the existing `MenuItem`/`ShopOrder`/`ShopOrderItem` models unchanged, and `Property` as its "location," rather than new parallel models — both were already workspace-scoped, not tied to a booking. Its Shop is the whole business (always on, no guest-facing toggle like RENTAL's), its Dashboard/Financials are sourced from `ShopOrder`s instead of bookings, and its properties get a fixed 100% owners / 0% ops / 0% management income split (same shape as HOSTEL). Public self-serve `/signup` offers Rental or Store; Hostel stays admin-onboarded only. **Inventory tracking** (`MenuItem.stockQuantity`, `StockAdjustment` audit log) is Store-only — a product opts in with a starting count, sales auto-decrement it and log a `StockAdjustment`, restocks/corrections go through the same log, and the Shop admin screen's Inventory tab shows the full history. **Free-tier limits are now real and enforced** (v1.1.1.1, not just copy) — see Pricing below.

### Pricing (real, current copy — see `app/pricing/page.tsx`)

Four tiers, not three (the three-tier version — Starter free / Pro $29 / Enterprise custom — shipped first, restructured to four in v1.0.9.4):

| Plan | Price | Key limits |
|---|---|---|
| Free | Free forever | 1 property, financials for the current month only, 2 staff accounts |
| Starter | $19.99/mo | Up to 5 properties, full financials & reporting, inventory tracking (Shop/Store), 5 staff accounts |
| Pro | $39.99/mo | Up to 20 properties, full financials & reporting, Menu & orders module, inventory tracking (Shop/Store), 10 staff accounts |
| Enterprise | Custom | Unlimited properties/staff, dedicated support |

**Important — pricing enforcement is real for STORE, still just copy for RENTAL/HOSTEL.** `Workspace` has a manually admin-toggled `paid: Boolean` (v1.0.1.6) and, as of v1.1.0.8, a real `plan: WorkspacePlan` field (FREE/STARTER/PRO/ENTERPRISE), now settable per workspace from `/admin`'s Plan row (v1.1.1.1). Every pre-existing workspace was grandfathered to `ENTERPRISE` in the v1.1.0.8 migration, so Oak & Co./Asare House and Escape3Points are unaffected — RENTAL/HOSTEL still have no real limits checked anywhere; enforcing their own long-stated limits (property/staff counts) is a separate, deliberately deferred future audit, not part of the STORE work. **For STORE specifically, three Free-tier limits are now enforced server-side, not just described in copy (v1.1.1.1):** Financials is locked to the real current month (no prev/next navigation — same mechanism as the existing Co-Manager lock, keyed off `plan` instead of role); the public `/shop/[slug]` storefront (both browsing and placing orders) returns `403` for a Free-tier Store, with the Shop admin screen showing an upgrade prompt instead of a dead link; and inventory tracking (`POST /api/menu`, `PATCH /api/menu/[id]`, `POST /api/menu/[id]/stock-adjustments`) rejects any attempt to set or start tracking stock with `403`, enforced at the API layer specifically so a direct call can't bypass the UI simply omitting the checkbox. Out of Scope's "Billing and subscription management" (above) is still true: no payment processor, no self-serve upgrade/downgrade — moving a real workspace off Free is a manual `/admin` action.
