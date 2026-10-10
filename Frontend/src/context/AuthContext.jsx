import { createContext, useContext, useEffect, useState } from 'react';
import { api, getSession, setSession } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession()?.usuario || null);

  useEffect(() => {
    const out = () => setUser(null); // sesión vencida
    window.addEventListener('sgbg-logout', out);
    return () => window.removeEventListener('sgbg-logout', out);
  }, []);

  const login = async (usuario, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { usuario, password } });
    setSession(d); setUser(d.usuario);
  };
  const logout = () => { setSession(null); setUser(null); };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
