import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useStation } from './context/StationContext';
import Monitor from './modules/monitor/Monitor';
import Bombas from './modules/bombas/Bombas';
import Facturacion from './modules/facturacion/Facturacion';
import Inventario from './modules/inventario/Inventario';
import Cierre from './modules/cierre/Cierre';
import Incidencias from './modules/incidencias/Incidencias';
import Turnos from './modules/turnos/Turnos';
import Reportes from './modules/reportes/Reportes';
import Conciliacion from './modules/conciliacion/Conciliacion';
import Usuarios from './modules/usuarios/Usuarios';
import Login from './modules/login/Login';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { state } = useStation();
  const { user, logout } = useAuth();
  const pend = state.tickets.length;
  const links = [
    ['/monitor', 'Monitor'], ['/bombas', 'Bombas y precios'],
    ['/facturacion', `Facturación${pend ? ` (${pend})` : ''}`],
    ['/inventario', 'Inventario'], ['/turnos', 'Turnos'], ['/cierre', 'Cierre de caja'], ['/reportes', 'Reportes'], ['/conciliacion', 'Conciliación'], ['/incidencias', 'Incidencias'], ...(user?.rol === 'ADMIN' ? [['/usuarios', 'Usuarios']] : [])
  ];
  if (!user) return <Login />;
  return (
    <div className="app">
      <header className="top"><h1>SGBG · Gestión de gasolinera</h1>
        <span className={`shift ${state.shift ? 'on' : ''}`}>{state.shift ? `Turno abierto: ${state.shift.cashier}` : 'Sin turno abierto'}</span>
        <span className="who">{user.nombre} ({user.rol}) <button className="btn sm" onClick={logout}>Salir</button></span></header>
      <nav className="nav">
        {links.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
      </nav>
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/monitor" replace />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/bombas" element={<Bombas />} />
          <Route path="/facturacion" element={<Facturacion />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/cierre" element={<Cierre />} />
          <Route path="/incidencias" element={<Incidencias />} />
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/conciliacion" element={<Conciliacion />} />
          {user.rol === 'ADMIN' && <Route path="/usuarios" element={<Usuarios />} />}
        </Routes>
      </main>
    </div>
  );
}
