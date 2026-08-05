# 💬 Configurar o Discord (bot + login)

Tudo fica numa **única aplicação** no Discord Developer Portal. No fim, você preenche
umas variáveis no `.env` (ou no Render, em produção). Leva ~15 min.

Antes de tudo, no app do Discord: **Configurações do Usuário → Avançado → Modo
desenvolvedor: LIGADO** (isso libera o "Copiar ID" com o botão direito).

---

## 1. Criar a aplicação
1. Acesse https://discord.com/developers/applications → **New Application** → dê o nome
   "Colmeia" → **Create**.
2. Na aba **General Information**, copie o **Application ID** → é o `DISCORD_CLIENT_ID`.

## 2. Login (OAuth2)
Na aba **OAuth2**:
1. Em **Client Secret**, clique **Reset Secret** e copie → é o `DISCORD_CLIENT_SECRET`.
2. Em **Redirects**, clique **Add Redirect** e cole:
   ```
   http://localhost:4000/api/auth/discord/callback
   ```
   (depois, em produção, adicione também `https://SUA-API.onrender.com/api/auth/discord/callback`)
   → esse valor é o `DISCORD_REDIRECT_URI`. **Salve**.

## 3. Bot (tickets)
Na aba **Bot**:
1. Clique **Reset Token** e copie → é o `DISCORD_BOT_TOKEN`. (Guarde bem, não compartilhe.)
2. Não precisa ligar nenhum "Privileged Gateway Intent".

## 4. Colocar o bot no seu servidor
Ainda no portal, aba **OAuth2 → URL Generator**:
1. Em **Scopes**, marque **`bot`**.
2. Em **Bot Permissions**, marque:
   **Manage Channels, Manage Roles, View Channels, Send Messages, Attach Files,
   Read Message History**.
   *(Ou, pra simplificar, marque só **Administrator**.)*
3. Copie a URL gerada lá embaixo, abra no navegador, escolha **seu servidor** → **Authorize**.

## 5. Pegar os IDs (com o Modo desenvolvedor ligado)
- **Servidor:** clique com o botão direito no ícone do servidor → **Copiar ID do servidor**
  → `DISCORD_GUILD_ID`.
- **Categoria dos tickets:** crie uma categoria no servidor (ex: `🎫 Pedidos`), clique com o
  direito nela → **Copiar ID** → `DISCORD_TICKET_CATEGORY_ID`.
- **Seu ID (admin):** clique com o direito no seu nome → **Copiar ID do usuário** →
  `DISCORD_ADMIN_IDS` (coloque o seu e o do seu amigo separados por vírgula, ex:
  `12345,67890`). Quem estiver nessa lista vira admin ao entrar com o Discord.

## 6. Link de convite (pro cliente entrar no servidor)
No servidor → **Convidar Pessoas** → **Editar link do convite** → deixe
**"Expira após: Nunca"** e **"Número máximo de usos: Sem limite"** → copie o link.
→ vai em `DISCORD_CONVITE` (backend) **e** `VITE_DISCORD_CONVITE` (frontend).

---

## 7. Onde colar

**Local** — em `backend/.env`:
```
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
DISCORD_TICKET_CATEGORY_ID=...
DISCORD_CONVITE=https://discord.gg/xxxx
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback
DISCORD_ADMIN_IDS=seu_id,id_do_amigo
```
E em `frontend/.env`:
```
VITE_DISCORD_CONVITE=https://discord.gg/xxxx
```
Depois **reinicie** o backend (`npm run dev`) e o frontend.

**Produção (Render/Vercel):** coloque as mesmas variáveis nas **Environment Variables** do
serviço. Lembre de trocar `DISCORD_REDIRECT_URI` pela URL de produção **e** adicionar essa
URL nos **Redirects** do portal do Discord (passo 2).

---

## Checklist rápido
- [ ] Bot aparece no seu servidor (offline até você rodar o backend).
- [ ] Ao abrir o site, o botão **"Entrar com Discord"** aparece no login.
- [ ] Entrar com Discord funciona; seu usuário vira **admin** (porque seu ID está em
      `DISCORD_ADMIN_IDS`).
- [ ] Aceitar um orçamento cria um **canal privado** na categoria de tickets, com as infos
      do pedido e um ping pra você.

Se algo não abrir o ticket, confira: o bot tem permissão de **Gerenciar Canais/Cargos** e o
`DISCORD_TICKET_CATEGORY_ID` é de uma **categoria** (não de um canal comum).
