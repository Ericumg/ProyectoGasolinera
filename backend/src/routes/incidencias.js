import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../http.js';

const r = Router();

r.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM incidencias ORDER BY id DESC LIMIT 200');
  res.json(rows);
});

r.post('/', async (req, res) => {
  const { bombaId, descripcion } = req.body;
  if (!descripcion?.trim()) throw new HttpError(400, 'Describe el problema');
  const [ins] = await pool.query('INSERT INTO incidencias (bomba_id, descripcion, usuario_id) VALUES (?,?,?)',
    [bombaId, descripcion.trim(), req.user.id]);
  res.status(201).json({ id: ins.insertId });
});

r.patch('/:id/resolver', async (req, res) => {
  const [upd] = await pool.query(
    "UPDATE incidencias SET estado = 'RESUELTO', fecha_resolucion = NOW() WHERE id = ? AND estado = 'PENDIENTE'", [req.params.id]);
  if (!upd.affectedRows) throw new HttpError(404, 'Incidencia no encontrada o ya resuelta');
  res.json({ ok: true });
});
export default r;
