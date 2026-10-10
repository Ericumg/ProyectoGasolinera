import { useMemo } from 'react';
import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';
import BarChart from '../../components/BarChart';
import { Q } from '../../utils/format';

export default function Reportes() {
  const { state } = useStation();
  const inv = state.invoices;
  const d = useMemo(() => {
    const fuel = {}, hour = {}, pay = {};
    inv.forEach((i) => {
      const n = state.prices[i.fuelKey]?.name || i.fuelName;
      fuel[n] = (fuel[n] || 0) + i.total;
      const h = new Date(i.ts).getHours(); hour[h] = (hour[h] || 0) + i.total;
      pay[i.paymentMethod] = (pay[i.paymentMethod] || 0) + i.total;
    });
    const arr = (o) => Object.entries(o).map(([label, value]) => ({ label, value }));
    return { fuel: arr(fuel), pay: arr(pay), hour: Object.keys(hour).sort((a, b) => a - b).map((h) => ({ label: `${h}:00`, value: hour[h] })) };
  }, [inv, state.prices]);
  const total = inv.reduce((a, i) => a + i.total, 0);
  const gallons = inv.reduce((a, i) => a + i.gallons, 0);

  return (
    <>
      <h2>Reportes de ventas</h2>
      <div className="grid">
        <Card><span className="muted">Ventas totales</span><div className="big">{Q(total)}</div></Card>
        <Card><span className="muted">Galones vendidos</span><div className="big">{gallons.toFixed(2)}</div></Card>
        <Card><span className="muted">Venta promedio</span><div className="big">{Q(inv.length ? total / inv.length : 0)}</div></Card>
      </div>
      <div className="two">
        <Card title="Ventas por combustible"><BarChart data={d.fuel} format={Q} /></Card>
        <Card title="Ventas por método de pago"><BarChart data={d.pay} format={Q} /></Card>
      </div>
      <Card title="Ventas por hora (horas pico)"><BarChart data={d.hour} format={Q} /></Card>
    </>
  );
}
