import jwt from 'jsonwebtoken';
import { HttpError } from '../http.js';

export function auth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw new HttpError(401, 'Debes iniciar sesión');
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); }
  catch { throw new HttpError(401, 'Sesión inválida o vencida'); }
  next();
}
export const roles = (...permitidos) => (req, _res, next) => {
  if (!permitidos.includes(req.user.rol)) throw new HttpError(403, 'No tienes permiso para esta acción');
  next();
};
