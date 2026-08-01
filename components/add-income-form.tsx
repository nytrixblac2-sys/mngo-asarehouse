"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/colors";
import type { Currency, Property } from "@/lib/types";
import type { ManualIncomeInput } from "@/lib/queries/manual-income";

/**
 * context/07-mockup.jsx AddIncomeForm, plus a currency toggle. The mockup
 * hardcodes `currency: 'GHS'` with no selector at all, which can't be
 * right given GHS/EUR are independent accounts throughout the rest of the
 * app (context/02-architecture-context.md invariant #2) — treated as an
 * incomplete mockup form, not intentional GHS-only scope for this feature.
 */
export function AddIncomeForm({
  onClose,
  onSubmit,
  defaultDate,
  properties,
  defaultPropertyId,
  defaultCurrency,
}: {
  onClose: () => void;
  onSubmit: (input: ManualIncomeInput) => void;
  defaultDate: string;
  properties: Property[];
  defaultPropertyId: string;
  defaultCurrency: Currency;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [propertyId, setPropertyId] = useState(defaultPropertyId !== "all" ? defaultPropertyId : properties[0]?.id ?? "");

  const parsedAmount = parseFloat(amount);
  const canSubmit = description.trim() && parsedAmount > 0 && propertyId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ propertyId, description: description.trim(), amount: parsedAmount, date, currency });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-bold" style={{ color: C.text }}>Add income</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>
          For money received from owners for repairs, top-ups, or other contributions.
        </p>
        <div className="flex flex-col gap-3">
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
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="e.g. Owner contribution for plumbing repair"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Amount</label>
              <input
                type="number"
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
                <option value="GHS">GHS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full text-sm font-semibold py-3 rounded-xl mt-1"
            style={{ background: canSubmit ? C.teal : C.border, color: canSubmit ? "#fff" : C.muted }}
          >
            Add income
          </button>
        </div>
      </div>
    </div>
  );
}
