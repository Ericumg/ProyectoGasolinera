import { useState } from 'react';
import { useStation } from '../../context/StationContext';
import Card from '../../components/Card';

export default function Incidencias() {
  const { state, dispatch } = useStation();
  const [pumpId, setPumpId] = useState(1);
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: 'ADD_INCIDENT', pumpId, description: text.trim() });
    setText('');
  };

  return (
    <>
      <h2>Incidencias y mantenimiento</h2>
      <div className="two">
        <Card title="Reportar falla">
          <form className="col" onSubmit={submit}>
            <label>Bomba
              <select value={pumpId} onChange={(e) => setPumpId(Number(e.target.value))}>
                {state.pumps.map((p) => <option key={p.id} value={p.id}>Bomba #{p.id}</option>)}
              </select>
            </label>
            <label>Descripción
              <textarea rows="4" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: fuga leve en la manguera" />
            </label>
            <button className="btn red">Registrar incidencia</button>
          </form>
        </Card>
        <Card title="Reportes">
          {state.incidents.length === 0 && <p className="muted">No hay incidencias reportadas.</p>}
          {state.incidents.map((i) => (
            <div key={i.id} className={`inc ${i.status.toLowerCase()}`}>
              <div className="between"><b>Bomba #{i.pumpId}</b><span>{i.status}</span></div>
              <p>{i.description}</p>
              <small className="muted">{i.date}</small>
              {i.status === 'PENDIENTE' && <div><button className="btn green sm" onClick={() => dispatch({ type: 'RESOLVE', id: i.id })}>Marcar resuelto</button></div>}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
