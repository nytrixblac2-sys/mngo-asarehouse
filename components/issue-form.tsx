"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { C } from "@/lib/colors";
import { ISSUE_TYPE_LABEL } from "@/lib/labels";
import type { Booking, IssueType, Property } from "@/lib/types";
import type { IssueInput } from "@/lib/queries/issues";

const ISSUE_TYPES: IssueType[] = ["GUEST_COMPLAINT", "MAINTENANCE", "NOTE"];

/** context/07-mockup.jsx IssueForm. */
export function IssueForm({
  date,
  defaultGuest,
  bookings,
  onClose,
  onSubmit,
  properties,
  defaultPropertyId,
}: {
  date: string;
  defaultGuest?: string | null;
  bookings: Booking[];
  onClose: () => void;
  onSubmit: (input: IssueInput) => void;
  properties: Property[];
  defaultPropertyId: string;
}) {
  const [type, setType] = useState<IssueType>(defaultGuest ? "GUEST_COMPLAINT" : "MAINTENANCE");
  const [issueDate, setIssueDate] = useState(date);
  const [description, setDescription] = useState("");
  const [guest, setGuest] = useState(defaultGuest ?? "");
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId !== "all" ? defaultPropertyId : properties[0]?.id ?? ""
  );
  const canSubmit = description.trim() && propertyId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ propertyId, date: issueDate, type, description: description.trim(), guest: guest || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: C.card }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-bold" style={{ color: C.text }}>Log an issue</p>
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
            <div className="flex gap-2 mt-1">
              {ISSUE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="flex-1 text-xs font-semibold py-2.5 rounded-xl"
                  style={{
                    background: type === t ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.bg,
                    color: type === t ? "var(--accent, #111111)" : C.muted,
                  }}
                >
                  {ISSUE_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Related guest (optional)</label>
            <select
              value={guest}
              onChange={(e) => setGuest(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              <option value="">None</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.guest}>{b.guest}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="What happened?"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full text-sm font-semibold py-3 rounded-xl mt-1 flex items-center justify-center gap-2"
            style={{ background: canSubmit ? "var(--accent, #111111)" : C.border, color: canSubmit ? "#fff" : C.muted }}
          >
            <AlertTriangle size={16} /> Log issue
          </button>
        </div>
      </div>
    </div>
  );
}
