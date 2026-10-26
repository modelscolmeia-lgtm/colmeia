import { Router } from 'express';
import { DISCORD_AUTH_ATIVO } from '../services/discordAuth.js';
import { CLOUDINARY_ATIVO } from '../services/upload.js';
import { getSite } from '../services/site.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', servico: 'Colmeia API' });
});

// Config pública consumida pelo frontend (ex: mostrar ou não o botão de login do Discord).
// `cloudinary` indica se a hospedagem de imagens está configurada (diagnóstico).
// `siteAberto`/`mensagemPausa`: se o site está pausado para os clientes (sem banco = aberto).
router.get('/config', async (req, res) => {
  let site = { aberto: true, mensagem: '' };
  try {
    site = await getSite();
  } catch {
    /* sem banco: considera o site aberto */
  }
  res.json({
    discordAuth: DISCORD_AUTH_ATIVO,
    cloudinary: CLOUDINARY_ATIVO,
    siteAberto: site.aberto,
    mensagemPausa: site.mensagem,
  });
});

export default router;
