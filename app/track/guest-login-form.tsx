"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { Card } from "@/components/primitives";
import { C } from "@/lib/colors";
import { useGuestTrack } from "@/lib/queries/guest";

export function GuestLoginForm() {
  const [bookingCode, setBookingCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const track = useGuestTrack();

  const canSubmit = bookingCode.trim().length > 0 && guestName.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || track.isPending) return;
    track.mutate({ bookingCode: bookingCode.trim(), guestName: guestName.trim() });
  };

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold" style={{ color: C.muted }}>Booking code</label>
          <input
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm uppercase"
            style={{ border: `1px solid ${C.border}`, letterSpacing: "0.1em" }}
            placeholder="e.g. K7M2QRT"
          />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.muted }}>Name on the booking</label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="e.g. Sofia R."
          />
        </div>
        {track.isError && <p className="text-xs text-destructive">{(track.error as Error).message}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || track.isPending}
          className="w-full text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          style={{ background: canSubmit && !track.isPending ? C.text : C.border, color: canSubmit && !track.isPending ? "#fff" : C.muted }}
        >
          <LogIn size={16} /> {track.isPending ? "Checking…" : "Track my stay"}
        </button>
      </div>
    </Card>
  );
}
