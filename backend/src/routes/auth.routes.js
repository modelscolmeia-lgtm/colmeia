import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { notificarResetSenha } from '../services/email.js';
import { autenticar } from '../middleware/auth.js';
import {
  DISCORD_AUTH_ATIVO,
  urlAutorizacao,
  trocarCodigo,
  ehAdminDiscord,
} from '../services/discordAuth.js';

const router = Router();

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

function gerarToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, nome: user.nome },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// GET /api/auth/me — dados do usuário logado (usado após o login via Discord)
router.get('/me', autenticar, async (req, res) => {
  const user = await User.findById(req.usuario.id).select('nome email role avatar discordUsername');
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json({ id: user._id, nome: user.nome, email: user.email, role: user.role, avatar: user.avatar });
});

// GET /api/auth/discord — redireciona o navegador para o Discord autorizar
router.get('/discord', (req, res) => {
  if (!DISCORD_AUTH_ATIVO) return res.status(400).json({ erro: 'Login por Discord não configurado' });
  const state = crypto.randomBytes(8).toString('hex');
  res.redirect(urlAutorizacao(state));
});

// GET /api/auth/discord/callback — Discord volta com o "code"
router.get('/discord/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${APP_URL}/login?erro=discord`);

    const perfil = await trocarCodigo(code); // { id, username, email, avatar }
    const emailUso = (perfil.email || `${perfil.id}@discord.local`).toLowerCase();

    let user = await User.findOne({ discordId: perfil.id });
    if (!user) {
      // vincula a uma conta existente pelo e-mail, ou cria nova
      user = perfil.email ? await User.findOne({ email: emailUso }) : null;
      if (!user) {
        user = new User({ nome: perfil.username, email: emailUso, role: 'cliente' });
      }
      user.discordId = perfil.id;
    }
    user.discordUsername = perfil.username;
    user.avatar = perfil.avatar || user.avatar;
    if (ehAdminDiscord(perfil.id)) user.role = 'admin'; // artistas viram admin
    await user.save();

    const token = gerarToken(user);
    res.redirect(`${APP_URL}/entrar-discord?token=${token}`);
  } catch (err) {
    res.redirect(`${APP_URL}/login?erro=${encodeURIComponent(err.message)}`);
  }
});

// Cadastro — sempre cria como "cliente". Admins são promovidos manualmente no banco.
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha nome, email e senha' });
    }

    const existente = await User.findOne({ email: email.toLowerCase() });
    if (existente) {
      return res.status(409).json({ erro: 'Já existe uma conta com esse email' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const user = await User.create({ nome, email, senhaHash });

    const token = gerarToken(user);
    res.status(201).json({
      token,
      usuario: { id: user._id, nome: user.nome, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar', detalhe: err.message });
  }
});

// Login — usado tanto por clientes quanto por admins
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ erro: 'Email ou senha inválidos' });
    if (!user.senhaHash) return res.status(401).json({ erro: 'Essa conta usa login pelo Discord' });

    const senhaConfere = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaConfere) return res.status(401).json({ erro: 'Email ou senha inválidos' });

    const token = gerarToken(user);
    res.json({
      token,
      usuario: { id: user._id, nome: user.nome, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao fazer login', detalhe: err.message });
  }
});

// POST /api/auth/esqueci-senha — gera um token e envia link por e-mail.
// Responde 200 mesmo se o e-mail não existir (não revela quem tem conta).
router.post('/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;
    const user = email ? await User.findOne({ email: email.toLowerCase() }) : null;

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = hashToken(token);
      user.resetTokenExpira = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await user.save();

      const link = `${APP_URL}/redefinir-senha/${token}`;
      notificarResetSenha(user.email, link); // fire-and-forget (simulação loga no console)
    }

    res.json({ ok: true, mensagem: 'Se existir uma conta com esse e-mail, enviamos um link.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao solicitar redefinição', detalhe: err.message });
  }
});

// POST /api/auth/redefinir-senha — troca a senha usando o token do e-mail.
router.post('/redefinir-senha', async (req, res) => {
  try {
    const { token, senha } = req.body;
    if (!token || !senha) return res.status(400).json({ erro: 'Token e nova senha são obrigatórios' });
    if (senha.length < 6) return res.status(400).json({ erro: 'A senha precisa ter ao menos 6 caracteres' });

    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpira: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ erro: 'Link inválido ou expirado' });

    user.senhaHash = await bcrypt.hash(senha, 10);
    user.resetTokenHash = undefined;
    user.resetTokenExpira = undefined;
    await user.save();

    res.json({ ok: true, mensagem: 'Senha redefinida com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao redefinir senha', detalhe: err.message });
  }
});

export default router;
