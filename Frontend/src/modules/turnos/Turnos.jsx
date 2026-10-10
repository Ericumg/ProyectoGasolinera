import { useState } from 'react';
import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';
import { shiftTotals } from '../../utils/shift';
import { downloadCSV, printHTML, tableHTML } from '../../utils/export';
import { Q } from '../../utils/format';

export default function Turnos() {
  const { state, dispatch } = useStation();
  const { shift, shifts, invoices, tickets, pumps } = state;
  const [cashier, setCashier] = useState('');
  const [opening, setOpening] = useState(200);
  const [counted, setCounted] = useState('');
  const t = shift ? shiftTotals(invoices, shift.id) : null;
  const expected = shift ? shift.openingCash + t.cash : 0;
  const blocked = tickets.length > 0 || pumps.some((p) => p.state !== 'INACTIVO');
  const head = ['Cajero', 'Apertura', 'Cierre', 'Ventas', 'Efectivo', 'Tarjeta', 'Esperado', 'Contado', 'Diferencia'];
  const rows = shifts.map((s) => [s.cashier, s.openedAt, s.closedAt, s.count, s.cash.toFixed(2), s.card.toFixed(2), s.expected.toFixed(2), s.counted.toFixed(2), s.diff.toFixed(2)]);

  const open = (e) => {
    e.preventDefault();
    if (cashier.trim() && Number(opening) >= 0) dispatch({ type: 'OPEN_SHIFT', cashier: cashier.trim(), openingCash: Number(opening) });
  };
  const close = (e) => {
    e.preventDefault();
    if (counted !== '' && !blocked) { dispatch({ type: 'CLOSE_SHIFT', counted: Number(counted) }); setCounted(''); }
  };

  return (
    <>
      <h2>Turnos</h2>
      {!shift ? (
        <Card title="Abrir turno">
          <form className="row" onSubmit={open}>
            <label>Cajero<input value={cashier} onChange={(e) => setCashier(e.target.value)} placeholder="Nombre" /></label>
            <label>Efectivo inicial (Q)<input type="number" min="0" value={opening} onChange={(e) => setOpening(e.target.value)} /></label>
            <button className="btn green">Abrir turno</button>
          </form>
        </Card>
      ) : (
        <Card title={`Turno abierto · ${shift.cashier}`}>
          <p className="muted">Desde {shift.openedAt} · {t.count} ventas · Efectivo {Q(t.cash)} · Tarjeta {Q(t.card)}</p>
          <p>Efectivo esperado en caja: <b>{Q(expected)}</b> (inicial {Q(shift.openingCash)} + ventas en efectivo)</p>
          <form className="row" onSubmit={close}>
            <label>Efectivo contado (Q)<input type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} /></label>
            <button className="btn red" disabled={blocked || counted === ''}>Cerrar turno</button>
          </form>
          {blocked && <p className="warn">Para cerrar, cobra los despachos pendientes y espera que las bombas estén inactivas.</p>}
        </Card>
      )}
      <Card title="Turnos cerrados">
        {shifts.length === 0 ? <p className="muted">Aún no hay turnos cerrados.</p> : (
          <>
            <div className="row">
              <button className="btn sm" onClick={() => downloadCSV('turnos.csv', [head, ...rows])}>Exportar Excel (CSV)</button>
              <button className="btn sm" onClick={() => printHTML('Turnos cerrados', tableHTML(head, rows))}>Exportar PDF</button>
            </div>
            <div className="scroll"><table>
              <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{shifts.map((s) => (
                <tr key={s.id}><td>{s.cashier}</td><td>{s.openedAt}</td><td>{s.closedAt}</td><td>{s.count}</td><td>{Q(s.cash)}</td><td>{Q(s.card)}</td><td>{Q(s.expected)}</td><td>{Q(s.counted)}</td>
                  <td className={s.diff === 0 ? '' : 'danger'}><b>{Q(s.diff)}</b></td></tr>
              ))}</tbody>
            </table></div>
          </>
        )}
      </Card>
    </>
  );
}
