# CLAUDE.md — Projeto Colmeia

Este arquivo resume todo o contexto, decisões de arquitetura e estado atual do projeto para continuidade no Claude Code.

---

## O que é o Colmeia

Site de encomendas de **Minecraft custom models** (modelos 3D de personagens) para o amigo do Otavio. O cliente acessa o site, monta o pedido escolhendo partes do model (skin, cabelo, chifres, asas, etc.), e o admin (dono do negócio) revisa, precifica e gerencia a fila de produção.

---

## Stack

- **Backend**: Node.js + Express + Mongoose (MongoDB)
- **Frontend**: React + Vite + React Router
- **Banco**: MongoDB Atlas (free tier)
- **Pagamento**: Mercado Pago Checkout Pro — **somente Pix**
- **Deploy futuro**: Frontend → Vercel | Backend → Render ou Railway | Banco → MongoDB Atlas

---

## Fluxo completo do pedido (máquina de estados)

```
Cliente monta o pedido + aceita o termo
        ↓ status: pendente_aprovacao
Admin revisa, ajusta itens fora da tabela, define valor por versão
        ↓ status: orcado
Cliente vê o orçamento → aceita ou recusa
  → recusa: status: recusado_cliente (fim)
  → aceita: status: pagamento_pendente
Cliente paga via Pix (Mercado Pago)
        ↓ status: fila_producao
Pedido entra na fila (posicaoFila atribuída)
Fila visível para todos os usuários logados
Quando o pedido anterior é marcado como concluido:
  → próximo da fila automaticamente vira: em_producao
  → dataEntrouProducao = now()
  → prazo de 20 a 45 dias começa a contar
        ↓ status: concluido (admin marca)
```

**Regra da fila automática**: quando admin marca um pedido como `concluido`, o backend busca o pedido com menor `posicaoFila` dentro de `fila_producao`, muda para `em_producao` e preenche `dataEntrouProducao`.

> ⚠️ **Atualização (pagamento via Pix confirmado no ticket do Discord)**: o gateway automático
> (Mercado Pago) foi **removido**, mas há **confirmação manual de pagamento**. Fluxo hoje:
> `pendente_aprovacao` → `orcado` → (cliente **aceita**) → **`aguardando_pagamento`**
> **+ abre um ticket no Discord** com o orçamento e a forma de pagamento (Pix) → o cliente
> paga a **entrada (50%)** e **envia o comprovante no ticket** → o artista confere a conta e
> **confirma o pagamento** no painel → `fila_producao` → `em_producao` → `concluido`.
> Status atuais: pendente_aprovacao, orcado, recusado_cliente, cancelado, **aguardando_pagamento**,
> fila_producao, em_producao, concluido. Ver "Bot do Discord" nas Observações.

---

## Estrutura de pastas atual

```
colmeia/
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json          (Node ESM, nodemon, express, mongoose, bcryptjs, jsonwebtoken, dotenv)
│   └── src/
│       ├── server.js         ✅ pronto
│       ├── config/
│       │   └── db.js         ✅ pronto
│       ├── middleware/
│       │   └── auth.js       ✅ pronto (autenticar, somenteAdmin)
│       ├── models/
│       │   ├── User.js       ✅ pronto
│       │   ├── CategoriaItem.js ✅ pronto
│       │   ├── Variante.js   ✅ pronto
│       │   ├── Pedido.js     ✅ atualizado (versoes / itensAvulsos / quantidade)
│       │   └── Pagamento.js  ✅ pronto
│       ├── routes/
│       │   ├── health.routes.js ✅ pronto
│       │   └── auth.routes.js   ✅ pronto (POST /api/auth/cadastro, POST /api/auth/login)
│       ├── controllers/      (vazio — ainda não criado)
│       └── services/         (vazio — integração MP vai aqui)
└── frontend/
    ├── package.json          (React, Vite, react-router-dom)
    └── src/
        ├── main.jsx          ✅ pronto
        ├── App.jsx           ✅ pronto (rotas: /, /login, /cadastro, /admin)
        ├── index.css         ✅ pronto (tema dark, paleta marrom/dourado)
        ├── context/
        │   └── AuthContext.jsx ✅ pronto (login, cadastro, logout, token no localStorage)
        ├── services/
        │   └── api.js        ✅ pronto (wrapper de fetch com Bearer token)
        ├── components/
        │   └── RotaProtegida.jsx ✅ pronto
        └── pages/
            ├── Home.jsx          ✅ pronto (provisória)
            ├── Login.jsx         ✅ pronto
            ├── Cadastro.jsx      ✅ pronto
            └── AdminDashboard.jsx ✅ pronto (provisória)
```

---

## Schemas do MongoDB

### User ✅
```js
{ nome, email (unique), senhaHash, role: enum['cliente','admin'] }
```
> Admin é promovido manualmente no banco (campo `role`). Cadastro público sempre cria como `cliente`.

### CategoriaItem ✅
```js
{ nome, slug (unique), ordem, permiteMultiplaSelecao }
```

### Variante ✅
```js
{ categoria (ref), nome, precoMin, precoMax (null se fixo), imagemExemplo (URL), descricao, ativo }
```

### Pedido ✅ IMPLEMENTADO
O schema foi refatorado e está pronto em `backend/src/models/Pedido.js`, exatamente
como o rascunho abaixo. **Decisão de precificação resolvida**: o admin define valor
**por item** (`itemSelecionadoSchema.valorAprovado`); o sistema soma em subtotal e o
admin pode sobrescrever o `valorTotal`. Isso cobre tanto "por versão" quanto "valor
total" sem travar — flexível. Quantidade por item está suportada (`quantidade`).

Schema (implementado):
```js
const itemSelecionadoSchema = {
  variante: ObjectId (ref Variante),
  quantidade: Number (default 1),
  observacao: String,
  valorAprovado: Number, // admin define
}

const versaoModelSchema = {
  nome: String,           // "Versão A", "Versão Negra", etc.
  itens: [itemSelecionadoSchema],
  valorAprovado: Number,  // admin define por versão (se essa for a decisão)
}

const pedidoSchema = {
  cliente: ObjectId (ref User),
  tipo: enum['model', 'item_avulso'], // model ou Espada/Cajado/Escudo
  versoes: [versaoModelSchema],       // só para tipo 'model'
  itensAvulsos: [itemSelecionadoSchema], // só para tipo 'item_avulso'
  itensPersonalizados: [{tipo, descricao, valor}],
  aceiteTermo: { aceito: Boolean, dataAceite: Date },
  status: enum[...],     // ver máquina de estados acima
  valorTotal: Number,
  observacaoAdmin: String,
  posicaoFila: Number,
  dataEntrouProducao: Date,
  prazoEstimado: { min: 20, max: 45 },
}
```

### Pagamento ✅
```js
{ pedido (ref), mercadoPagoId, status: enum['pendente','aprovado','recusado'], valor, qrCodeBase64, qrCodeCopiaECola }
```

---

## Catálogo completo de categorias e variantes

Este é o catálogo a ser inserido via seed script. As imagens de exemplo ainda não existem — usar placeholder por enquanto.

### Categorias do MODEL (tipo: 'model')

| Categoria | Slug | Seleção |
|---|---|---|
| Skin | skin | única por versão |
| Cabelo | cabelo | única por versão |
| Chifres | chifres | múltipla + quantidade |
| Orelhas | orelhas | múltipla + quantidade |
| Expressões | expressoes | múltipla |
| Caudas | caudas | múltipla + quantidade |
| Asas | asas | múltipla |
| Roupas 3D | roupas-3d | múltipla |
| Armaduras | armaduras | única |
| Acessórios | acessorios | múltipla |
| Pets (só voadores) | pets | múltipla |

#### Skin
- Vanilla Simples — R$10
- Vanilla Média — R$15
- Vanilla Detalhada — R$? (a definir com o amigo)

#### Cabelo
- Curto — R$15
- Médio — R$20
- Longo — R$25 a R$35

#### Chifres
- Simples — R$8
- Médio — R$11
- Detalhado — R$15

#### Orelhas
- Humano/Elfo/Goblin/Similares — R$3 a R$5
- Animais ou Complexos — R$6 a R$10

#### Expressões
- Pacote Básico — R$6
- Expressões com Animação — R$5 cada

#### Caudas
> "Caudas" cobre também rabos (mesma coisa) — a categoria "Rabos" foi removida do catálogo.
- Simples — R$10
- Médio — R$15
- Detalhado — R$20

#### Asas
- Simples — R$10
- Médio — R$15
- Detalhado — R$20

#### Roupas 3D
- Capa — R$10
- Vestido/Saia — R$10
- Jaqueta — R$9
- Sobre Tudo da Calça — R$5
- Elemento Específico — R$7

#### Armaduras
- Simples — R$60
- Médio — R$80
- Detalhado — R$100

#### Acessórios
- Chapéu — R$25
- Máscara — R$25
- Espada no Model — R$25
- Acessório Simples — R$6

#### Pets (somente voadores, junto do model)
- Simples — R$45
- Médio — R$60
- Complexo — R$75

### Categorias de ITEM AVULSO (tipo: 'item_avulso', pedido separado)

#### Espada
- Simples — R$45
- Médio — R$60
- Complexa — R$75

#### Cajado
- Simples — R$45
- Médio — R$60
- Complexo — R$75

#### Escudo
- Simples — R$45
- Médio — R$60
- Complexo — R$75

### Campos de texto livre (itensPersonalizados)
- Item Específico (descreva): valor definido pelo admin
- Animação Específica (descreva): R$15 a R$35 (admin confirma)
- Pet Específico (descreva): valor definido pelo admin

---

## Termo de aceite (exibido antes de confirmar pedido)

O cliente deve aceitar explicitamente (checkbox com timestamp) os seguintes termos:

1. **Direito de Imagem**: o artista pode exibir o model criado em portfolio, redes sociais e divulgação, sem identificar o cliente sem autorização.
2. **Direito de Reutilização de Partes Não Principais**: partes como orelhas, chifres, caudas, asas e outros elementos secundários podem ser reutilizados pelo artista como base para futuros trabalhos.

---

## Variáveis de ambiente necessárias

### Backend (.env)
```
PORT=4000
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/colmeia?retryWrites=true&w=majority
JWT_SECRET=string-longa-e-aleatoria

# Discord — bot do ticket. Sem DISCORD_BOT_TOKEN = modo simulação (loga no console).
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_TICKET_CATEGORY_ID=      # ID de uma CATEGORIA (não canal); inválido = cria fora dela
DISCORD_CONVITE=

# Pix mostrado no ticket para o cliente pagar a entrada. Vazio = não exibe.
PIX_CHAVE=
PIX_NOME=

# Discord — login (OAuth2). Sem CLIENT_ID/SECRET, login por Discord fica off (e-mail continua).
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback
DISCORD_ADMIN_IDS=               # IDs Discord dos artistas (viram admin), separados por vírgula

# E-mail (opcional). Sem SMTP_USER/SMTP_PASS = modo simulação (loga no console).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=                      # ex: seu-email@gmail.com (use senha de app)
SMTP_PASS=
EMAIL_FROM=Colmeia <seu-email@gmail.com>
EMAIL_ARTISTA=                  # vazio = avisa todos os admins
APP_URL=http://localhost:5173   # base dos links nos e-mails
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000/api
```

---

## Estado atual (MVP completo e testado de ponta a ponta)

O app inteiro foi implementado e validado pela UI real (cadastro → montar pedido →
orçamento → aceite → pagamento Pix → fila → produção → conclusão). Backend e frontend
buildam limpos, sem erros/warnings no console.

### ✅ Pronto

**Backend**
- Schema do Pedido refatorado (versoes / itensAvulsos / quantidade / valores).
- `CategoriaItem` ganhou `tipo` ('model' | 'item_avulso') e `permiteQuantidade`.
- Seed: `backend/src/scripts/seed.js` (`npm run seed`) — popula todo o catálogo
  (idempotente) e cria o admin inicial.
- Rotas: `GET /api/catalogo` (ativas); pedidos do cliente (criar, meus, detalhe, aceitar,
  recusar); admin (listar por status, orçar, concluir, `GET /api/admin/catalogo` completo,
  CRUD de categorias/variantes); pagamentos (gerar Pix, consultar/polling,
  simular-aprovação); webhook do MP; fila pública. Tudo montado em `server.js`.
- CORS configurável por `CORS_ORIGIN` (vazio = libera tudo, para dev).
- Services: `fila.js` (promoção automática da fila), `mercadopago.js` (Pix real +
  modo simulação), `pagamento.js` (registrar aprovação idempotente), `email.js`
  (notificações por e-mail via nodemailer + modo simulação).
- **Notificações por e-mail** (`services/email.js`): disparadas em cada etapa.
  Cliente: pedido recebido, orçamento pronto, chegando no topo da fila, entrou em
  produção, finalizado. Artista (todos os admins ou `EMAIL_ARTISTA`): novo pedido,
  pagamento confirmado.
  Se o cliente logou via Discord (tem `discordId`), o **ticket é criado privado**: o bot
  nega `ViewChannel` pro @everyone e libera só o cliente, os artistas (`DISCORD_ADMIN_IDS`)
  e o próprio bot — e dá ping no cliente. Sem `discordId`, o canal herda a categoria.
  Sem SMTP configurado, o e-mail roda em **modo simulação** (loga no
  console). Todas são fire-and-forget (não derrubam o fluxo). Testadas de ponta a ponta.

**Frontend**
- Landing, login/cadastro (com Layout/nav), Montar Pedido (model + item avulso +
  quantidade + observação + itens personalizados + estimativa + **modal de termos** ao
  enviar), Meus Pedidos, Detalhe do Pedido (aceite/recusa + pagamento Pix com polling),
  Fila pública, Painel Admin (abas por status + editor de orçamento inline + concluir),
  **Gerenciar Catálogo** (`pages/AdminCatalogo.jsx`, rota `/admin/catalogo`): CRUD de
  categorias e variantes, imagem por URL, ativar/desativar. Miniaturas de imagem aparecem
  no montador quando a variante tem `imagemExemplo`.
- **Nomenclatura da UI**: cada bloco do model é um **personagem** nomeado pelo cliente
  (campo "Nome do personagem", **obrigatório**; pode adicionar mais de um). Internamente o
  schema continua `versoes[]` / `versaoModelSchema.nome` — só a UI usa "personagem".
  Fallback de segurança: "Personagem N" (front) / "Personagem" (backend) se vier vazio.
- **Tema claro/escuro** com toggle na navbar (`components/ThemeToggle.jsx`), padrão
  **escuro**, persistido em `localStorage` (`colmeia_tema`) e aplicado sem flash por
  script no `index.html`. CSS com sistema de tokens por tema (`[data-theme]`).
- `components/Modal.jsx` (modal pixelado reutilizável), checkboxes/radios pixelados,
  valores em alto contraste nos dois temas. Helpers em `src/utils/pedido.js`.

### Decisões tomadas (antes estavam abertas)
- **Precificação**: admin define **valor por item**, sistema soma em subtotal e o admin
  pode sobrescrever o **total**. Cobre os dois modelos (por versão / total). ✔
- **Skin Vanilla Detalhada**: seedada como **R$ 20** com descrição "Valor a confirmar
  com o artista". ⚠ confirmar o valor real com o amigo e ajustar no seed/banco.
- **Imagens de exemplo**: o campo `imagemExemplo` é editável no admin (URL ou upload).
  A imagem do item aparece em **todas as telas** que mostram o nome do item (montador,
  orçamento do admin, resumo, detalhe, editor de itens) via `components/ItemImagem.jsx`
  (miniatura + "clique para ampliar"; placeholder "s/ img" quando não há imagem).
- **Termos e condições**: link para um **documento externo** (`VITE_TERMOS_URL` ou a
  constante `TERMOS_URL` em `utils/pedido.js`). No modal de envio, o aceite só habilita
  **depois** que o cliente abre o documento (mecânica de leitura obrigatória), com aviso
  de que a não leitura é responsabilidade dele.
- **Cores por variante** (ex: pets prontos): `Variante.cores: [{ nome, imagem }]`. No
  montador, variante com cores vira um **card** (`.pet-card`): imagem grande + quadradinhos
  de cor (`.pet-cor`) que **trocam a imagem**; **borda dourada** (`--accent`) quando
  selecionado. A cor escolhida fica em `itemSelecionado.cor`. Editável no admin de catálogo.
- **Login/cadastro via Discord (OAuth2)** (`services/discordAuth.js`): `GET /api/auth/discord`
  → Discord → `GET /api/auth/discord/callback` (acha/cria User por `discordId`, emite JWT,
  redireciona pra `/entrar-discord?token=`). Admins = IDs em `DISCORD_ADMIN_IDS`. O **login
  por e-mail continua** (reserva/artista). `GET /api/config` diz se o Discord está ativo
  (o botão `BotaoDiscord` só aparece se sim). Sem `DISCORD_CLIENT_ID/SECRET`, fica off.
  Config: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `DISCORD_ADMIN_IDS`.
- **Texto por unidade** (`CategoriaItem.textoPorQuantidade`, ativo em **Expressões**): ao
  escolher quantidade N, o montador mostra N campos de texto; salvos em
  `itemSelecionado.descricoes[]`. (No seed, a variante virou "Expressão" com quantidade.)
- **Cupons** (`models/Cupom.js`): artista cria/gerencia em `/admin/cupons` (CRUD); cliente
  **ou** artista aplicam no pedido (`PUT/DELETE /api/pedidos/:id/cupom`). Percentual ou
  fixo; desconto sobre `valorTotal` guardado em `pedido.descontoValor` (+ `pedido.cupom`).
  **Limite por usuário** (`Cupom.usosPorUsuario`, 0 = ilimitado): ao aplicar, conta os
  outros pedidos do mesmo cliente que já usam o cupom (ignora cancelados/recusados) e
  bloqueia se atingiu o limite.
- **Checkbox/radio**: todos com o mesmo estilo (quadradinho preenchido).
- **Pagamento via Pix confirmado manualmente** ⚠️ (o gateway automático Mercado Pago foi
  removido). Quando o cliente **aceita** o orçamento → status **`aguardando_pagamento`** e
  abre-se o **ticket no Discord** com o orçamento + a **forma de pagamento (Pix)**. O cliente
  paga a **entrada (50%)** e **envia o comprovante no ticket**; o artista confere a conta e
  clica **"Confirmar pagamento"** no painel (aba dedicada) → `PUT /api/admin/pedidos/:id/confirmar-pagamento`
  → `entrarNaFila` → `fila_producao`. A chave/nome do Pix vêm de `PIX_CHAVE`/`PIX_NOME` no
  `.env` (mostrados só no ticket). Continuam removidos: rotas de webhook,
  `services/pix.js`/`mercadopago.js`/`pagamento.js`, `models/Pagamento.js`. (As deps
  `qrcode`/`mercadopago` ficaram no package.json, sem uso.)
- **Bot do Discord** (`services/discord.js`, discord.js): no `aceitar`, cria um canal/ticket
  na categoria configurada (nome do canal = **`{numero}-{personagem}`**, ex: `1-aragorn`) e
  posta **duas mensagens** (texto, não embed): (1) o **orçamento formatado** — título
  `🐝 Orçamento — Pedido #N`, `Cliente:` (com **@ping** se o cliente logou pelo Discord),
  `Modelo:`, divisória, lista de itens **com preço** (`• Item [detalhes] — R$ x,xx`, agrupada
  por personagem quando há mais de um), `Observações:`, divisória e **`Valor Total`** (com
  cupom riscando o valor cheio); (2) a **`[ Forma de Pagamento ]`** — Pix 50% início / 50%
  fim, `Chave Pix` + `Nome` (de `PIX_CHAVE`/`PIX_NOME`) e o **lembrete de pagar a entrada e
  enviar o comprovante no ticket**. Helpers `mensagemOrcamento`/`mensagemPagamento` exportados
  (testáveis). Depois posta atualizações no ticket (pagamento confirmado/posição na fila,
  produção começou, concluído). Cada pedido tem `numero` sequencial (`models/Counter.js`,
  atômico). Config: `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_TICKET_CATEGORY_ID`,
  `DISCORD_CONVITE`, `PIX_CHAVE`, `PIX_NOME` (+ `VITE_DISCORD_CONVITE` no front). Sem token →
  **modo simulação** (loga no console). Convive com o Ticket Tool no mesmo servidor (não usa o
  Ticket Tool; é um bot próprio). O cliente informa o `@` do Discord ao aceitar; o link do
  ticket fica em `pedido.discordCanalUrl`.

### Como rodar
```
# backend (terminal 1)
cd backend && npm run seed   # 1x para popular catálogo + admin
cd backend && npm run dev    # API em http://localhost:4000

# frontend (terminal 2)
cd frontend && npm run dev   # http://localhost:5173
```
Admin de teste: **admin@colmeia.com / colmeia123** (criado pelo seed; trocar em prod).

### Próximos passos sugeridos (não-MVP)
- [x] UI de admin para CRUD de catálogo — `pages/AdminCatalogo.jsx` (rota `/admin/catalogo`),
  usa `GET /api/admin/catalogo` (lista tudo, inclui inativas) + as rotas de CRUD já
  existentes. Cria/edita categorias e variantes, define imagem (URL), ativa/desativa.
- [x] Imagens do catálogo via **URL** (campo `imagemExemplo` editável no admin, miniatura
  no montador). Falta só, se quiserem, **upload de arquivo** (Cloudinary/ImgBB) — hoje é
  colar a URL.
- [x] Prontidão pra deploy: `render.yaml` (backend), `frontend/vercel.json` (SPA),
  `.env.example` dos dois, `.gitignore`, CORS por `CORS_ORIGIN`, README com passo a passo.
- [x] Nome do personagem **obrigatório** no montador (era "Versão A"; agora o cliente nomeia).
- [x] **Upload de arquivo de imagem**: `POST /api/admin/upload` (multer, salva em
  `backend/uploads`, servido em `/uploads`, limite 3MB, só imagens). Botão "Enviar imagem"
  no admin de catálogo. Helper `imagemUrl()` no front resolve caminho relativo → origem da
  API. ⚠ No Render free o disco é efêmero (some em redeploy) — pra prod, migrar p/ Cloudinary.
- [x] **Recuperação de senha**: `POST /api/auth/esqueci-senha` + `POST /api/auth/redefinir-senha`
  (token sha256 com validade de 1h, uso único). Páginas `EsqueciSenha.jsx` / `RedefinirSenha.jsx`,
  link no login. Em modo simulação, o link do reset é logado no console.
- [x] **Cancelar pedido** (cliente, antes de pagar): `PUT /api/pedidos/:id/cancelar` → status
  `cancelado` (novo no enum). Botão em `PedidoDetalhe`. Avisa o artista por e-mail.
- [x] **Admin editar itens do pedido**: `PUT /api/admin/pedidos/:id/itens` (antes do pagamento;
  ao salvar volta pra `pendente_aprovacao` e zera o total pra reorçar). Componente
  `components/AdminEditarItens.jsx` no painel (adicionar/remover itens e personagens, mudar
  qtd, editar personalizados).
- [ ] **Depende de você**: confirmar valores com o amigo; colocar `MERCADOPAGO_ACCESS_TOKEN`
  real + webhook público; preencher `SMTP_USER`/`SMTP_PASS` (Gmail senha de app); e
  executar o deploy de fato (Vercel + Render + Atlas prod).

---

## Observações importantes

- **ESM**: o backend usa `"type": "module"` no package.json — todos os imports são `import/export`, não `require`.
- **Admin inicial**: o seed cria/promove `admin@colmeia.com`. Fora isso, promoção é manual no MongoDB (campo `role: "admin"`). Cadastro público sempre cria `cliente`.
- **Pets**: somente voadores estão no catálogo. Pets terrestres só via campo "Pet Específico" (texto livre).
- **Imagens de exemplo**: ainda sem definição de onde hospedar. Opções futuras: Cloudinary (free tier), ImgBB, ou upload direto no Atlas (não recomendado). A definir.
- **Tema visual (atual)**: estilo **Minecraft pixel/retro** com **dois temas** (escuro = padrão, e claro), trocáveis pelo toggle na navbar e persistidos em `localStorage`. Fonte **VT323** (self-hostada em `frontend/public/fonts/vt323.woff2`, `@font-face` no `index.css`). Paleta base: mel `#ffbd26` / mel-escuro `#f09616`, terra `#5d3b23`, grama `#5b8c35`, fundo creme listrado `#fef3c7` (claro) / marrom escuro `#1a1510` (escuro). Bordas grossas, sombras "pixel", cantos retos, botões com `translateY` no `:active`. O CSS usa **tokens por tema** (`[data-theme='dark'|'light']`); as cores de cada elemento vêm desses tokens. Os aliases antigos (`--gold`, `--card`, `--card-2`) seguem definidos nos dois temas (usados em estilos inline). Baseado nos arquivos de referência do portfólio do amigo. Para mudar o tema padrão, altere o fallback `'dark'` no script do `index.html` e no `ThemeToggle`.
- **Modo simulação do Pix**: ativo enquanto `MERCADOPAGO_ACCESS_TOKEN` for o placeholder. Ver `backend/src/services/mercadopago.js`.
