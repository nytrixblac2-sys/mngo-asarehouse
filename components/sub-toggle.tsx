"use client";

import { C } from "@/lib/colors";

/** context/07-mockup.jsx SubToggle. */
export function SubToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: "#F2F2F2" }}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="text-xs font-semibold px-4 py-1.5 rounded-full"
          style={{ background: value === o.key ? C.card : "transparent", color: value === o.key ? C.text : C.muted }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
