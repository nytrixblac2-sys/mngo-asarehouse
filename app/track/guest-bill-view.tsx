"use client";

import { useState } from "react";
import { Download, Loader2, LogOut, Minus, Plus, Search, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { nightsBetween } from "@/lib/periods";
import { buildGuestReceipt } from "@/lib/guest-receipt";
import { useGuestBill, useGuestLogout, useGuestMenu, useGuestOrder, type GuestBill } from "@/lib/queries/guest";
import type { MenuStation } from "@/lib/types";

/** "Menu" covers both Kitchen and Bar stations (food + drinks together,
 * same as staff see them on the /menu screen) — Shop and Experiences are
 * their own tabs. Architecture Decision 91. */
type GuestOrderTab = "MENU" | "SHOP" | "EXPERIENCE";
const TAB_STATIONS: Record<GuestOrderTab, MenuStation[]> = {
  MENU: ["KITCHEN", "BAR"],
  SHOP: ["SHOP"],
  EXPERIENCE: ["EXPERIENCE"],
};
const TAB_LABEL: Record<GuestOrderTab, string> = { MENU: "Menu", SHOP: "Shop", EXPERIENCE: "Experiences" };

function GuestOrderPanel({ onClose }: { onClose: () => void }) {
  const menuQuery = useGuestMenu(true);
  const placeOrder = useGuestOrder();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<GuestOrderTab>("MENU");

  const items = menuQuery.data ?? [];
  // The cart spans all three tabs at once — a guest can add a meal, a shop
  // item, and an experience in one order, which the server then splits
  // into independent per-station tickets automatically.
  const tabItems = items.filter((i) => TAB_STATIONS[tab].includes(i.station));
  const visibleItems = search.trim()
    ? tabItems.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
    : tabItems;
  const categories = Array.from(new Set(visibleItems.map((i) => i.category)));
  const setQty = (id: string, qty: number) => setQuantities((q) => ({ ...q, [id]: Math.max(0, qty) }));
  const selected = items.map((i) => ({ item: i, quantity: quantities[i.id] ?? 0 })).filter((s) => s.quantity > 0);
  const total = selected.reduce((sum, s) => sum + s.item.price * s.quantity, 0);
  const canSubmit = selected.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    placeOrder.mutate(
      selected.map((s) => ({ menuItemId: s.item.id, quantity: s.quantity })),
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto flex flex-col" style={{ background: "#fff" }}>
        <p className="text-lg font-bold mb-1" style={{ color: C.text }}>Order</p>
        <p className="text-xs mb-3" style={{ color: C.muted }}>Only today&apos;s available items are shown.</p>
        <div className="flex items-center gap-1 rounded-full p-1 mb-3" style={{ background: "#F2F2F2" }}>
          {(Object.keys(TAB_LABEL) as GuestOrderTab[]).map((t) => (
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
        {items.length === 0 && !menuQuery.isLoading && (
          <p className="text-sm" style={{ color: C.muted }}>Nothing is available to order right now — check back later.</p>
        )}
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
        {tabItems.length === 0 && items.length > 0 && (
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
                        <button onClick={() => setQty(item.id, qty - 1)} disabled={qty === 0} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: qty === 0 ? C.border : C.tealSoft, color: qty === 0 ? C.muted : C.teal }}>
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-4 text-center" style={{ color: C.text }}>{qty}</span>
                        <button onClick={() => setQty(item.id, qty + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.tealSoft, color: C.teal }}>
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
        {selected.length > 0 && (
          <div className="p-3 rounded-xl flex items-center justify-between mt-4" style={{ background: C.bg }}>
            <span className="text-xs" style={{ color: C.muted }}>{selected.reduce((n, s) => n + s.quantity, 0)} item(s)</span>
            <span className="text-sm font-bold" style={{ color: C.text }}>{fmtCurrency(total, selected[0].item.currency)}</span>
          </div>
        )}
        {placeOrder.isError && <p className="text-xs text-destructive mt-2">{(placeOrder.error as Error).message}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 text-sm font-semibold py-3 rounded-xl" style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || placeOrder.isPending}
            className="flex-1 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ background: canSubmit && !placeOrder.isPending ? C.text : C.border, color: canSubmit && !placeOrder.isPending ? "#fff" : C.muted }}
          >
            <ShoppingCart size={16} /> {placeOrder.isPending ? "Placing…" : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillContent({ bill }: { bill: GuestBill }) {
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const logout = useGuestLogout();
  const { booking, room } = bill;
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const checkedOut = !!booking.checkedOutAt;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      const [{ pdf }, { GuestReceiptPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/guest-receipt-pdf-document"),
      ]);
      const data = buildGuestReceipt({ propertyName: bill.propertyName, booking, room, orders: bill.orders });
      const blob = await pdf(<GuestReceiptPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bill.propertyName} - ${booking.guest} - receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold" style={{ color: C.text }}>{booking.guest}</p>
          <p className="text-xs" style={{ color: C.muted }}>{room?.name} · {booking.checkIn} → {booking.checkOut} · {nights} night{nights === 1 ? "" : "s"}</p>
        </div>
        <button onClick={() => logout.mutate()} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.muted }}>
          <LogOut size={12} /> Sign out
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Pill tone={booking.status === "CONFIRMED" ? "teal" : "amber"}>{booking.status === "CONFIRMED" ? "Paid" : "Payment due at property"}</Pill>
        {checkedOut && <Pill tone="muted">Checked out</Pill>}
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.muted }}>Your bill</p>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm" style={{ color: C.text }}>Room ({nights} night{nights === 1 ? "" : "s"})</span>
          <span className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(bill.roomCharge, booking.currency)}</span>
        </div>
        {bill.orders.flatMap((o) => o.items).map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: C.text }}>{item.quantity}× {item.name}</span>
            <span className="text-sm font-semibold" style={{ color: C.text }}>{fmtCurrency(item.unitPrice * item.quantity, item.currency)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${C.border}` }}>
          <span className="text-sm font-bold" style={{ color: C.text }}>Total</span>
          <span className="text-base font-bold" style={{ color: C.text }}>{fmtCurrency(bill.grandTotal, booking.currency)}</span>
        </div>
      </Card>

      {!checkedOut && (
        <button
          onClick={() => setShowOrderPanel(true)}
          className="w-full text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          style={{ background: C.text, color: "#fff" }}
        >
          <UtensilsCrossed size={16} /> Order food, shop &amp; experiences
        </button>
      )}
      {checkedOut && (
        <button
          onClick={handleDownloadReceipt}
          disabled={isDownloading}
          className="w-full text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          style={{ background: C.text, color: "#fff" }}
        >
          {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {isDownloading ? "Preparing…" : "Download receipt"}
        </button>
      )}

      {showOrderPanel && <GuestOrderPanel onClose={() => setShowOrderPanel(false)} />}
    </div>
  );
}

export function GuestBillView() {
  const billQuery = useGuestBill();

  if (billQuery.isLoading) {
    return <p className="text-sm text-center" style={{ color: C.muted }}>Loading…</p>;
  }
  if (!billQuery.data) {
    return null;
  }

  return <BillContent bill={billQuery.data} />;
}
