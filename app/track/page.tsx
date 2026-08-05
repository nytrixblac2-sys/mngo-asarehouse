"use client";

import { C } from "@/lib/colors";
import { useGuestBill } from "@/lib/queries/guest";
import { GuestLoginForm } from "./guest-login-form";
import { GuestBillView } from "./guest-bill-view";

/**
 * Public, unauthenticated guest portal — "log in" with booking code +
 * name (no password, no Supabase Auth account — lib/guest-session.ts),
 * then see a live running bill and order food. Whether the guest is
 * "signed in" is derived entirely from GET /api/public/bill succeeding
 * or 401ing, not any client-side flag — the signed cookie is the only
 * source of truth.
 */
export default function TrackPage() {
  const billQuery = useGuestBill();
  const isSignedIn = !billQuery.isLoading && !billQuery.isError && !!billQuery.data;

  return (
    <div className="flex w-full items-start justify-center py-12 px-6" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <p className="text-xl font-bold" style={{ color: C.text }}>Track your stay</p>
          {!isSignedIn && (
            <p className="mt-1 text-xs font-medium text-center" style={{ color: C.muted }}>
              Enter your booking code and name to see your bill
            </p>
          )}
        </div>
        {isSignedIn ? <GuestBillView /> : <GuestLoginForm />}
      </div>
    </div>
  );
}
