"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Check, Copy } from "lucide-react";
import { Card } from "@/components/primitives";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { nightsBetween } from "@/lib/periods";
import { fetchJson } from "@/lib/api-client";
import type { Booking, Room } from "@/lib/types";

export function PublicBookingForm({ workspaceSlug, rooms }: { workspaceSlug: string; rooms: Room[] }) {
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guest, setGuest] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const previewTotal = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : null;
  const canSubmit =
    roomId && checkIn && checkOut && nights > 0 && guest.trim() && passportNumber.trim() &&
    guestEmail.trim() && guestPhone.trim();

  const handleSubmit = async () => {
    if (!canSubmit || isPending) return;
    setIsPending(true);
    setError(null);
    try {
      const booking = await fetchJson<Booking>("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSlug,
          roomId,
          guest: guest.trim(),
          checkIn,
          checkOut,
          passportNumber: passportNumber.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim(),
        }),
      });
      setConfirmed(booking);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPending(false);
    }
  };

  if (confirmed) {
    return (
      <Card className="flex flex-col items-center text-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.tealSoft }}>
          <Check size={20} style={{ color: C.teal }} />
        </div>
        <p className="text-base font-bold" style={{ color: C.text }}>Booking requested</p>
        <p className="text-xs" style={{ color: C.muted }}>
          Save this code — you&apos;ll use it with your name to track your stay and bill at{" "}
          <a href="/track" className="font-semibold" style={{ color: C.text }}>/track</a>.
        </p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(confirmed.bookingCode ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-2 text-lg font-bold px-5 py-3 rounded-xl"
          style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, letterSpacing: "0.1em" }}
        >
          {confirmed.bookingCode} {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <a
          href="/track"
          className="w-full text-sm font-semibold py-3 rounded-xl mt-2"
          style={{ background: C.text, color: "#fff" }}
        >
          Go to my stay
        </a>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold" style={{ color: C.muted }}>Room</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
          >
            <option value="">Select a room…</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {fmtCurrency(r.pricePerNight, r.currency)}/night</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
        </div>
        {previewTotal !== null && selectedRoom && (
          <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: C.bg }}>
            <span className="text-xs" style={{ color: C.muted }}>
              {nights} night{nights === 1 ? "" : "s"} × {fmtCurrency(selectedRoom.pricePerNight, selectedRoom.currency)}
            </span>
            <span className="text-sm font-bold" style={{ color: C.text }}>{fmtCurrency(previewTotal, selectedRoom.currency)}</span>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold" style={{ color: C.muted }}>Your name</label>
          <input
            value={guest}
            onChange={(e) => setGuest(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="e.g. Sofia R."
          />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.muted }}>Passport number</label>
          <input
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${C.border}` }}
            placeholder="e.g. G1234567"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Email</label>
            <input
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Phone</label>
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="+233…"
            />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
          className="w-full text-sm font-semibold py-3 rounded-xl mt-2 flex items-center justify-center gap-2"
          style={{ background: canSubmit && !isPending ? C.text : C.border, color: canSubmit && !isPending ? "#fff" : C.muted }}
        >
          <CalendarIcon size={16} /> {isPending ? "Booking…" : "Request booking"}
        </button>
        <p className="text-xs text-center" style={{ color: C.muted }}>Payment is made at the property, not online.</p>
      </div>
    </Card>
  );
}
