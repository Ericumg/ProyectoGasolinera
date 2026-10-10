import { useState } from 'react';
import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';
import { TOLERANCIA_PCT } from '../../utils/constants';
import { downloadCSV, printHTML, tableHTML } from '../../utils/export';

export default function Conciliacion() {
  const { state, dispatch } = useStation();
  const [vals, setVals] = useState({});
  const [adjust, setAdjust] = useState(false);
  const recs = state.reconciliations;
  const head = ['Fecha', 'Tanque', 'Libro (gal)', 'Medido (gal)', 'Diferencia', '%', 'Estado'];
  const status = (r) => (Math.abs(r.pct) <= TOLERANCIA_PCT ? 'OK' : r.diff < 0 ? 'Merma: revisar' : 'Sobrante: revisar');
  const rows = recs.map((r) => [r.date, `#${r.tankId} ${r.fuelKey}`, r.book.toFixed(2), r.measured.toFixed(2), r.diff.toFixed(2), r.pct.toFixed(2), status(r)]);

  const apply = (t) => {
    const raw = vals[t.id];
    if (raw === undefined || raw === '' || Number(raw) < 0) return;
    dispatch({ type: 'RECONCILE', tankId: t.id, measured: Number(raw), adjust });
    setVals((v) => ({ ...v, [t.id]: '' }));
  };

  return (
    <>
      <h2>Conciliación de inventario</h2>
      <Card title="Comparar libro vs. medición física">
        <p className="muted">Mide cada tanque con la regla o sonda y escribe los galones. La diferencia contra lo que el sistema descontó por ventas indica mermas, fugas o errores de calibración. Tolerancia: {TOLERANCIA_PCT}%.</p>
        <label className="check"><input type="checkbox" checked={adjust} onChange={(e) => setAdjust(e.target.checked)} /> Ajustar el inventario del sistema al valor medido</label>
        <table>
          <thead><tr><th>Tanque</th><th>Libro (gal)</th><th>Medido (gal)</th><th /></tr></thead>
          <tbody>{state.tanks.map((t) => (
            <tr key={t.id}>
              <td>#{t.id} · {state.prices[t.fuelKey].name}</td>
              <td>{t.currentGallons.toFixed(2)}</td>
              <td><input type="number" min="0" step="0.01" value={vals[t.id] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [t.id]: e.target.value }))} /></td>
              <td><button className="btn sm" onClick={() => apply(t)}>Conciliar</button></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
      <Card title="Historial de conciliaciones">
        {recs.length === 0 ? <p className="muted">Aún no hay conciliaciones.</p> : (
          <>
            <div className="row">
              <button className="btn sm" onClick={() => downloadCSV('conciliacion.csv', [head, ...rows])}>Exportar Excel (CSV)</button>
              <button className="btn sm" onClick={() => printHTML('Conciliación de inventario', tableHTML(head, rows))}>Exportar PDF</button>
            </div>
            <div className="scroll"><table>
              <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{recs.map((r) => (
                <tr key={r.id}><td>{r.date}</td><td>#{r.tankId} {r.fuelKey}</td><td>{r.book.toFixed(2)}</td><td>{r.measured.toFixed(2)}</td>
                  <td>{r.diff.toFixed(2)}</td><td>{r.pct.toFixed(2)}%</td><td className={status(r) === 'OK' ? '' : 'danger'}><b>{status(r)}</b></td></tr>
              ))}</tbody>
            </table></div>
          </>
        )}
      </Card>
    </>
  );
}
