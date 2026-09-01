"use client";

import { useState } from "react";
import { X, Check, Copy } from "lucide-react";
import { C } from "@/lib/colors";
import { useInviteUser } from "@/lib/queries/users";
import type { Property } from "@/lib/types";

type InviteRole = "CO_MANAGER" | "PROPERTY_OWNER";

/**
 * context/07-mockup.jsx InviteOwnerForm, extended per user decision,
 * 2026-08-01, to also invite Co-Managers (full edit access) alongside
 * Property Owners (view-only, property-scoped) — a role picker, plus the
 * property checklist only applying to the Owner role. Also extended with
 * a one-time password reveal step (user decision, 2026-07-30/31: no email
 * infra configured, so the manager gets a generated password to hand over
 * directly instead of an invite email). Shown exactly once; never
 * retrievable again after this modal closes.
 */
export function InviteUserForm({ properties, onClose }: { properties: Property[]; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("PROPERTY_OWNER");
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const inviteUser = useInviteUser();
  const canSubmit = name.trim() && email.trim() && (role === "CO_MANAGER" || propertyIds.length > 0);

  const togglePropertyId = (id: string) =>
    setPropertyIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const handleSubmit = () => {
    if (!canSubmit) return;
    inviteUser.mutate({ name: name.trim(), email: email.trim(), role, propertyIds });
  };

  if (inviteUser.data) {
    const { user, temporaryPassword } = inviteUser.data;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
        <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: C.card }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-lg font-bold" style={{ color: C.text }}>Account created</p>
            <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
          </div>
          <p className="text-xs mb-4" style={{ color: C.muted }}>
            Share this password with {user.name} yourself — it won&apos;t be shown again.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            <div className="py-2 px-3 rounded-xl" style={{ background: C.bg }}>
              <p className="text-xs" style={{ color: C.muted }}>Email</p>
              <p className="text-sm font-medium" style={{ color: C.text }}>{user.email}</p>
            </div>
            <div className="py-2 px-3 rounded-xl flex items-center justify-between gap-2" style={{ background: C.bg }}>
              <div>
                <p className="text-xs" style={{ color: C.muted }}>One-time password</p>
                <p className="text-sm font-mono font-medium" style={{ color: C.text }}>{temporaryPassword}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(temporaryPassword);
                  setCopied(true);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: C.card, color: C.text, border: `1px solid ${C.border}` }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full text-sm font-semibold py-3 rounded-xl"
            style={{ background: "var(--accent, #111111)", color: "#fff" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-bold" style={{ color: C.text }}>Invite someone</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>

        <label className="text-xs font-semibold" style={{ color: C.muted }}>Role</label>
        <div className="flex gap-2 mt-1 mb-4">
          <button
            onClick={() => setRole("CO_MANAGER")}
            className="flex-1 text-xs font-semibold py-2.5 rounded-xl"
            style={{ background: role === "CO_MANAGER" ? C.text : C.bg, color: role === "CO_MANAGER" ? "#fff" : C.muted }}
          >
            Co-Manager
          </button>
          <button
            onClick={() => setRole("PROPERTY_OWNER")}
            className="flex-1 text-xs font-semibold py-2.5 rounded-xl"
            style={{ background: role === "PROPERTY_OWNER" ? C.text : C.bg, color: role === "PROPERTY_OWNER" ? "#fff" : C.muted }}
          >
            Owner
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>
          {role === "CO_MANAGER"
            ? "Full edit access across the whole workspace, same as you."
            : "They'll see everything you choose below under their own name, but won't be able to add, edit, or delete anything."}
        </p>

        <label className="text-xs font-semibold" style={{ color: C.muted }}>Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
          placeholder="e.g. Cecilia Boateng"
        />
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
          placeholder="cecilia@example.com"
        />

        {role === "PROPERTY_OWNER" && (
          <>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Properties they can view</label>
            <div className="flex flex-col gap-2 mt-1 mb-4">
              {properties.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer" style={{ background: C.bg }}>
                  <input type="checkbox" checked={propertyIds.includes(p.id)} onChange={() => togglePropertyId(p.id)} />
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-sm" style={{ color: C.text }}>{p.name}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {inviteUser.isError && <p className="text-xs mb-3 text-destructive">{(inviteUser.error as Error).message}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || inviteUser.isPending}
          className="w-full text-sm font-semibold py-3 rounded-xl"
          style={{
            background: canSubmit ? "var(--accent, #111111)" : C.border,
            color: canSubmit ? "#fff" : C.muted,
            opacity: inviteUser.isPending ? 0.6 : 1,
          }}
        >
          {inviteUser.isPending ? "Creating…" : "Create account"}
        </button>
      </div>
    </div>
  );
}
