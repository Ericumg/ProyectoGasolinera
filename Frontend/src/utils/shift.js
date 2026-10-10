import { round2 } from './format';
export function shiftTotals(invoices, shiftId) {
  const mine = invoices.filter((i) => i.shiftId === shiftId);
  const sum = (m) => round2(mine.filter((i) => i.paymentMethod === m).reduce((a, i) => a + i.total, 0));
  const cash = sum('EFECTIVO'), card = sum('TARJETA');
  return { cash, card, total: round2(cash + card), count: mine.length };
}
