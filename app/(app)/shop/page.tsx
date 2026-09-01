"use client";

import { useState } from "react";
import { QrCode, Package, ShoppingBag, Check, ExternalLink, Plus } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useWorkspace } from "@/lib/queries/workspace";
import { useMenuItems, useCreateMenuItem, useDeleteMenuItem } from "@/lib/queries/menu";
import { useShopOrders, useUpdateShopOrderStatus, useToggleShop } from "@/lib/queries/shop";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import type { IssueStatus } from "@/lib/types";

const STATUS_LABEL: Record<IssueStatus, string> = {
  OPEN: "Received",
  IN_PROGRESS: "Preparing",
  RESOLVED: "Delivered",
};
const STATUS_TONE: Record<IssueStatus, "muted" | "amber" | "teal"> = {
  OPEN: "muted",
  IN_PROGRESS: "amber",
  RESOLVED: "teal",
};

const PLACEHOLDER_IMAGES: Record<string, string> = {
  socks: "🧦",
  singlet: "👕",
  shirt: "👔",
  shirts: "👔",
  shaving: "🪒",
  toothbrush: "🪥",
  slipper: "🩴",
  slippers: "🩴",
  "coca-cola": "🥤",
  coke: "🥤",
  cola: "🥤",
  fanta: "🧃",
  water: "💧",
  beer: "🍺",
  chocolate: "🍫",
  bead: "📿",
  beads: "📿",
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(PLACEHOLDER_IMAGES)) {
    if (lower.includes(key)) return emoji;
  }
  return "🛍️";
}

export default function ShopPage() {
  const { effectiveUser, effectiveCanEdit } = useEffectiveUser();
  const workspace = useWorkspace().data;
  const menuQuery = useMenuItems();
  const shopOrdersQuery = useShopOrders();
  const createMenuItem = useCreateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const updateStatus = useUpdateShopOrderStatus();
  const toggleShop = useToggleShop();

  const isOwner = effectiveUser.role === "ACCOUNT_OWNER";

  const [tab, setTab] = useState<"products" | "orders">("products");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Shop", imageUrl: "" });
  const [addError, setAddError] = useState<string | null>(null);

  const shopItems = (menuQuery.data ?? []).filter((m) => m.station === "SHOP");
  const shopOrders = shopOrdersQuery.data ?? [];

  const shopUrl = workspace ? `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${workspace.slug}` : "";

  if (workspace && workspace.type !== "RENTAL") {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Shop</h1>
        <Card><p className="text-sm" style={{ color: C.muted }}>The Shop is only available for RENTAL workspaces.</p></Card>
      </div>
    );
  }

  const handleAddItem = async () => {
    setAddError(null);
    if (!newItem.name.trim()) { setAddError("Name is required"); return; }
    const price = parseFloat(newItem.price);
    if (!price || price <= 0) { setAddError("Enter a valid price"); return; }
    createMenuItem.mutate({
      name: newItem.name.trim(),
      category: newItem.category || "Shop",
      price,
      currency: "GHS",
      alwaysAvailable: true,
      station: "SHOP",
      imageUrl: newItem.imageUrl.trim() || null,
    }, {
      onSuccess: () => { setShowAddForm(false); setNewItem({ name: "", price: "", category: "Shop", imageUrl: "" }); },
      onError: (e) => setAddError((e as Error).message),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Shop</h1>
        {isOwner && (
          <button
            onClick={() => toggleShop.mutate(!(workspace?.hasShop ?? false))}
            disabled={toggleShop.isPending}
            className="text-sm font-semibold px-4 py-2 rounded-full"
            style={{
              background: workspace?.hasShop ? C.tealSoft : C.bg,
              color: workspace?.hasShop ? C.teal : C.muted,
              border: `1px solid ${workspace?.hasShop ? C.teal : C.border}`,
            }}
          >
            {workspace?.hasShop ? "Shop enabled" : "Enable shop"}
          </button>
        )}
      </div>

      {workspace?.hasShop && (
        <Card style={{ background: C.tealSoft, border: `1px solid rgba(0,166,153,0.2)` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: C.teal }}>
                <QrCode size={14} className="inline mr-1" /> Guest shop link
              </p>
              <p className="text-xs break-all" style={{ color: C.teal }}>{shopUrl}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>
                Share this link or generate a QR code. Guests browse and order, then pay at checkout.
              </p>
            </div>
            <a
              href={shopUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ background: C.teal, color: "#fff" }}
            >
              <ExternalLink size={12} /> Preview
            </a>
          </div>
        </Card>
      )}

      {!workspace?.hasShop && isOwner && (
        <Card>
          <p className="text-sm" style={{ color: C.muted }}>
            Enable the shop to let guests scan a QR code and browse your products. They can place orders and pay at checkout.
          </p>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: "#F2F2F2" }}>
        {(["products", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full capitalize"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? C.text : C.muted }}
          >
            {t === "products" ? `Products (${shopItems.length})` : `Orders (${shopOrders.filter((o) => o.status !== "RESOLVED").length})`}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="flex flex-col gap-4">
          {effectiveCanEdit && (
            <div>
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
                  style={{ background: C.teal, color: "#fff" }}
                >
                  <Plus size={16} /> Add product
                </button>
              ) : (
                <Card>
                  <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>New product</p>
                  <div className="flex flex-col gap-3">
                    <input
                      value={newItem.name}
                      onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Product name (e.g. Socks)"
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                      style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                    />
                    <div className="flex gap-2">
                      <input
                        value={newItem.price}
                        onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))}
                        placeholder="Price (GHS)"
                        type="number"
                        min="0"
                        step="0.01"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                        style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                      />
                      <input
                        value={newItem.category}
                        onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
                        placeholder="Category"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                        style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                      />
                    </div>
                    <div className="flex gap-3 items-center">
                      <div
                        className="rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden text-3xl"
                        style={{ width: 56, height: 56, background: C.bg, border: `1px solid ${C.border}` }}
                      >
                        {newItem.imageUrl ? (
                          <img
                            src={newItem.imageUrl}
                            alt=""
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          getEmoji(newItem.name)
                        )}
                      </div>
                      <input
                        value={newItem.imageUrl}
                        onChange={(e) => setNewItem((p) => ({ ...p, imageUrl: e.target.value }))}
                        placeholder="Image URL (optional — paste a link to a photo)"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                        style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                      />
                    </div>
                    {addError && <p className="text-xs text-destructive">{addError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddItem}
                        disabled={createMenuItem.isPending}
                        className="flex-1 text-sm font-semibold py-2.5 rounded-xl"
                        style={{ background: C.teal, color: "#fff" }}
                      >
                        {createMenuItem.isPending ? "Adding…" : "Add product"}
                      </button>
                      <button
                        onClick={() => { setShowAddForm(false); setAddError(null); }}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: C.bg, color: C.muted }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {shopItems.length === 0 && !showAddForm && (
            <Card>
              <div className="flex flex-col items-center gap-2 py-4">
                <Package size={28} style={{ color: C.muted }} />
                <p className="text-sm" style={{ color: C.muted }}>No products yet. Add your first product above.</p>
              </div>
            </Card>
          )}

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {shopItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <div
                  className="w-full rounded-xl flex items-center justify-center text-4xl"
                  style={{ height: 80, background: C.bg }}
                >
                  {getEmoji(item.name)}
                </div>
                <p className="text-sm font-semibold" style={{ color: C.text }}>{item.name}</p>
                <p className="text-xs font-semibold" style={{ color: C.teal }}>{fmtCurrency(item.price, item.currency)}</p>
                <p className="text-xs" style={{ color: C.muted }}>{item.category}</p>
                {effectiveCanEdit && (
                  <button
                    onClick={() => deleteMenuItem.mutate(item.id)}
                    disabled={deleteMenuItem.isPending}
                    className="text-xs font-semibold mt-1"
                    style={{ color: C.muted }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="flex flex-col gap-3">
          {shopOrders.length === 0 && (
            <Card>
              <div className="flex flex-col items-center gap-2 py-4">
                <ShoppingBag size={28} style={{ color: C.muted }} />
                <p className="text-sm" style={{ color: C.muted }}>No orders yet.</p>
              </div>
            </Card>
          )}
          {shopOrders.map((order) => (
            <Card key={order.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Pill tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Pill>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{order.guestName}</p>
                  </div>
                  {order.guestPhone && <p className="text-xs" style={{ color: C.muted }}>{order.guestPhone}</p>}
                  <div className="flex flex-col gap-0.5 mt-2">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-xs" style={{ color: C.muted }}>
                        {item.quantity}× {item.name} — {fmtCurrency(Number(item.unitPrice) * item.quantity, item.currency)}
                      </p>
                    ))}
                  </div>
                  {order.notes && <p className="text-xs mt-1 italic" style={{ color: C.muted }}>Note: {order.notes}</p>}
                  <p className="text-xs mt-1" style={{ color: C.muted }}>
                    {new Date(order.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                {effectiveCanEdit && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {(["OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus.mutate({ id: order.id, status: s })}
                        disabled={order.status === s || updateStatus.isPending}
                        className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{
                          background: order.status === s ? C.teal : C.bg,
                          color: order.status === s ? "#fff" : C.muted,
                          opacity: order.status === s ? 1 : 0.8,
                        }}
                      >
                        {order.status === s && <Check size={10} className="inline mr-1" />}
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
