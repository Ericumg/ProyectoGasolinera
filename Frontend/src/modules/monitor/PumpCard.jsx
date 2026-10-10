import { Q, gal } from '../../utils/format';

export default function PumpCard({ pump, fuel, dispatch }) {
  return (
    <div className={`card pump ${pump.state.toLowerCase()}`}>
      <div className="between"><h3>Bomba #{pump.id}</h3><span className={`badge ${pump.state.toLowerCase()}`}>{pump.state}</span></div>
      <p className="muted">{fuel.name} · {Q(fuel.price)}/gal</p>
      <div className="display"><b>{Q(pump.currentTotal)}</b><span>{gal(pump.currentGallons)}</span></div>
      {pump.state === 'DESPACHANDO' && <button className="btn red full" onClick={() => dispatch({ type: 'STOP', pumpId: pump.id })}>Paro de emergencia</button>}
      {pump.state === 'PAUSADO' && <button className="btn green full" onClick={() => dispatch({ type: 'RESUME', pumpId: pump.id })}>Reanudar despacho</button>}
    </div>
  );
}
