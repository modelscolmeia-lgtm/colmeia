import { Router } from 'express';
import { DISCORD_AUTH_ATIVO } from '../services/discordAuth.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', servico: 'Colmeia API' });
});

// Config pública consumida pelo frontend (ex: mostrar ou não o botão de login do Discord).
router.get('/config', (req, res) => {
  res.json({ discordAuth: DISCORD_AUTH_ATIVO });
});

export default router;
