# 🚀 Guia de deploy — Colmeia

Passo a passo para colocar o Colmeia no ar **de graça**: **banco no MongoDB Atlas**,
**backend no Render** e **frontend no Vercel**. Reserve ~30–40 min.

Você vai precisar de contas (gratuitas) em: **GitHub, MongoDB Atlas, Render, Vercel** e do
**servidor + aplicação do Discord** já configurados (veja `DISCORD.md`).

---

## Passo 0 — Subir o código pro GitHub

O Render e o Vercel puxam o código do GitHub.

```bash
cd colmeia
git init -b main
git add .
git commit -m "Colmeia"
```

Crie um repositório **novo e privado** no GitHub e rode o que ele mostrar:

```bash
git remote add origin https://github.com/SEU-USUARIO/colmeia.git
git push -u origin main
```

> 🔒 O `.gitignore` já garante que os `.env` (com **senha do banco, token do bot, segredo do
> Discord**, etc.) e o `node_modules` **não** vão pro repositório. **Nunca** comite segredos.
> As imagens enviadas em `backend/uploads/` também ficam de fora (são dados de runtime).

---

## Passo 1 — Banco de dados (MongoDB Atlas)

1. Em https://cloud.mongodb.com crie um cluster **gratuito (M0)**.
2. **Database Access** → *Add New Database User* → crie usuário e senha (anote).
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`)
   — o Render usa IPs variáveis.
4. **Connect** → *Drivers* → copie a **connection string**:
   ```
   mongodb+srv://USUARIO:SENHA@cluster.xxxxx.mongodb.net/colmeia?retryWrites=true&w=majority
   ```
   Troque `USUARIO`/`SENHA` e **adicione `/colmeia`** antes do `?` (nome do banco).
   Guarde — é o `MONGO_URI`.

---

## Passo 2 — Backend (Render)

1. Em https://dashboard.render.com → **New +** → **Web Service** → conecte o GitHub e
   escolha o repositório.
2. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
3. Em **Environment**, adicione as variáveis abaixo. As de **Discord** vêm do `DISCORD.md`.

   **Essenciais**
   | Variável | Valor |
   |---|---|
   | `MONGO_URI` | a string do Passo 1 |
   | `JWT_SECRET` | um texto longo e aleatório qualquer |
   | `ADMIN_EMAIL` / `ADMIN_SENHA` | login do admin inicial (reserva) |
   | `APP_URL` | a URL do frontend (preenche depois do Passo 3) |
   | `CORS_ORIGIN` | a URL do frontend (preenche depois do Passo 3) |

   **Discord — bot do ticket** (sem isso os tickets só logam no console)
   | Variável | Valor |
   |---|---|
   | `DISCORD_BOT_TOKEN` | token do bot |
   | `DISCORD_GUILD_ID` | ID do servidor |
   | `DISCORD_TICKET_CATEGORY_ID` | ID de uma **categoria** (onde os tickets abrem) |
   | `DISCORD_CONVITE` | link de convite do servidor |

   **Discord — login (OAuth2)** + **Pix mostrado no ticket**
   | Variável | Valor |
   |---|---|
   | `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | da aplicação no Developer Portal |
   | `DISCORD_REDIRECT_URI` | `https://SUA-API.onrender.com/api/auth/discord/callback` |
   | `DISCORD_ADMIN_IDS` | IDs Discord dos artistas (viram admin), separados por vírgula |
   | `PIX_CHAVE` / `PIX_NOME` | chave e nome do Pix do artista (aparecem no ticket) |

   **E-mail (opcional)** — sem `SMTP_USER`/`SMTP_PASS` roda em modo simulação (loga no console)
   | Variável | Valor |
   |---|---|
   | `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` |
   | `SMTP_USER` / `SMTP_PASS` | e-mail + **senha de app** do Gmail |
   | `EMAIL_FROM` | `Colmeia <seu-email@gmail.com>` |
   | `EMAIL_ARTISTA` | vazio = avisa todos os admins |

   **Imagens (opcional)** — sem isso o upload usa o disco local (efêmero no Render, veja Passo 4)
   | Variável | Valor |
   |---|---|
   | `CLOUDINARY_URL` | `cloudinary://api_key:api_secret@cloud_name` |

4. **Create Web Service**. Ao terminar, anote a URL (ex: `https://colmeia-api.onrender.com`).

> Alternativa: o repositório tem um `render.yaml` — em **New + → Blueprint** o Render lê ele
> e já cria o serviço; você só preenche os **valores** das variáveis (todas com `sync:false`).

### Popular o catálogo em produção (rodar 1x)
No painel do serviço no Render, abra a aba **Shell** e rode:
```bash
npm run seed
```
Cria o catálogo e o admin inicial no banco de produção.

> ⚠️ O plano Free do Render **hiberna** após ~15 min sem uso; a primeira visita depois
> disso demora ~30–50s para "acordar". É normal.

---

## Passo 3 — Frontend (Vercel)

1. Em https://vercel.com → **Add New → Project** → importe o mesmo repositório.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (detectado sozinho)
3. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = `https://SUA-API.onrender.com/api` (a URL do Passo 2 **+ `/api`**)
   - `VITE_DISCORD_CONVITE` = link de convite do servidor (mesmo do `DISCORD_CONVITE`)
   - `VITE_TERMOS_URL` = URL do seu documento de termos e condições
4. **Deploy**. Anote a URL final (ex: `https://colmeia.vercel.app`).

### Fechar o ciclo (importante)
Agora que você tem a URL do frontend, volte no **Render** e preencha:
- `CORS_ORIGIN` = `https://colmeia.vercel.app`
- `APP_URL` = `https://colmeia.vercel.app`

Salve (o Render reinicia sozinho). O `vercel.json` já cuida do roteamento das páginas
(abrir/atualizar em `/admin`, `/pedido/...` etc. funciona).

---

## Passo 4 — Discord em produção (ajustes finais)

O bot e o login por Discord usam a **mesma aplicação** (veja `DISCORD.md` para criar tudo).
Para produção, confira 2 coisas no https://discord.com/developers/applications:

1. **OAuth2 → Redirects:** adicione **exatamente**
   `https://SUA-API.onrender.com/api/auth/discord/callback`
   (o mesmo valor de `DISCORD_REDIRECT_URI` no Render). Sem isso, o login por Discord dá erro
   de "redirect_uri mismatch".
2. **Bot:** ele precisa estar **no servidor** com permissão de **Gerenciar Canais** (para abrir
   os tickets). O `DISCORD_TICKET_CATEGORY_ID` tem que ser o ID de uma **categoria** (clique
   direito no nome da categoria → *Copiar ID*), não de um canal.

> Sem as variáveis do Discord, o site **continua funcionando** com login por e-mail e os
> tickets em modo simulação (aparecem só no log do Render) — útil para um primeiro teste.

---

## Passo 5 — Imagens persistentes (Cloudinary, opcional mas recomendado)

No plano Free do Render o disco é **efêmero**: imagens enviadas somem a cada redeploy.
Para hospedagem permanente:

1. Crie conta grátis em https://cloudinary.com.
2. No **Dashboard**, copie a **API Environment variable** (`CLOUDINARY_URL`), no formato
   `cloudinary://api_key:api_secret@cloud_name`.
3. Coloque em `CLOUDINARY_URL` no Render. Pronto — os uploads passam a ir pro Cloudinary.

---

## Passo 6 — Pagamento (Pix manual)

Não há gateway automático: o pagamento é **combinado e confirmado no ticket do Discord**.

1. Preencha `PIX_CHAVE` e `PIX_NOME` no Render — eles aparecem na mensagem do ticket.
2. O cliente **aceita** o orçamento → abre o ticket com o orçamento + a chave Pix → ele paga a
   **entrada (50%)** e **envia o comprovante no ticket**.
3. O artista confere a conta e clica **"Confirmar pagamento"** no painel → o pedido vai pra
   **fila de produção**.

---

## Checklist final

- [ ] Abrir `https://colmeia.vercel.app` — a landing carrega.
- [ ] Login como admin (`ADMIN_EMAIL` / `ADMIN_SENHA`) → painel abre.
- [ ] Login por Discord funciona (o artista, com ID em `DISCORD_ADMIN_IDS`, vira admin).
- [ ] Criar conta de cliente → montar um pedido → aparece no painel do admin.
- [ ] Orçar → cliente aceita → **abre o ticket no Discord** com o orçamento + Pix.
- [ ] Cliente envia o comprovante → admin clica **"Confirmar pagamento"** → vai pra fila.
- [ ] E-mails chegando (se configurou SMTP) — senão, é modo simulação.

Qualquer erro: os logs ficam em **Render → Logs** (backend) e
**Vercel → Deployments → Logs** (frontend).
