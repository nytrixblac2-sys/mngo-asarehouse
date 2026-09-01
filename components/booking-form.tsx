"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { C } from "@/lib/colors";
import type { Booking, BookingSource, Currency, Property } from "@/lib/types";
import type { BookingInput } from "@/lib/queries/bookings";

/** context/07-mockup.jsx BookingForm. */
export function BookingForm({
  onClose,
  onSubmit,
  booking,
  properties,
  defaultPropertyId,
  isPending,
  error,
}: {
  onClose: () => void;
  onSubmit: (input: BookingInput) => void;
  booking?: Booking;
  properties: Property[];
  defaultPropertyId: string;
  isPending?: boolean;
  error?: string | null;
}) {
  const isEdit = !!booking;
  const [guest, setGuest] = useState(booking?.guest ?? "");
  const [checkIn, setCheckIn] = useState(booking?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(booking?.checkOut ?? "");
  const [source, setSource] = useState<BookingSource>(booking?.source ?? "AIRBNB");
  const [amount, setAmount] = useState(booking?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(booking?.currency ?? "EUR");
  const [propertyId, setPropertyId] = useState(
    booking?.propertyId ?? (defaultPropertyId !== "all" ? defaultPropertyId : properties[0]?.id ?? "")
  );

  const parsedAmount = parseFloat(amount);
  const canSubmit = guest.trim() && checkIn && checkOut && amount && parsedAmount > 0 && propertyId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ propertyId, guest: guest.trim(), checkIn, checkOut, amount: parsedAmount, currency, source });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: C.card }}>
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
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Source</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { setSource("AIRBNB"); setCurrency("EUR"); }}
                className="flex-1 text-sm font-medium py-2.5 rounded-xl"
                style={{
                  background: source === "AIRBNB" ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.bg,
                  color: source === "AIRBNB" ? "var(--accent, #111111)" : C.muted,
                }}
              >
                Airbnb
              </button>
              <button
                onClick={() => { setSource("LOCAL"); setCurrency("GHS"); }}
                className="flex-1 text-sm font-medium py-2.5 rounded-xl"
                style={{
                  background: source === "LOCAL" ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.bg,
                  color: source === "LOCAL" ? "var(--accent, #111111)" : C.muted,
                }}
              >
                Local / Cash
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Amount</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ border: `1px solid ${C.border}` }}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ border: `1px solid ${C.border}` }}
              >
                <option value="EUR">EUR</option>
                <option value="GHS">GHS</option>
              </select>
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
