# Development Workflow

## Versioning Scheme

Version format is `MAJOR.MINOR.STAGE.BUILD` (e.g. `1.0.9.3`), each segment a single digit 0–9, tracked in `package.json`'s `version` field and mirrored at the top of `06-progress-tracker.md`. The last segment (BUILD) increments once per completed build/fix.

**Rollover cascades like an odometer.** Every segment maxes out at 9, then resets to 0 and increments the segment to its left — which can itself cascade further left if it was also at 9:

- `1.0.0.0` → `1.0.0.1` → … → `1.0.0.9` → `1.0.1.0` (BUILD rolled into STAGE)
- `1.0.9.9` → `1.1.0.0` (BUILD rolled into STAGE, which *also* rolled into MINOR — **not** `1.0.10.0`)
- `1.9.9.9` → `2.0.0.0` (same cascade, all the way to MAJOR)

No segment is ever allowed to exceed 9. Before bumping the version, check whether the segment about to increment is already 9 — if so, that segment resets to 0 and the next one left increments instead, checking the same condition recursively. Real mistake made and corrected 2026-09-08: `1.0.9.9` was bumped to `1.0.10.0` instead of `1.1.0.0`, caught by the user and fixed the same session — see `06-progress-tracker.md`'s Version Log for the corrected entry.

## Approach

Build MNGO incrementally using a spec-driven workflow. The context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch. The mockup (`07-mockup.jsx`) is the ground truth for UI behavior. When in doubt about how something should look or behave, the mockup is the reference.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine UI changes with API changes and database migrations in a single step.
- Financial logic changes require explicit review before implementation — an error in allocation or balance calculation affects real money.

## When To Split Work

Split an implementation step if it combines:

- UI screen changes and API route changes
- Database schema changes and client-side rendering changes
- Multiple unrelated financial calculations or fund types
- Any change to the role-based access model that touches both server and client

If a change cannot be verified end to end in one session, the scope is too large — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files or the mockup.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `06-progress-tracker.md` before proceeding.
- Financial behavior questions must be raised with Kwame before implementation — do not make assumptions about how money is split or carried forward.

## Protected Conventions — Do Not Change Without Explicit Instruction

- The 60/15/25 default allocation is a default, not a constant — it is always read from `property.allocation[currency]`.
- The MoMo 1% charge applies to GHS expenses only. Do not apply it to EUR.
- `paid_at` is always set server-side. Never let the client supply this value.
- GHS and EUR are always computed separately. Never aggregate them.
- The Oak & Co. Internal tab content is never sent to `property_owner` sessions. This is enforced server-side.
- Owner preview mode is a client-side rendering state only. It does not modify the Supabase session.
- The `canEdit` prop is the single source of truth for whether edit controls render. Never check `currentUser.role` directly in a screen component.
- The PDF report's structure (v1.0.2.9 — income overview, balance carried forward, income allocation, itemized income/expenses, EUR-only Oak & Co transfer callout, final balance calculation) and visual design (`components/report-pdf-document.tsx`'s grey/teal bento-card styling) are both user-confirmed final as of 2026-08-04. Do not restructure the content or change the color/card styling without explicit instruction — see Architecture Decision 62.

## Mockup Fidelity Rules

The mockup (`07-mockup.jsx`) is a complete, working React prototype. When converting it to the production app:

- UI layout, component structure, and interaction patterns should match the mockup exactly unless a context file explicitly specifies otherwise.
- Extract inline logic from the mockup into `lib/financials.ts` and API routes — do not leave financial calculations in components.
- Replace the mockup's `useState` initial data with real API calls via TanStack Query.
- The mockup's `INITIAL_*` constants become seed data and test fixtures, not production defaults.
- CSS custom property theming (`--accent`, `--accent-soft`) from the mockup carries over directly to the production app.

## Decision Protocol

When you encounter a decision point:

1. Check `02-architecture-context.md` for the relevant invariant or boundary rule.
2. Check `03-code-standards.md` for the relevant convention.
3. Check `07-mockup.jsx` for how the UI handles this case.
4. If none of the above resolves the question, add it as an open question in `06-progress-tracker.md` and surface it before proceeding.
5. Never make a silent architectural decision — log it in `06-progress-tracker.md` under Architecture Decisions.

## Verification Standard

After each implementation unit:

- Financial calculations must be verified against the mockup's expected output with the same input data.
- Any new API route must enforce auth, workspace scoping, and role checks — verify each.
- Any UI surface must render correctly for all three roles: Account Owner, Co-Manager, and Property Owner.
- The Property Owner view must be verified to show no management fund data anywhere — not in the DOM, not in network responses.
- If it cannot be verified end to end, the step is too large — split it.

## Known Open Questions (Structural)

These questions were identified during mockup development and must be resolved before implementing the relevant features:

1. **EUR running balance carryforward** — how are prior EUR balances recorded at the start of a new property? The mockup initialises `prev_balance_eur.owners` at 0, but real historical EUR balances from Airbnb need to be imported. What is the import mechanism?
2. **Month close process** — when does `prev_balance` update? Is there an explicit "close month" action, or does it update automatically? This affects how running balances are calculated during a partially-complete month.
3. **Multi-owner income split** — the current model gives Prince and Pamela a combined Owners Fund. If they have different ownership percentages of the property (e.g. 70/30), how is their individual share calculated? This is not yet modelled.
