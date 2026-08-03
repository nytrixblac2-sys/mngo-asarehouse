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
const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6B7280", marginBottom: 16 },
  sectionHeader: { fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 8, borderBottom: "1 solid #E5E5E5", paddingBottom: 4 },
  currencyHeader: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 6, color: "#374151" },
  cardRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  card: { flex: 1, padding: 10, backgroundColor: "#F5F5F5", borderRadius: 6 },
  cardLabel: { fontSize: 8, color: "#6B7280", textTransform: "uppercase", marginBottom: 3 },
  cardValue: { fontSize: 14, fontWeight: 700 },
  cardSub: { fontSize: 8, color: "#6B7280", marginTop: 2 },
  balanceCard: { padding: 12, backgroundColor: "#00A699", borderRadius: 6, marginBottom: 10 },
  balanceLabel: { fontSize: 8, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", marginBottom: 3 },
  balanceValue: { fontSize: 18, fontWeight: 700, color: "#fff" },
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

export function ReportPdfDocument({ data }: { data: MonthlyReportData }) {
  return (
    <Document title={`${data.propertyName} — ${data.monthLabel} Report`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.propertyName}</Text>
        <Text style={styles.subtitle}>{data.monthLabel} financial report · generated {data.generatedAt}</Text>

        {data.reportTypes.includes("owner") && (
          <View>
            <Text style={styles.sectionHeader}>Owner Report</Text>
            {data.sections.map((section) => (
              <View key={`owner-${section.currency}`} wrap={false}>
                <Text style={styles.currencyHeader}>{section.currency}</Text>
                <View style={styles.cardRow}>
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Owners Fund</Text>
                    <Text style={styles.cardValue}>{fmtCurrencyPdf(section.current.owner.ownersAlloc, section.currency)}</Text>
                    <Text style={styles.cardSub}>Expenses -{fmtCurrencyPdf(section.current.owner.ownersExp, section.currency)}</Text>
                    <Text style={styles.cardSub}>Balance {fmtCurrencyPdf(section.current.owner.ownersBalance, section.currency)}</Text>
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Operations Fund</Text>
                    <Text style={styles.cardValue}>{fmtCurrencyPdf(section.current.owner.opsAlloc, section.currency)}</Text>
                    <Text style={styles.cardSub}>Expenses -{fmtCurrencyPdf(section.current.owner.opsExp, section.currency)}</Text>
                    <Text style={styles.cardSub}>Balance {fmtCurrencyPdf(section.current.owner.opsBalance, section.currency)}</Text>
                  </View>
                </View>
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Owners Running Balance held with management — {section.currency}</Text>
                  <Text style={styles.balanceValue}>{fmtCurrencyPdf(section.current.owner.runningBalance, section.currency)}</Text>
                </View>
                <Text style={{ fontSize: 9, fontWeight: 700, marginBottom: 3 }}>Income — {section.currency}</Text>
                <IncomeTable rows={section.current.incomeRows} currency={section.currency} />
                <Text style={{ fontSize: 9, fontWeight: 700, marginTop: 8, marginBottom: 3 }}>Expenses — {section.currency}</Text>
                <ExpenseTable rows={section.current.ownerExpenseRows} currency={section.currency} />
              </View>
            ))}
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
