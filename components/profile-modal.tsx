"use client";

import { useState } from "react";
import { X, KeyRound } from "lucide-react";
import { C } from "@/lib/colors";
import { Pill } from "@/components/primitives";
import { useAppStore } from "@/store/use-app-store";
import { useWorkspaceUsers, useRemoveUserAccess } from "@/lib/queries/users";
import { useSetWorkspacePin, useWorkspace } from "@/lib/queries/workspace";
import { signOut } from "@/app/(app)/actions";
import type { Property, User } from "@/lib/types";
import type { WorkspaceUser } from "@/lib/users";
import { InviteUserForm } from "./invite-user-form";

const ROLE_LABEL: Record<User["role"], string> = {
  ACCOUNT_OWNER: "Property Manager · can edit",
  CO_MANAGER: "Property Manager · can edit",
  PROPERTY_OWNER: "Owner · view only",
};

/**
 * context/07-mockup.jsx ProfileModal — always about *your own* account
 * (realUser/realCanEdit), never the effective/previewed one, per
 * components/app-shell.tsx's doc comment: you can't "preview" someone
 * else's account settings, and you need to be able to invite people or
 * exit preview from here even while previewing.
 */
export function ProfileModal({
  realUser,
  realCanEdit,
  properties,
  onClose,
}: {
  realUser: User;
  realCanEdit: boolean;
  properties: Property[];
  onClose: () => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);

  const usersQuery = useWorkspaceUsers(realCanEdit);
  const removeAccess = useRemoveUserAccess();
  const workspace = useWorkspace().data;
  const setPin = useSetWorkspacePin();
  const setPreviewUser = useAppStore((s) => s.setPreviewUser);
  const exitPreview = useAppStore((s) => s.exitPreview);
  // Was HOSTEL-only (Architecture Decision 79, order deletion/menu price
  // changes only existed there); now every workspace type can set a PIN
  // since it also gates booking deletion (Architecture Decision 93).
  const showSecurity = realUser.role === "ACCOUNT_OWNER";

  const handleSavePin = () => {
    setPin.mutate(
      { newPin, currentPin: workspace?.hasPin ? currentPin : undefined },
      {
        onSuccess: () => {
          setCurrentPin("");
          setNewPin("");
          setPinSaved(true);
          setTimeout(() => setPinSaved(false), 2000);
        },
      }
    );
  };

  const startPreview = (u: WorkspaceUser) => {
    setPreviewUser(u);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col" style={{ background: "#fff", maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-lg font-bold" style={{ color: C.text }}>Profile</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-base font-bold" style={{ color: C.text }}>{realUser.name}</p>
            <p className="text-sm" style={{ color: C.muted }}>{ROLE_LABEL[realUser.role]}</p>
          </div>

          <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
            <span className="text-xs" style={{ color: C.muted }}>Email</span>
            <span className="text-sm" style={{ color: C.text }}>{realUser.email}</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
              {realCanEdit ? "Properties managed" : "Properties you can view"}
            </p>
            <div className="flex flex-col gap-2">
              {properties.map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-sm" style={{ color: C.text }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {realCanEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>People with access</p>
                <button onClick={() => setShowInvite(true)} className="text-xs font-semibold" style={{ color: "var(--accent, #111111)" }}>
                  + Invite
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {usersQuery.data?.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: C.text }}>{u.name}</p>
                      <p className="text-xs truncate" style={{ color: C.muted }}>{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Pill tone={u.role === "PROPERTY_OWNER" ? "muted" : "teal"}>
                        {u.role === "PROPERTY_OWNER" ? "Owner" : "Manager"}
                      </Pill>
                      {u.role === "PROPERTY_OWNER" && (
                        <button
                          onClick={() => startPreview(u)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: "#FEF9C3", color: "#92400E" }}
                        >
                          Preview
                        </button>
                      )}
                      {u.role === "PROPERTY_OWNER" &&
                        (confirmRemoveId === u.id ? (
                          <>
                            <button
                              onClick={() => { removeAccess.mutate(u.id); setConfirmRemoveId(null); }}
                              className="text-xs font-semibold"
                              style={{ color: "var(--accent, #111111)" }}
                            >
                              Confirm
                            </button>
                            <button onClick={() => setConfirmRemoveId(null)} className="text-xs font-medium" style={{ color: C.muted }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmRemoveId(u.id)} className="text-xs font-medium" style={{ color: C.muted }}>
                            Remove
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {usersQuery.data?.length === 0 && (
                  <p className="text-xs" style={{ color: C.muted }}>No one else has access yet.</p>
                )}
              </div>
            </div>
          )}

          {showSecurity && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
                <span className="inline-flex items-center gap-1"><KeyRound size={11} /> Action PIN</span>
              </p>
              <p className="text-xs mb-2" style={{ color: C.muted }}>
                {workspace?.hasPin
                  ? "Required from managers to delete a booking or order, or change a menu price."
                  : "Not set yet — managers can't delete bookings or orders, or change menu prices, until you set one."}
              </p>
              <div className="flex flex-col gap-2">
                {workspace?.hasPin && (
                  <input
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                    type="password"
                    inputMode="numeric"
                    placeholder="Current PIN"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: `1px solid ${C.border}` }}
                  />
                )}
                <input
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  type="password"
                  inputMode="numeric"
                  placeholder="New 4-8 digit PIN"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ border: `1px solid ${C.border}` }}
                />
                {setPin.isError && <p className="text-xs text-destructive">{(setPin.error as Error).message}</p>}
                {pinSaved && <p className="text-xs" style={{ color: C.teal }}>PIN saved.</p>}
                <button
                  onClick={handleSavePin}
                  disabled={newPin.length < 4 || (workspace?.hasPin && currentPin.length === 0) || setPin.isPending}
                  className="text-xs font-semibold py-2.5 rounded-xl"
                  style={{
                    background: newPin.length >= 4 ? "var(--accent, #111111)" : C.border,
                    color: newPin.length >= 4 ? "#fff" : C.muted,
                  }}
                >
                  {setPin.isPending ? "Saving…" : workspace?.hasPin ? "Change PIN" : "Set PIN"}
                </button>
              </div>
            </div>
          )}

          <form action={signOut}>
            <button
              type="submit"
              onClick={() => exitPreview()}
              className="w-full text-sm font-semibold py-3 rounded-xl mt-1"
              style={{ background: C.bg, color: C.muted }}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      {showInvite && <InviteUserForm properties={properties} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
