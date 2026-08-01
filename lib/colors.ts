/**
 * Static MNGO palette — see context/05-ui-context.md.
 *
 * Only the property accent color (--accent / --accent-soft) is a true CSS
 * custom property, because it changes per active property at runtime
 * without a page reload (context/02-architecture-context.md, "Property
 * Theming Model"). Everything else is static for the life of the app, so
 * it lives here as the canonical `C` constants object instead of colliding
 * with shadcn/ui's own --border / --muted / --card / --accent tokens,
 * which share these names but carry different (oklch, neutral) values.
 */
export const C = {
  bg: "#F5F5F5",
  card: "#FFFFFF",
  border: "#E5E5E5",
  text: "#111111",
  muted: "#9B9B9B",
  teal: "#00A699",
  tealSoft: "rgba(0, 166, 153, 0.10)",
  amber: "#F59E0B",
  amberSoft: "rgba(245, 158, 11, 0.10)",
} as const;

/** Property theme swatches — context/05-ui-context.md "Property Theme Colors". */
export const THEME_COLORS = [
  "#111111",
  "#FF5A5F",
  "#00A699",
  "#B8860B",
  "#6C5CE7",
  "#0EA5E9",
  "#E5533D",
  "#22C55E",
  "#F97316",
  "#EC4899",
  "#64748B",
] as const;
