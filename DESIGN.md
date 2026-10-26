# Design System: Colmeia

Direção definida pelo dono: o **formato do sistema da Casa Luckham (Lyendell)**, mas para venda. Nada de pixel, hexágonos, cantos cortados, bisel ou interruptor de tema. Só tema escuro.

## Overview
Uma loja sóbria e elegante: barra lateral fixa, cabeçalho de página com título serifado e enfeite, painéis de borda fina e cantos levemente arredondados. Ameixa escura de fundo, mel dourado como cor da marca. Foco em vender: imagem grande, nome, descrição curta e preço em cada produto.

## Colors (tokens em `frontend/src/estilo.css`)
- Fundo `--bg #120b1c`, superfícies `--sup #1d1230`, `--sup-2 #251838`, `--sup-3 #31204a`, bordas `--borda #33234d` e `--borda-2 #4a3469`.
- Texto `--texto #f6ead3`, secundário `--texto-2 #d9cdea`, suave `--suave #a999c6`.
- Marca: mel `--mel #ffb800`, `--mel-l #ffd866`, `--mel-d #b88300`. Apoios: verde `#38e0a0` (sucesso), vermelho `#ff6b84` (erro/perigo), azul `#4fc3ff` (info).
- Regra: o mel é a marca (ação principal, seleção, preços); cores de apoio só com função.

## Typography
Títulos em **Playfair Display** (600/700), texto em **DM Sans**. Preços e nomes de produto em serifada. Rótulos pequenos em maiúsculas com espaçamento.

## Layout
Barra lateral de 264px (marca, seções Loja / Pedidos / Artista, cartão do usuário, redes). No celular vira barra superior com gaveta. Conteúdo em contêiner de 1080px (760px nas telas de leitura). Cada página abre com `components/Cabecalho.jsx`.

## Components
- Botões: principal em degradê de mel; `secundario` com contorno; `perigo`, `sucesso`, `pequeno`, `cta`. Raio de 8px.
- Painéis (`.card`): borda de 1px, raio de 12px, fundo em degradê suave e sombra.
- Card de produto (`.vcard`): imagem 4:3, nome serifado, descrição curta, preço em mel e pílula "Escolher/Escolhido". Selecionado: borda de mel.
- Passo a passo do pedido: abas por categoria, avanço automático em escolha única.
- Etapas do pedido: círculos numerados ligados por uma linha; o atual em mel.
- Ícones: `components/Icone.jsx`, traço fino em SVG.

## Do / Don't
- Do: manter sobriedade, espaço e hierarquia; preço sempre visível nos produtos; contraste de 4,5:1; alvos de 44px no celular.
- Don't: pixel, hexágonos, cantos cortados, sombras duras, emoji como ícone, tema claro.
