import { Router } from 'express';
import { pool, tx } from '../db.js';
import { HttpError, round2 } from '../http.js';
import { roles } from '../middleware/auth.js';

const r = Router();

r.get('/', roles('ADMIN', 'CAJERO'), async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT t.*, u.nombre AS cajero FROM turnos t JOIN usuarios u ON u.id = t.usuario_id
     WHERE t.estado = 'CERRADO' ORDER BY t.id DESC LIMIT 100`);
  res.json(rows);
});

r.get('/actual', async (req, res) => {
  const [[t]] = await pool.query(
    `SELECT v.* FROM v_resumen_turno v JOIN turnos t ON t.id = v.turno_id
     WHERE t.usuario_id = ? AND t.estado = 'ABIERTO'`, [req.user.id]);
  res.json(t || null);
});

r.post('/abrir', roles('ADMIN', 'CAJERO'), async (req, res) => {
  const inicial = Number(req.body.efectivoInicial);
  if (!(inicial >= 0)) throw new HttpError(400, 'Efectivo inicial inválido');
  const [[abierto]] = await pool.query("SELECT id FROM turnos WHERE usuario_id = ? AND estado = 'ABIERTO'", [req.user.id]);
  if (abierto) throw new HttpError(409, 'Ya tienes un turno abierto');
  const [ins] = await pool.query('INSERT INTO turnos (usuario_id, efectivo_inicial) VALUES (?,?)', [req.user.id, inicial]);
  res.status(201).json({ id: ins.insertId });
});

r.post('/cerrar', roles('ADMIN', 'CAJERO'), async (req, res) => {
  const contado = Number(req.body.efectivoContado);
  if (!(contado >= 0)) throw new HttpError(400, 'Efectivo contado inválido');
  const out = await tx(async (c) => {
    const [[t]] = await c.query("SELECT * FROM turnos WHERE usuario_id = ? AND estado = 'ABIERTO' FOR UPDATE", [req.user.id]);
    if (!t) throw new HttpError(404, 'No tienes un turno abierto');
    const [[p]] = await c.query("SELECT COUNT(*) AS n FROM despachos WHERE estado IN ('EN_CURSO','PAUSADO','COMPLETADO')");
    if (p.n > 0) throw new HttpError(409, 'Cobra los despachos pendientes y espera a que las bombas estén inactivas');
    const [[v]] = await c.query("SELECT COALESCE(SUM(total),0) AS efectivo FROM facturas WHERE turno_id = ? AND metodo_pago = 'EFECTIVO'", [t.id]);
    const esperado = round2(t.efectivo_inicial + v.efectivo);
    const diferencia = round2(contado - esperado);
    await c.query(
      "UPDATE turnos SET estado='CERRADO', fecha_cierre=NOW(), efectivo_esperado=?, efectivo_contado=?, diferencia=? WHERE id=?",
      [esperado, contado, diferencia, t.id]);
    return { esperado, contado, diferencia };
  });
  res.json(out);
});
export default r;
