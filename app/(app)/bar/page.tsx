"use client";

import { OrderFulfillmentScreen } from "@/components/order-fulfillment-screen";

/** HOSTEL-only Bar order-fulfillment screen — see components/order-fulfillment-screen.tsx. */
export default function BarPage() {
  return <OrderFulfillmentScreen station="BAR" title="Bar" />;
}
