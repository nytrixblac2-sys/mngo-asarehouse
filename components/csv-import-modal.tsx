"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { X, Upload, Check, AlertCircle } from "lucide-react";
import { C } from "@/lib/colors";
import { fmtCurrency } from "@/lib/format";
import { parseFlexibleAmount, parseFlexibleDate } from "@/lib/csv-import";
import { useBulkImportBookings } from "@/lib/queries/bookings";
import type { BookingSource, BookingStatus, Currency, Property } from "@/lib/types";

type Step = "upload" | "map" | "preview" | "done";

interface Mapping {
  guest: string | null;
  checkIn: string | null;
  checkOut: string | null;
  amount: string | null;
  currencyMode: "fixed" | "column";
  currencyColumn: string | null;
  currencyFixed: Currency;
  sourceMode: "fixed" | "column";
  sourceColumn: string | null;
  sourceFixed: BookingSource;
  /** Applies to the whole batch — Architecture Decision 63. Not
   * "always CONFIRMED" like the original historical-only importer: an
   * export of upcoming reservations hasn't actually been paid out yet. */
  status: BookingStatus;
}

const EMPTY_MAPPING: Mapping = {
  guest: null,
  checkIn: null,
  checkOut: null,
  amount: null,
  currencyMode: "fixed",
  currencyColumn: null,
  currencyFixed: "EUR",
  sourceMode: "fixed",
  sourceColumn: null,
  sourceFixed: "AIRBNB",
  status: "EXPECTED",
};

interface ParsedRow {
  guest: string;
  checkIn: string | null;
  checkOut: string | null;
  amount: number | null;
  currency: Currency | null;
  source: BookingSource;
  valid: boolean;
  error?: string;
}

function normalizeCurrency(raw: string): Currency | null {
  const v = raw.trim().toUpperCase();
  if (v.includes("EUR") || v.includes("€")) return "EUR";
  if (v.includes("GHS") || v.includes("GH₵") || v.includes("CEDI")) return "GHS";
  return null;
}

function normalizeSource(raw: string): BookingSource {
  return raw.trim().toLowerCase().includes("airbnb") ? "AIRBNB" : "LOCAL";
}

/**
 * Generic CSV importer for historical bookings — Architecture Decision
 * 44. Upload -> map arbitrary columns to booking fields -> preview
 * parsed/validated rows -> bulk-create. Deliberately not Airbnb-specific:
 * works on whatever CSV the user actually has, since MNGO can't know
 * Airbnb's exact export format without seeing a real file.
 */
export function CsvImportModal({
  onClose,
  properties,
  defaultPropertyId,
}: {
  onClose: () => void;
  properties: Property[];
  defaultPropertyId: string;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING);
  const [propertyId, setPropertyId] = useState(defaultPropertyId || properties[0]?.id || "");
  const [importedCount, setImportedCount] = useState(0);

  const bulkImport = useBulkImportBookings();

  const handleFile = (file: File) => {
    setFileError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          setFileError("Couldn't find any columns in that file.");
          return;
        }
        if (results.data.length === 0) {
          setFileError("That file has no rows to import.");
          return;
        }
        setHeaders(results.meta.fields);
        setRows(results.data);
        setFileName(file.name);
        setStep("map");
      },
      error: (err) => setFileError(err.message),
    });
  };

  const mappingComplete =
    mapping.guest &&
    mapping.checkIn &&
    mapping.checkOut &&
    mapping.amount &&
    (mapping.currencyMode === "fixed" || mapping.currencyColumn) &&
    (mapping.sourceMode === "fixed" || mapping.sourceColumn);

  const parsedRows: ParsedRow[] = useMemo(() => {
    if (step !== "preview") return [];
    return rows.map((row) => {
      const guest = (mapping.guest ? row[mapping.guest] : "")?.trim() ?? "";
      const checkIn = mapping.checkIn ? parseFlexibleDate(row[mapping.checkIn] ?? "") : null;
      const checkOut = mapping.checkOut ? parseFlexibleDate(row[mapping.checkOut] ?? "") : null;
      const amount = mapping.amount ? parseFlexibleAmount(row[mapping.amount] ?? "") : null;
      const currency =
        mapping.currencyMode === "fixed" ? mapping.currencyFixed : normalizeCurrency(row[mapping.currencyColumn!] ?? "");
      const source =
        mapping.sourceMode === "fixed" ? mapping.sourceFixed : normalizeSource(row[mapping.sourceColumn!] ?? "");

      let error: string | undefined;
      if (!guest) error = "Missing guest name";
      else if (!checkIn) error = "Unrecognized check-in date";
      else if (!checkOut) error = "Unrecognized check-out date";
      else if (checkOut <= checkIn) error = "Check-out is not after check-in";
      else if (!amount) error = "Missing or invalid amount";
      else if (!currency) error = "Unrecognized currency";

      return { guest, checkIn, checkOut, amount, currency, source, valid: !error, error };
    });
  }, [step, rows, mapping]);

  const validRows = parsedRows.filter((r) => r.valid);

  const handleImport = () => {
    if (validRows.length === 0 || !propertyId) return;
    bulkImport.mutate(
      {
        propertyId,
        status: mapping.status,
        bookings: validRows.map((r) => ({
          guest: r.guest,
          checkIn: r.checkIn!,
          checkOut: r.checkOut!,
          amount: r.amount!,
          currency: r.currency!,
          source: r.source,
        })),
      },
      {
        // Read the count from the actual server response, not
        // validRows.length — that's a useMemo gated on step === "preview"
        // (see parsedRows above), so it silently resets to 0 the instant
        // step becomes "done", making the success message always say
        // "Imported 0 bookings" regardless of what really happened. User
        // feedback, 2026-08.
        onSuccess: (created) => {
          setImportedCount(created.length);
          setStep("done");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: C.card, maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-lg font-bold" style={{ color: C.text }}>Import bookings from CSV</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex flex-col gap-4">
          {step === "upload" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: C.muted }}>
                Upload any CSV of stays — an Airbnb export, or your own records. You&apos;ll map its columns to
                MNGO&apos;s fields next, and say whether payment for these has actually been received yet.
              </p>
              <label
                className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl cursor-pointer"
                style={{ border: `2px dashed ${C.border}`, background: C.bg }}
              >
                <Upload size={24} style={{ color: C.muted }} />
                <span className="text-sm font-semibold" style={{ color: C.text }}>Choose a CSV file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>
              {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            </div>
          )}

          {step === "map" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs" style={{ color: C.muted }}>
                {fileName} · {rows.length} row{rows.length !== 1 ? "s" : ""} detected
              </p>

              {properties.length > 1 && (
                <div>
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

              {(["guest", "checkIn", "checkOut", "amount"] as const).map((field) => (
                <div key={field}>
                  <label className="text-xs font-semibold" style={{ color: C.muted }}>
                    {{ guest: "Guest name column", checkIn: "Check-in date column", checkOut: "Check-out date column", amount: "Amount column" }[field]}
                  </label>
                  <select
                    value={mapping[field] ?? ""}
                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || null })}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: `1px solid ${C.border}` }}
                  >
                    <option value="">— select column —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold" style={{ color: C.muted }}>Currency</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setMapping({ ...mapping, currencyMode: "fixed" })}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl"
                    style={{ background: mapping.currencyMode === "fixed" ? C.text : C.bg, color: mapping.currencyMode === "fixed" ? "#fff" : C.muted }}
                  >
                    Same for all rows
                  </button>
                  <button
                    onClick={() => setMapping({ ...mapping, currencyMode: "column" })}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl"
                    style={{ background: mapping.currencyMode === "column" ? C.text : C.bg, color: mapping.currencyMode === "column" ? "#fff" : C.muted }}
                  >
                    From a column
                  </button>
                </div>
                {mapping.currencyMode === "fixed" ? (
                  <select
                    value={mapping.currencyFixed}
                    onChange={(e) => setMapping({ ...mapping, currencyFixed: e.target.value as Currency })}
                    className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: `1px solid ${C.border}` }}
                  >
                    <option value="EUR">EUR</option>
                    <option value="GHS">GHS</option>
                  </select>
                ) : (
                  <select
                    value={mapping.currencyColumn ?? ""}
                    onChange={(e) => setMapping({ ...mapping, currencyColumn: e.target.value || null })}
                    className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: `1px solid ${C.border}` }}
                  >
                    <option value="">— select column —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold" style={{ color: C.muted }}>Source</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setMapping({ ...mapping, sourceMode: "fixed" })}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl"
                    style={{ background: mapping.sourceMode === "fixed" ? C.text : C.bg, color: mapping.sourceMode === "fixed" ? "#fff" : C.muted }}
                  >
                    Same for all rows
                  </button>
                  <button
                    onClick={() => setMapping({ ...mapping, sourceMode: "column" })}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl"
                    style={{ background: mapping.sourceMode === "column" ? C.text : C.bg, color: mapping.sourceMode === "column" ? "#fff" : C.muted }}
                  >
                    From a column
                  </button>
                </div>
                {mapping.sourceMode === "fixed" ? (
                  <select
                    value={mapping.sourceFixed}
                    onChange={(e) => setMapping({ ...mapping, sourceFixed: e.target.value as BookingSource })}
                    className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: `1px solid ${C.border}` }}
                  >
                    <option value="AIRBNB">Airbnb</option>
                    <option value="LOCAL">Local / Cash</option>
                  </select>
                ) : (
                  <select
                    value={mapping.sourceColumn ?? ""}
                    onChange={(e) => setMapping({ ...mapping, sourceColumn: e.target.value || null })}
                    className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: `1px solid ${C.border}` }}
                  >
                    <option value="">— select column —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold" style={{ color: C.muted }}>Payment status</label>
                <p className="text-xs mt-0.5 mb-1.5" style={{ color: C.muted }}>
                  Has the money for these stays actually been received yet? Applies to every row in this import.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMapping({ ...mapping, status: "EXPECTED" })}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl"
                    style={{ background: mapping.status === "EXPECTED" ? C.text : C.bg, color: mapping.status === "EXPECTED" ? "#fff" : C.muted }}
                  >
                    Not yet — Expected
                  </button>
                  <button
                    onClick={() => setMapping({ ...mapping, status: "CONFIRMED" })}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl"
                    style={{ background: mapping.status === "CONFIRMED" ? C.teal : C.bg, color: mapping.status === "CONFIRMED" ? "#fff" : C.muted }}
                  >
                    Yes — Confirmed
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep("preview")}
                disabled={!mappingComplete || !propertyId}
                className="w-full text-sm font-semibold py-3 rounded-xl mt-1"
                style={{
                  background: mappingComplete && propertyId ? "var(--accent, #111111)" : C.border,
                  color: mappingComplete && propertyId ? "#fff" : C.muted,
                }}
              >
                Preview import
              </button>
            </div>
          )}

          {step === "preview" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold" style={{ color: C.text }}>
                {validRows.length} of {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} ready to import
              </p>
              <p className="text-xs" style={{ color: C.muted }}>
                Will be imported as{" "}
                <strong style={{ color: mapping.status === "CONFIRMED" ? C.teal : "var(--accent, #111111)" }}>
                  {mapping.status === "CONFIRMED" ? "Confirmed (payment received)" : "Expected (payment not yet received)"}
                </strong>
                .
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}`, maxHeight: 320, overflowY: "auto" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: C.bg }}>
                      <th className="text-left px-3 py-2" style={{ color: C.muted }}>Guest</th>
                      <th className="text-left px-3 py-2" style={{ color: C.muted }}>Check-in</th>
                      <th className="text-left px-3 py-2" style={{ color: C.muted }}>Check-out</th>
                      <th className="text-right px-3 py-2" style={{ color: C.muted }}>Amount</th>
                      <th className="text-left px-3 py-2" style={{ color: C.muted }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2" style={{ color: C.text }}>{r.guest || "—"}</td>
                        <td className="px-3 py-2" style={{ color: C.text }}>{r.checkIn ?? "—"}</td>
                        <td className="px-3 py-2" style={{ color: C.text }}>{r.checkOut ?? "—"}</td>
                        <td className="px-3 py-2 text-right" style={{ color: C.text }}>
                          {r.amount && r.currency ? fmtCurrency(r.amount, r.currency) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {r.valid ? (
                            <Check size={14} style={{ color: C.teal }} />
                          ) : (
                            <span className="flex items-center gap-1" style={{ color: "var(--accent, #111111)" }}>
                              <AlertCircle size={12} /> {r.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bulkImport.isError && (
                <p className="text-xs text-destructive">{(bulkImport.error as Error).message}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("map")}
                  className="flex-1 text-sm font-semibold py-3 rounded-xl"
                  style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || bulkImport.isPending}
                  className="flex-1 text-sm font-semibold py-3 rounded-xl"
                  style={{
                    background: validRows.length > 0 ? C.teal : C.border,
                    color: validRows.length > 0 ? "#fff" : C.muted,
                    opacity: bulkImport.isPending ? 0.6 : 1,
                  }}
                >
                  {bulkImport.isPending ? "Importing…" : `Import ${validRows.length} booking${validRows.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: C.tealSoft }}>
                <Check size={24} style={{ color: C.teal }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: C.text }}>
                Imported {importedCount} booking{importedCount !== 1 ? "s" : ""}
              </p>
              <button
                onClick={onClose}
                className="text-sm font-semibold px-6 py-2.5 rounded-full"
                style={{ background: "var(--accent, #111111)", color: "#fff" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
