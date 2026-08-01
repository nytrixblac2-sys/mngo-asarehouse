"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/colors";
import type { TeamMemberInput } from "@/lib/queries/team";

/** context/07-mockup.jsx TeamMemberForm. */
export function TeamMemberForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: TeamMemberInput) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const canSubmit = name.trim() && role.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), role: role.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-bold" style={{ color: C.text }}>Add team member</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
          placeholder="e.g. Kojo"
        />
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Role</label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
          placeholder="e.g. Cleaner"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full text-sm font-semibold py-3 rounded-xl"
          style={{ background: canSubmit ? "var(--accent, #111111)" : C.border, color: canSubmit ? "#fff" : C.muted }}
        >
          Add team member
        </button>
      </div>
    </div>
  );
}
