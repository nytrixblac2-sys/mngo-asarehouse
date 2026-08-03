"use client";

import { useState } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { C } from "@/lib/colors";
import { MONTH_NAMES } from "@/lib/calendar";
import { useBookings } from "@/lib/queries/bookings";
import { useExpenses } from "@/lib/queries/expenses";
import { useManualIncome } from "@/lib/queries/manual-income";
import { buildMonthlyReport, type OpeningBalanceOverride, type ReportType } from "@/lib/reports";
import type { Currency, Property } from "@/lib/types";

/**
 * context/07-mockup.jsx GenerateReportModal, ported for real: month+year
 * pickers instead of the mockup's free-form From/To date inputs (this app's
 * financial data is always reasoned about per calendar month — same pattern
 * as the Financials/Bookings screens' own month switchers), same two
 * checkboxes (Owner Report / Oak & Co. internal report — user decision
 * 2026-08-03: both report types needed, generated on demand from a single
 * modal). PDF is built entirely client-side with @react-pdf/renderer and
 * downloaded directly — no server route, consistent with Architecture
 * Decision 2 ("financial calculations run client-side").
 */
export function GenerateReportModal({
  onClose,
  properties,
  defaultPropertyId,
  defaultYear,
  defaultMonth,
  managementLabel,
}: {
  onClose: () => void;
  properties: Property[];
  defaultPropertyId?: string;
  defaultYear?: number;
  defaultMonth?: number;
  managementLabel: string;
}) {
  const today = new Date();
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? properties[0]?.id ?? "");
  const [year, setYear] = useState(defaultYear ?? today.getFullYear());
  const [month, setMonth] = useState(defaultMonth ?? today.getMonth());
  const [includeOwner, setIncludeOwner] = useState(true);
  const [includeOakco, setIncludeOakco] = useState(false);
  const [useStatedBalance, setUseStatedBalance] = useState(false);
  const [ownersBalanceInputs, setOwnersBalanceInputs] = useState<Partial<Record<Currency, string>>>({});
  const [managementBalanceInputs, setManagementBalanceInputs] = useState<Partial<Record<Currency, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingsQuery = useBookings();
  const expensesQuery = useExpenses();
  const manualIncomeQuery = useManualIncome();

  const property = properties.find((p) => p.id === propertyId);
  const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - 4 + i);
  const reportCurrencies: Currency[] = property && property.currencies.length > 0 ? property.currencies : ["GHS"];

  const handleGenerate = async () => {
    setError(null);
    if (!property) {
      setError("Select a property first.");
      return;
    }
    const reportTypes: ReportType[] = [
      ...(includeOwner ? (["owner"] as const) : []),
      ...(includeOakco ? (["oakco"] as const) : []),
    ];
    if (reportTypes.length === 0) {
      setError("Select at least one report type.");
      return;
    }

    const openingBalanceOverrides: Partial<Record<Currency, OpeningBalanceOverride>> = {};
    if (useStatedBalance) {
      for (const currency of reportCurrencies) {
        const override: OpeningBalanceOverride = {};
        const ownersRaw = ownersBalanceInputs[currency];
        const managementRaw = managementBalanceInputs[currency];
        if (includeOwner && ownersRaw !== undefined && ownersRaw.trim() !== "") override.owners = Number(ownersRaw);
        if (includeOakco && managementRaw !== undefined && managementRaw.trim() !== "") override.management = Number(managementRaw);
        if (override.owners !== undefined || override.management !== undefined) {
          openingBalanceOverrides[currency] = override;
        }
      }
    }

    setIsGenerating(true);
    try {
      const data = buildMonthlyReport({
        property,
        bookings: bookingsQuery.data ?? [],
        expenses: expensesQuery.data ?? [],
        manualIncome: manualIncomeQuery.data ?? [],
        year,
        month,
        reportTypes,
        managementLabel,
        openingBalanceOverrides,
      });

      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/report-pdf-document"),
      ]);

      const blob = await pdf(<ReportPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${property.name} - ${data.monthLabel} report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate the report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg font-bold" style={{ color: C.text }}>Generate report</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <p className="text-sm mb-5" style={{ color: C.muted }}>Choose a property and month to generate the report for.</p>

        {properties.length > 1 && (
          <div className="mb-4">
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
            <input type="checkbox" checked={includeOwner} onChange={(e) => setIncludeOwner(e.target.checked)} />
            Owner Report (Owners + Operations)
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
            <input type="checkbox" checked={includeOakco} onChange={(e) => setIncludeOakco(e.target.checked)} />
            {managementLabel} internal report
          </label>
        </div>

        <div className="mb-5 rounded-xl p-3" style={{ background: C.bg }}>
          <label className="flex items-start gap-2 text-sm" style={{ color: C.text }}>
            <input
              type="checkbox"
              checked={useStatedBalance}
              onChange={(e) => setUseStatedBalance(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Not all history is in the system yet — state the actual opening balance for this month instead of calculating from scratch
            </span>
          </label>

          {useStatedBalance && (
            <div className="flex flex-col gap-3 mt-3">
              {reportCurrencies.map((currency) => (
                <div key={currency} className="grid grid-cols-2 gap-3">
                  {includeOwner && (
                    <div>
                      <label className="text-xs font-semibold" style={{ color: C.muted }}>
                        Owners balance ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 4500.00"
                        value={ownersBalanceInputs[currency] ?? ""}
                        onChange={(e) => setOwnersBalanceInputs((prev) => ({ ...prev, [currency]: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                        style={{ border: `1px solid ${C.border}` }}
                      />
                    </div>
                  )}
                  {includeOakco && (
                    <div>
                      <label className="text-xs font-semibold" style={{ color: C.muted }}>
                        {managementLabel} balance ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. -1200.00"
                        value={managementBalanceInputs[currency] ?? ""}
                        onChange={(e) => setManagementBalanceInputs((prev) => ({ ...prev, [currency]: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                        style={{ border: `1px solid ${C.border}` }}
                      />
                    </div>
                  )}
                </div>
              ))}
              <p className="text-xs" style={{ color: C.muted }}>
                Leave a field blank to calculate that balance from system records as normal. This is a one-time input for this PDF only — nothing is saved.
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          style={{ background: "var(--accent, #111111)", color: "#fff", opacity: isGenerating ? 0.7 : 1 }}
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {isGenerating ? "Generating…" : "Generate PDF"}
        </button>
      </div>
    </div>
  );
}
