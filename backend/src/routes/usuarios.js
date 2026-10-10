import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { HttpError } from '../http.js';
import { roles } from '../middleware/auth.js';

const r = Router();
r.use(roles('ADMIN'));
const ROLES = ['ADMIN', 'CAJERO', 'DESPACHADOR'];
const validaClave = (p) => {
  if (typeof p !== 'string' || p.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
};
const bitacora = (req, accion, detalle) =>
  pool.query('INSERT INTO bitacora (usuario_id, accion, detalle) VALUES (?,?,?)', [req.user.id, accion, detalle]);

r.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, nombre, usuario, rol, activo, creado_en FROM usuarios ORDER BY id');
  res.json(rows);
});

r.post('/', async (req, res) => {
  const { nombre, usuario, rol, password } = req.body;
  if (!nombre?.trim() || !usuario?.trim()) throw new HttpError(400, 'Nombre y usuario son obligatorios');
  if (!ROLES.includes(rol)) throw new HttpError(400, 'Rol inválido');
  validaClave(password);
  try {
    const hash = await bcrypt.hash(password, 10);
    const [ins] = await pool.query('INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES (?,?,?,?)',
      [nombre.trim(), usuario.trim(), hash, rol]);
    await bitacora(req, 'CREAR_USUARIO', `${usuario.trim()} (${rol})`);
    res.status(201).json({ id: ins.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ese nombre de usuario ya existe');
    throw e;
  }
});

// Cambia rol, activa/desactiva o restablece la contraseña
r.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rol, activo, password } = req.body;
  if (id === req.user.id && (activo === false || (rol !== undefined && rol !== 'ADMIN')))
    throw new HttpError(409, 'No puedes quitarte tu propio acceso de administrador');
  const campos = [], vals = [];
  if (rol !== undefined) { if (!ROLES.includes(rol)) throw new HttpError(400, 'Rol inválido'); campos.push('rol = ?'); vals.push(rol); }
  if (activo !== undefined) { campos.push('activo = ?'); vals.push(!!activo); }
  if (password !== undefined) { validaClave(password); campos.push('password_hash = ?'); vals.push(await bcrypt.hash(password, 10)); }
  if (!campos.length) throw new HttpError(400, 'No hay nada que actualizar');
  const [upd] = await pool.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, [...vals, id]);
  if (!upd.affectedRows) throw new HttpError(404, 'El usuario no existe');
  await bitacora(req, 'EDITAR_USUARIO', `id ${id}: ${Object.keys(req.body).join(', ')}`);
  res.json({ ok: true });
});
export default r;
