import { useState } from 'react';
import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';
import PumpCard from './PumpCard';
import { Q } from '../../utils/format';

export default function Monitor() {
  const { state, dispatch } = useStation();
  const [pumpId, setPumpId] = useState(1);
  const [amount, setAmount] = useState(100);
  const pump = state.pumps.find((p) => p.id === pumpId);
  const price = state.prices[pump.fuelKey].price;
  const tank = state.tanks.find((t) => t.fuelKey === pump.fuelKey);
  const est = amount > 0 ? amount / price : 0;
  const busy = pump.state !== 'INACTIVO';
  const noStock = tank.currentGallons < est;

  const submit = (e) => {
    e.preventDefault();
    if (amount > 0 && !busy && !noStock) dispatch({ type: 'AUTHORIZE', pumpId, amount: Number(amount) });
  };

  return (
    <>
      <h2>Monitor de bombas</h2>
      <Card title="Autorizar despacho">
        <form className="row" onSubmit={submit}>
          <label>Bomba
            <select value={pumpId} onChange={(e) => setPumpId(Number(e.target.value))}>
              {state.pumps.map((p) => <option key={p.id} value={p.id}>Bomba #{p.id} · {state.prices[p.fuelKey].name}</option>)}
            </select>
          </label>
          <label>Monto (Q)
            <input type="number" min="5" max="2000" step="5" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <p className="hint">≈ <strong>{est.toFixed(2)} galones</strong> a {Q(price)}/gal</p>
          <button className="btn" disabled={busy || noStock}>Iniciar despacho</button>
        </form>
        {busy && <p className="warn">La bomba #{pumpId} está {pump.state.toLowerCase()}.</p>}
        {noStock && !busy && <p className="warn">El tanque no tiene galones suficientes para este monto.</p>}
      </Card>
      <div className="grid">
        {state.pumps.map((p) => <PumpCard key={p.id} pump={p} fuel={state.prices[p.fuelKey]} dispatch={dispatch} />)}
      </div>
    </>
  );
}
