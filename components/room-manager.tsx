"use client";

import { useState } from "react";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { useCreateRoom, useDeleteRoom, useRooms, useUpdateRoom } from "@/lib/queries/rooms";
import type { Currency } from "@/lib/types";

/**
 * HOSTEL-workspace room CRUD, embedded in PropertyProfileModal in place of
 * the plain string Rooms list RENTAL workspaces use — these are real,
 * priced, bookable entities (prisma/schema.prisma Room), not decorative
 * free text.
 */
export function RoomManagerPanel({ propertyId }: { propertyId: string }) {
  const roomsQuery = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("GHS");

  const rooms = (roomsQuery.data ?? []).filter((r) => r.propertyId === propertyId);
  const parsedPrice = parseFloat(price);
  const canAdd = name.trim().length > 0 && parsedPrice > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const submittedName = name.trim();
    const submittedPrice = parsedPrice;
    createRoom.mutate(
      { propertyId, name: submittedName, pricePerNight: submittedPrice, currency },
      {
        // Only clear the fields if they still hold what was just
        // submitted — if the request is slow and the user has already
        // started typing the next room while this one was saving,
        // clearing unconditionally would silently wipe their new input
        // out from under them the moment this response arrives.
        onSuccess: () => {
          setName((current) => (current.trim() === submittedName ? "" : current));
          setPrice((current) => (parseFloat(current) === submittedPrice ? "" : current));
        },
      }
    );
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Rooms</p>
      <div className="flex flex-col gap-2 mb-3">
        {rooms.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No rooms added yet.</p>}
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.text }}>{room.name}</p>
              <p className="text-xs" style={{ color: C.muted }}>
                {fmtCurrency(room.pricePerNight, room.currency)}/night{!room.active && " · inactive"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  updateRoom.mutate({
                    id: room.id,
                    input: { propertyId: room.propertyId, name: room.name, pricePerNight: room.pricePerNight, currency: room.currency, active: !room.active },
                  })
                }
                className="text-xs font-semibold"
                style={{ color: C.muted }}
              >
                {room.active ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => deleteRoom.mutate(room.id)} className="text-xs font-semibold" style={{ color: "var(--accent, #111111)" }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. Dorm"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Price/night"
          className="w-28 px-3 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="px-2 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
        >
          <option value="GHS">GHS</option>
          <option value="EUR">EUR</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={!canAdd || createRoom.isPending}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: canAdd ? C.text : C.border, color: canAdd ? "#fff" : C.muted }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
