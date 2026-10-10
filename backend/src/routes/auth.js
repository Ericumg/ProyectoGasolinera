import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { HttpError } from '../http.js';
import { auth } from '../middleware/auth.js';

const r = Router();

r.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  const [[u]] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? AND activo = TRUE', [usuario]);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
    throw new HttpError(401, 'Usuario o contraseña incorrectos');
  const token = jwt.sign({ id: u.id, nombre: u.nombre, rol: u.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
});

r.get('/me', auth, (req, res) => res.json(req.user));
export default r;
