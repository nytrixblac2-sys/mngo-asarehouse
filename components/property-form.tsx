"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { C } from "@/lib/colors";
import type { CreatePropertyInput } from "@/lib/queries/properties";

/** context/07-mockup.jsx PropertyForm, extended with a loading state and
 * error display — user feedback, 2026-08: the modal previously closed the
 * instant "Add property" was clicked, regardless of whether the request
 * had even finished, so there was no feedback while it was in flight and
 * a failed request would silently vanish with no error shown. */
export function PropertyForm({
  onClose,
  onSubmit,
  isPending,
  isError,
  error,
}: {
  onClose: () => void;
  onSubmit: (input: CreatePropertyInput) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || isPending) return;
    onSubmit({ name: name.trim() });
  };

  if (isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
        <div className="w-full max-w-sm rounded-2xl p-10 flex flex-col items-center gap-3" style={{ background: C.card }}>
          <Loader2 size={24} className="animate-spin" style={{ color: C.muted }} />
          <p className="text-sm font-semibold" style={{ color: C.text }}>Adding property…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: C.card }}>
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
        {isError && <p className="text-xs mb-3 text-destructive">{error?.message ?? "Something went wrong."}</p>}
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
