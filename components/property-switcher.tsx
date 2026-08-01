"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { C } from "@/lib/colors";
import { useAppStore } from "@/store/use-app-store";
import { useCreateProperty, useDeleteProperty, useUpdateProperty } from "@/lib/queries/properties";
import type { Property } from "@/lib/types";
import { PropertyForm } from "./property-form";
import { PropertyProfileModal } from "./property-profile-modal";

/** context/07-mockup.jsx PropertySwitcher. */
export function PropertySwitcher({ properties, canEdit }: { properties: Property[]; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [profileFor, setProfileFor] = useState<Property | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const activePropertyId = useAppStore((s) => s.activePropertyId);
  const setActivePropertyId = useAppStore((s) => s.setActivePropertyId);

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();

  const current = properties.find((p) => p.id === activePropertyId);
  const label = activePropertyId === "all" ? "All properties" : current?.name ?? "All properties";

  // User feedback, 2026-08: clicking anywhere outside the open dropdown
  // should close it, same as any standard dropdown menu.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative ml-2" ref={rootRef}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5">
        {current && <div className="w-2 h-2 rounded-full" style={{ background: current.color }} />}
        <span className="text-base font-bold" style={{ color: C.text }}>
          {label}
        </span>
        <ChevronDown size={14} style={{ color: C.muted }} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-64 rounded-xl p-2 z-30"
          style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
        >
          <button
            onClick={() => {
              setActivePropertyId("all");
              setOpen(false);
            }}
            className="w-full text-left text-sm px-3 py-2 rounded-lg"
            style={{
              color: activePropertyId === "all" ? "var(--accent, #111111)" : C.text,
              fontWeight: activePropertyId === "all" ? 700 : 500,
              background: activePropertyId === "all" ? "var(--accent-soft, rgba(0,0,0,0.07))" : "transparent",
            }}
          >
            All properties
          </button>
          {properties.length > 0 && <div style={{ borderTop: `1px solid ${C.border}`, margin: "6px 0" }} />}
          {properties.map((p) => (
            <div
              key={p.id}
              className="rounded-lg px-3 py-2"
              style={{ background: activePropertyId === p.id ? "var(--accent-soft, rgba(0,0,0,0.07))" : "transparent" }}
            >
              <button
                onClick={() => {
                  setActivePropertyId(p.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2 text-left text-sm w-full"
                style={{
                  color: activePropertyId === p.id ? "var(--accent, #111111)" : C.text,
                  fontWeight: activePropertyId === p.id ? 700 : 500,
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} /> {p.name}
              </button>
              {canEdit && (
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => {
                      setProfileFor(p);
                      setOpen(false);
                    }}
                    className="text-xs font-medium"
                    style={{ color: C.muted }}
                  >
                    Edit profile
                  </button>
                  {confirmDeleteId === p.id ? (
                    <>
                      <button
                        onClick={() => {
                          deleteProperty.mutate(p.id);
                          setConfirmDeleteId(null);
                        }}
                        className="text-xs font-semibold"
                        style={{ color: "var(--accent, #111111)" }}
                      >
                        Confirm delete
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-medium" style={{ color: C.muted }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    properties.length > 1 && (
                      <button onClick={() => setConfirmDeleteId(p.id)} className="text-xs font-medium" style={{ color: C.muted }}>
                        Delete
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
          {canEdit && (
            <>
              <div style={{ borderTop: `1px solid ${C.border}`, margin: "6px 0" }} />
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setOpen(false);
                }}
                className="w-full text-left text-sm px-3 py-2 rounded-lg"
                style={{ color: C.muted, fontWeight: 500 }}
              >
                + Add property
              </button>
            </>
          )}
        </div>
      )}
      {showAddForm && (
        <PropertyForm
          onClose={() => setShowAddForm(false)}
          onSubmit={(input) => {
            createProperty.mutate(input, {
              // Immediately open the profile editor for the new property —
              // creation is name-only (Architecture Decision 42), and
              // without this the color/currencies/allocation/rooms step
              // that comes next isn't discoverable. User feedback, 2026-08.
              onSuccess: (created) => {
                setActivePropertyId(created.id);
                setProfileFor(created);
              },
            });
            setShowAddForm(false);
          }}
        />
      )}
      {profileFor && (
        <PropertyProfileModal
          property={profileFor}
          onClose={() => setProfileFor(null)}
          onSave={(input) => {
            updateProperty.mutate({ id: profileFor.id, input });
            setProfileFor(null);
          }}
          onDelete={() => {
            deleteProperty.mutate(profileFor.id);
            setProfileFor(null);
          }}
          canDelete={properties.length > 1}
        />
      )}
    </div>
  );
}
