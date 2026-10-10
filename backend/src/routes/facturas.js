import { Router } from 'express';
import { pool, tx } from '../db.js';
import { HttpError, round2 } from '../http.js';

const r = Router();
const IVA = 1.12;

r.get('/', async (req, res) => {
  const { turnoId } = req.query;
  const [rows] = await pool.query(
    `SELECT f.*, d.galones, d.bomba_id, c.nombre AS combustible
     FROM facturas f JOIN despachos d ON d.id = f.despacho_id JOIN combustibles c ON c.id = d.combustible_id
     ${turnoId ? 'WHERE f.turno_id = ?' : ''} ORDER BY f.id DESC LIMIT 500`, turnoId ? [turnoId] : []);
  res.json(rows);
});

r.post('/', async (req, res) => {
  const { despachoId, clienteNombre, nit, metodoPago } = req.body;
  if (!['EFECTIVO', 'TARJETA'].includes(metodoPago)) throw new HttpError(400, 'Forma de pago inválida');
  const id = await tx(async (c) => {
    const [[turno]] = await c.query("SELECT id FROM turnos WHERE usuario_id = ? AND estado = 'ABIERTO'", [req.user.id]);
    if (!turno) throw new HttpError(409, 'Abre un turno antes de cobrar');
    const [[d]] = await c.query('SELECT * FROM despachos WHERE id = ? FOR UPDATE', [despachoId]);
    if (!d) throw new HttpError(404, 'El despacho no existe');
    if (d.estado !== 'COMPLETADO') throw new HttpError(409, 'El despacho no está listo para cobrar');
    const subtotal = round2(d.monto_total / IVA);
    const iva = round2(d.monto_total - subtotal);
    const [ins] = await c.query(
      `INSERT INTO facturas (despacho_id, turno_id, cliente_nombre, nit, metodo_pago, subtotal, iva, total)
       VALUES (?,?,?,?,?,?,?,?)`,
      [d.id, turno.id, clienteNombre?.trim() || 'Consumidor Final', nit?.trim() || 'CF', metodoPago, subtotal, iva, d.monto_total]);
    await c.query("UPDATE despachos SET estado = 'FACTURADO' WHERE id = ?", [d.id]);
    return ins.insertId;
  });
  res.status(201).json({ id });
});
export default r;
