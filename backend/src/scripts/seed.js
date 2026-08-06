/**
 * Popula o banco com o catálogo completo (categorias + variantes)
 * e cria um admin inicial para testes.
 *
 * Rodar:  npm run seed     (a partir da pasta backend)
 *
 * É idempotente: usa upsert por slug/nome, então pode rodar quantas vezes quiser.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import CategoriaItem from '../models/CategoriaItem.js';
import Variante from '../models/Variante.js';
import User from '../models/User.js';

// Estrutura do catálogo. preco: [min, max] — max null quando o valor é fixo.
const CATALOGO = [
  // ===================== CATEGORIAS DO MODEL =====================
  {
    nome: 'Skin', slug: 'skin', tipo: 'model', ordem: 1,
    permiteMultiplaSelecao: false, permiteQuantidade: false,
    variantes: [
      { nome: 'Vanilla Simples', preco: [10, null] },
      { nome: 'Vanilla Média', preco: [15, null] },
      { nome: 'Vanilla Detalhada', preco: [20, null], descricao: 'Valor a confirmar com o artista' },
    ],
  },
  {
    nome: 'Cabelo', slug: 'cabelo', tipo: 'model', ordem: 2,
    permiteMultiplaSelecao: false, permiteQuantidade: false,
    variantes: [
      { nome: 'Curto', preco: [15, null] },
      { nome: 'Médio', preco: [20, null] },
      { nome: 'Longo', preco: [25, 35] },
    ],
  },
  {
    nome: 'Chifres', slug: 'chifres', tipo: 'model', ordem: 3,
    permiteMultiplaSelecao: true, permiteQuantidade: true,
    variantes: [
      { nome: 'Simples', preco: [8, null] },
      { nome: 'Médio', preco: [11, null] },
      { nome: 'Detalhado', preco: [15, null] },
    ],
  },
  {
    nome: 'Orelhas', slug: 'orelhas', tipo: 'model', ordem: 4,
    permiteMultiplaSelecao: true, permiteQuantidade: true,
    variantes: [
      { nome: 'Humano / Elfo / Goblin / Similares', preco: [3, 5] },
      { nome: 'Animais ou Complexos', preco: [6, 10] },
    ],
  },
  {
    nome: 'Expressões', slug: 'expressoes', tipo: 'model', ordem: 5,
    permiteMultiplaSelecao: true, permiteQuantidade: true, textoPorQuantidade: true,
    variantes: [
      { nome: 'Pacote Básico', preco: [6, null] },
      { nome: 'Expressão', preco: [5, null] }, // qtd + o cliente descreve cada uma
    ],
  },
  {
    // "Caudas" cobre também rabos (mesma coisa) — categoria "Rabos" foi removida.
    nome: 'Caudas', slug: 'caudas', tipo: 'model', ordem: 7,
    permiteMultiplaSelecao: true, permiteQuantidade: true,
    variantes: [
      { nome: 'Simples', preco: [10, null] },
      { nome: 'Médio', preco: [15, null] },
      { nome: 'Detalhado', preco: [20, null] },
    ],
  },
  {
    nome: 'Asas', slug: 'asas', tipo: 'model', ordem: 8,
    permiteMultiplaSelecao: true, permiteQuantidade: false,
    variantes: [
      { nome: 'Simples', preco: [10, null] },
      { nome: 'Médio', preco: [15, null] },
      { nome: 'Detalhado', preco: [20, null] },
    ],
  },
  {
    nome: 'Roupas 3D', slug: 'roupas-3d', tipo: 'model', ordem: 9,
    permiteMultiplaSelecao: true, permiteQuantidade: false,
    variantes: [
      { nome: 'Capa', preco: [10, null] },
      { nome: 'Vestido / Saia', preco: [10, null] },
      { nome: 'Jaqueta', preco: [9, null] },
      { nome: 'Sobre Tudo da Calça', preco: [5, null] },
      { nome: 'Elemento Específico', preco: [7, null] },
    ],
  },
  {
    nome: 'Armaduras', slug: 'armaduras', tipo: 'model', ordem: 10,
    permiteMultiplaSelecao: false, permiteQuantidade: false,
    variantes: [
      { nome: 'Simples', preco: [60, null] },
      { nome: 'Médio', preco: [80, null] },
      { nome: 'Detalhado', preco: [100, null] },
    ],
  },
  {
    nome: 'Acessórios', slug: 'acessorios', tipo: 'model', ordem: 11,
    permiteMultiplaSelecao: true, permiteQuantidade: true,
    variantes: [
      { nome: 'Chapéu', preco: [25, null] },
      { nome: 'Máscara', preco: [25, null] },
      { nome: 'Espada no Model', preco: [25, null] },
      { nome: 'Acessório Simples', preco: [6, null] },
    ],
  },
  {
    nome: 'Pets', slug: 'pets', tipo: 'model', ordem: 12,
    permiteMultiplaSelecao: true, permiteQuantidade: true,
    variantes: [
      { nome: 'Simples', preco: [45, null] },
      { nome: 'Médio', preco: [60, null] },
      { nome: 'Complexo', preco: [75, null] },
    ],
  },

  // ===================== ITENS AVULSOS (pedido separado) =====================
  {
    nome: 'Espada', slug: 'espada', tipo: 'item_avulso', ordem: 1,
    permiteMultiplaSelecao: false, permiteQuantidade: true,
    variantes: [
      { nome: 'Simples', preco: [45, null] },
      { nome: 'Média', preco: [60, null] },
      { nome: 'Complexa', preco: [75, null] },
    ],
  },
  {
    nome: 'Cajado', slug: 'cajado', tipo: 'item_avulso', ordem: 2,
    permiteMultiplaSelecao: false, permiteQuantidade: true,
    variantes: [
      { nome: 'Simples', preco: [45, null] },
      { nome: 'Médio', preco: [60, null] },
      { nome: 'Complexo', preco: [75, null] },
    ],
  },
  {
    nome: 'Escudo', slug: 'escudo', tipo: 'item_avulso', ordem: 3,
    permiteMultiplaSelecao: false, permiteQuantidade: true,
    variantes: [
      { nome: 'Simples', preco: [45, null] },
      { nome: 'Médio', preco: [60, null] },
      { nome: 'Complexo', preco: [75, null] },
    ],
  },
];

async function seedCatalogo() {
  for (const cat of CATALOGO) {
    const categoria = await CategoriaItem.findOneAndUpdate(
      { slug: cat.slug },
      {
        nome: cat.nome,
        slug: cat.slug,
        tipo: cat.tipo,
        ordem: cat.ordem,
        permiteMultiplaSelecao: cat.permiteMultiplaSelecao,
        permiteQuantidade: cat.permiteQuantidade,
        textoPorQuantidade: !!cat.textoPorQuantidade,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Migração: renomeia a variante antiga de expressão (idempotente).
    if (cat.slug === 'expressoes') {
      await Variante.updateMany(
        { categoria: categoria._id, nome: 'Expressão com Animação (cada)' },
        { $set: { nome: 'Expressão' } }
      );
    }

    for (const v of cat.variantes) {
      await Variante.findOneAndUpdate(
        { categoria: categoria._id, nome: v.nome },
        {
          categoria: categoria._id,
          nome: v.nome,
          precoMin: v.preco[0],
          precoMax: v.preco[1] ?? undefined,
          descricao: v.descricao,
          ativo: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`  • ${cat.nome} (${cat.variantes.length} variantes)`);
  }
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@colmeia.com').toLowerCase();
  const senha = process.env.ADMIN_SENHA || 'colmeia123';

  const existente = await User.findOne({ email });
  if (existente) {
    if (existente.role !== 'admin') {
      existente.role = 'admin';
      await existente.save();
      console.log(`  • Usuário ${email} promovido a admin`);
    } else {
      console.log(`  • Admin ${email} já existe`);
    }
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  await User.create({ nome: 'Administrador', email, senhaHash, role: 'admin' });
  console.log(`  • Admin criado → email: ${email} | senha: ${senha}`);
}

// Remove categorias que saíram do catálogo (ex: "Rabos" virou "Caudas").
async function removerCategoriasObsoletas() {
  const obsoletas = ['rabos'];
  for (const slug of obsoletas) {
    const cat = await CategoriaItem.findOne({ slug });
    if (cat) {
      await Variante.deleteMany({ categoria: cat._id });
      await CategoriaItem.deleteOne({ _id: cat._id });
      console.log(`  • Categoria removida: ${cat.nome}`);
    }
  }
}

async function run() {
  await connectDB();
  console.log('\n🌱 Populando catálogo...');
  await seedCatalogo();
  await removerCategoriasObsoletas();
  console.log('\n👤 Configurando admin...');
  await seedAdmin();
  console.log('\n✅ Seed concluído.\n');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
