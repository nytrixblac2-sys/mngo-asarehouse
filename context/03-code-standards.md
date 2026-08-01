# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `02-architecture-context.md`.
- Financial logic lives in `lib/financials.ts` — never inline allocation calculations in components.

## TypeScript

- Strict mode required throughout.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate unknown external input at API boundaries using Zod before trusting it.
- Use `interface` for object contracts; use `type` for unions and computed shapes.
- The `Booking`, `Expense`, `Property`, `Issue`, `Schedule`, and `User` types are canonical — import from `lib/types.ts`, never redefine locally.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, or Zustand state.
- Keep API route handlers thin — push financial logic and validation into `lib/`.
- Long-running work (PDF generation) belongs in background tasks, not in request handlers.

## Styling

- All colors come from CSS custom properties. Never use hardcoded hex values or raw Tailwind color classes like `zinc-*` in component code.
- Property theme colors are applied via `--accent` and `--accent-soft` on the root wrapper. Components read these variables.
- Use `var(--accent, #111111)` with a black fallback wherever the property accent color is referenced.
- Border radius scale: `rounded-xl` for inline elements and pills, `rounded-2xl` for cards and panels, fixed in the `Card` component.
- The `Card`, `Pill`, and `SmallBtn` primitives are the building blocks — use them before writing custom wrappers.

## Financial Logic Rules

- All allocation percentages are read from `property.allocation[currency]` — never hardcoded.
- GHS and EUR are handled in completely separate code paths. There is no conversion anywhere.
- MoMo charge (1%) is applied only to GHS expenses: `amount × 1.01`. EUR expenses use raw `amount`.
- Running balance calculations always include the `prev_balance` from the property record.
- `paid_at` is set server-side only — the client sends a confirm request, the server sets the date.

## Role and Access Rules

- Never use client-side role checks as the only gate for sensitive data. Server-side enforcement is the source of truth.
- The Oak & Co. Internal tab must be conditionally rendered based on `effectiveCanEdit` — if false, it must not appear in the DOM at all.
- Owner preview mode sets `effectiveUser` and `effectiveCanEdit` at the App root and threads them down as props — do not read from Zustand for role checks inside individual screens.
- The `previewUser` Zustand state is cleared on sign-out. Never persist it to local storage.

## API Routes

- Every route must verify the Supabase session before touching the database.
- Ownership: verify `workspace_id` matches the authenticated user's workspace before any read or write.
- Role: verify `role` before returning management fund data or accepting mutations from property owners.
- Return consistent response shapes: `{ data, error }`.
- Input is always parsed with Zod before use.

## Data and Storage

- Property metadata, bookings, expenses, schedules, and issues live in PostgreSQL via Prisma.
- PDF reports and screenshots live in Supabase Storage; only the URL reference is stored in the database.
- Do not store computed financial totals in the database — recalculate from raw records on the client.
- `prev_balance` is the only persisted financial aggregate; it is updated explicitly at month close, not computed on every request.

## File Organisation

- `lib/` — types, Prisma client, Supabase client, auth helpers, financial utilities.
- `components/` — all UI: screens, forms, modals, cards. No database calls.
- `components/ui/` — shadcn/ui components. Do not modify.
- `app/api/` — route handlers for auth, bookings, expenses, schedules, issues, properties, users.
- `store/` — Zustand: active property, preview user, navigation history.
- Name files after the responsibility they contain, not the technology: `booking-detail-modal.tsx` not `modal.tsx`.

## Component Conventions

- Every form uses React Hook Form with a Zod schema. No uncontrolled inputs.
- Modals are fixed-position overlays rendered at the App root level via a portal — not inline in the component that triggers them.
- The booking detail modal is the single canonical modal for viewing a booking — it is reused across Day, Week, Month, and Per Stay views. Do not create view-specific variants.
- `canEdit` is the single prop that controls all edit controls in every component. When false, buttons do not render — they are not disabled, they are absent.
