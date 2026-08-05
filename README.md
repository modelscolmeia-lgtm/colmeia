# 🐝 Colmeia

Site de encomendas de **Minecraft custom models**. O cliente monta o pedido escolhendo
as partes do personagem (skin, cabelo, chifres, asas, etc.), e o artista revisa,
precifica, recebe o pagamento via Pix e gerencia a fila de produção.

## Stack

- **Backend:** Node.js + Express + Mongoose (MongoDB Atlas)
- **Frontend:** React + Vite + React Router
- **Pagamento:** Mercado Pago (Pix) — com modo simulação quando sem credenciais
- **E-mail:** Nodemailer — com modo simulação quando sem SMTP

## Rodando localmente

Pré-requisitos: Node 18+ e uma string de conexão do MongoDB (Atlas free serve).

```bash
# 1) Backend
cd backend
cp .env.example .env          # preencha MONGO_URI e JWT_SECRET
npm install
npm run seed                  # popula o catálogo e cria o admin (1x)
npm run dev                   # API em http://localhost:4000

# 2) Frontend (outro terminal)
cd frontend
cp .env.example .env          # VITE_API_URL já aponta pra localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

Admin de teste criado pelo seed: **admin@colmeia.com / colmeia123** (troque em produção
via `ADMIN_EMAIL` / `ADMIN_SENHA` no `.env`).

## Modos de simulação

O app funciona 100% sem credenciais externas, em modo simulação:

- **Pix:** sem um `MERCADOPAGO_ACCESS_TOKEN` real, a tela de pagamento mostra um botão
  "simular pagamento aprovado". Ao configurar o token, o Pix real passa a valer sozinho.
- **E-mail:** sem `SMTP_USER`/`SMTP_PASS`, as notificações apenas aparecem no console do
  backend. Ao configurar o SMTP, passam a ser enviadas de verdade.

### Opção A — Pix manual (mais simples, sem gateway)
Recebe direto na chave Pix do artista. No `.env` do backend:
```
PIX_CHAVE=chave-pix-real-do-artista
PIX_NOME=Nome do Recebedor
PIX_CIDADE=Cidade
```
O app gera o QR/copia-e-cola com o valor do pedido. Como não há confirmação automática,
o cliente clica **"Já fiz o Pix"** e o **artista confirma** no painel (aba "Confirmar Pix")
depois de ver o dinheiro cair na conta. Esse modo tem prioridade sobre o Mercado Pago.

### Opção B — Pix automático (Mercado Pago)
Deixe `PIX_CHAVE` vazio e:
1. Crie uma aplicação em https://www.mercadopago.com.br/developers e pegue o
   **Access Token** de produção.
2. Coloque em `MERCADOPAGO_ACCESS_TOKEN` no `.env` do backend.
3. Para a confirmação automática, configure o webhook do MP apontando para
   `https://SEU-BACKEND/api/webhooks/mercadopago` (em dev, use ngrok).

### Ativar e-mails (Gmail)
1. Ative a verificação em 2 etapas na conta do Gmail e gere uma **senha de app**.
2. No `.env` do backend: `SMTP_USER=seu-email@gmail.com`, `SMTP_PASS=a-senha-de-app`,
   `EMAIL_FROM=Colmeia <seu-email@gmail.com>`.
3. `EMAIL_ARTISTA` (opcional): e-mail que recebe os avisos internos. Vazio = todos os
   admins. `APP_URL` = URL pública do frontend (usada nos links dos e-mails).

## Deploy

📘 **Guia completo e passo a passo em [DEPLOY.md](DEPLOY.md).** Resumo:

- **Banco:** MongoDB Atlas (já usado em dev).
- **Backend → Render:** existe um `render.yaml` na raiz (New > Blueprint no Render).
  Preencha as variáveis de ambiente no dashboard (`MONGO_URI`, `JWT_SECRET`,
  `CORS_ORIGIN` = URL do frontend, e as de MP/e-mail se for usar).
- **Frontend → Vercel:** importe a pasta `frontend` (framework Vite). Defina
  `VITE_API_URL` = `https://SEU-BACKEND/api`. O `vercel.json` já cuida do roteamento SPA.

Depois do deploy, ajuste `CORS_ORIGIN` (backend) para a URL do frontend e `APP_URL` para
a mesma URL, e rode o seed uma vez apontando para o banco de produção.

> **Imagens do catálogo:** o upload salva os arquivos no disco do backend (`/uploads`).
> No Render free o disco é **efêmero** (os arquivos somem a cada redeploy). Para produção,
> use uma URL externa (colar no campo de imagem) ou migre o upload para o Cloudinary.

## Estrutura

```
colmeia/
├── backend/    # API Express + Mongoose (models, rotas, services, seed)
├── frontend/   # SPA React + Vite
├── render.yaml # blueprint de deploy do backend
└── CLAUDE.md   # contexto e decisões de arquitetura (detalhado)
```

O `CLAUDE.md` tem o detalhamento completo do fluxo de estados do pedido, catálogo e
decisões de projeto.
