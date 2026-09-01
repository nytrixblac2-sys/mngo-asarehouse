"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OrderFulfillmentScreen } from "@/components/order-fulfillment-screen";
import { C } from "@/lib/colors";
import type { MenuStation } from "@/lib/types";

const STATION_TABS: MenuStation[] = ["KITCHEN", "BAR", "SHOP", "EXPERIENCE"];
const STATION_LABEL: Record<MenuStation, string> = {
  KITCHEN: "Kitchen",
  BAR: "Bar",
  SHOP: "Shop",
  EXPERIENCE: "Experiences",
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * HOSTEL-only order fulfillment with month navigation so staff can review
 * past orders without scrolling through everything.
 */
export default function OrdersPage() {
  const [station, setStation] = useState<MenuStation>("KITCHEN");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  const goPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: C.bg }}>
          {STATION_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStation(s)}
              className="text-sm font-semibold px-4 py-2 rounded-full"
              style={{ background: station === s ? C.card : "transparent", color: station === s ? C.text : C.muted }}
            >
              {STATION_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold min-w-[80px] text-center" style={{ color: C.text }}>{monthLabel}</span>
          <button onClick={goNext} className="p-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <OrderFulfillmentScreen station={station} title={STATION_LABEL[station]} activeMonth={monthPrefix} />
    </div>
  );
}
