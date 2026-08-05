"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { nightsBetween } from "@/lib/periods";
import type { Booking, Property, Room } from "@/lib/types";
import type { HostelBookingInput } from "@/lib/queries/bookings";

/**
 * Room-based booking form for HOSTEL workspaces (Escape3Points) — a
 * separate component from BookingForm rather than a heavily-branched
 * version of it, since the field set genuinely differs: a room dropdown
 * that drives an auto-computed total instead of a free-typed amount, a
 * required passport number, no Airbnb/Local source toggle (staff-entered
 * bookings are always LOCAL — Airbnb doesn't apply to a hostel room
 * booking). The total shown here is a preview only; the server
 * recomputes and is the actual source of truth (lib/rooms.ts
 * computeHostelBookingFields), so it can never drift from a stale room
 * price and always catches a double-booked room.
 */
export function HostelBookingForm({
  onClose,
  onSubmit,
  booking,
  properties,
  rooms,
  defaultPropertyId,
  isPending,
  error,
}: {
  onClose: () => void;
  onSubmit: (input: HostelBookingInput) => void;
  booking?: Booking;
  properties: Property[];
  rooms: Room[];
  defaultPropertyId: string;
  isPending?: boolean;
  error?: string | null;
}) {
  const isEdit = !!booking;
  const [guest, setGuest] = useState(booking?.guest ?? "");
  const [checkIn, setCheckIn] = useState(booking?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(booking?.checkOut ?? "");
  const [roomId, setRoomId] = useState(booking?.roomId ?? "");
  const [passportNumber, setPassportNumber] = useState(booking?.passportNumber ?? "");
  const [guestEmail, setGuestEmail] = useState(booking?.guestEmail ?? "");
  const [guestPhone, setGuestPhone] = useState(booking?.guestPhone ?? "");
  const [propertyId, setPropertyId] = useState(
    booking?.propertyId ?? (defaultPropertyId !== "all" ? defaultPropertyId : properties[0]?.id ?? "")
  );

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const previewTotal = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : null;

  const canSubmit =
    guest.trim() && checkIn && checkOut && nights > 0 && roomId && passportNumber.trim() && propertyId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      propertyId,
      guest: guest.trim(),
      checkIn,
      checkOut,
      roomId,
      passportNumber: passportNumber.trim(),
      guestEmail: guestEmail.trim() || undefined,
      guestPhone: guestPhone.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-bold" style={{ color: C.text }}>{isEdit ? "Edit booking" : "New booking"}</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="flex flex-col gap-4">
          {properties.length > 1 && (
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ border: `1px solid ${C.border}` }}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Guest name</label>
            <input
              value={guest}
              onChange={(e) => setGuest(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="e.g. Sofia R."
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              <option value="">Select a room…</option>
              {rooms.filter((r) => r.active || r.id === roomId).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {fmtCurrency(r.pricePerNight, r.currency)}/night
                </option>
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
              <span className="text-xs" style={{ color: C.muted }}>{nights} night{nights === 1 ? "" : "s"} × {fmtCurrency(selectedRoom.pricePerNight, selectedRoom.currency)}</span>
              <span className="text-sm font-bold" style={{ color: C.text }}>{fmtCurrency(previewTotal, selectedRoom.currency)}</span>
            </div>
          )}
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
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Email (optional)</label>
              <input
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ border: `1px solid ${C.border}` }}
                placeholder="guest@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Phone (optional)</label>
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
            style={{ background: canSubmit && !isPending ? "var(--accent, #111111)" : C.border, color: canSubmit && !isPending ? "#fff" : C.muted }}
          >
            <CalendarIcon size={16} /> {isPending ? "Saving…" : isEdit ? "Save changes" : "Create booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
