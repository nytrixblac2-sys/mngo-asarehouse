import { TrendingUp, TrendingDown } from "lucide-react";
import { C } from "@/lib/colors";

/** context/07-mockup.jsx DeltaStat. */
export function DeltaStat({
  label,
  current,
  previous,
  format,
}: {
  label: string;
  current: number;
  previous: number;
  format?: (n: number) => string;
}) {
  const fmt = format ?? ((n: number) => String(n));
  const diff = current - previous;
  const up = diff > 0;
  const flat = diff === 0;
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: C.bg }}>
      <span className="text-sm" style={{ color: C.text }}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold" style={{ color: C.text }}>
          {fmt(current)}
        </span>
        <span
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: flat ? C.muted : up ? C.teal : "var(--accent, #111111)" }}
        >
          {!flat && (up ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
          {flat ? "No change" : `${up ? "+" : ""}${fmt(diff)} vs last`}
        </span>
      </div>
    </div>
  );
}
