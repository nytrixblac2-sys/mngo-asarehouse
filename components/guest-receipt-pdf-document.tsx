import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { GuestReceiptData } from "@/lib/guest-receipt";
import type { Currency } from "@/lib/types";

/**
 * Per-stay guest receipt — same @react-pdf/renderer conventions as
 * components/report-pdf-document.tsx (plain Helvetica, "GHS " text
 * instead of the cedi glyph since Helvetica's WinAnsi encoding doesn't
 * include ₵), but its own simpler document: one stay, not one month's
 * allocation math.
 */
function fmtCurrencyPdf(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === "EUR" ? `€${formatted}` : `GHS ${formatted}`;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6B7280", marginBottom: 16 },
  cardRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  card: { flex: 1, padding: 10, backgroundColor: "#F5F5F5", borderRadius: 6 },
  cardLabel: { fontSize: 8, color: "#6B7280", textTransform: "uppercase", marginBottom: 3 },
  cardValue: { fontSize: 12, fontWeight: 700 },
  sectionHeader: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#374151", marginTop: 12, marginBottom: 6 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #111111", paddingBottom: 3, marginBottom: 3 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #E5E5E5", paddingVertical: 3 },
  th: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#6B7280" },
  td: { fontSize: 9 },
  colDesc: { width: "55%" },
  colQty: { width: "15%", textAlign: "right" },
  colAmount: { width: "30%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, marginTop: 8, borderTop: "1 solid #111111" },
  totalLabel: { fontSize: 11, fontWeight: 700 },
  totalValue: { fontSize: 14, fontWeight: 700, color: "#00A699" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 7, color: "#9B9B9B", textAlign: "center" },
});

export function GuestReceiptPdfDocument({ data }: { data: GuestReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.propertyName}</Text>
        <Text style={styles.subtitle}>
          Receipt for {data.guest}{data.bookingCode ? ` · Booking ${data.bookingCode}` : ""}
        </Text>

        <View style={styles.cardRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Check-in</Text>
            <Text style={styles.cardValue}>{data.checkIn}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Check-out</Text>
            <Text style={styles.cardValue}>{data.checkOut}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Room</Text>
            <Text style={styles.cardValue}>{data.roomName}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Payment</Text>
            <Text style={styles.cardValue}>{data.paymentStatus === "CONFIRMED" ? "Paid" : "Due at property"}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Charges</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colDesc]}>Item</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colAmount]}>Amount</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.td, styles.colDesc]}>Room ({data.nights} night{data.nights === 1 ? "" : "s"} × {fmtCurrencyPdf(data.roomRate, data.currency)})</Text>
          <Text style={[styles.td, styles.colQty]}>{data.nights}</Text>
          <Text style={[styles.td, styles.colAmount]}>{fmtCurrencyPdf(data.roomCharge, data.currency)}</Text>
        </View>
        {data.foodRows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.td, styles.colDesc]}>{r.name}</Text>
            <Text style={[styles.td, styles.colQty]}>{r.quantity}</Text>
            <Text style={[styles.td, styles.colAmount]}>{fmtCurrencyPdf(r.amount, data.currency)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmtCurrencyPdf(data.grandTotal, data.currency)}</Text>
        </View>

        <Text style={styles.footer}>Generated {data.generatedAt}{data.checkedOutAt ? ` · Checked out ${data.checkedOutAt.slice(0, 10)}` : ""}</Text>
      </Page>
    </Document>
  );
}
