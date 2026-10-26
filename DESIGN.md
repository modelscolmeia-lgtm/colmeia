---
name: Colmeia
description: Vitrine pixel de Minecraft custom models, em mel e ameixa, com cores de apoio vivas para um público jovem.
colors:
  plum-night: "#170f22"
  plum-card: "#251838"
  plum-card-raised: "#31204a"
  plum-field: "#1e1330"
  plum-line: "#5a4380"
  ink-black: "#0b0612"
  honey: "#ffb800"
  honey-deep: "#e0a000"
  honey-light: "#ffd866"
  on-honey: "#1a1000"
  lemon: "#ffe14d"
  mint: "#38e0a0"
  sky: "#4fc3ff"
  coral: "#ff6b84"
  violet: "#a06bff"
  cream-text: "#fff4dd"
  lilac-muted: "#cdbde3"
  lavender-paper: "#f6f1ff"
  lavender-raised: "#f0e8ff"
  grape-ink: "#1e1235"
  grape-heading: "#3a1d78"
  grape-muted: "#4b3f68"
  grape-line: "#2a1a4a"
  amber-value: "#8a5410"
  violet-link: "#5b2fd0"
typography:
  display:
    fontFamily: "VT323, monospace"
    fontSize: "2.6rem"
    fontWeight: 400
    lineHeight: 1.1
  headline:
    fontFamily: "VT323, monospace"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "VT323, monospace"
    fontSize: "1.4rem"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "VT323, monospace"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "VT323, monospace"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.honey}"
    textColor: "{colors.on-honey}"
    rounded: "{rounded.none}"
    padding: "8px 18px"
  button-primary-hover:
    backgroundColor: "{colors.honey-deep}"
  button-secondary:
    backgroundColor: "{colors.plum-card}"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.none}"
    padding: "8px 18px"
  card:
    backgroundColor: "{colors.plum-card}"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.none}"
    padding: "20px"
  product-card:
    backgroundColor: "{colors.plum-card}"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.none}"
  field:
    backgroundColor: "{colors.plum-field}"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.none}"
    padding: "10px"
  summary-bar:
    backgroundColor: "{colors.plum-card-raised}"
    textColor: "{colors.cream-text}"
    rounded: "{rounded.none}"
    padding: "10px 76px 10px 16px"
---

# Design System: Colmeia

## Overview

**Creative North Star: "A Vitrine do Artista"**

A Colmeia é uma loja de arte encomendada, e a arte do artista é a estrela. A interface é a prateleira: ameixa escura de fundo, mel como cor da marca e cores de apoio que se acendem só onde há informação (preço, estado, categoria). O pixel é a assinatura, vem das bordas grossas, das sombras duras e da fonte VT323, mas o resto é de loja: cards com imagem grande, preço sempre visível e um caminho claro até pedir.

O tom é tátil e divertido, para quem joga Minecraft e chega pelo celular vindo do Discord ou do TikTok. Cada botão e cada card parece um objeto que dá para apertar: a sombra afunda ao clicar. Nada é macio, nada é arredondado, nada é gradiente.

**Key Characteristics:**
- Fundo ameixa com mel como única cor de marca; as demais cores só aparecem com função.
- Cantos retos, borda grossa e sombra pixel em todos os objetos clicáveis.
- Imagem grande no centro de cada produto; texto curto em volta.
- Dois temas completos (escuro é o padrão, claro em lavanda), desenhados em conjunto.

## Colors

Mel sobre ameixa. As cores de apoio são vivas, mas aparecem em pequenas doses.

### Primary
- **Mel** (#ffb800): cor da marca. Botões principais, seleção de cards, contador de escolhidos, bordas de destaque. Texto sobre ele é sempre `on-honey` (#1a1000).
- **Mel Profundo** (#e0a000): hover dos botões principais.
- **Mel Claro** (#ffd866): títulos e links no tema escuro.

### Secondary
- **Limão** (#ffe14d): preços e valores no tema escuro. É o único uso de limão como texto.
- **Menta** (#38e0a0): sucesso e pedido aprovado.
- **Céu** (#4fc3ff): informação (orçamento enviado, avisos neutros).
- **Coral** (#ff6b84): erro, cancelamento e perigo.
- **Violeta** (#a06bff): reservado para categorias e destaques decorativos, nunca para estado.

### Neutral
- **Noite Ameixa** (#170f22): fundo da página no escuro.
- **Cartão Ameixa** (#251838) e **Cartão Elevado** (#31204a): superfícies e barras fixas.
- **Campo Ameixa** (#1e1330): fundo de campos de texto.
- **Linha Ameixa** (#5a4380): borda dos cards no escuro.
- **Creme** (#fff4dd) e **Lilás Suave** (#cdbde3): texto principal e secundário no escuro.
- **Papel Lavanda** (#f6f1ff), **Lavanda Elevado** (#f0e8ff): fundo e superfície elevada no claro.
- **Tinta Uva** (#1e1235), **Uva Título** (#3a1d78), **Uva Suave** (#4b3f68), **Linha Uva** (#2a1a4a): texto, título, texto secundário e borda no claro.
- **Âmbar Valor** (#8a5410): preços no claro. **Violeta Link** (#5b2fd0): links no claro.

### Named Rules
**The Honey Is The Brand Rule.** O mel é a marca. Se algo precisa se destacar e não é seleção, ação principal ou marca, não é mel.
**The Function Before Color Rule.** Menta, céu, coral e violeta só entram com função (estado ou categoria). Cor que só enfeita não entra.
**The Two Themes Rule.** Toda cor existe nos dois temas, com contraste mínimo de 4,5:1 para texto. Nunca uma cor definida só em um tema.

## Typography

**Display Font:** VT323 (monospace)
**Body Font:** VT323 (monospace)

**Character:** Uma única fonte pixel de terminal, autoral e legível, usada em tudo. A hierarquia vem do tamanho e do peso, não de trocar de fonte.

### Hierarchy
- **Display** (400, 2.6rem, 1.1): títulos de página.
- **Headline** (400, 2rem, 1.1): seções.
- **Title** (700, 1.4rem, 1.1): nome de produto e cabeçalho de card.
- **Body** (400, 19px, 1.45): texto corrido, com linha de até 65–75 caracteres.
- **Label** (700, 17px, 1.25): rótulos, etiquetas e preços pequenos.

### Named Rules
**The One Pixel Voice Rule.** Uma fonte só. Peso e tamanho constroem a hierarquia, e nenhuma segunda fonte entra sem decisão explícita.
**The Price Is Big Rule.** Preço aparece sempre em Title ou maior, em limão (escuro) ou âmbar (claro), com números alinhados em coluna (`tabular-nums`).

## Layout

Página centrada com contêiner de até 1080px e margens de 20 a 24px. Telas de leitura usam o contêiner estreito (680px). Grades de produto usam `repeat(auto-fill, minmax(210px, 1fr))` com intervalo de 16px, e quebram para uma coluna no celular. O ritmo vertical usa 6, 10, 16, 24 e 40px. A barra de resumo do pedido é fixa embaixo, no alcance do polegar, com folga à direita para o botão de tema.

## Elevation & Depth

Profundidade vem de sombra dura, sem desfoque, em um sistema de dois degraus. Superfícies em repouso ficam planas contra a borda grossa. A sombra é o que faz o objeto parecer pressionável.

### Shadow Vocabulary
- **Pixel** (`box-shadow: 4px 4px 0 0 rgba(0,0,0,0.6)`): cards, hero e barras.
- **Pixel pequeno** (`2px 2px 0 0`): botões e etiquetas.
- **Pixel interno** (`inset 3px 3px 0 0`): campos de texto, como se estivessem afundados.

### Named Rules
**The Press Down Rule.** Ao clicar, o objeto desce 3px e perde a sombra. Qualquer elemento clicável que não faz isso está errado.

## Shapes

Os elementos principais usam **cantos cortados** (chanfro de 14 a 22px) em vez de cantos arredondados; botões e campos seguem retos. Cantos de 0px, bordas de 2px (botões, etiquetas) a 4px (cards, hero), sempre sólidas. A única forma diferente é o hexágono do favo, reservado a detalhes de marca (cantos do hero e etapas do pedido), nunca a botões de ação.

## Components

### Buttons
- **Shape:** reto, borda de 2px preta (#000 no claro, #0b0612 no escuro).
- **Primary:** mel com texto `on-honey`, borda de 3px, padding 8px 18px. O volume vem do bisel (luz no canto superior esquerdo, sombra no inferior direito, 3px) mais a sombra pixel de 4px. Ao passar o mouse sobe 1px; ao clicar desce 3px e o bisel inverte.
- **Hover / Focus:** hover escurece para mel profundo; foco mostra contorno de 3px em mel; o clique desce 3px.
- **Secondary:** cor de cartão com texto principal; hover clareia para a superfície elevada.
- **CTA:** o primário em 1.35rem para a ação da página (entrar, pedir).

### Cards / Containers
- **Corner Style:** reto.
- **Background:** cartão ameixa (escuro) ou branco (claro).
- **Border:** 4px sólida na cor da borda do tema.
- **Shadow Strategy:** sombra pixel; cards de produto sobem 2px no hover.
- **Internal Padding:** 20px; cards de produto têm imagem sem padding no topo e 10–12px de texto.

### Product Card
Imagem grande no topo (proporção 4:3), nome em Title, descrição curta em cor suave, preço grande. Selecionado: borda de mel, sombra de mel e etiqueta "Escolhido" sobre a imagem. Sem imagem: faixa baixa com "sem imagem". Cores da variante aparecem como quadradinhos que trocam a imagem.

### Inputs / Fields
- **Style:** borda de 2px, fundo de campo, sombra interna.
- **Focus:** contorno de 3px em mel.
- **Error / Disabled:** erro em coral com mensagem junto do campo; desabilitado a 50% de opacidade.

### Scrollbars
Barras de rolagem no estilo do site: trilho afundado (campo ameixa com borda) e um bloco de mel com bisel como "polegar", sem setas. Vale para a página e para as faixas roláveis (passos, abas do admin).

### Category Steps
No pedido, uma categoria por vez, com a barra de passos em hexágonos numerados e rolável: o atual maior e em mel, os escolhidos em verde com check (e contador quando há mais de um), os próximos apagados. Abaixo, "Passo N de M", os cards da categoria e Voltar/Próxima.

### Product Card (formato)
Os cards do pedido têm **cantos cortados** (estilo pixel) com borda e sombra, e a **imagem grande dentro de um hexágono deitado**. As informações seguem a ordem pedida pelo dono: imagem, nome, descrição curta e preço (com um hexágono de mel como marcador). Clicar na foto amplia (sem lupa); o botão-pílula "Escolher" (vira "Escolhido", em verde) e o texto do card selecionam. Selecionado: borda e hexágono em mel.

### Summary Bar
Barra fixa embaixo com número de itens, estimativa em Title e o botão principal. Borda de 4px em mel e fundo elevado.

### Theme Switch
Interruptor pixel na barra, 84×44px: trilho afundado com sol à esquerda e lua à direita, e um bloco de mel com bisel que desliza até o tema ativo. `role="switch"`. No celular, vai para dentro da gaveta.

### Order Steps
Seis hexágonos em linha (Enviado, Orçado, Pix, Na fila, Produção, Pronto) ligados por uma barra: feitos em mel com check, o atual maior e em mel, os próximos apagados (cor `hex-off`). Abaixo, uma frase "e agora?" com borda de mel. Em listas, versão compacta com só o nome da etapa atual.

### Navigation
Barra no topo em ameixa escura (escuro) ou mel (claro), com borda inferior de 3px. Os itens (Fazer pedido, Portfólio, Menu, Entrar) são **botões com bisel e sombra pixel**, como os demais: o principal em mel (em tinta roxa no tema claro, porque a barra clara já é mel) e os secundários em cor de cartão; a página atual aparece "apertada". O nome Colmeia é a marca, em texto. Ícones sociais com área de toque de 44px. A barra mostra só Logo, Fazer pedido, Menu, redes sociais e o interruptor de tema, em qualquer largura. O resto (Meus pedidos, Fila, páginas do admin, Sair) abre numa gaveta pixel à direita, com itens de 48px.

## Do's and Don'ts

### Do:
- **Do** usar mel só para marca, seleção e ação principal.
- **Do** mostrar preço em todo card de produto, em tamanho Title ou maior.
- **Do** manter borda grossa, canto reto e sombra pixel em tudo que é clicável.
- **Do** projetar cada cor nos dois temas e conferir contraste 4,5:1.
- **Do** respeitar `prefers-reduced-motion` em toda animação.
- **Do** tratar a imagem do produto como protagonista; o texto serve a ela.

### Don't:
- **Don't** usar gradiente, vidro, desfoque decorativo ou cantos arredondados.
- **Don't** usar emoji como ícone estrutural; ícones são desenhados em SVG ou pixel.
- **Don't** transformar o pedido em criador de personagem interativo: o dono quer cards de produto.
- **Don't** usar uma segunda fonte sem decisão explícita.
- **Don't** usar cor de apoio só para enfeitar.
- **Don't** repetir a mesma informação em seções diferentes da mesma página.
