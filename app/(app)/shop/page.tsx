"use client";

import { useState } from "react";
import { QrCode, Package, ShoppingBag, Boxes, Check, ExternalLink, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, Pill } from "@/components/primitives";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useWorkspace } from "@/lib/queries/workspace";
import { useMenuItems, useCreateMenuItem, useDeleteMenuItem, useUpdateMenuItem } from "@/lib/queries/menu";
import type { MenuItemInput } from "@/lib/queries/menu";
import { useShopOrders, useUpdateShopOrderStatus, useToggleShop } from "@/lib/queries/shop";
import { useStockAdjustments, useAdjustStock } from "@/lib/queries/stock";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import type { IssueStatus, MenuItem } from "@/lib/types";

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

/**
 * Same edit pattern as `/menu`'s `ItemRow` (PIN required for a real price
 * change unless the actor is the ACCOUNT_OWNER — Architecture Decision
 * 82), adapted to Shop's grid-card layout instead of a list row. Shop
 * items are always `station: "SHOP"` — no station picker here, unlike
 * the Menu screen's Kitchen/Bar choice, since there's nothing to choose.
 */
function ShopItemCard({
  item,
  canEdit,
  isOwner,
  canTrackInventory,
  onDelete,
  deleteIsPending,
  onUpdate,
  updateIsPending,
  updateError,
  onAdjustStock,
  adjustIsPending,
  adjustError,
}: {
  item: MenuItem;
  canEdit: boolean;
  isOwner: boolean;
  /** Starter-and-up (Stage 4 of the STORE build) — false on a Free-tier
   * Store, always false for RENTAL/HOSTEL. */
  canTrackInventory: boolean;
  onDelete: () => void;
  deleteIsPending: boolean;
  onUpdate: (input: MenuItemInput, onSuccess: () => void) => void;
  updateIsPending: boolean;
  updateError: string | null;
  onAdjustStock: (delta: number, reason: string, onSuccess: () => void) => void;
  adjustIsPending: boolean;
  adjustError: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(item.name);
  const [draftCategory, setDraftCategory] = useState(item.category);
  const [draftPrice, setDraftPrice] = useState(String(item.price));
  const [draftImageUrl, setDraftImageUrl] = useState(item.imageUrl ?? "");
  const [pin, setPin] = useState("");
  const [showStockForm, setShowStockForm] = useState(false);
  const [stockDelta, setStockDelta] = useState("");
  const [stockReason, setStockReason] = useState("");

  const parsedPrice = parseFloat(draftPrice);
  const priceChanged = parsedPrice !== item.price;
  const needsPin = priceChanged && !isOwner;
  const canSave = draftName.trim().length > 0 && draftCategory.trim().length > 0 && parsedPrice > 0 && (!needsPin || pin.trim().length > 0);

  const startEdit = () => {
    setDraftName(item.name);
    setDraftCategory(item.category);
    setDraftPrice(String(item.price));
    setDraftImageUrl(item.imageUrl ?? "");
    setPin("");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!canSave) return;
    onUpdate(
      {
        name: draftName.trim(),
        category: draftCategory.trim(),
        price: parsedPrice,
        currency: item.currency,
        station: item.station,
        alwaysAvailable: item.alwaysAvailable,
        imageUrl: draftImageUrl.trim() || null,
        pin: needsPin ? pin.trim() : undefined,
      },
      () => setIsEditing(false)
    );
  };

  const parsedDelta = parseInt(stockDelta, 10);
  const canSubmitStock = !isNaN(parsedDelta) && parsedDelta !== 0 && stockReason.trim().length > 0;
  const handleStockSubmit = () => {
    if (!canSubmitStock) return;
    onAdjustStock(parsedDelta, stockReason.trim(), () => {
      setShowStockForm(false);
      setStockDelta("");
      setStockReason("");
    });
  };

  if (isEditing) {
    return (
      <div
        className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Name"
          className="w-full px-2.5 py-2 rounded-lg text-sm"
          style={{ border: `1px solid ${C.border}` }}
        />
        <div className="flex gap-2">
          <input
            value={draftPrice}
            onChange={(e) => setDraftPrice(e.target.value)}
            placeholder="Price"
            type="number"
            min="0"
            step="0.01"
            className="w-full px-2.5 py-2 rounded-lg text-sm"
            style={{ border: `1px solid ${C.border}` }}
          />
          <input
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            placeholder="Category"
            className="w-full px-2.5 py-2 rounded-lg text-sm"
            style={{ border: `1px solid ${C.border}` }}
          />
        </div>
        <input
          value={draftImageUrl}
          onChange={(e) => setDraftImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="w-full px-2.5 py-2 rounded-lg text-sm"
          style={{ border: `1px solid ${C.border}` }}
        />
        {needsPin && (
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            type="password"
            inputMode="numeric"
            placeholder="Owner PIN (price changed)"
            className="w-full px-2.5 py-2 rounded-lg text-sm"
            style={{ border: `1px solid ${C.border}` }}
          />
        )}
        {updateError && <p className="text-xs text-destructive">{updateError}</p>}
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={handleSave}
            disabled={!canSave || updateIsPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: canSave ? C.text : C.border, color: canSave ? "#fff" : C.muted }}
          >
            {updateIsPending ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setIsEditing(false)} className="text-xs font-semibold" style={{ color: C.muted }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="w-full rounded-xl flex items-center justify-center text-4xl overflow-hidden"
        style={{ height: 80, background: C.bg }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          getEmoji(item.name)
        )}
      </div>
      <p className="text-sm font-semibold" style={{ color: C.text }}>{item.name}</p>
      <p className="text-xs font-semibold" style={{ color: C.teal }}>{fmtCurrency(item.price, item.currency)}</p>
      <p className="text-xs" style={{ color: C.muted }}>{item.category}</p>

      {item.stockQuantity !== null && (
        <Pill tone={item.stockQuantity === 0 ? "amber" : "muted"}>
          {item.stockQuantity === 0 ? "Out of stock" : `${item.stockQuantity} in stock`}
        </Pill>
      )}

      {canEdit && canTrackInventory && showStockForm && (
        <div className="flex flex-col gap-1.5 mt-1 p-2 rounded-xl" style={{ background: C.bg }}>
          <input
            value={stockDelta}
            onChange={(e) => setStockDelta(e.target.value)}
            placeholder={item.stockQuantity === null ? "Starting quantity" : "+10 or -2"}
            type="number"
            step="1"
            className="w-full px-2 py-1.5 rounded-lg text-xs"
            style={{ border: `1px solid ${C.border}` }}
          />
          <input
            value={stockReason}
            onChange={(e) => setStockReason(e.target.value)}
            placeholder={item.stockQuantity === null ? "e.g. Initial stock" : "e.g. Restock, damaged, miscount"}
            className="w-full px-2 py-1.5 rounded-lg text-xs"
            style={{ border: `1px solid ${C.border}` }}
          />
          {adjustError && <p className="text-xs text-destructive">{adjustError}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStockSubmit}
              disabled={!canSubmitStock || adjustIsPending}
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: canSubmitStock ? C.text : C.border, color: canSubmitStock ? "#fff" : C.muted }}
            >
              {adjustIsPending ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setShowStockForm(false)} className="text-xs font-semibold" style={{ color: C.muted }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex items-center gap-3 mt-1">
          <button onClick={startEdit} title="Edit">
            <Pencil size={14} style={{ color: C.muted }} />
          </button>
          {canTrackInventory && !showStockForm && (
            <button onClick={() => setShowStockForm(true)} title={item.stockQuantity === null ? "Track inventory" : "Adjust stock"}>
              <Boxes size={14} style={{ color: item.stockQuantity !== null ? C.teal : C.muted }} />
            </button>
          )}
          <button onClick={onDelete} disabled={deleteIsPending} title="Remove">
            <Trash2 size={14} style={{ color: C.muted }} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  const { effectiveUser, effectiveCanEdit } = useEffectiveUser();
  const workspace = useWorkspace().data;
  const isStoreWorkspace = workspace?.type === "STORE";
  // Free-tier Store limits (Stage 4 of the STORE build): no shareable
  // public link, no inventory tracking. RENTAL is grandfathered to
  // ENTERPRISE and never hits this, so it always gets inventory tracking
  // on its Shop — user request, 2026-09-15: "every account will be like
  // this," extending Store's inventory feature to RENTAL's Shop too.
  const isFreeTierStore = isStoreWorkspace && workspace?.plan === "FREE";
  const canTrackInventory = !isFreeTierStore;
  const menuQuery = useMenuItems();
  const shopOrdersQuery = useShopOrders();
  const createMenuItem = useCreateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const updateStatus = useUpdateShopOrderStatus();
  const toggleShop = useToggleShop();
  const stockAdjustmentsQuery = useStockAdjustments({ enabled: canTrackInventory });
  const adjustStock = useAdjustStock();

  const isOwner = effectiveUser.role === "ACCOUNT_OWNER";

  const [tab, setTab] = useState<"products" | "orders" | "inventory">("products");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Shop", imageUrl: "" });
  const [trackStock, setTrackStock] = useState(false);
  const [startingStock, setStartingStock] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const shopItems = (menuQuery.data ?? []).filter((m) => m.station === "SHOP");
  const shopOrders = shopOrdersQuery.data ?? [];
  const stockAdjustments = stockAdjustmentsQuery.data ?? [];

  const shopUrl = workspace ? `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${workspace.slug}` : "";

  if (workspace && workspace.type !== "RENTAL" && !isStoreWorkspace) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Shop</h1>
        <Card><p className="text-sm" style={{ color: C.muted }}>The Shop is only available for RENTAL and STORE workspaces.</p></Card>
      </div>
    );
  }

  // Without this, shopItems briefly evaluates to [] while menuQuery is
  // still loading (menuQuery.data is undefined, `?? []` fills in an empty
  // array) — the "No products yet" empty state flashed on every load
  // before the real products arrived, looking like the shop had been
  // wiped. User report, 2026-09-09.
  if (menuQuery.isLoading || shopOrdersQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Shop</h1>
        <p className="text-sm" style={{ color: C.muted }}>Loading…</p>
      </div>
    );
  }

  const handleAddItem = async () => {
    setAddError(null);
    if (!newItem.name.trim()) { setAddError("Name is required"); return; }
    const price = parseFloat(newItem.price);
    if (!price || price <= 0) { setAddError("Enter a valid price"); return; }
    let stockQuantity: number | null = null;
    if (canTrackInventory && trackStock) {
      const qty = parseInt(startingStock, 10);
      if (isNaN(qty) || qty < 0) { setAddError("Enter a valid starting quantity"); return; }
      stockQuantity = qty;
    }
    createMenuItem.mutate({
      name: newItem.name.trim(),
      category: newItem.category || "Shop",
      price,
      currency: "GHS",
      alwaysAvailable: true,
      station: "SHOP",
      imageUrl: newItem.imageUrl.trim() || null,
      stockQuantity,
    }, {
      onSuccess: () => {
        setShowAddForm(false);
        setNewItem({ name: "", price: "", category: "Shop", imageUrl: "" });
        setTrackStock(false);
        setStartingStock("");
      },
      onError: (e) => setAddError((e as Error).message),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Shop</h1>
        {isOwner && !isStoreWorkspace && (
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

      {/* STORE's shop link is always live — it's the whole business, not
          an optional guest add-on toggled per-workspace like RENTAL's.
          On the Free plan the link itself isn't shareable yet (Stage 4 of
          the STORE build) — the public endpoint rejects it server-side
          (app/api/shop/[slug]), so this shows an upgrade prompt instead of
          a link that would just dead-end for a customer who scans it. */}
      {isFreeTierStore ? (
        <Card>
          <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>Store link — Starter plan and up</p>
          <p className="text-xs" style={{ color: C.muted }}>
            Upgrade to share an online link customers can browse and order from. On the Free plan, products and orders are managed here, but there&apos;s no public storefront yet.
          </p>
        </Card>
      ) : (isStoreWorkspace || workspace?.hasShop) && (
        <Card style={{ background: C.tealSoft, border: `1px solid rgba(0,166,153,0.2)` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: C.teal }}>
                <QrCode size={14} className="inline mr-1" /> {isStoreWorkspace ? "Store link" : "Guest shop link"}
              </p>
              <p className="text-xs break-all" style={{ color: C.teal }}>{shopUrl}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>
                {isStoreWorkspace
                  ? "Share this link or generate a QR code. Customers browse and order, then pay at checkout."
                  : "Share this link or generate a QR code. Guests browse and order, then pay at checkout."}
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

      {!isStoreWorkspace && !workspace?.hasShop && isOwner && (
        <Card>
          <p className="text-sm" style={{ color: C.muted }}>
            Enable the shop to let guests scan a QR code and browse your products. They can place orders and pay at checkout.
          </p>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: C.bg }}>
        {(canTrackInventory ? (["products", "orders", "inventory"] as const) : (["products", "orders"] as const)).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full capitalize"
            style={{ background: tab === t ? C.card : "transparent", color: tab === t ? C.text : C.muted }}
          >
            {t === "products"
              ? `Products (${shopItems.length})`
              : t === "orders"
              ? `Orders (${shopOrders.filter((o) => o.status !== "RESOLVED").length})`
              : "Inventory"}
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
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
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
                    {canTrackInventory && (
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                          <input
                            type="checkbox"
                            checked={trackStock}
                            onChange={(e) => setTrackStock(e.target.checked)}
                          />
                          Track inventory
                        </label>
                        {trackStock && (
                          <input
                            value={startingStock}
                            onChange={(e) => setStartingStock(e.target.value)}
                            placeholder="Starting quantity"
                            type="number"
                            min="0"
                            step="1"
                            className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                            style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text }}
                          />
                        )}
                      </div>
                    )}
                    {isFreeTierStore && (
                      <p className="text-xs" style={{ color: C.muted }}>
                        Inventory tracking requires the Starter plan or higher.
                      </p>
                    )}
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
              <ShopItemCard
                key={item.id}
                item={item}
                canEdit={effectiveCanEdit}
                isOwner={isOwner}
                canTrackInventory={canTrackInventory}
                onDelete={() => deleteMenuItem.mutate(item.id)}
                deleteIsPending={deleteMenuItem.isPending && deleteMenuItem.variables === item.id}
                onUpdate={(input, onSuccess) => updateMenuItem.mutate({ id: item.id, input }, { onSuccess })}
                updateIsPending={updateMenuItem.isPending && updateMenuItem.variables?.id === item.id}
                updateError={
                  updateMenuItem.isError && updateMenuItem.variables?.id === item.id
                    ? (updateMenuItem.error as Error).message
                    : null
                }
                onAdjustStock={(delta, reason, onSuccess) => adjustStock.mutate({ id: item.id, delta, reason }, { onSuccess })}
                adjustIsPending={adjustStock.isPending && adjustStock.variables?.id === item.id}
                adjustError={
                  adjustStock.isError && adjustStock.variables?.id === item.id
                    ? (adjustStock.error as Error).message
                    : null
                }
              />
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

      {tab === "inventory" && canTrackInventory && (
        <div className="flex flex-col gap-3">
          {stockAdjustments.length === 0 && (
            <Card>
              <div className="flex flex-col items-center gap-2 py-4">
                <Boxes size={28} style={{ color: C.muted }} />
                <p className="text-sm" style={{ color: C.muted }}>
                  No stock activity yet. Turn on &quot;Track inventory&quot; on a product to start.
                </p>
              </div>
            </Card>
          )}
          {stockAdjustments.map((adj) => {
            const item = shopItems.find((i) => i.id === adj.menuItemId);
            return (
              <Card key={adj.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{item?.name ?? "Removed product"}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{adj.reason}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                      {new Date(adj.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: adj.delta > 0 ? C.teal : "var(--accent, #111111)" }}>
                    {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
