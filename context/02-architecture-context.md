# Architecture Context

## Stack

| Layer            | Technology                        | Role                                                                        |
|------------------|-----------------------------------|-----------------------------------------------------------------------------|
| Framework        | Next.js 14 + TypeScript           | Full-stack app with server/client boundaries, API routes, SSR               |
| UI               | Tailwind CSS + shadcn/ui          | Component composition and styling                                            |
| Icons            | Lucide React                      | Stroke-based icon set used throughout the UI                                 |
| Charts           | Recharts                          | Period comparison bar chart on the Dashboard                                 |
| State            | Zustand                           | Global client state: current user, active property, preview mode, theme      |
| Data fetching    | TanStack Query                    | Server state management, caching, and background refetch                     |
| Forms            | React Hook Form + Zod             | Typed validation for all forms (booking, expense, invite, allocation)        |
| Auth             | Supabase Auth                     | Email/password login, magic link invites for property owners                 |
| Database         | Supabase (PostgreSQL) + Prisma    | Relational data, Row Level Security, migration management                    |
| Realtime         | None (V1)                         | No real-time collaboration in V1; polling via TanStack Query if needed       |
| Background tasks | None (V1)                         | No durable background jobs in V1; PDF generation deferred to V2             |
| File storage     | Supabase Storage                  | Generated PDF reports (V2), Airbnb payout screenshots                       |
| Email            | Resend                            | Owner invite emails, payment confirmation notifications                      |
| PDF              | react-pdf/renderer (V2)           | Monthly owner report generation — deferred to V2                            |
| Hosting          | Vercel                            | Zero-config Next.js deployment, branch preview environments                  |
| Monitoring       | Sentry                            | Error tracking and session replay                                            |
| Analytics        | PostHog                           | Product analytics and feature flags for phased rollout                      |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, role enforcement, and database persistence. No long-running work here.
- `lib` — Shared infrastructure: Supabase client, Prisma client, auth helpers, financial calculation utilities, and type definitions.
- `components` — UI composition: screens, cards, modals, forms, and interactive elements. No business logic or direct database calls.
- `components/ui` — shadcn/ui foundation components. Do not modify these directly.
- `prisma` — Database schema and generated Prisma client output.
- `store` — Zustand stores: active property, preview user state, navigation history.

## Storage Model

- **Database (PostgreSQL via Supabase):** all relational data — users, workspaces, properties, bookings, expenses, manual income, schedules, issues, team members. Every record is owned by a workspace and protected by Row Level Security.
- **Supabase Storage:** generated PDF reports stored at `reports/{workspace_id}/{month}.pdf` and linked to the property record. Airbnb payout screenshots stored at `uploads/{workspace_id}/{booking_id}.jpg`.
- Financial running balances are stored as `prev_balance_ghs` and `prev_balance_eur` JSONB fields on the property record and updated at month close.

## Auth and Access Control Model

- Every workspace has a single Account Owner (Supabase Auth User ID).
- Users have one of three roles: `account_owner`, `co_manager`, `property_owner`.
- Property Owners are scoped to specific properties via the `user_properties` join table.
- Row Level Security in Supabase enforces workspace scoping at the database layer — no query can return data from another workspace regardless of application-layer bugs.
- The management fund percentage and Oak & Co. Internal tab data are excluded server-side for `property_owner` role sessions. This is enforced in API route middleware, not in client components.
- Owner preview mode is a **client-side rendering state only** — it switches the React component tree to render as if the user has the owner role, but the actual Supabase session and server-side permissions remain unchanged.

## Financial Calculation Model

All financial calculations run client-side from raw data returned by the API. The API returns full booking and expense records; the client computes allocations, running balances, and fund summaries dynamically.

```
owners_income    = booking.amount × (allocation[currency].owners_pct / 100)
operations_income = booking.amount × (allocation[currency].operations_pct / 100)
management_income = booking.amount × (allocation[currency].management_pct / 100)

GHS expense total = amount × 1.01   (MoMo 1% charge)
EUR expense total = amount           (no charge)

Owners Running Balance =
  prev_balance[currency].owners
  + (confirmed income × owners_pct / 100)
  + (confirmed income × operations_pct / 100)
  − owners_expenses
  − operations_expenses

Management Running Balance =
  prev_balance[currency].management
  + (confirmed income × management_pct / 100)
  − management_expenses
```

GHS and EUR accounts are fully separate. There is no conversion or cross-account aggregation anywhere in the codebase.

## Property Theming Model

Each property has a single hex color. On the client, this color is applied as CSS custom properties on the root wrapper:

```
--accent: #[hex]
--accent-soft: rgba(r, g, b, 0.10)
```

Every accent-colored element reads `var(--accent)` or `var(--accent-soft)` — no component has a hardcoded property color. Switching the active property or updating a property's color triggers a Zustand state update that re-renders the root wrapper with the new CSS variables, repainting the entire UI without a page reload.

## Invariants

1. Management fund data is never returned to `property_owner` role sessions — enforced server-side, not in component conditionals.
2. GHS and EUR balances are never mixed, converted, or aggregated together.
3. Income allocation percentages must sum to exactly 100% per currency before a property can be saved.
4. The `paid_at` date on a booking is set to the server date at the moment of confirmation — never supplied by the client.
5. Client components are used only where browser interactivity requires them; all data fetching defaults to Server Components.
6. The owner preview mode does not modify the Supabase session — it is a rendering-layer concern only.
