"use client";

import { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { C } from "@/lib/colors";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/labels";
import type { Currency, Expense, ExpenseCategory, Property, TeamMember } from "@/lib/types";
import type { ExpenseInput } from "@/lib/queries/expenses";

const CATEGORIES: ExpenseCategory[] = ["OWNERS", "OPERATIONS", "MANAGEMENT"];

/** context/07-mockup.jsx ExpenseForm. `managementLabel` lets the caller
 * substitute the real workspace name for the MANAGEMENT category button,
 * since "Oak & Co." is workspace branding, not a generic label
 * (Architecture Decision 7) — falls back to "Management" if omitted. */
export function ExpenseForm({
  onClose,
  onSubmit,
  expense,
  defaultCategory,
  defaultDate,
  defaultCurrency,
  properties,
  defaultPropertyId,
  team,
  managementLabel,
  hideCategory,
}: {
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => void;
  expense?: Expense;
  defaultCategory?: ExpenseCategory;
  defaultDate: string;
  defaultCurrency?: Currency;
  properties: Property[];
  defaultPropertyId: string;
  team: TeamMember[];
  managementLabel?: string;
  /** HOSTEL workspaces have no owner/operations/management split (no
   * "Internal" tab to view MANAGEMENT-category expenses at all, and
   * OWNERS vs OPERATIONS never renders differently) — the category picker
   * is just noise there, so every expense defaults to OWNERS silently. */
  hideCategory?: boolean;
}) {
  const isEdit = !!expense;
  const [date, setDate] = useState(expense?.date ?? defaultDate);
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(expense?.currency ?? defaultCurrency ?? "GHS");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? defaultCategory ?? (hideCategory ? "OWNERS" : "OPERATIONS"));
  const [person, setPerson] = useState(expense?.person ?? team[0]?.name ?? "");
  const [propertyId, setPropertyId] = useState(
    expense?.propertyId ?? (defaultPropertyId !== "all" ? defaultPropertyId : properties[0]?.id ?? "")
  );

  const parsedAmount = parseFloat(amount);
  const canSubmit = description.trim() && parsedAmount > 0 && propertyId && (category !== "MANAGEMENT" || person);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      propertyId,
      date,
      description: description.trim(),
      amount: parsedAmount,
      currency,
      category,
      person: category === "MANAGEMENT" ? person : undefined,
    });
  };

  const categoryLabel = (c: ExpenseCategory) => (c === "MANAGEMENT" ? managementLabel ?? EXPENSE_CATEGORY_LABEL.MANAGEMENT : EXPENSE_CATEGORY_LABEL[c]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: C.card }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-bold" style={{ color: C.text }}>{isEdit ? "Edit expense" : "Add expense"}</p>
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
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Currency</label>
            <div className="flex gap-2 mt-1">
              {(["GHS", "EUR"] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl"
                  style={{ background: currency === cur ? C.text : C.bg, color: currency === cur ? "#fff" : C.muted }}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
          {!hideCategory && (
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Category</label>
              <div className="flex gap-2 mt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="flex-1 text-xs font-semibold py-2.5 rounded-xl"
                    style={{
                      background: category === cat ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.bg,
                      color: category === cat ? "var(--accent, #111111)" : C.muted,
                    }}
                  >
                    {categoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {category === "MANAGEMENT" && (
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Team member</label>
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
                style={{ border: `1px solid ${C.border}` }}
              >
                {team.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
              {person && (
                <p className="text-xs mt-1" style={{ color: C.muted }}>
                  This payment will show up on {person}&apos;s page in Team.
                </p>
              )}
            </div>
          )}
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
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="e.g. ECG, Cleaning — turnover"
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Amount ({currency})</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
              placeholder="0.00"
            />
          </div>
          {currency === "GHS" && (
            <p className="text-xs" style={{ color: C.muted }}>MoMo charge (1%) is added automatically for GHS expenses.</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full text-sm font-semibold py-3 rounded-xl mt-1 flex items-center justify-center gap-2"
            style={{ background: canSubmit ? "var(--accent, #111111)" : C.border, color: canSubmit ? "#fff" : C.muted }}
          >
            <DollarSign size={16} /> {isEdit ? "Save changes" : "Log expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
