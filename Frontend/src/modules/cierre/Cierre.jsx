import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';
import { Q, gal } from '../../utils/format';
import { downloadCSV, printHTML, tableHTML } from '../../utils/export';

export default function Cierre() {
  const { state } = useStation();
  const inv = state.invoices;
  const sum = (m) => inv.filter((i) => !m || i.paymentMethod === m).reduce((a, i) => a + i.total, 0);
  const head = ['Fecha', 'Cliente', 'NIT', 'Combustible', 'Galones', 'Pago', 'Total'];
  const rows = inv.map((i) => [i.date, i.clientName, i.nit, i.fuelName, i.gallons.toFixed(2), i.paymentMethod, i.total.toFixed(2)]);
  const stats = [['Total recaudado', Q(sum())], ['Efectivo', Q(sum('EFECTIVO'))], ['Tarjeta', Q(sum('TARJETA'))], ['Transacciones', inv.length]];

  return (
    <>
      <h2>Cierre de caja</h2>
      <div className="grid">{stats.map(([l, v]) => <Card key={l}><span className="muted">{l}</span><div className="big">{v}</div></Card>)}</div>
      <Card title="Historial de ventas">
        <div className="row">
          <button className="btn sm" disabled={!inv.length} onClick={() => downloadCSV('ventas.csv', [head, ...rows])}>Exportar Excel (CSV)</button>
          <button className="btn sm" disabled={!inv.length} onClick={() => printHTML('Historial de ventas', tableHTML(head, rows))}>Exportar PDF</button>
        </div>
        {inv.length === 0 ? <p className="muted">Aún no hay ventas cobradas.</p> : (
          <div className="scroll"><table>
            <thead><tr><th>Fecha</th><th>Cliente</th><th>NIT</th><th>Combustible</th><th>Volumen</th><th>Pago</th><th>Total</th></tr></thead>
            <tbody>{inv.map((i) => (
              <tr key={i.id}><td>{i.date}</td><td>{i.clientName}</td><td>{i.nit}</td><td>{i.fuelName}</td><td>{gal(i.gallons)}</td><td>{i.paymentMethod}</td><td><b>{Q(i.total)}</b></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
