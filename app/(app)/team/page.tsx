"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/primitives";
import { TeamMemberForm } from "@/components/team-member-form";
import { TeamMemberDetail } from "@/components/team-member-detail";
import { useEffectiveUser } from "@/components/effective-user-context";
import { useCreateTeamMember, useDeleteTeamMember, useTeam } from "@/lib/queries/team";
import { useExpenses } from "@/lib/queries/expenses";
import { useWorkspace } from "@/lib/queries/workspace";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { applyMomo } from "@/lib/financials";
import type { TeamMember } from "@/lib/types";

/**
 * context/07-mockup.jsx TeamView. Gated on effectiveCanEdit (not the real
 * session role) so this correctly hides during owner preview mode once
 * that exists — same reasoning as the placeholder this replaces. The
 * actual sensitive data (payment amounts) is already excluded server-side
 * in GET /api/expenses (MANAGEMENT category) and GET /api/team itself
 * (manager-only) — this is UX, not the security gate.
 *
 * On a HOSTEL workspace, staff pay specifically is further restricted to
 * the ACCOUNT_OWNER only (Architecture Decision 87) — Janet (CO_MANAGER)
 * still manages the team roster (add/remove, see who's on staff) from
 * this same page, she just never sees the amount or history of what
 * anyone's been paid; only Akwesi does. GET /api/expenses already strips
 * MANAGEMENT-category rows server-side for her, so `payments` below is
 * naturally empty on her session — `canSeePay` only controls whether the
 * (already-empty-for-her) amount/history UI renders at all, not a second
 * data filter. RENTAL is untouched — Cecilia's CO_MANAGER access at Oak &
 * Co. still sees this page exactly as before.
 */
export default function TeamPage() {
  const { effectiveCanEdit, effectiveUser } = useEffectiveUser();
  const workspace = useWorkspace().data;

  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const teamQuery = useTeam();
  const expensesQuery = useExpenses();
  const createTeamMember = useCreateTeamMember();
  const deleteTeamMember = useDeleteTeamMember();

  if (!effectiveCanEdit) {
    return (
      <p className="text-sm" style={{ color: C.muted }}>
        You don&apos;t have access to this page.
      </p>
    );
  }

  const canSeePay = !(workspace?.type === "HOSTEL" && effectiveUser.role !== "ACCOUNT_OWNER");

  const isLoading = teamQuery.isLoading || expensesQuery.isLoading;
  const isError = teamQuery.isError || expensesQuery.isError;

  if (isLoading) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">Something went wrong loading the team.</p>;
  }

  const team = teamQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>Team</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>
            {canSeePay ? "Click a team member to see their payment history." : "Manage who's on staff."}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full"
          style={{ background: "var(--accent, #111111)", color: "#fff" }}
        >
          <Plus size={16} /> Add team member
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {team.map((t) => {
          const payments = expenses.filter((e) => e.category === "MANAGEMENT" && e.person === t.name);
          const totalGhs = payments.filter((e) => e.currency === "GHS").reduce((s, e) => s + applyMomo(e.amount, e.currency), 0);
          const last = payments.length ? [...payments].map((p) => p.date).sort().slice(-1)[0] : null;

          return (
            <Card key={t.id}>
              <div onClick={() => canSeePay && setSelected(t)} className={canSeePay ? "cursor-pointer" : ""}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{t.name}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{t.role}</p>
                  </div>
                  {canSeePay && <p className="text-sm font-bold" style={{ color: C.text }}>{fmtCurrency(totalGhs, "GHS")}</p>}
                </div>
                {canSeePay && (
                  <p className="text-xs mt-3" style={{ color: C.muted }}>
                    {last ? `Last payment ${last} · ${payments.length} payment${payments.length !== 1 ? "s" : ""}` : "No payments yet"}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end mt-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                {confirmDeleteId === t.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: C.muted }}>Remove {t.name}?</span>
                    <button
                      onClick={() => { deleteTeamMember.mutate(t.id); setConfirmDeleteId(null); }}
                      className="text-xs font-semibold"
                      style={{ color: "var(--accent, #111111)" }}
                    >
                      Confirm
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-semibold" style={{ color: C.muted }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(t.id)} className="text-xs font-semibold" style={{ color: C.muted }}>
                    Remove
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {canSeePay && selected && (
        <TeamMemberDetail name={selected.name} role={selected.role} expenses={expenses} onClose={() => setSelected(null)} />
      )}
      {showForm && (
        <TeamMemberForm
          onClose={() => setShowForm(false)}
          onSubmit={(input) => { createTeamMember.mutate(input); setShowForm(false); }}
        />
      )}
    </div>
  );
}
