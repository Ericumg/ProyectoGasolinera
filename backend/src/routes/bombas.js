import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../http.js';
import { roles } from '../middleware/auth.js';

const r = Router();

r.get('/', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.estado, b.combustible_id, c.codigo, c.nombre AS combustible, c.precio_galon
     FROM bombas b JOIN combustibles c ON c.id = b.combustible_id ORDER BY b.id`);
  res.json(rows);
});

r.put('/:id/combustible', roles('ADMIN'), async (req, res) => {
  const [result] = await pool.query(
    "UPDATE bombas SET combustible_id = ? WHERE id = ? AND estado = 'INACTIVO'", [req.body.combustibleId, req.params.id]);
  if (!result.affectedRows) throw new HttpError(409, 'La bomba no existe o no está inactiva');
  res.json({ ok: true });
});
export default r;
