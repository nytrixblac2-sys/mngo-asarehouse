import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MonthlyReportData, ReportExpenseRow, ReportIncomeRow } from "@/lib/reports";
import type { Currency } from "@/lib/types";

/**
 * Plain @react-pdf/renderer tree, built from already-computed MonthlyReportData
 * (context/lib/reports.ts — reuses the same computeOwnersReport/
 * computeManagementReport formulas the live Financials screen uses, so the
 * PDF numbers always match the app). Default Helvetica font — no custom font
 * embedding, matching "don't add complexity beyond what's needed."
 *
 * Owner Report structure follows the layout the user was already using
 * before this feature existed (user feedback, 2026-08-04 — "this was
 * saying more" than the first version's fund-card layout): income overview
 * for both currencies up front, the opening balance carried forward shown
 * explicitly (not folded silently into a single final number), income
 * allocation, itemized expenses, Oak & Co.'s EUR share (see Architecture
 * Decision 61 for why EUR needs this and GHS doesn't), then a final
 * balance calculation shown as worked arithmetic rather than just the
 * answer.
 *
 * Uses a PDF-specific currency formatter, not lib/format.ts's fmtCurrency:
 * react-pdf's built-in Helvetica only supports WinAnsi-encoded glyphs, which
 * excludes the cedi sign (₵) — it silently fell back to "µ" (GHµ2,535.60)
 * during verification. "GHS " reads correctly everywhere without embedding a
 * custom font just for one glyph. € is in WinAnsi, so it's untouched.
 */
function fmtCurrencyPdf(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === "EUR" ? `€${formatted}` : `GHS ${formatted}`;
}

function signed(amount: number, currency: Currency): string {
  const sign = amount < 0 ? "-" : "+";
  return `${sign} ${fmtCurrencyPdf(Math.abs(amount), currency)}`;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6B7280", marginBottom: 16 },
  sectionHeader: { fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 8, borderBottom: "1 solid #E5E5E5", paddingBottom: 4 },
  subheading: { fontSize: 9, fontWeight: 700, marginTop: 10, marginBottom: 4, textTransform: "uppercase", color: "#374151" },
  currencyHeader: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 6, color: "#374151" },
  cardRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  card: { flex: 1, padding: 10, backgroundColor: "#F5F5F5", borderRadius: 6 },
  cardLabel: { fontSize: 8, color: "#6B7280", textTransform: "uppercase", marginBottom: 3 },
  cardValue: { fontSize: 14, fontWeight: 700 },
  cardSub: { fontSize: 8, color: "#6B7280", marginTop: 2 },
  openingCard: { padding: 10, backgroundColor: "#F5F5F5", borderRadius: 6, marginBottom: 8, borderLeft: "3 solid #111111" },
  openingLabel: { fontSize: 8, color: "#6B7280", textTransform: "uppercase", marginBottom: 2 },
  openingValue: { fontSize: 13, fontWeight: 700 },
  transferCard: { padding: 12, backgroundColor: "#FEF3C7", borderRadius: 6, marginTop: 4, marginBottom: 10, border: "1 solid #F59E0B" },
  transferLabel: { fontSize: 9, fontWeight: 700, color: "#92400E", marginBottom: 3 },
  transferValue: { fontSize: 16, fontWeight: 700, color: "#92400E" },
  transferSub: { fontSize: 8, color: "#92400E", marginTop: 3 },
  balanceCard: { padding: 12, backgroundColor: "#00A699", borderRadius: 6, marginBottom: 10 },
  balanceLabel: { fontSize: 8, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", marginBottom: 3 },
  balanceValue: { fontSize: 18, fontWeight: 700, color: "#fff" },
  balanceNote: { fontSize: 7, color: "rgba(255,255,255,0.85)", marginTop: 4, fontStyle: "italic" },
  calcBox: { padding: 10, backgroundColor: "#F9FAFB", borderRadius: 6, border: "1 solid #E5E5E5", marginBottom: 10 },
  calcTitle: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", marginBottom: 5 },
  calcRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  calcRowLabel: { fontSize: 9, color: "#374151" },
  calcRowValue: { fontSize: 9, color: "#111111" },
  calcDivider: { borderTop: "1 solid #D1D5DB", marginVertical: 4 },
  calcTotalLabel: { fontSize: 10, fontWeight: 700 },
  calcTotalValue: { fontSize: 10, fontWeight: 700 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #111111", paddingBottom: 3, marginBottom: 3 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #E5E5E5", paddingVertical: 3 },
  th: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#6B7280" },
  td: { fontSize: 9 },
  colDate: { width: "15%" },
  colDesc: { width: "45%" },
  colPerson: { width: "20%" },
  colAmount: { width: "20%", textAlign: "right" },
  empty: { fontSize: 9, color: "#9B9B9B", marginBottom: 6 },
  recBullet: { flexDirection: "row", marginBottom: 5 },
  recDot: { width: 10, fontSize: 9 },
  recText: { flex: 1, fontSize: 9, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 7, color: "#9B9B9B", textAlign: "center" },
});

function IncomeTable({ rows, currency }: { rows: ReportIncomeRow[]; currency: Currency }) {
  if (rows.length === 0) return <Text style={styles.empty}>No {currency} income recorded this month.</Text>;
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.colDate]}>Date</Text>
        <Text style={[styles.th, styles.colDesc]}>Guest / Source</Text>
        <Text style={[styles.th, styles.colPerson]}>Type</Text>
        <Text style={[styles.th, styles.colAmount]}>Amount</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.td, styles.colDate]}>{r.date}</Text>
          <Text style={[styles.td, styles.colDesc]}>{r.label}{r.sublabel ? ` — ${r.sublabel}` : ""}</Text>
          <Text style={[styles.td, styles.colPerson]}>{r.kind === "booking" ? "Booking" : "Manual"}</Text>
          <Text style={[styles.td, styles.colAmount]}>{fmtCurrencyPdf(r.amount, currency)}</Text>
        </View>
      ))}
    </View>
  );
}

function ExpenseTable({ rows, currency }: { rows: ReportExpenseRow[]; currency: Currency }) {
  if (rows.length === 0) return <Text style={styles.empty}>No {currency} expenses recorded this month.</Text>;
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.colDate]}>Date</Text>
        <Text style={[styles.th, styles.colDesc]}>Description</Text>
        <Text style={[styles.th, styles.colPerson]}>Person</Text>
        <Text style={[styles.th, styles.colAmount]}>Amount</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.td, styles.colDate]}>{r.date}</Text>
          <Text style={[styles.td, styles.colDesc]}>{r.description}</Text>
          <Text style={[styles.td, styles.colPerson]}>{r.person ?? "—"}</Text>
          <Text style={[styles.td, styles.colAmount]}>{fmtCurrencyPdf(r.amount, currency)}</Text>
        </View>
      ))}
    </View>
  );
}

function CalcRow({ label, value, currency, bold = false, plain = false }: { label: string; value: number; currency: Currency; bold?: boolean; plain?: boolean }) {
  return (
    <View style={styles.calcRow}>
      <Text style={bold ? [styles.calcRowLabel, styles.calcTotalLabel] : styles.calcRowLabel}>{label}</Text>
      <Text style={bold ? [styles.calcRowValue, styles.calcTotalValue] : styles.calcRowValue}>
        {plain ? fmtCurrencyPdf(value, currency) : signed(value, currency)}
      </Text>
    </View>
  );
}

export function ReportPdfDocument({ data }: { data: MonthlyReportData }) {
  return (
    <Document title={`${data.propertyName} — ${data.monthLabel} Report`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.propertyName}</Text>
        <Text style={styles.subtitle}>{data.monthLabel} financial report · generated {data.generatedAt}</Text>

        {data.reportTypes.includes("owner") && (
          <View>
            <Text style={styles.sectionHeader}>Owner Report</Text>

            {/* 1. Income overview — both currencies together, per user request 2026-08-04. */}
            <View wrap={false}>
              <Text style={styles.subheading}>Income Overview — {data.monthLabel}</Text>
              <View style={styles.cardRow}>
                {data.sections.map((section) => {
                  const totalIncome = section.current.confirmedIncome + section.current.manualIncomeTotal;
                  return (
                    <View style={styles.card} key={`income-overview-${section.currency}`}>
                      <Text style={styles.cardLabel}>{section.currency} Income</Text>
                      <Text style={styles.cardValue}>{fmtCurrencyPdf(totalIncome, section.currency)}</Text>
                      <Text style={styles.cardSub}>Bookings: {fmtCurrencyPdf(section.current.confirmedIncome, section.currency)}</Text>
                      {section.current.manualIncomeTotal !== 0 && (
                        <Text style={styles.cardSub}>Manual: {fmtCurrencyPdf(section.current.manualIncomeTotal, section.currency)}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {data.sections.map((section) => {
              const { currency, current } = section;
              const alloc = current.allocationPct;
              return (
                <View key={`owner-${currency}`}>
                  <Text style={styles.currencyHeader}>{currency}</Text>

                  {/* 2. Balance carried forward from last month. */}
                  <View style={styles.openingCard} wrap={false}>
                    <Text style={styles.openingLabel}>Balance brought forward from last month</Text>
                    <Text style={styles.openingValue}>{fmtCurrencyPdf(current.owner.prevOwners, currency)}</Text>
                    {current.ownersBalanceStated && (
                      <Text style={{ fontSize: 7, color: "#6B7280", marginTop: 2, fontStyle: "italic" }}>
                        Based on the opening balance you stated for this month, not system history.
                      </Text>
                    )}
                  </View>

                  {/* 3. Income allocation. Management % only shown for EUR — see the
                      Oak & Co. transfer section below for why (GHS Oak & Co already
                      holds its own cut; EUR does not). */}
                  <Text style={styles.subheading}>Income Allocation</Text>
                  <View style={styles.cardRow} wrap={false}>
                    <View style={styles.card}>
                      <Text style={styles.cardLabel}>Owners — {alloc.owners}%</Text>
                      <Text style={styles.cardValue}>{fmtCurrencyPdf(current.owner.ownersAlloc, currency)}</Text>
                    </View>
                    <View style={styles.card}>
                      <Text style={styles.cardLabel}>Operations — {alloc.operations}%</Text>
                      <Text style={styles.cardValue}>{fmtCurrencyPdf(current.owner.opsAlloc, currency)}</Text>
                    </View>
                    {currency === "EUR" && (
                      <View style={styles.card}>
                        <Text style={styles.cardLabel}>{data.managementLabel} — {alloc.management}%</Text>
                        <Text style={styles.cardValue}>{fmtCurrencyPdf(current.management.managementAlloc, currency)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Itemized income backing the overview/allocation figures above. */}
                  <Text style={styles.subheading}>Income — {currency}</Text>
                  <IncomeTable rows={current.incomeRows} currency={currency} />

                  {/* 4. Expenses (Owners + Operations). */}
                  <Text style={styles.subheading}>Expenses</Text>
                  <ExpenseTable rows={current.ownerExpenseRows} currency={currency} />

                  {/* 5. EUR only: Oak & Co.'s share, which the owner must transfer
                      out — Airbnb pays EUR bookings to the owner directly, unlike
                      GHS/local bookings which Oak & Co already collects and holds
                      (Architecture Decision 61). */}
                  {currency === "EUR" && (
                    <View style={styles.transferCard} wrap={false}>
                      <Text style={styles.transferLabel}>{data.managementLabel}&apos;s EUR share — transfer to {data.managementLabel}</Text>
                      <Text style={styles.transferValue}>{fmtCurrencyPdf(current.management.runningBalance, currency)}</Text>
                      <Text style={styles.transferSub}>
                        EUR bookings are paid out to the owner directly — this is {data.managementLabel}&apos;s allocated share that the owner should transfer over.
                      </Text>
                      {current.managementBalanceStated && (
                        <Text style={styles.transferSub}>Based on the opening balance you stated for this month, not system history.</Text>
                      )}
                    </View>
                  )}

                  {/* 6. Final balance calculation, shown as worked arithmetic. */}
                  <Text style={styles.subheading}>Final Balance Calculation</Text>
                  <View style={styles.calcBox} wrap={false}>
                    <Text style={styles.calcTitle}>Owners Running Balance — {currency}</Text>
                    <CalcRow label="Opening balance" value={current.owner.prevOwners} currency={currency} plain />
                    <CalcRow label={`Owners allocation (${alloc.owners}%)`} value={current.owner.ownersAlloc} currency={currency} />
                    <CalcRow label={`Operations allocation (${alloc.operations}%)`} value={current.owner.opsAlloc} currency={currency} />
                    <CalcRow label="Owners expenses" value={-current.owner.ownersExp} currency={currency} />
                    <CalcRow label="Operations expenses" value={-current.owner.opsExp} currency={currency} />
                    {current.owner.manualIncomeTotal !== 0 && (
                      <CalcRow label="Manual income" value={current.owner.manualIncomeTotal} currency={currency} />
                    )}
                    <View style={styles.calcDivider} />
                    <CalcRow label="Owners Running Balance held with management" value={current.owner.runningBalance} currency={currency} bold plain />
                  </View>

                  {currency === "EUR" && (
                    <View style={styles.calcBox} wrap={false}>
                      <Text style={styles.calcTitle}>{data.managementLabel} Transfer Calculation — EUR</Text>
                      <CalcRow label="Opening balance" value={current.management.prevManagement} currency={currency} plain />
                      <CalcRow label={`${data.managementLabel} allocation (${alloc.management}%)`} value={current.management.managementAlloc} currency={currency} />
                      <CalcRow label={`${data.managementLabel} expenses`} value={-current.management.managementExp} currency={currency} />
                      <View style={styles.calcDivider} />
                      <CalcRow label={`Amount to transfer to ${data.managementLabel}`} value={current.management.runningBalance} currency={currency} bold plain />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {data.reportTypes.includes("oakco") && (
          <View>
            <Text style={styles.sectionHeader}>{data.managementLabel} · Internal Report</Text>
            {data.sections.map((section) => (
              <View key={`oakco-${section.currency}`} wrap={false}>
                <Text style={styles.currencyHeader}>{section.currency}</Text>
                <View style={styles.cardRow}>
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>{data.managementLabel} Fund</Text>
                    <Text style={styles.cardValue}>{fmtCurrencyPdf(section.current.management.managementAlloc, section.currency)}</Text>
                    <Text style={styles.cardSub}>Team payments -{fmtCurrencyPdf(section.current.management.managementExp, section.currency)}</Text>
                    <Text style={styles.cardSub}>Balance {fmtCurrencyPdf(section.current.management.managementBalance, section.currency)}</Text>
                  </View>
                </View>
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>{data.managementLabel} Running Balance — {section.currency}</Text>
                  <Text style={styles.balanceValue}>{fmtCurrencyPdf(section.current.management.runningBalance, section.currency)}</Text>
                  {section.current.managementBalanceStated && (
                    <Text style={styles.balanceNote}>Based on an opening balance you stated for this month, not on full system history</Text>
                  )}
                </View>
                <Text style={{ fontSize: 9, fontWeight: 700, marginBottom: 3 }}>Team payments — {section.currency}</Text>
                <ExpenseTable rows={section.current.managementExpenseRows} currency={section.currency} />
              </View>
            ))}
          </View>
        )}

        <View wrap={false}>
          <Text style={styles.sectionHeader}>Recommendations</Text>
          {data.recommendations.map((rec, i) => (
            <View key={i} style={styles.recBullet}>
              <Text style={styles.recDot}>•</Text>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} fixed>
          Generated by MNGO — {data.propertyName} — {data.monthLabel}
        </Text>
      </Page>
    </Document>
  );
}
