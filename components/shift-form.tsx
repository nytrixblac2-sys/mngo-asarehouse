"use client";

import { useState } from "react";
import { X, ClipboardList } from "lucide-react";
import { C } from "@/lib/colors";
import { SCHEDULE_TYPE_LABEL } from "@/lib/labels";
import type { Property, Schedule, ScheduleType, TeamMember } from "@/lib/types";
import type { ScheduleInput } from "@/lib/queries/schedules";

const SCHEDULE_TYPES: ScheduleType[] = ["CLEANING", "REPAIR", "SUPERVISION", "TRAINING"];

/** context/07-mockup.jsx ShiftForm. */
export function ShiftForm({
  date,
  schedule,
  onClose,
  onSubmit,
  properties,
  defaultPropertyId,
  team,
}: {
  date: string;
  schedule?: Schedule;
  onClose: () => void;
  onSubmit: (input: ScheduleInput) => void;
  properties: Property[];
  defaultPropertyId: string;
  team: TeamMember[];
}) {
  const isEdit = !!schedule;
  const [type, setType] = useState<ScheduleType>(schedule?.type ?? "CLEANING");
  const [shiftDate, setShiftDate] = useState(schedule?.date ?? date);
  const [assignedTo, setAssignedTo] = useState(schedule?.assignedTo ?? team[0]?.name ?? "");
  const [note, setNote] = useState(schedule?.note ?? "");
  const [propertyId, setPropertyId] = useState(
    schedule?.propertyId ?? (defaultPropertyId !== "all" ? defaultPropertyId : properties[0]?.id ?? "")
  );

  const handleSubmit = () => {
    if (!propertyId || !assignedTo) return;
    onSubmit({ propertyId, type, date: shiftDate, assignedTo, note: note.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: C.card }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-bold" style={{ color: C.text }}>{isEdit ? "Edit schedule" : "Add schedule"}</p>
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
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Type</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SCHEDULE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="text-xs font-semibold py-2.5 rounded-xl"
                  style={{ background: type === t ? C.tealSoft : C.bg, color: type === t ? C.teal : C.muted }}
                >
                  {SCHEDULE_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Date</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Assigned to</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              {team.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="e.g. Turnover for Sofia R."
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full text-sm font-semibold py-3 rounded-xl mt-1 flex items-center justify-center gap-2"
            style={{ background: C.teal, color: "#fff" }}
          >
            <ClipboardList size={16} /> {isEdit ? "Save changes" : "Add schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
