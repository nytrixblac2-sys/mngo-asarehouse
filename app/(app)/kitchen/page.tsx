"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useCreateMenuItem, useDeleteMenuItem, useMenuItems, useToggleMenuItemAvailability } from "@/lib/queries/menu";
import { useWorkspace } from "@/lib/queries/workspace";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import type { Currency } from "@/lib/types";

/**
 * HOSTEL-only daily menu curation — Janet toggles which of the master
 * menu's items are orderable today. Per user decision, this screen is
 * curation only, no order-fulfillment queue (guest/staff orders are
 * placed from the booking detail view instead).
 */
export default function KitchenPage() {
  const { effectiveCanEdit } = useEffectiveUser();
  const workspace = useWorkspace().data;
  const menuQuery = useMenuItems();
  const createItem = useCreateMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();
  const deleteItem = useDeleteMenuItem();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("GHS");

  if (workspace && workspace.type !== "HOSTEL") {
    return <p className="text-sm" style={{ color: C.muted }}>The Kitchen screen is only available for hostel-style workspaces.</p>;
  }
  if (menuQuery.isLoading) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }
  if (menuQuery.isError) {
    return <p className="text-sm text-destructive">Something went wrong loading the menu.</p>;
  }

  const items = menuQuery.data ?? [];
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const parsedPrice = parseFloat(price);
  const canAdd = name.trim().length > 0 && category.trim().length > 0 && parsedPrice > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const submittedName = name.trim();
    const submittedCategory = category.trim();
    const submittedPrice = parsedPrice;
    createItem.mutate(
      { name: submittedName, category: submittedCategory, price: submittedPrice, currency },
      {
        onSuccess: () => {
          setName((cur) => (cur.trim() === submittedName ? "" : cur));
          setPrice((cur) => (parseFloat(cur) === submittedPrice ? "" : cur));
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Kitchen</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Toggle which menu items guests can order today.</p>
      </div>

      {items.length === 0 && (
        <p className="text-sm" style={{ color: C.muted }}>No menu items yet — add your first one below.</p>
      )}

      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>{cat}</p>
          <div className="flex flex-col gap-2">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: C.bg }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{item.name}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{fmtCurrency(item.price, item.currency)}</p>
                  </div>
                  {effectiveCanEdit && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAvailability.mutate({ id: item.id, isAvailableToday: !item.isAvailableToday })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{
                          background: item.isAvailableToday ? C.tealSoft : C.border,
                          color: item.isAvailableToday ? C.teal : C.muted,
                        }}
                      >
                        {item.isAvailableToday ? "Available today" : "Not available"}
                      </button>
                      <button onClick={() => deleteItem.mutate(item.id)} title="Remove">
                        <Trash2 size={14} style={{ color: C.muted }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}

      {effectiveCanEdit && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Add menu item</p>
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
              placeholder="e.g. Food"
              list="kitchen-categories"
              className="w-32 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            />
            <datalist id="kitchen-categories">
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
              disabled={!canAdd || createItem.isPending}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: canAdd ? C.text : C.border, color: canAdd ? "#fff" : C.muted }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
