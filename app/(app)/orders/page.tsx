"use client";

import { useState } from "react";
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

/**
 * HOSTEL-only order fulfillment — one screen, one tab per station, instead
 * of four separate nav items/routes each pointing at the same
 * OrderFulfillmentScreen. Same tab-switcher pattern as /menu's
 * Menu/Shop/Experiences tabs; OrderFulfillmentScreen keeps its own
 * per-station h1/description, so switching tabs updates the heading too
 * rather than duplicating it above the tab bar.
 */
export default function OrdersPage() {
  const [station, setStation] = useState<MenuStation>("KITCHEN");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: "#F2F2F2" }}>
        {STATION_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStation(s)}
            className="text-sm font-semibold px-4 py-2 rounded-full"
            style={{ background: station === s ? "#fff" : "transparent", color: station === s ? C.text : C.muted }}
          >
            {STATION_LABEL[s]}
          </button>
        ))}
      </div>

      <OrderFulfillmentScreen station={station} title={STATION_LABEL[station]} />
    </div>
  );
}
