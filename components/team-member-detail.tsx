import { X } from "lucide-react";
import { C } from "@/lib/colors";
import { applyMomo } from "@/lib/financials";
import { fmtCurrency } from "@/lib/format";
import type { Expense } from "@/lib/types";

/**
 * context/07-mockup.jsx TeamMemberDetail. Payment history is derived from
 * Expense rows (category MANAGEMENT, person = name) — no separate
 * payments table, per prisma/schema.prisma's comment on TeamMember. GHS
 * and EUR payments are kept in separate totals rather than summed
 * together, unlike the mockup (which only ever had GHS team payments in
 * its seed data) — matches invariant #2, never mix currencies.
 */
export function TeamMemberDetail({
  name,
  role,
  expenses,
  onClose,
}: {
  name: string;
  role: string;
  expenses: Expense[];
  onClose: () => void;
}) {
  const payments = expenses
    .filter((e) => e.category === "MANAGEMENT" && e.person === name)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalGhs = payments.filter((e) => e.currency === "GHS").reduce((s, e) => s + applyMomo(e.amount, e.currency), 0);
  const totalEur = payments.filter((e) => e.currency === "EUR").reduce((s, e) => s + applyMomo(e.amount, e.currency), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: C.card, maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-lg font-bold" style={{ color: C.text }}>{name}</p>
            <p className="text-xs" style={{ color: C.muted }}>{role}</p>
          </div>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">
          <div className="flex flex-col gap-2 mb-4">
            {totalGhs > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: C.bg }}>
                <span className="text-sm font-semibold" style={{ color: C.text }}>Total paid (GHS)</span>
                <span className="text-lg font-bold" style={{ color: C.text }}>{fmtCurrency(totalGhs, "GHS")}</span>
              </div>
            )}
            {totalEur > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: C.bg }}>
                <span className="text-sm font-semibold" style={{ color: C.text }}>Total paid (EUR)</span>
                <span className="text-lg font-bold" style={{ color: C.text }}>{fmtCurrency(totalEur, "EUR")}</span>
              </div>
            )}
            {totalGhs === 0 && totalEur === 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: C.bg }}>
                <span className="text-sm font-semibold" style={{ color: C.text }}>Total paid</span>
                <span className="text-lg font-bold" style={{ color: C.text }}>{fmtCurrency(0, "GHS")}</span>
              </div>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Payment history</p>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 300 }}>
            {payments.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No payments logged yet.</p>}
            {payments.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                <p className="text-sm" style={{ color: C.text }}>{e.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: C.muted }}>{e.date}</span>
                  <span className="text-sm font-semibold w-24 text-right" style={{ color: C.text }}>
                    {fmtCurrency(applyMomo(e.amount, e.currency), e.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
