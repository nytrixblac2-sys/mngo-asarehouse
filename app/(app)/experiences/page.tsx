"use client";

import { OrderFulfillmentScreen } from "@/components/order-fulfillment-screen";

/** HOSTEL-only Experiences order-fulfillment screen — see components/order-fulfillment-screen.tsx. */
export default function ExperiencesPage() {
  return <OrderFulfillmentScreen station="EXPERIENCE" title="Experiences" />;
}
