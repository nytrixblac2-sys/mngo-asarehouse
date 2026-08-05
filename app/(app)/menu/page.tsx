"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useCreateMenuItem, useDeleteMenuItem, useMenuItems, useToggleMenuItemAvailability } from "@/lib/queries/menu";
import { useWorkspace } from "@/lib/queries/workspace";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import type { Currency, MenuItem } from "@/lib/types";

function AddItemForm({
  categories,
  alwaysAvailable,
  onAdd,
  isPending,
}: {
  categories: string[];
  alwaysAvailable: boolean;
  onAdd: (input: { name: string; category: string; price: number; currency: Currency }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("GHS");
  const datalistId = `menu-categories-${alwaysAvailable ? "constant" : "daily"}`;

  const parsedPrice = parseFloat(price);
  const canAdd = name.trim().length > 0 && category.trim().length > 0 && parsedPrice > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const submittedName = name.trim();
    const submittedPrice = parsedPrice;
    onAdd({ name: submittedName, category: category.trim(), price: submittedPrice, currency });
    setName((cur) => (cur.trim() === submittedName ? "" : cur));
    setPrice((cur) => (parseFloat(cur) === submittedPrice ? "" : cur));
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="e.g. Coconut Fish"
        className="flex-1 min-w-[160px] px-3 py-2.5 rounded-xl text-sm"
        style={{ border: `1px solid ${C.border}` }}
      />
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="e.g. Breakfast"
        list={datalistId}
        className="w-32 px-3 py-2.5 rounded-xl text-sm"
        style={{ border: `1px solid ${C.border}` }}
      />
      <datalist id={datalistId}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="Price"
        className="w-24 px-3 py-2.5 rounded-xl text-sm"
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
        disabled={!canAdd || isPending}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: canAdd ? C.text : C.border, color: canAdd ? "#fff" : C.muted }}
      >
        Add
      </button>
    </div>
  );
}

function ItemRow({
  item,
  showToggle,
  canEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItem;
  showToggle: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: C.bg }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: C.text }}>{item.name}</p>
        <p className="text-xs" style={{ color: C.muted }}>{fmtCurrency(item.price, item.currency)}</p>
      </div>
      {canEdit && (
        <div className="flex items-center gap-3">
          {showToggle && (
            <button
              onClick={onToggle}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: item.isAvailableToday ? C.tealSoft : C.border,
                color: item.isAvailableToday ? C.teal : C.muted,
              }}
            >
              {item.isAvailableToday ? "Available today" : "Not available"}
            </button>
          )}
          <button onClick={onDelete} title="Remove">
            <Trash2 size={14} style={{ color: C.muted }} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * HOSTEL-only menu curation (route /menu — order fulfillment now lives
 * separately at /kitchen and /bar). Most of a menu doesn't change day to
 * day (breakfast, drinks, the all-day menu) — those live under "Always on
 * the menu" with no daily toggle, so Janet only has to touch them when
 * the menu itself changes. "Today's Lunch & Dinner" is the actual daily
 * task: the rotating items she toggles on/off each day.
 */
export default function MenuPage() {
  const { effectiveCanEdit } = useEffectiveUser();
  const workspace = useWorkspace().data;
  const menuQuery = useMenuItems();
  const createItem = useCreateMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();
  const deleteItem = useDeleteMenuItem();

  if (workspace && workspace.type !== "HOSTEL") {
    return <p className="text-sm" style={{ color: C.muted }}>The Menu screen is only available for hostel-style workspaces.</p>;
  }
  if (menuQuery.isLoading) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }
  if (menuQuery.isError) {
    return <p className="text-sm text-destructive">Something went wrong loading the menu.</p>;
  }

  const items = menuQuery.data ?? [];
  const dailyItems = items.filter((i) => !i.alwaysAvailable);
  const constantItems = items.filter((i) => i.alwaysAvailable);
  const dailyCategories = Array.from(new Set(dailyItems.map((i) => i.category)));
  const constantCategories = Array.from(new Set(constantItems.map((i) => i.category)));

  const renderCategory = (cat: string, catItems: MenuItem[], showToggle: boolean) => (
    <div key={cat}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>{cat}</p>
      <div className="flex flex-col gap-2">
        {catItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            showToggle={showToggle}
            canEdit={effectiveCanEdit}
            onToggle={() => toggleAvailability.mutate({ id: item.id, isAvailableToday: !item.isAvailableToday })}
            onDelete={() => deleteItem.mutate(item.id)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Menu</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Toggle what&apos;s on today&apos;s rotating menu, and manage the rest of the menu when it changes.</p>
      </div>

      <div className="flex flex-col gap-5">
        <p className="text-sm font-semibold" style={{ color: C.text }}>Today&apos;s Lunch &amp; Dinner</p>
        {dailyItems.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>No rotating menu items yet — add one below.</p>
        )}
        {dailyCategories.map((cat) => renderCategory(cat, dailyItems.filter((i) => i.category === cat), true))}
        {effectiveCanEdit && (
          <AddItemForm
            categories={dailyCategories}
            alwaysAvailable={false}
            isPending={createItem.isPending}
            onAdd={(input) => createItem.mutate({ ...input, alwaysAvailable: false })}
          />
        )}
      </div>

      <div className="flex flex-col gap-5 pt-6" style={{ borderTop: `1px solid ${C.border}` }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: C.text }}>Always on the menu</p>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Breakfast, drinks, the all-day menu — orderable every day, no daily toggle needed.</p>
        </div>
        {constantItems.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>No standing menu items yet — add one below.</p>
        )}
        {constantCategories.map((cat) => renderCategory(cat, constantItems.filter((i) => i.category === cat), false))}
        {effectiveCanEdit && (
          <AddItemForm
            categories={constantCategories}
            alwaysAvailable
            isPending={createItem.isPending}
            onAdd={(input) => createItem.mutate({ ...input, alwaysAvailable: true })}
          />
        )}
      </div>
    </div>
  );
}
