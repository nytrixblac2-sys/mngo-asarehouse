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
