import { Router } from 'express';
import { pool, tx } from '../db.js';
import { HttpError, round2, round3 } from '../http.js';
import { roles } from '../middleware/auth.js';

const r = Router();
const TOLERANCIA_PCT = 0.5;

r.get('/', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT t.*, c.codigo, c.nombre AS combustible FROM tanques t JOIN combustibles c ON c.id = t.combustible_id ORDER BY t.id`);
  res.json(rows);
});

r.get('/conciliaciones', roles('ADMIN', 'CAJERO'), async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM conciliaciones ORDER BY id DESC LIMIT 200');
  res.json(rows.map((x) => ({ ...x, estado: Math.abs(x.porcentaje) <= TOLERANCIA_PCT ? 'OK' : x.diferencia < 0 ? 'MERMA' : 'SOBRANTE' })));
});

// Sin "galones" llena el tanque hasta su capacidad
r.post('/:id/reabastecer', roles('ADMIN'), async (req, res) => {
  await tx(async (c) => {
    const [[t]] = await c.query('SELECT * FROM tanques WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!t) throw new HttpError(404, 'El tanque no existe');
    const galones = round3(req.body.galones ?? t.capacidad_galones - t.galones_actuales);
    if (!(galones > 0) || t.galones_actuales + galones > t.capacidad_galones) throw new HttpError(400, 'Cantidad inválida para este tanque');
    await c.query('UPDATE tanques SET galones_actuales = galones_actuales + ? WHERE id = ?', [galones, t.id]);
    await c.query('INSERT INTO recepciones_combustible (tanque_id, galones, costo_total, proveedor, usuario_id) VALUES (?,?,?,?,?)',
      [t.id, galones, req.body.costoTotal ?? null, req.body.proveedor ?? null, req.user.id]);
  });
  res.json({ ok: true });
});

r.post('/:id/conciliar', roles('ADMIN', 'CAJERO'), async (req, res) => {
  const medidos = Number(req.body.galonesMedidos);
  if (!(medidos >= 0)) throw new HttpError(400, 'Medición inválida');
  const out = await tx(async (c) => {
    const [[t]] = await c.query('SELECT * FROM tanques WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!t) throw new HttpError(404, 'El tanque no existe');
    const diferencia = round3(medidos - t.galones_actuales);
    const porcentaje = t.galones_actuales ? round2((diferencia / t.galones_actuales) * 100) : 0;
    await c.query(
      'INSERT INTO conciliaciones (tanque_id, galones_libro, galones_medidos, diferencia, porcentaje, ajustado, usuario_id) VALUES (?,?,?,?,?,?,?)',
      [t.id, t.galones_actuales, medidos, diferencia, porcentaje, !!req.body.ajustar, req.user.id]);
    if (req.body.ajustar)
      await c.query('UPDATE tanques SET galones_actuales = LEAST(?, capacidad_galones) WHERE id = ?', [medidos, t.id]);
    return { diferencia, porcentaje, estado: Math.abs(porcentaje) <= TOLERANCIA_PCT ? 'OK' : diferencia < 0 ? 'MERMA' : 'SOBRANTE' };
  });
  res.json(out);
});
export default r;
