# UI Context

## Theme

Light mode only. Clean, minimal, and professional — white card surfaces on a soft grey background, with a property-driven accent color as the only variable element. The accent color is the single most important theming concept: it changes based on which property is active, painting the entire UI in that property's color without a page reload.

All property-specific colors are applied as CSS custom properties on the root wrapper. Components must read these variables — no component should contain a hardcoded property color.

| Role                  | CSS Variable          | Default Value                        |
|-----------------------|-----------------------|--------------------------------------|
| Page background       | `--bg`                | `#F5F5F5`                            |
| Card / surface        | `--card`              | `#FFFFFF`                            |
| Border                | `--border`            | `#E5E5E5`                            |
| Primary text          | `--text`              | `#111111`                            |
| Muted text            | `--muted`             | `#9B9B9B`                            |
| Property accent       | `--accent`            | Property hex color (default #111111) |
| Property accent soft  | `--accent-soft`       | `rgba(r, g, b, 0.10)` of accent      |
| Teal (confirmed)      | `C.teal`              | `#00A699`                            |
| Teal soft             | `C.tealSoft`          | `rgba(0, 166, 153, 0.10)`            |

The `C` constants object (`C.text`, `C.muted`, `C.bg`, `C.card`, `C.border`, `C.teal`, `C.tealSoft`) is the canonical way to reference colors inside components. This pattern carries over from the mockup to the production app — replace inline hex values with `C.*` references or Tailwind token classes.

## Typography

| Role        | Font              | Application                                     |
|-------------|-------------------|-------------------------------------------------|
| All UI text | Plus Jakarta Sans | Loaded via Google Fonts, applied on `<body>`    |

Font sizes follow a consistent scale:
- `text-2xl font-bold` — page headings (`h1`)
- `text-lg font-bold` — modal headings
- `text-sm font-semibold` — card headings, nav items, button labels
- `text-sm` — body text, list items
- `text-xs font-semibold` — section labels (uppercase + tracking-wide), pills, small metadata
- `text-xs` — timestamps, sublabels, helper text

## Color Roles

**Accent (property color):** Used for primary action buttons, active nav states, open issue indicators, chart bars, the property color dot in the switcher. Reads `var(--accent, #111111)`.

**Accent soft:** Used for card backgrounds on alert states (open issues banner), active tab backgrounds. Reads `var(--accent-soft)`.

**Teal (#00A699):** Exclusively for confirmed/positive states — Confirmed pill, Confirm payout buttons, Add schedule button, Add income button, running balance cards, upcoming schedule card background. Never use teal for alerts or warnings.

**Amber:** Expected/pending states — Expected pill on bookings, In Progress issue status.

**Muted grey:** Timestamps, sublabels, secondary metadata, inactive nav items, placeholder text.

## Border Radius Scale

| Context                        | Class         |
|--------------------------------|---------------|
| Pills, tags, small UI elements | `rounded-full`|
| Inputs, list rows, small cards | `rounded-xl`  |
| Cards, panels, form containers | `rounded-2xl` |
| Modals, overlays               | `rounded-2xl` |

## Property Theme Colors (Swatches)

11 swatches available in the property profile color picker. These are the only permitted property colors:

| Name    | Hex       |
|---------|-----------|
| Black   | `#111111` |
| Coral   | `#FF5A5F` |
| Teal    | `#00A699` |
| Gold    | `#B8860B` |
| Purple  | `#6C5CE7` |
| Sky     | `#0EA5E9` |
| Red     | `#E5533D` |
| Green   | `#22C55E` |
| Orange  | `#F97316` |
| Pink    | `#EC4899` |
| Slate   | `#64748B` |

Black (#111111) is the default. Color changes are staged behind a Save button — not applied on swatch click.

## Component Primitives

Three core primitives from the mockup carry over to production:

**Card** — white, `rounded-2xl`, light border, standard padding (`p-5`). The container for all content sections. No card should contain business logic.

**Pill** — `rounded-full`, small padded label. Six tones: `accent` (property color), `teal`, `amber`, `muted` (grey), `light` (white bg). Used for booking status, issue status, categories, source labels.

**SmallBtn** — compact action button used inside summary panels and cards. Two tones: `dark` (accent bg) and `light` (soft bg).

## Layout Patterns

**App shell:** Full-viewport height. Top bar (fixed) → content row below. Content row: optional pinned left sidebar + scrollable main content area.

**Top bar:** Left — menu (☰) and panel toggle (▤). Center — property switcher with color dot. Right — search (🔍), back/forward navigation, generate report icon. Nav items render in a hover panel on ☰ click, and in the pinned left sidebar when ▤ is active.

**Pinned sidebar:** 200px wide, full height, light border on the right. Nav items in the body; Generate report, View profile, and Sign out pinned to the bottom.

**Modals:** Fixed overlay, centered, `max-w-md`, `rounded-2xl`, `max-height: 85vh` with internal scroll. Dark semi-transparent backdrop.

**Slide-in forms:** Fixed overlay anchored to the right edge. `max-w-sm`, full height, white background, internal scroll. Used for Add booking, Add expense, Add schedule, Add income, Log issue.

**Preview banner:** When in owner preview mode, a yellow banner (`bg: #FEF9C3`, `border: #FDE68A`) appears above the top bar, full width. Contains the preview label on the left and an Exit preview button on the right. Always visible regardless of active screen.

## Navigation

**Menu order:** Dashboard · Bookings · Issues & Schedules · Team · Financials

Team is hidden from the Property Owner nav. No other items differ by role in V1.

## Booking Status Colors

| Status    | Pill tone | Color   |
|-----------|-----------|---------|
| Confirmed | teal      | #00A699 |
| Expected  | amber     | #F59E0B |

## Issue Status Colors

| Status      | Dot / button color            |
|-------------|-------------------------------|
| Open        | `var(--accent)` (property)    |
| In Progress | `#F59E0B` (amber)             |
| Resolved    | `#00A699` (teal)              |

## Icons

Lucide React throughout. Key icons by usage:

| Icon            | Usage                                              |
|-----------------|----------------------------------------------------|
| `Menu`          | Top bar hamburger                                  |
| `PanelLeft`     | Sidebar toggle                                     |
| `Search`        | Search trigger                                     |
| `Plus`          | Add booking, add expense, add income               |
| `Check`         | Confirm payment, color swatch active state         |
| `AlertTriangle` | Log issue button, open issue indicators            |
| `ClipboardList` | Add/edit schedule button                           |
| `ChevronLeft/Right` | Month navigation, back/forward, expand/collapse|
| `ChevronDown`   | Dropdowns                                          |
| `X`             | Close modals and forms                             |
| `ExternalLink`  | "Open booking detail" link inside Per Stay expand  |
| `Eye`           | Owner preview mode banner                          |
| `DollarSign`    | Log expense form submit                            |
| `TrendingUp/Down` | Delta stats on Dashboard chart                   |
