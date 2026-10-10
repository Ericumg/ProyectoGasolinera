import { useState } from 'react';
import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';

export default function Bombas() {
  const { state, dispatch } = useStation();
  const [key, setKey] = useState('SUPER');
  const [price, setPrice] = useState(state.prices.SUPER.price);
  const fuels = Object.values(state.prices);

  const save = (e) => {
    e.preventDefault();
    if (Number(price) > 0) dispatch({ type: 'SET_PRICE', fuelKey: key, price: Number(price) });
  };

  return (
    <>
      <h2>Bombas y precios</h2>
      <Card title="Actualizar precio por galón">
        <form className="row" onSubmit={save}>
          <select value={key} onChange={(e) => { setKey(e.target.value); setPrice(state.prices[e.target.value].price); }}>
            {fuels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input type="number" step="0.10" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button className="btn">Guardar precio</button>
        </form>
      </Card>
      <Card title="Combustible por bomba">
        <table>
          <thead><tr><th>Bomba</th><th>Combustible</th><th>Estado</th><th>Cambiar a</th></tr></thead>
          <tbody>
            {state.pumps.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td><td>{state.prices[p.fuelKey].name}</td><td>{p.state}</td>
                <td>
                  <select value={p.fuelKey} disabled={p.state !== 'INACTIVO'}
                    onChange={(e) => dispatch({ type: 'SET_FUEL', pumpId: p.id, fuelKey: e.target.value })}>
                    {fuels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
