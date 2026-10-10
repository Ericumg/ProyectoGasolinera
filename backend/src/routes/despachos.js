import { Router } from 'express';
import { pool, tx } from '../db.js';
import { HttpError, round3 } from '../http.js';

const r = Router();

const bloquear = async (c, id) => {
  const [[d]] = await c.query('SELECT * FROM despachos WHERE id = ? FOR UPDATE', [id]);
  if (!d) throw new HttpError(404, 'El despacho no existe');
  return d;
};
const montoValido = (d, valor) => {
  const m = valor === undefined ? d.monto_total : Number(valor);
  if (!(m >= 0 && m <= d.monto_objetivo)) throw new HttpError(400, 'Monto fuera de rango');
  return m;
};

// ?estado=COMPLETADO devuelve los pendientes de cobro
r.get('/', async (req, res) => {
  const { estado } = req.query;
  const [rows] = await pool.query(
    `SELECT d.*, c.nombre AS combustible FROM despachos d JOIN combustibles c ON c.id = d.combustible_id
     ${estado ? 'WHERE d.estado = ?' : ''} ORDER BY d.id DESC LIMIT 200`, estado ? [estado] : []);
  res.json(rows);
});

r.post('/', async (req, res) => {
  const { bombaId } = req.body;
  const monto = Number(req.body.monto);
  if (!(monto > 0 && monto <= 2000)) throw new HttpError(400, 'El monto debe estar entre Q1 y Q2000');
  const id = await tx(async (c) => {
    const [[b]] = await c.query(
      'SELECT b.*, f.precio_galon FROM bombas b JOIN combustibles f ON f.id = b.combustible_id WHERE b.id = ? FOR UPDATE', [bombaId]);
    if (!b) throw new HttpError(404, 'La bomba no existe');
    if (b.estado !== 'INACTIVO') throw new HttpError(409, `La bomba está ${b.estado.toLowerCase()}`);
    const [[t]] = await c.query('SELECT galones_actuales FROM tanques WHERE combustible_id = ?', [b.combustible_id]);
    if (!t || t.galones_actuales < monto / b.precio_galon) throw new HttpError(409, 'No hay combustible suficiente en el tanque');
    const [ins] = await c.query(
      'INSERT INTO despachos (bomba_id, combustible_id, precio_galon, monto_objetivo, usuario_id) VALUES (?,?,?,?,?)',
      [bombaId, b.combustible_id, b.precio_galon, monto, req.user.id]);
    await c.query("UPDATE bombas SET estado = 'DESPACHANDO' WHERE id = ?", [bombaId]);
    return ins.insertId;
  });
  res.status(201).json({ id });
});

r.post('/:id/pausar', async (req, res) => {
  await tx(async (c) => {
    const d = await bloquear(c, req.params.id);
    if (d.estado !== 'EN_CURSO') throw new HttpError(409, 'El despacho no está en curso');
    const m = montoValido(d, req.body.montoActual);
    await c.query("UPDATE despachos SET estado = 'PAUSADO', monto_total = ?, galones = ? WHERE id = ?", [m, round3(m / d.precio_galon), d.id]);
    await c.query("UPDATE bombas SET estado = 'PAUSADO' WHERE id = ?", [d.bomba_id]);
  });
  res.json({ ok: true });
});

r.post('/:id/reanudar', async (req, res) => {
  await tx(async (c) => {
    const d = await bloquear(c, req.params.id);
    if (d.estado !== 'PAUSADO') throw new HttpError(409, 'El despacho no está pausado');
    await c.query("UPDATE despachos SET estado = 'EN_CURSO' WHERE id = ?", [d.id]);
    await c.query("UPDATE bombas SET estado = 'DESPACHANDO' WHERE id = ?", [d.bomba_id]);
  });
  res.json({ ok: true });
});

// Cierra el despacho y descuenta los galones del tanque
r.post('/:id/completar', async (req, res) => {
  const out = await tx(async (c) => {
    const d = await bloquear(c, req.params.id);
    if (!['EN_CURSO', 'PAUSADO'].includes(d.estado)) throw new HttpError(409, 'El despacho ya fue cerrado');
    const m = montoValido(d, req.body.montoTotal ?? d.monto_objetivo);
    if (m <= 0) throw new HttpError(400, 'El monto despachado debe ser mayor a 0');
    const galones = round3(m / d.precio_galon);
    const [upd] = await c.query(
      'UPDATE tanques SET galones_actuales = galones_actuales - ? WHERE combustible_id = ? AND galones_actuales >= ?',
      [galones, d.combustible_id, galones]);
    if (!upd.affectedRows) throw new HttpError(409, 'El tanque no tiene galones suficientes');
    await c.query("UPDATE despachos SET estado = 'COMPLETADO', monto_total = ?, galones = ? WHERE id = ?", [m, galones, d.id]);
    await c.query("UPDATE bombas SET estado = 'INACTIVO' WHERE id = ?", [d.bomba_id]);
    return { id: d.id, total: m, galones };
  });
  res.json(out);
});
export default r;
