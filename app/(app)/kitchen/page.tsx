"use client";

import { OrderFulfillmentScreen } from "@/components/order-fulfillment-screen";

/** HOSTEL-only Kitchen order-fulfillment screen — see components/order-fulfillment-screen.tsx. */
export default function KitchenPage() {
  return <OrderFulfillmentScreen station="KITCHEN" title="Kitchen" />;
}
