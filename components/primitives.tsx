import type { ReactNode, CSSProperties } from "react";
import { C } from "@/lib/colors";

/**
 * Core UI primitives — see context/05-ui-context.md "Component Primitives"
 * and context/03-code-standards.md ("The Card, Pill, and SmallBtn
 * primitives are the building blocks — use them before writing custom
 * wrappers"). Ported from context/07-mockup.jsx.
 */

export function Card({
  children,
  style,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: C.card, border: `1px solid ${C.border}`, ...style }}
    >
      {children}
    </div>
  );
}

/** "light" is documented in 05-ui-context.md but not exercised in the
 * mockup's Pill — included here since it's part of the design spec. */
export type PillTone = "muted" | "accent" | "teal" | "amber" | "light";

const PILL_TONES: Record<PillTone, { bg: string; color: string }> = {
  muted: { bg: "#F2F2F2", color: C.muted },
  accent: { bg: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" },
  teal: { bg: C.tealSoft, color: C.teal },
  amber: { bg: C.amberSoft, color: C.amber },
  light: { bg: C.card, color: C.text },
};

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: PillTone }) {
  const t = PILL_TONES[tone];
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: t.bg, color: t.color, border: tone === "light" ? `1px solid ${C.border}` : undefined }}
    >
      {children}
    </span>
  );
}

export type SmallBtnTone = "dark" | "light";

export function SmallBtn({
  children,
  onClick,
  tone = "dark",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: SmallBtnTone;
  type?: "button" | "submit";
}) {
  const style: CSSProperties =
    tone === "dark"
      ? { background: C.text, color: "#fff" }
      : { background: C.bg, color: C.text, border: `1px solid ${C.border}` };
  return (
    <button
      type={type}
      onClick={onClick}
      className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
      style={style}
    >
      {children}
    </button>
  );
}
