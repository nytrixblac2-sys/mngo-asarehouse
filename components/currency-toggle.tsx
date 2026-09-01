"use client";

import { C } from "@/lib/colors";
import type { Currency } from "@/lib/types";

/** context/07-mockup.jsx CurrencyToggle. Renders nothing for a
 * single-currency property — nothing to switch between. */
export function CurrencyToggle({
  value,
  onChange,
  currencies,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
  currencies: Currency[];
}) {
  if (!currencies || currencies.length < 2) return null;
  return (
    <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: "#F2F2F2" }}>
      {currencies.map((cur) => (
        <button
          key={cur}
          onClick={() => onChange(cur)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: value === cur ? C.card : "transparent", color: value === cur ? C.text : C.muted }}
        >
          {cur}
        </button>
      ))}
    </div>
  );
}
