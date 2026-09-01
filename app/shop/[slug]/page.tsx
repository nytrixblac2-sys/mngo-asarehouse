"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Minus, Plus, ChevronLeft } from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  category: string;
  price: string;
  currency: string;
  imageUrl: string | null;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
}

interface CartItem extends ShopItem {
  quantity: number;
}

const PLACEHOLDER_EMOJI: Record<string, string> = {
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
  for (const [key, emoji] of Object.entries(PLACEHOLDER_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return "🛍️";
}

function fmtPrice(price: string | number, currency: string): string {
  const n = Number(price);
  if (currency === "GHS") return `GH₵ ${n.toFixed(2)}`;
  if (currency === "EUR") return `€${n.toFixed(2)}`;
  return `${currency} ${n.toFixed(2)}`;
}

type Screen = "shop" | "cart" | "checkout" | "confirm";

export default function PublicShopPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<Screen>("shop");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/shop/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setWorkspace(data.data.workspace);
        setItems(data.data.items);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load shop"); setLoading(false); });
  }, [params.slug]);

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + Number(c.price) * c.quantity, 0);
  const currency = cart[0]?.currency ?? "GHS";

  function addToCart(item: ShopItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function getQty(id: string): number {
    return cart.find((c) => c.id === id)?.quantity ?? 0;
  }

  async function submitOrder() {
    if (!guestName.trim()) { setSubmitError("Please enter your name"); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/shop/${params.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || undefined,
          notes: notes.trim() || undefined,
          items: cart.map((c) => ({ menuItemId: c.id, quantity: c.quantity })),
        }),
      });
      const data = await res.json();
      if (data.error) { setSubmitError(data.error); setSubmitting(false); return; }
      setOrderId(data.data.id);
      setScreen("confirm");
      setCart([]);
    } catch {
      setSubmitError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FA", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#999", fontSize: 14 }}>Loading shop…</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FA", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🛍️</p>
          <p style={{ color: "#333", fontWeight: 600, marginBottom: 8 }}>Shop not found</p>
          <p style={{ color: "#999", fontSize: 14 }}>{error ?? "This shop doesn't exist or isn't available."}</p>
        </div>
      </div>
    );
  }

  /* ─── Confirm screen ─── */
  if (screen === "confirm") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Order placed!</h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>Order #{orderId?.slice(-8).toUpperCase()}</p>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>Show this to our staff and pay at checkout.</p>
          <button
            onClick={() => { setScreen("shop"); setGuestName(""); setGuestPhone(""); setNotes(""); }}
            style={{ background: "#00A699", color: "#fff", border: "none", borderRadius: 32, padding: "12px 28px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >
            Browse more
          </button>
        </div>
      </div>
    );
  }

  /* ─── Checkout screen ─── */
  if (screen === "checkout") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 16px" }}>
            <button onClick={() => setScreen("cart")} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
              <ChevronLeft size={18} /> Back
            </button>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>Your details</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>Pay at checkout when staff deliver your order.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name *"
              style={{ border: "1.5px solid #E5E5E5", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", background: "#fff", color: "#1a1a1a" }}
            />
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Phone number (optional)"
              type="tel"
              style={{ border: "1.5px solid #E5E5E5", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", background: "#fff", color: "#1a1a1a" }}
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Room number or notes (optional)"
              rows={2}
              style={{ border: "1.5px solid #E5E5E5", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", background: "#fff", color: "#1a1a1a", resize: "none" }}
            />
          </div>

          {/* Order summary */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 24, border: "1px solid #F0F0F0" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 12 }}>ORDER SUMMARY</p>
            {cart.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: "#333" }}>{c.quantity}× {c.name}</span>
                <span style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>{fmtPrice(Number(c.price) * c.quantity, c.currency)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #F0F0F0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#00A699" }}>{fmtPrice(totalPrice, currency)}</span>
            </div>
          </div>

          {submitError && <p style={{ color: "#e53e3e", fontSize: 13, marginBottom: 12 }}>{submitError}</p>}

          <button
            onClick={submitOrder}
            disabled={submitting}
            style={{ width: "100%", background: "#00A699", color: "#fff", border: "none", borderRadius: 32, padding: "15px 0", fontWeight: 700, fontSize: 16, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Placing order…" : "Place order — pay at checkout"}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Cart screen ─── */
  if (screen === "cart") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 16px" }}>
            <button onClick={() => setScreen("shop")} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
              <ChevronLeft size={18} /> Back
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Your cart</h2>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🛒</p>
              <p style={{ color: "#999", fontSize: 14 }}>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ background: "#fff", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 12, border: "1px solid #F0F0F0" }}>
                    <div style={{ fontSize: 32, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FA", borderRadius: 12 }}>
                      {getEmoji(item.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{item.name}</p>
                      <p style={{ fontSize: 13, color: "#00A699", fontWeight: 600 }}>{fmtPrice(item.price, item.currency)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ width: 28, height: 28, border: "1px solid #E5E5E5", borderRadius: "50%", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Minus size={14} color="#555" />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: "center", color: "#1a1a1a" }}>{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        style={{ width: 28, height: 28, border: "none", borderRadius: "50%", background: "#00A699", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Plus size={14} color="#fff" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 24, border: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#00A699" }}>{fmtPrice(totalPrice, currency)}</span>
              </div>

              <button
                onClick={() => setScreen("checkout")}
                style={{ width: "100%", background: "#00A699", color: "#fff", border: "none", borderRadius: 32, padding: "15px 0", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
              >
                Checkout
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ─── Main shop screen ─── */
  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>
        {/* Header */}
        <div style={{ padding: "24px 0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#00A699", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>SHOP</p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{workspace.name}</h1>
          </div>
          {totalItems > 0 && (
            <button
              onClick={() => setScreen("cart")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#00A699", color: "#fff", border: "none", borderRadius: 32, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              <ShoppingCart size={16} />
              {totalItems} item{totalItems !== 1 ? "s" : ""} · {fmtPrice(totalPrice, currency)}
            </button>
          )}
        </div>

        <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Browse and add items. Pay at checkout when you receive your order.</p>

        {/* Products by category */}
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          return (
            <div key={cat} style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{cat}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {catItems.map((item) => {
                  const qty = getQty(item.id);
                  return (
                    <div
                      key={item.id}
                      style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: `1.5px solid ${qty > 0 ? "#00A699" : "#F0F0F0"}`, transition: "border-color 0.15s" }}
                    >
                      <div style={{ height: 100, background: "#F8F9FA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          getEmoji(item.name)
                        )}
                      </div>
                      <div style={{ padding: "10px 12px 12px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{item.name}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#00A699", marginBottom: 10 }}>{fmtPrice(item.price, item.currency)}</p>
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            style={{ width: "100%", background: "#00A699", color: "#fff", border: "none", borderRadius: 24, padding: "8px 0", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                          >
                            Add
                          </button>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              style={{ width: 32, height: 32, border: "1px solid #E5E5E5", borderRadius: "50%", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Minus size={14} color="#555" />
                            </button>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{qty}</span>
                            <button
                              onClick={() => addToCart(item)}
                              style={{ width: 32, height: 32, border: "none", borderRadius: "50%", background: "#00A699", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Plus size={14} color="#fff" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🛍️</p>
            <p style={{ color: "#999", fontSize: 14 }}>No products available yet.</p>
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      {totalItems > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 24px", background: "rgba(248,249,250,0.92)", backdropFilter: "blur(8px)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <button
              onClick={() => setScreen("cart")}
              style={{ width: "100%", background: "#00A699", color: "#fff", border: "none", borderRadius: 32, padding: "15px 0", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <ShoppingCart size={18} />
              View cart ({totalItems}) · {fmtPrice(totalPrice, currency)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
