// Uso: node scripts/crear-usuario.js admin "Administrador" ADMIN MiClave123
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const [usuario, nombre, rol, clave] = process.argv.slice(2);
if (!clave || !['ADMIN', 'CAJERO', 'DESPACHADOR'].includes(rol)) {
  console.log('Uso: node scripts/crear-usuario.js <usuario> "<Nombre>" <ADMIN|CAJERO|DESPACHADOR> <clave>');
  process.exit(1);
}
const hash = await bcrypt.hash(clave, 10);
await pool.query(
  `INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES (?,?,?,?)
   ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password_hash = VALUES(password_hash), rol = VALUES(rol)`,
  [nombre, usuario, hash, rol]);
console.log('Usuario listo:', usuario);
await pool.end();
