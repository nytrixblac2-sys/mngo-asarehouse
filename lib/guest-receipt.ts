import { nightsBetween } from "./periods";
import type { Booking, BookingStatus, Currency, Order, Room } from "./types";

export interface ReceiptFoodRow {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface GuestReceiptData {
  propertyName: string;
  guest: string;
  bookingCode: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomName: string;
  roomRate: number;
  roomCharge: number;
  foodRows: ReceiptFoodRow[];
  foodTotal: number;
  grandTotal: number;
  currency: Currency;
  paymentStatus: BookingStatus;
  checkedOutAt: string | null;
  generatedAt: string;
}

/**
 * Builds a per-stay guest receipt — deliberately a separate data shape
 * from lib/reports.ts's MonthlyReportData, not a third ReportType bolted
 * onto it: a receipt is booking/stay-level, not month/allocation-level,
 * and doesn't reuse computeOwnersReport/computeManagementReport at all.
 * Built entirely client-side from data the caller already has loaded
 * (booking, room, orders), same pattern as buildMonthlyReport +
 * GenerateReportModal — no server PDF-rendering route.
 */
export function buildGuestReceipt(params: {
  propertyName: string;
  booking: Booking;
  room: Room | null;
  orders: Order[];
}): GuestReceiptData {
  const { propertyName, booking, room, orders } = params;

  const foodRows: ReceiptFoodRow[] = orders.flatMap((o) =>
    o.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, amount: i.unitPrice * i.quantity }))
  );
  const foodTotal = foodRows.reduce((sum, r) => sum + r.amount, 0);
  const roomCharge = booking.amount;

  return {
    propertyName,
    guest: booking.guest,
    bookingCode: booking.bookingCode,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: nightsBetween(booking.checkIn, booking.checkOut),
    roomName: room?.name ?? "—",
    roomRate: room?.pricePerNight ?? 0,
    roomCharge,
    foodRows,
    foodTotal,
    grandTotal: roomCharge + foodTotal,
    currency: booking.currency,
    paymentStatus: booking.status,
    checkedOutAt: booking.checkedOutAt,
    generatedAt: new Date().toISOString().slice(0, 10),
  };
}
