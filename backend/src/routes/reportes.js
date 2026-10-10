import { Router } from 'express';
import { pool } from '../db.js';
import { roles } from '../middleware/auth.js';

const r = Router();
r.use(roles('ADMIN', 'CAJERO'));

r.get('/resumen', async (_req, res) => {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(f.total),0) AS total, COALESCE(SUM(d.galones),0) AS galones, COUNT(f.id) AS transacciones
     FROM facturas f JOIN despachos d ON d.id = f.despacho_id`);
  res.json({ ...row, promedio: row.transacciones ? row.total / row.transacciones : 0 });
});
r.get('/por-combustible', async (_req, res) => res.json((await pool.query('SELECT * FROM v_ventas_por_combustible'))[0]));
r.get('/por-hora', async (_req, res) => res.json((await pool.query('SELECT * FROM v_ventas_por_hora'))[0]));
r.get('/bitacora', roles('ADMIN'), async (_req, res) =>
  res.json((await pool.query('SELECT b.*, u.nombre AS usuario FROM bitacora b LEFT JOIN usuarios u ON u.id = b.usuario_id ORDER BY b.id DESC LIMIT 200'))[0]));
export default r;
