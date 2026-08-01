import { Card } from "@/components/primitives";
import { C } from "@/lib/colors";

/** Shown on screens that need at least one property to do anything
 * useful, when the workspace is brand new. The actual "+ Add property"
 * action lives in the always-visible PropertySwitcher (top bar) — this is
 * just the pointer to it, not a duplicate entry point. */
export function EmptyPropertyState({ canEdit }: { canEdit: boolean }) {
  return (
    <Card>
      <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>No properties yet</p>
      <p className="text-sm" style={{ color: C.muted }}>
        {canEdit
          ? "Add your first property from the switcher at the top of the page to get started."
          : "There's nothing here yet — check back once a property has been set up."}
      </p>
    </Card>
  );
}
