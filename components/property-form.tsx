"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/colors";
import type { CreatePropertyInput } from "@/lib/queries/properties";

/** context/07-mockup.jsx PropertyForm. */
export function PropertyForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: CreatePropertyInput) => void;
}) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-bold" style={{ color: C.text }}>Add property</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Property name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm"
          style={{ border: `1px solid ${C.border}` }}
          placeholder="e.g. Osu Loft"
        />
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full text-sm font-semibold py-3 rounded-xl"
          style={{ background: name.trim() ? "var(--accent, #111111)" : C.border, color: name.trim() ? "#fff" : C.muted }}
        >
          Add property
        </button>
      </div>
    </div>
  );
}
