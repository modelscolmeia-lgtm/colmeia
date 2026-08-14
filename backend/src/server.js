import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import tiposRoutes from './routes/tipos.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import adminRoutes from './routes/admin.routes.js';
import filaRoutes from './routes/fila.routes.js';
import { iniciarBot } from './services/discord.js';

const app = express();

// CORS: em produção, defina CORS_ORIGIN (lista separada por vírgula) no .env.
// Sem essa variável, libera qualquer origem (bom para desenvolvimento).
const origensPermitidas = process.env.CORS_ORIGIN?.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origensPermitidas?.length ? origensPermitidas : true }));

app.use(express.json());

// imagens enviadas pelo admin (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/tipos', tiposRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fila', filaRoutes);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  iniciarBot(); // conecta o bot do Discord (se configurado)
  app.listen(PORT, () => {
    console.log(`🐝 Colmeia API rodando na porta ${PORT}`);
  });
});
