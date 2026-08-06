"use client";

import { OrderFulfillmentScreen } from "@/components/order-fulfillment-screen";

/** HOSTEL-only Shop order-fulfillment screen — see components/order-fulfillment-screen.tsx. */
export default function ShopPage() {
  return <OrderFulfillmentScreen station="SHOP" title="Shop" />;
}
