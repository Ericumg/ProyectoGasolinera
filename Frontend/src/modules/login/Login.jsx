import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(usuario.trim(), password); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="login">
      <form className="card col" onSubmit={submit}>
        <h2>SGBG · Iniciar sesión</h2>
        <label>Usuario<input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus /></label>
        <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="warn">{error}</p>}
        <button className="btn" disabled={busy || !usuario || !password}>Entrar</button>
      </form>
    </div>
  );
}
