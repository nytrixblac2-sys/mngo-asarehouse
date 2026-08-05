"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { C, THEME_COLORS } from "@/lib/colors";
import type { Allocation, Currency, Property, WorkspaceType } from "@/lib/types";
import type { UpdatePropertyInput } from "@/lib/queries/properties";
import { RoomManagerPanel } from "./room-manager";

const DEFAULT_ALLOCATION: Allocation = { owners: 60, operations: 15, management: 25 };
const ALLOCATION_FIELDS: Array<[keyof Allocation, string]> = [
  ["owners", "Owners Fund"],
  ["operations", "Operations Fund"],
  ["management", "Management Fund"],
];

/**
 * context/07-mockup.jsx PropertyProfileModal. The mockup calls `onUpdate`
 * on every keystroke/click (fine for in-memory-only state) — converted
 * here to local pending state with one explicit "Save changes" action,
 * since context/02-architecture-context.md invariant #3 ("allocation
 * percentages must sum to exactly 100% per currency before a property
 * can be saved") only makes sense against a real save boundary, not a
 * request fired on every digit typed into a percentage field.
 */
export function PropertyProfileModal({
  property,
  onClose,
  onSave,
  onDelete,
  canDelete,
  isDeleting,
  deleteError,
  workspaceType,
}: {
  property: Property;
  onClose: () => void;
  onSave: (input: UpdatePropertyInput) => void;
  onDelete: () => void;
  canDelete: boolean;
  isDeleting: boolean;
  deleteError: Error | null;
  /** HOSTEL workspaces get real priced Rooms (RoomManagerPanel) instead of
   * the plain string room-name list below. */
  workspaceType?: WorkspaceType;
}) {
  const [color, setColor] = useState(property.color);
  const [currencies, setCurrencies] = useState<Currency[]>(property.currencies);
  const [allocation, setAllocation] = useState(property.allocation);
  const [rooms, setRooms] = useState(property.rooms);
  const [facilities, setFacilities] = useState(property.facilities);
  const [roomInput, setRoomInput] = useState("");
  const [facilityInput, setFacilityInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleCurrency = (cur: Currency) => {
    const next = currencies.includes(cur) ? currencies.filter((c) => c !== cur) : [...currencies, cur];
    if (next.length === 0) return;
    setCurrencies(next);
    if (!allocation[cur]) {
      setAllocation({ ...allocation, [cur]: DEFAULT_ALLOCATION });
    }
  };

  const updateAlloc = (cur: Currency, field: keyof Allocation, value: string) => {
    const parsed = Math.max(0, Math.min(100, Number(value) || 0));
    const current = { ...(allocation[cur] ?? DEFAULT_ALLOCATION), [field]: parsed };
    setAllocation({ ...allocation, [cur]: current });
  };

  const allocTotal = (cur: Currency) => {
    const a = allocation[cur] ?? DEFAULT_ALLOCATION;
    return a.owners + a.operations + a.management;
  };

  const addRoom = () => {
    if (!roomInput.trim()) return;
    setRooms([...rooms, roomInput.trim()]);
    setRoomInput("");
  };
  const removeRoom = (room: string) => setRooms(rooms.filter((r) => r !== room));
  const addFacility = () => {
    if (!facilityInput.trim()) return;
    setFacilities([...facilities, facilityInput.trim()]);
    setFacilityInput("");
  };
  const removeFacility = (f: string) => setFacilities(facilities.filter((x) => x !== f));

  const allocationValid = currencies.every((cur) => allocTotal(cur) === 100);
  const hasChanges =
    color !== property.color ||
    JSON.stringify(currencies) !== JSON.stringify(property.currencies) ||
    JSON.stringify(allocation) !== JSON.stringify(property.allocation) ||
    JSON.stringify(rooms) !== JSON.stringify(property.rooms) ||
    JSON.stringify(facilities) !== JSON.stringify(property.facilities);
  const canSave = hasChanges && allocationValid;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ color, currencies, allocation, rooms, facilities });
  };

  if (isDeleting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
        <div className="w-full max-w-sm rounded-2xl p-10 flex flex-col items-center gap-3" style={{ background: "#fff" }}>
          <Loader2 size={24} className="animate-spin" style={{ color: C.muted }} />
          <p className="text-sm font-semibold" style={{ color: C.text }}>Deleting {property.name}…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: "#fff", maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <p className="text-lg font-bold" style={{ color: C.text }}>{property.name}</p>
          </div>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Color theme</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {THEME_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: c, border: color === c ? `2px solid ${C.text}` : "2px solid transparent" }}
                >
                  {color === c && <Check size={14} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>Currencies</p>
            <p className="text-xs mb-3" style={{ color: C.muted }}>
              Select the currencies this property operates in. Financials will show a GHS/EUR switcher for enabled currencies.
            </p>
            <div className="flex gap-2">
              {(["GHS", "EUR"] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => toggleCurrency(cur)}
                  className="text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{
                    background: currencies.includes(cur) ? C.text : C.bg,
                    color: currencies.includes(cur) ? "#fff" : C.muted,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {currencies.map((cur) => {
            const total = allocTotal(cur);
            const isValid = total === 100;
            const a = allocation[cur] ?? DEFAULT_ALLOCATION;
            return (
              <div key={cur}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Income allocation — {cur}</p>
                  <span className="text-xs font-semibold" style={{ color: isValid ? C.teal : "var(--accent, #111111)" }}>
                    {total}% {isValid ? "✓" : "— must equal 100%"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {ALLOCATION_FIELDS.map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                      <span className="text-sm" style={{ color: C.text }}>{label}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={a[key]}
                          onChange={(e) => updateAlloc(cur, key, e.target.value)}
                          className="w-16 text-right px-2 py-1 rounded-lg text-sm font-semibold"
                          style={{ border: `1px solid ${C.border}`, color: C.text }}
                        />
                        <span className="text-sm" style={{ color: C.muted }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {workspaceType === "HOSTEL" ? (
            <RoomManagerPanel propertyId={property.id} />
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Rooms</p>
              <div className="flex flex-col gap-2 mb-3">
                {rooms.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No rooms added yet.</p>}
                {rooms.map((room) => (
                  <div key={room} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <span className="text-sm" style={{ color: C.text }}>{room}</span>
                    <button onClick={() => removeRoom(room)} className="text-xs font-semibold" style={{ color: "var(--accent, #111111)" }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRoom()}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                  style={{ border: `1px solid ${C.border}` }}
                  placeholder="e.g. Master Bedroom"
                />
                <button onClick={addRoom} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.text, color: "#fff" }}>
                  Add
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Facilities</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {facilities.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No facilities added yet.</p>}
              {facilities.map((f) => (
                <button
                  key={f}
                  onClick={() => removeFacility(f)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ background: C.tealSoft, color: C.teal }}
                >
                  {f} <X size={11} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={facilityInput}
                onChange={(e) => setFacilityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFacility()}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ border: `1px solid ${C.border}` }}
                placeholder="e.g. Pool"
              />
              <button onClick={addFacility} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.text, color: "#fff" }}>
                Add
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full text-sm font-semibold py-3 rounded-xl"
            style={{ background: canSave ? "var(--accent, #111111)" : C.border, color: canSave ? "#fff" : C.muted }}
          >
            Save changes
          </button>

          {canDelete && (
            <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              {confirmDelete ? (
                <div className="flex flex-col gap-2 mt-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: C.muted }}>Delete {property.name}? This can&apos;t be undone.</span>
                    <button onClick={onDelete} className="text-xs font-semibold" style={{ color: "var(--accent, #111111)" }}>Confirm</button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold" style={{ color: C.muted }}>Cancel</button>
                  </div>
                  {deleteError && <p className="text-xs text-destructive">{deleteError.message}</p>}
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="text-xs font-semibold mt-3" style={{ color: C.muted }}>
                  Delete property
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
