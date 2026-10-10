import { createContext, useContext, useEffect, useReducer } from 'react';
import { INITIAL_STATE, STEP_Q, TICK_MS } from '../utils/constants';
import { round2 } from '../utils/format';
import { shiftTotals } from '../utils/shift';

const KEY = 'sgbg-state-v4';
const StationContext = createContext(null);

// Toda la lógica es pura: sin efectos secundarios dentro del reducer.
function reducer(s, a) {
  switch (a.type) {
    case 'AUTHORIZE': {
      const pump = s.pumps.find((p) => p.id === a.pumpId);
      const tank = s.tanks.find((t) => t.fuelKey === pump.fuelKey);
      const needed = a.amount / s.prices[pump.fuelKey].price;
      if (pump.state !== 'INACTIVO' || tank.currentGallons < needed) return s;
      return { ...s, pumps: s.pumps.map((p) => p.id === a.pumpId
        ? { ...p, state: 'DESPACHANDO', currentTotal: 0, currentGallons: 0, targetTotal: a.amount } : p) };
    }
    case 'TICK': {
      let { tanks, tickets, nextId } = s;
      const pumps = s.pumps.map((p) => {
        if (p.state !== 'DESPACHANDO') return p;
        const price = s.prices[p.fuelKey].price;
        const inc = Math.min(STEP_Q, p.targetTotal - p.currentTotal);
        const g = inc / price;
        const tank = tanks.find((t) => t.fuelKey === p.fuelKey);
        if (tank.currentGallons < g) return { ...p, state: 'PAUSADO' }; // tanque vacío
        tanks = tanks.map((t) => t === tank ? { ...t, currentGallons: t.currentGallons - g } : t);
        const total = round2(p.currentTotal + inc);
        const gallons = p.currentGallons + g;
        if (total >= p.targetTotal) {
          tickets = [...tickets, { id: nextId++, pumpId: p.id, fuelKey: p.fuelKey, fuelName: s.prices[p.fuelKey].name,
            gallons, total, date: new Date().toLocaleString() }];
          return { ...p, state: 'INACTIVO', currentTotal: total, currentGallons: gallons };
        }
        return { ...p, currentTotal: total, currentGallons: gallons };
      });
      return { ...s, pumps, tanks, tickets, nextId };
    }
    case 'STOP': return { ...s, pumps: s.pumps.map((p) => p.id === a.pumpId && p.state === 'DESPACHANDO' ? { ...p, state: 'PAUSADO' } : p) };
    case 'RESUME': return { ...s, pumps: s.pumps.map((p) => p.id === a.pumpId && p.state === 'PAUSADO' ? { ...p, state: 'DESPACHANDO' } : p) };
    case 'SET_PRICE': return { ...s, prices: { ...s.prices, [a.fuelKey]: { ...s.prices[a.fuelKey], price: a.price } } };
    case 'SET_FUEL': return { ...s, pumps: s.pumps.map((p) => p.id === a.pumpId && p.state === 'INACTIVO' ? { ...p, fuelKey: a.fuelKey } : p) };
    case 'PAY':
      if (!s.shift) return s; // se necesita un turno abierto para cobrar
      return { ...s, nextId: s.nextId + 1,
        invoices: [{ ...a.invoice, id: s.nextId, shiftId: s.shift.id, ts: Date.now() }, ...s.invoices],
        tickets: s.tickets.filter((t) => t.id !== a.invoice.ticketId) };
    case 'OPEN_SHIFT':
      if (s.shift) return s;
      return { ...s, nextId: s.nextId + 1, shift: { id: s.nextId, cashier: a.cashier, openingCash: a.openingCash, openedAt: new Date().toLocaleString() } };
    case 'CLOSE_SHIFT': {
      if (!s.shift) return s;
      const t = shiftTotals(s.invoices, s.shift.id);
      const expected = round2(s.shift.openingCash + t.cash);
      return { ...s, shift: null, shifts: [{ ...s.shift, ...t, closedAt: new Date().toLocaleString(), expected, counted: a.counted, diff: round2(a.counted - expected) }, ...s.shifts] };
    }
    case 'RECONCILE': {
      const t = s.tanks.find((x) => x.id === a.tankId);
      const diff = round2(a.measured - t.currentGallons);
      const pct = t.currentGallons ? (diff / t.currentGallons) * 100 : 0;
      return { ...s, nextId: s.nextId + 1,
        reconciliations: [{ id: s.nextId, tankId: t.id, fuelKey: t.fuelKey, book: t.currentGallons, measured: a.measured, diff, pct, adjusted: a.adjust, date: new Date().toLocaleString() }, ...s.reconciliations],
        tanks: a.adjust ? s.tanks.map((x) => x.id === t.id ? { ...x, currentGallons: Math.min(a.measured, x.capacity) } : x) : s.tanks };
    }
    case 'REFILL': return { ...s, tanks: s.tanks.map((t) => t.id === a.tankId ? { ...t, currentGallons: t.capacity } : t) };
    case 'ADD_INCIDENT': return { ...s, nextId: s.nextId + 1,
      incidents: [{ id: s.nextId, pumpId: a.pumpId, description: a.description, status: 'PENDIENTE', date: new Date().toLocaleString() }, ...s.incidents] };
    case 'RESOLVE': return { ...s, incidents: s.incidents.map((i) => i.id === a.id ? { ...i, status: 'RESUELTO' } : i) };
    default: return s;
  }
}

function init() {
  try { return { ...INITIAL_STATE, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return INITIAL_STATE; }
}

export function StationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, init);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin espacio */ }
  }, [state]);

  return <StationContext.Provider value={{ state, dispatch }}>{children}</StationContext.Provider>;
}

export const useStation = () => useContext(StationContext);
