import { useState } from 'react';
import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';
import { IVA } from '../../utils/constants';
import { Q, gal } from '../../utils/format';

export default function Facturacion() {
  const { state, dispatch } = useStation();
  const [sel, setSel] = useState(null);
  const [name, setName] = useState('');
  const [nit, setNit] = useState('CF');
  const [method, setMethod] = useState('EFECTIVO');
  const ticket = state.tickets.find((t) => t.id === sel);

  const pay = (e) => {
    e.preventDefault();
    if (!ticket || !state.shift) return;
    dispatch({ type: 'PAY', invoice: {
      ticketId: ticket.id, pumpId: ticket.pumpId, clientName: name || 'Consumidor Final', nit: nit || 'CF',
      paymentMethod: method, fuelKey: ticket.fuelKey, fuelName: ticket.fuelName, gallons: ticket.gallons, total: ticket.total,
      date: new Date().toLocaleString()
    } });
    setSel(null); setName(''); setNit('CF');
  };

  return (
    <>
      <h2>Facturación y cobro</h2>
      <div className="two">
        <Card title="Despachos pendientes">
          {state.tickets.length === 0 && <p className="muted">No hay despachos por cobrar. Inicia uno desde el Monitor.</p>}
          {state.tickets.map((t) => (
            <button key={t.id} className={`ticket ${sel === t.id ? 'on' : ''}`} onClick={() => setSel(t.id)}>
              <b>Bomba #{t.pumpId} · {t.fuelName}</b>
              <span>{Q(t.total)} · {gal(t.gallons)}</span>
            </button>
          ))}
        </Card>
        <Card title="Emitir factura">
          {!ticket ? <p className="muted">Selecciona un despacho de la lista.</p> : (
            <form className="col" onSubmit={pay}>
              <label>Cliente<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Consumidor Final" /></label>
              <label>NIT / DPI<input value={nit} onChange={(e) => setNit(e.target.value)} /></label>
              <label>Forma de pago
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option>
                </select>
              </label>
              <div className="sum">
                <div>Subtotal: {Q(ticket.total / IVA)}</div>
                <div>IVA 12%: {Q(ticket.total - ticket.total / IVA)}</div>
                <b>Total: {Q(ticket.total)}</b>
              </div>
              {!state.shift && <p className="warn">Abre un turno en la pestaña Turnos para poder cobrar.</p>}
              <button className="btn green" disabled={!state.shift}>Cobrar y emitir factura</button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
