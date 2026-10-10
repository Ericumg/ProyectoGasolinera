import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';

export default function Inventario() {
  const { state, dispatch } = useStation();
  return (
    <>
      <h2>Tanques subterráneos</h2>
      <div className="grid">
        {state.tanks.map((t) => {
          const pct = (t.currentGallons / t.capacity) * 100;
          const low = pct < 20;
          return (
            <Card key={t.id} title={`Tanque #${t.id} · ${state.prices[t.fuelKey].name}`}>
              <div className={`big ${low ? 'danger' : ''}`}>{t.currentGallons.toFixed(2)} / {t.capacity} gal</div>
              <div className="bar"><div className={low ? 'low' : ''} style={{ width: `${pct}%` }} /></div>
              <div className="between"><span className="muted">Nivel {pct.toFixed(1)}%</span>{low && <b className="danger">Stock bajo</b>}</div>
              <button className="btn full" onClick={() => dispatch({ type: 'REFILL', tankId: t.id })}>Reabastecer tanque</button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
