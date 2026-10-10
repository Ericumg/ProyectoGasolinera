const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const KEY = 'sgbg-session';

export const getSession = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const setSession = (s) => (s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY));

export async function api(path, { method = 'GET', body } = {}) {
  const s = getSession();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(s ? { Authorization: `Bearer ${s.token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && s) { setSession(null); window.dispatchEvent(new Event('sgbg-logout')); }
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}
