import { Router } from 'express';
import { pool, tx } from '../db.js';
import { HttpError } from '../http.js';
import { roles } from '../middleware/auth.js';

const r = Router();

r.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM combustibles ORDER BY id');
  res.json(rows);
});

r.get('/:id/historial', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT h.*, u.nombre AS usuario FROM precios_historial h LEFT JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.combustible_id = ? ORDER BY h.id DESC LIMIT 50`, [req.params.id]);
  res.json(rows);
});

r.put('/:id/precio', roles('ADMIN'), async (req, res) => {
  const precio = Number(req.body.precio);
  if (!(precio > 0)) throw new HttpError(400, 'Precio inválido');
  await tx(async (c) => {
    const [[f]] = await c.query('SELECT precio_galon FROM combustibles WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!f) throw new HttpError(404, 'El combustible no existe');
    await c.query('UPDATE combustibles SET precio_galon = ? WHERE id = ?', [precio, req.params.id]);
    await c.query('INSERT INTO precios_historial (combustible_id, precio_anterior, precio_nuevo, usuario_id) VALUES (?,?,?,?)',
      [req.params.id, f.precio_galon, precio, req.user.id]);
    await c.query('INSERT INTO bitacora (usuario_id, accion, detalle) VALUES (?,?,?)',
      [req.user.id, 'CAMBIO_PRECIO', `Combustible ${req.params.id}: ${f.precio_galon} -> ${precio}`]);
  });
  res.json({ ok: true });
});
export default r;
