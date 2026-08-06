import { Router } from 'express';
import { DISCORD_AUTH_ATIVO } from '../services/discordAuth.js';
import { CLOUDINARY_ATIVO } from '../services/upload.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', servico: 'Colmeia API' });
});

// Config pública consumida pelo frontend (ex: mostrar ou não o botão de login do Discord).
// `cloudinary` indica se a hospedagem de imagens está configurada (diagnóstico).
router.get('/config', (req, res) => {
  res.json({ discordAuth: DISCORD_AUTH_ATIVO, cloudinary: CLOUDINARY_ATIVO });
});

export default router;
