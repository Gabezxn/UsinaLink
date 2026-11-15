# Mudanças feitas no UsinaLink

Este é o único arquivo de mudanças. Eu atualizo no fim de cada pedido seu.
Para ver no seu PC: `git pull` na branch `claude/elegant-shannon-4ar9hg`.

## Pedido 1 (14/11): reta final até 17/11

### Segurança (o que estava perigoso)
| Mudança | Onde |
|---|---|
| Usina não consegue mais cancelar/aceitar pedido ou proposta de outra conta | `backend/src/pedido/pedido.service.ts`, `backend/src/proposta/proposta.service.ts` |
| Ninguém muda o status do pedido "na mão" (pulando proposta e pagamento) | `backend/src/pedido/dto/update-pedido.dto.ts`, `pedido.service.ts` |
| Usina só vê as próprias propostas e o nome do comprador (sem CNPJ, e-mail, telefone) | `backend/src/pedido/pedido.service.ts`, `proposta.service.ts` |
| Pagamento só com proposta aceita e uma vez só | `backend/src/pagamento/pagamento.service.ts` |
| Avaliação só depois do pedido concluído | `backend/src/avaliacao/avaliacao.service.ts` |
| Avaliações, lista de usuários e busca de empresa/usina agora exigem login | `backend/src/avaliacao/avaliacao.controller.ts`, `usuario/usuario.controller.ts`, `empresa/empresa.controller.ts`, `usina/usina.controller.ts` |
| Limite de tentativas de login por pessoa (não pela plataforma inteira) e teto por IP | `backend/src/common/login-throttler.guard.ts`, `backend/src/main.ts`, `backend/src/app.module.ts` |
| Admin demo (`admin@demo.com`) desativado | `backend/src/database/seed.service.ts` |
| Segredo do login (JWT) fraco ou de exemplo não vale mais | `backend/src/auth/token.service.ts`, `backend/.env.example` |
| Anexos só PDF/imagem/desenho e com tamanho máximo | `backend/src/common/anexo.ts` + DTOs de solicitação, pedido e peça |
| Valor da proposta precisa ser maior que zero | `backend/src/proposta/proposta.service.ts` |
| Texto digitado por usuário não executa mais código na tela (XSS) | `Site/assets/js/safe-html.js` (novo), `reviews-blocks.js`, `solicitacoes.js`, `pedidos-usina.js`, `aceitar-convite-funcionario.js` |
| Cabeçalhos de segurança do site | `Site/_headers` |

### Fluxos que estavam quebrados ou confusos
| Mudança | Onde |
|---|---|
| Empresa agora acompanha e paga compra de peça do catálogo | `Site/compra-pessoa-fisica.html`, `Site/dashboard-pessoa-juridica.html`, `Site/assets/js/pecas-comerciais.js` |
| Peça nova exige valor; não dá comprar peça sem valor | `backend/src/peca-comercial/dto/create-peca-comercial.dto.ts`, `solicitacao-comercial.service.ts`, `Site/pecas-comerciais-usina.html` |
| Valor com ponto ("1500.50") não vira R$ 150.050 | `Site/assets/js/enviar-proposta.js`, `pecas-comerciais-usina.js`, `ui-utils.js` |
| Comprovante de pagamento mostra forma de pagamento e protocolo; não paga sozinho ao abrir | `Site/assets/js/order-history.js` |
| Lista de pagamentos só oferece "Pagar" para pedido com proposta aceita | `Site/assets/js/order-history.js` |
| Botão "Editar proposta" (que não salvava nada) foi removido | `Site/script.js` |
| "Voltar" do pagamento não leva mais a página só de empresa | `Site/pagamento-pedido.html` |
| Sessão expirada leva ao login com aviso | `Site/assets/js/api.js`, `Site/assets/js/auth-guard.js` |
| Cadastro não preenche mais dados de outras empresas | `Site/script.js` |

### Acessibilidade
| Mudança | Onde |
|---|---|
| Botão "Acessibilidade" (fonte, contraste, modo escuro, espaçamento, dislexia, sem animação, destacar links) | `Site/assets/js/a11y.js`, `Site/assets/css/a11y.css` (novos, ligados em todas as páginas por `scripts/inject-assets.mjs`) |
| VLibras e link "Pular para o conteúdo" | `Site/assets/js/a11y.js` |
| Cores do texto mais escuras (contraste) | `Site/style.css` |
| Modais prendem o foco e fecham com Esc; avisos lidos por leitor de tela; erros de formulário ligados aos campos; tabelas, menus e autocomplete | `Site/assets/js/a11y.js`, `Site/script.js`, `Site/assets/js/ui-utils.js` |

### Servidor dormindo / publicação
| Mudança | Onde |
|---|---|
| Endereço de saúde `/api/health` | `backend/src/health/` |
| Aviso "Acordando o servidor…" e novas tentativas automáticas | `Site/assets/js/api.js` |
| Ping automático a cada 10 min | `.github/workflows/keepalive.yml` |
| Página "não encontrada" | `Site/404.html` |

### Testes e documentos
| O que | Onde |
|---|---|
| Testes automáticos (rodar tudo: `node qa/run-all.mjs --fresh`) | pasta `qa/` |
| Lista de problemas e status | `docs/BACKLOG.md` |
| O que você precisa fazer + roteiro da apresentação | `docs/PRONTO-PARA-APRESENTAR.md` |
| Como publicar no Cloudflare | `docs/DEPLOY-CLOUDFLARE-PAGES.md` |
| Papéis dos agentes | `docs/agentes/` |

## Pedido 2 (15/11): pedido de formato

- Passei a responder de forma curta e simples, e a manter este arquivo. Criado: `docs/MUDANCAS.md`. Nenhum código mudou.

## Pedido 3 (15/11): merge e Cloudflare

| Mudança | Onde |
|---|---|
| Fiz o merge de tudo no `main` (PR nº 1, commit `62e5041`) | GitHub: <https://github.com/Gabezxn/UsinaLink/pull/1> |
| Seu projeto no Cloudflare é do tipo "Workers" e a build falhava por falta de configuração. Criei o arquivo que diz para publicar a pasta `Site` | `wrangler.jsonc` (raiz do projeto) |

## Pedido 4 (15/11): Cloudflare funcionando

| Mudança | Onde |
|---|---|
| Build do Cloudflare passou com o `wrangler.jsonc`. Fiz o merge no `main` (PR nº 2, commit `5ccd393`) | GitHub: <https://github.com/Gabezxn/UsinaLink/pull/2> |
| Nenhum código mudou nesta etapa | — |

## Pedido 5 (15/11): botão de acessibilidade em cima do "Fale conosco"

| Mudança | Onde |
|---|---|
| Nas páginas com o chat "Fale conosco" (página inicial), o botão e o painel de Acessibilidade vão para o canto **esquerdo**. Nas outras páginas continuam no canto direito | `Site/assets/css/a11y.css` |
| Teste novo que falha se os dois botões se sobrepuserem | `qa/flows/a11y-pages.mjs` |

## Pedido 6 (15/11): avisar o endereço de cada versão nova

| Mudança | Onde |
|---|---|
| Combinado: a cada envio eu leio o aviso do Cloudflare no PR e te mando o endereço da versão nova. Nenhum código mudou | — |
| Endereço fixo do site (só muda quando entra no `main`): `https://usinalink.tibiel2010.workers.dev` | — |
| Endereço fixo da versão em teste (branch, sempre a mais recente): `https://claude-elegant-shannon-4ar9hg-usinalink.tibiel2010.workers.dev` | — |

## Pedido 7 (15/11): passar o trabalho para a conversa do PC

| Mudança | Onde |
|---|---|
| Arquivo com tudo o que eu sei (estado, endereços, o que falta, como falar com você) para a conversa que roda no seu PC continuar | `docs/PASSAGEM-PARA-O-PC.md` |
| Nenhum código mudou | — |

## Pedido 8 (15/11): o que a conversa do PC enxerga

| Mudança | Onde |
|---|---|
| Acrescentei no arquivo de passagem onde ficam o plano, a especificação e os papéis do time de agentes, e o que não vai junto | `docs/PASSAGEM-PARA-O-PC.md` |
| Nenhum código mudou | — |

## Pedido 9 (15/11): por que o login como empresa falhava no endereço de teste

| Mudança | Onde |
|---|---|
| Causa confirmada: o servidor (Render) só aceita chamadas dos endereços da lista `ALLOWED_ORIGINS`. O endereço fixo do site está na lista; o endereço de teste da branch **não** está (CORS bloqueia). | — |
| O login em si funciona: `empresa@demo.com`, `usina@demo.com` e `pessoa@demo.com` entram com `Demo@123` na API de produção. O site fixo abre (200) e `/api/health` está ok. | — |
| Nenhum código mudou. Falta decidir como liberar os endereços de teste (ver pergunta feita a você). | — |

## Pedido 10 (15/11): liberar os endereços de teste no servidor

| Mudança | Onde |
|---|---|
| O servidor passa a aceitar também os endereços `https://<algo>-usinalink.tibiel2010.workers.dev` (versões de teste do Cloudflare), além da lista `ALLOWED_ORIGINS`. Outros sites continuam bloqueados. | `backend/src/main.ts` |
| Ainda **não publicado**: precisa de merge no `main` e deploy no Render (aguardando seu OK). Não consegui rodar testes neste PC (sem Node). | — |

## Pedido 11 (15/11): publicado e conferido

| Mudança | Onde |
|---|---|
| Mudança do pedido 10 enviada ao `main` (commit `7a57f61`, junto com o botão de acessibilidade do PR 3) e o Render já está com ela | GitHub `main` |
| Conferido: endereço de teste agora é aceito e o login da empresa dá certo; `https://evil.com` continua bloqueado; `/api/health` ok | — |

## Pedido 12 (15/11): botão de Libras bloqueado

| Mudança | Onde |
|---|---|
| Testei o site no navegador: o botão de Acessibilidade aparece à esquerda (ok), mas o Libras não carrega. O plugin busca um arquivo em `cdn.jsdelivr.net`, que a política de segurança bloqueava. Liberei só esse endereço para scripts, estilos, fontes e conexões | `Site/_headers` |
| Ainda **não publicado** (aguardando seu OK) e ainda não testado depois da mudança | — |

## Pedido 13 (15/11): testes automáticos agora rodam no Windows

| Mudança | Onde |
|---|---|
| Instalei Node 24 (winget, só do seu usuário), Postgres 16 portátil e Playwright/Chromium em `C:\Projetos\_qa-tools` e `C:\Projetos\node_modules` (fora do repositório, nada vai ao GitHub) | seu PC |
| Scripts de teste adaptados para Windows. Bateria completa: 17 de 17 verdes (variável `QA_PGBIN=C:/Projetos/_qa-tools/pgsql/bin`) | `qa/env/up.mjs`, `qa/env/down.mjs`, `qa/run-all.mjs`, `qa/security/sec-7-throttle.mjs` |
| Libras: liberação do `cdn.jsdelivr.net` já está no `main` (commit `71b362f`) | `Site/_headers` |

## Pedido 14 (15/11): segurança P2

| Mudança | Onde |
|---|---|
| Login: e-mail que não existe e senha errada agora dão a mesma mensagem; a senha é conferida antes do status da conta; removida a aceitação de senha em texto puro (SEC-14) | `backend/src/usuario/usuario.service.ts`, `backend/src/auth/password.service.ts` |
| Sessão passa de 24h para 8h (SEC-15). Não mexi no guard para checar o status a cada chamada: exigiria banco em todos os módulos | `backend/src/auth/token.service.ts` |
| Só o titular da conta cria, edita ou exclui funcionários; funcionário não gerencia colegas (SEC-16) | `backend/src/funcionario/funcionario.service.ts`, `backend/src/contexto-usuario/contexto-usuario.service.ts` |
| Bloqueio de usina: admin só pode marcar em análise, aprovada ou rejeitada; não decide duas vezes; "analisado por" vem do token, não do pedido (SEC-17) | `backend/src/solicitacao-bloqueio-usina/` |
| Mensagem de erro do painel da empresa agora é escapada (SEC-21); os outros dois pontos já estavam seguros | `Site/assets/js/dashboard-empresa.js` |
| Tipo de conta errado em pedidos/propostas: conferido, já responde 403 e não 500 (SEC-24); teste novo garante | `qa/security/sec-p2.mjs` |
| Textos longos (comentário, descrição, motivo etc.) limitados a 2000 caracteres e nomes a 200 (BUG-4). Não ativei `forbidNonWhitelisted`: poderia quebrar telas que mandam campos extras; campos desconhecidos já são descartados | DTOs em `backend/src/**/dto/` |
| Testes novos: `sec-p2` na bateria e testes unitários do bloqueio | `qa/run-all.mjs`, `backend/src/solicitacao-bloqueio-usina/` |
| Não feitos: SEC-22 e SEC-23 (dependem do Render) | — |

## Pedido 15 (15/11): fluxos e acessibilidade P2

| Mudança | Onde |
|---|---|
| Aceitar proposta leva direto ao pagamento; o card ganhou botão Recusar; as confirmações mostram usina, valor e prazo (FLX-6, 7) | `Site/script.js` |
| Um só total, igual ao backend (valor da proposta, sem taxa de 3,5% inventada); texto do chat também corrigido (FLX-14) | `Site/assets/js/ui-utils.js`, `chat-contato.js` |
| Textos falsos de "localStorage" trocados por "pagamento simulado, registrado na sua conta" (FLX-15) | `Site/pagamento-pedido.html`, `Site/pagamentos.html` |
| Usina e comprador podem confirmar entrega e o texto agora diz isso; botão "Avaliar usina" depois de concluído; rótulo "Comprador"; filtros do histórico por status real (FLX-8, 9, 16, 17) | `Site/assets/js/order-history.js`, `Site/historico-pedidos.html` |
| Pedido sob medida da PF: link "Ver propostas" e status em português (FLX-10); peça sem estoque mostra "Sem estoque" e botão desligado (FLX-13); "Criar nova conta" já abre o tipo certo (FLX-21) | `Site/assets/js/solicitacoes.js`, `peca-pessoa-fisica.js`, `Site/login-*.html` |
| Acessibilidade: símbolos decorativos escondidos do leitor de tela, títulos de página distintos, avisos de atualização em tabelas, botão de ações com o nome da linha, chat com ESC e como diálogo, carregando com aria-busy (A11Y-6, 9, 11, 12, 13, 14) | `Site/*.html`, `Site/script.js`, `chat-contato.js` |
| Não feitos: FLX-11, 12, 18 a 20, 22 a 34 (fora da lista pedida; alguns tocam backend/DTO) | — |
| Testes do fluxo empresa-usina atualizados para as novas regras | `qa/flows/empresa-usina.mjs` |

## Pedido 16 (15/11): polimento visual para a apresentação

| Mudança | Onde |
|---|---|
| Página inicial refeita: topo fixo com menu (Como funciona, Benefícios, Para quem), título mais forte, botões "Criar conta grátis" e "Ver como funciona", painel de exemplo de comparação de propostas marcado como "Exemplo ilustrativo" | `Site/index.html`, `Site/style.css` |
| Ícones de verdade (SVG) nos cartões de benefícios, no lugar das letras R/Q/C/G; nova seção "Para quem" com os 3 perfis | `Site/index.html` |
| Faixa de números só com fatos (3 perfis, 4 etapas, 1 painel) e rótulo "Demonstração"; sem dados inventados | `Site/index.html` |
| "Empresas que já confiam" virou "Perfis de exemplo usados na demonstração", com nomes marcados como fictícios | `Site/index.html` |
| Rodapé completo em colunas com links reais (entrar, criar conta, seções); texto "Protótipo front-end" trocado por aviso de ambiente de demonstração; faixa final de chamada para ação | `Site/index.html`, `Site/style.css` |
| Marca nova (símbolo de porca sextavada) no lugar das letras "US" em todas as telas; favicon próprio | `Site/*.html`, `Site/assets/img/favicon.svg` |
| Descrição (meta description) e ícone de aba em todas as páginas | `Site/*.html` |
| Responsivo conferido em 375 px e 768 px na página inicial, sem rolagem lateral; movimento reduzido respeitado | `Site/style.css` |
| Não feito: revisão visual tela a tela dos painéis internos (já tinham estados vazios e tabelas) | — |

## Pedido 17 (15/11): telas internas e de acesso no mesmo padrão da página inicial

| Mudança | Onde |
|---|---|
| Menu lateral com ícones de verdade (SVG) no lugar das letras D, P, I, F...; cor segue o tipo de conta (azul, laranja, verde) | `Site/style.css` |
| Campos de formulário e de login sem as letrinhas decorativas; texto digitado normal e dica (placeholder) mais leve e legível | `Site/style.css` |
| Títulos, cartões e tabelas na mesma escala da home; cabeçalho de tabela e linhas com destaque ao passar o mouse | `Site/style.css` |
| Estados vazios padronizados (caixa tracejada, centralizada) e com ação sugerida: Ver catálogo, Nova solicitação, Ver solicitações, Ver pedidos disponíveis | `Site/style.css`, `Site/assets/js/*.js`, `Site/script.js` |
| Linhas vazias de tabelas com o mesmo visual e sem estilo solto no código; setor e cargo vazios mostram "-" | `Site/assets/js/*.js`, `Site/script.js` |
| Escolha de tipo de conta (login e cadastro) com ícones no lugar de EMP/PF/USI e marca de seleção em vez de "OK" | `Site/login.html`, `Site/cadastro*.html`, `Site/style.css` |
| Página 404 com a marca, número em destaque e botões Voltar para o início e Entrar | `Site/404.html`, `Site/style.css` |
| Celular (375 px): marca, tipo de conta e botão Menu na mesma linha; filtros em linhas que quebram; cartões com menos margem; cartões do catálogo sem rolagem lateral | `Site/style.css` |
| Conferido em 375 e 768 px nas telas das 3 contas: sem rolagem lateral na página (as tabelas rolam dentro do próprio quadro) | — |
| Não feito: revisão pixel a pixel de cada tela de detalhe (compra, peça, usina) e do modal de funcionário; fica para uma próxima rodada | — |
