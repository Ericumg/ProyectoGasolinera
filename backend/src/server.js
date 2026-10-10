import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { auth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import combustibles from './routes/combustibles.js';
import bombas from './routes/bombas.js';
import despachos from './routes/despachos.js';
import facturas from './routes/facturas.js';
import turnos from './routes/turnos.js';
import tanques from './routes/tanques.js';
import incidencias from './routes/incidencias.js';
import reportes from './routes/reportes.js';
import usuarios from './routes/usuarios.js';

if (!process.env.JWT_SECRET) { console.error('Falta JWT_SECRET en el archivo .env'); process.exit(1); }

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/salud', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);   // login es público
app.use('/api', auth);              // todo lo demás requiere sesión
app.use('/api/combustibles', combustibles);
app.use('/api/bombas', bombas);
app.use('/api/despachos', despachos);
app.use('/api/facturas', facturas);
app.use('/api/turnos', turnos);
app.use('/api/tanques', tanques);
app.use('/api/incidencias', incidencias);
app.use('/api/reportes', reportes);
app.use('/api/usuarios', usuarios);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API lista en http://localhost:${port}`));
