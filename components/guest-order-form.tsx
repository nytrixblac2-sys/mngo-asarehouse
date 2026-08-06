"use client";

import { useState } from "react";
import { X, ShoppingCart, Minus, Plus, Search } from "lucide-react";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { isMenuItemOrderable } from "@/lib/menu";
import { useMenuItems } from "@/lib/queries/menu";
import { useCreateOrder } from "@/lib/queries/orders";
import type { Currency, MenuStation } from "@/lib/types";

/** "Menu" covers both Kitchen and Bar stations (food + drinks together) —
 * Shop and Experiences are their own tabs, same split as the guest's own
 * ordering panel (app/track/guest-bill-view.tsx). Architecture Decision 91. */
type OrderTab = "MENU" | "SHOP" | "EXPERIENCE";
const TAB_STATIONS: Record<OrderTab, MenuStation[]> = {
  MENU: ["KITCHEN", "BAR"],
  SHOP: ["SHOP"],
  EXPERIENCE: ["EXPERIENCE"],
};
const TAB_LABEL: Record<OrderTab, string> = { MENU: "Menu", SHOP: "Shop", EXPERIENCE: "Experiences" };

/**
 * Staff-side "order for guest" — Janet picks from orderable menu items on
 * a guest's behalf (e.g. a walk-in guest who isn't using the public
 * self-ordering page): always-available items (breakfast, drinks, the
 * all-day menu) plus whatever's toggled available today. Same rule the
 * server enforces (lib/orders.ts createGuestOrder) so nothing shown here
 * can be rejected.
 */
export function GuestOrderForm({
  bookingId,
  guestName,
  onClose,
}: {
  bookingId: string;
  guestName: string;
  onClose: () => void;
}) {
  const menuQuery = useMenuItems();
  const createOrder = useCreateOrder();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<OrderTab>("MENU");

  const items = (menuQuery.data ?? []).filter(isMenuItemOrderable);
  // The cart spans all three tabs — Janet can add a meal, a shop item, and
  // an experience to the same order for a guest in one go.
  const tabItems = items.filter((i) => TAB_STATIONS[tab].includes(i.station));
  const visibleItems = search.trim()
    ? tabItems.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
    : tabItems;
  const categories = Array.from(new Set(visibleItems.map((i) => i.category)));

  const setQty = (id: string, qty: number) => {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, qty) }));
  };

  const selected = items
    .map((i) => ({ item: i, quantity: quantities[i.id] ?? 0 }))
    .filter((s) => s.quantity > 0);
  const currency: Currency | null = selected[0]?.item.currency ?? null;
  const total = selected.reduce((sum, s) => sum + s.item.price * s.quantity, 0);
  const canSubmit = selected.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createOrder.mutate(
      { bookingId, items: selected.map((s) => ({ menuItemId: s.item.id, quantity: s.quantity })) },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto flex flex-col" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-lg font-bold" style={{ color: C.text }}>Order for {guestName}</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <p className="text-xs mb-3" style={{ color: C.muted }}>Only today&apos;s available items are shown.</p>

        <div className="flex items-center gap-1 rounded-full p-1 mb-3" style={{ background: C.bg }}>
          {(Object.keys(TAB_LABEL) as OrderTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-full"
              style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? C.text : C.muted }}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>

        {items.length > 0 && (
          <div className="relative mb-4">
            <Search size={14} style={{ color: C.muted, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${TAB_LABEL[tab].toLowerCase()}…`}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
        )}

        {items.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>No menu items are marked available today — turn some on from the Menu screen first.</p>
        )}
        {items.length > 0 && tabItems.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>Nothing available under {TAB_LABEL[tab]} right now.</p>
        )}
        {tabItems.length > 0 && visibleItems.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>No items match &quot;{search}&quot;.</p>
        )}

        <div className="flex flex-col gap-5 flex-1">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>{cat}</p>
              <div className="flex flex-col gap-2">
                {visibleItems.filter((i) => i.category === cat).map((item) => {
                  const qty = quantities[item.id] ?? 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.text }}>{item.name}</p>
                        <p className="text-xs" style={{ color: C.muted }}>{fmtCurrency(item.price, item.currency)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty(item.id, qty - 1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: qty === 0 ? C.border : "var(--accent-soft, rgba(0,0,0,0.07))", color: qty === 0 ? C.muted : "var(--accent, #111111)" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-4 text-center" style={{ color: C.text }}>{qty}</span>
                        <button
                          onClick={() => setQty(item.id, qty + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selected.length > 0 && currency && (
          <div className="p-3 rounded-xl flex items-center justify-between mt-4" style={{ background: C.bg }}>
            <span className="text-xs" style={{ color: C.muted }}>{selected.reduce((n, s) => n + s.quantity, 0)} item(s)</span>
            <span className="text-sm font-bold" style={{ color: C.text }}>{fmtCurrency(total, currency)}</span>
          </div>
        )}
        {createOrder.isError && <p className="text-xs text-destructive mt-2">{(createOrder.error as Error).message}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createOrder.isPending}
          className="w-full text-sm font-semibold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
          style={{ background: canSubmit && !createOrder.isPending ? "var(--accent, #111111)" : C.border, color: canSubmit && !createOrder.isPending ? "#fff" : C.muted }}
        >
          <ShoppingCart size={16} /> {createOrder.isPending ? "Placing order…" : "Place order"}
        </button>
      </div>
    </div>
  );
}
