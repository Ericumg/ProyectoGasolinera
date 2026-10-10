import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['ADMIN', 'CAJERO', 'DESPACHADOR'];
const VACIO = { nombre: '', usuario: '', rol: 'CAJERO', password: '' };

export default function Usuarios() {
  const { user } = useAuth();
  const [lista, setLista] = useState([]);
  const [f, setF] = useState(VACIO);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const cargar = () => api('/usuarios').then(setLista).catch((e) => setMsg({ ok: false, text: e.message }));
  useEffect(() => { cargar(); }, []);

  const run = async (fn, okText) => {
    try { await fn(); setMsg({ ok: true, text: okText }); await cargar(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };
  const crear = (e) => {
    e.preventDefault();
    run(async () => { await api('/usuarios', { method: 'POST', body: f }); setF(VACIO); }, 'Usuario creado');
  };
  const patch = (id, body, text) => run(() => api(`/usuarios/${id}`, { method: 'PATCH', body }), text);
  const nuevaClave = (u) => {
    const p = window.prompt(`Nueva contraseña para ${u.usuario} (mínimo 8 caracteres):`);
    if (p) patch(u.id, { password: p }, 'Contraseña actualizada');
  };

  return (
    <>
      <h2>Usuarios</h2>
      <Card title="Crear usuario">
        <form className="row" onSubmit={crear}>
          <label>Nombre completo<input value={f.nombre} onChange={set('nombre')} /></label>
          <label>Usuario<input value={f.usuario} onChange={set('usuario')} autoComplete="off" /></label>
          <label>Rol
            <select value={f.rol} onChange={set('rol')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label>Contraseña (mín. 8)<input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></label>
          <button className="btn green" disabled={!f.nombre || !f.usuario || f.password.length < 8}>Crear usuario</button>
        </form>
        {msg && <p className={msg.ok ? 'okmsg' : 'warn'}>{msg.text}</p>}
      </Card>
      <Card title="Usuarios del sistema">
        <div className="scroll"><table>
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{lista.map((u) => {
            const yo = u.id === user.id;
            return (
              <tr key={u.id}>
                <td>{u.nombre}{yo && ' (tú)'}</td><td>{u.usuario}</td>
                <td>
                  <select value={u.rol} disabled={yo} onChange={(e) => patch(u.id, { rol: e.target.value }, 'Rol actualizado')}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className={u.activo ? '' : 'danger'}>{u.activo ? 'Activo' : 'Desactivado'}</td>
                <td>
                  <button className="btn sm" onClick={() => nuevaClave(u)}>Cambiar clave</button>{' '}
                  <button className={`btn sm ${u.activo ? 'red' : 'green'}`} disabled={yo}
                    onClick={() => patch(u.id, { activo: !u.activo }, u.activo ? 'Usuario desactivado' : 'Usuario activado')}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </Card>
    </>
  );
}
