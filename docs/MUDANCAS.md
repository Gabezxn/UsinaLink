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

## Pedido 18 (15/11): conferência no ar, de madrugada

| Mudança | Onde |
|---|---|
| Tudo dos pedidos 10 a 17 está no `main` e no ar. Conferido no site fixo: página inicial nova, botão de Libras aparece, sem erros no console. API `/api/health` ok e login da empresa pelo endereço de teste dá 201 | `https://usinalink.tibiel2010.workers.dev` |
| Bateria de testes: 18 de 18 verdes antes de cada envio | `node qa/run-all.mjs` |
| Ainda abertos (P2): FLX-11, 12, 18, 19, 22 em diante, SEC-22/23 (dependem do Render), BUG-2 | `docs/BACKLOG.md` |

## Pedido 19 (15/11): pendências de fluxo (P2) e telas de detalhe

| Mudança | Onde |
|---|---|
| Cartões do painel da empresa e da usina viram links para a lista certa e avisam pendências ("6 aguardando sua decisão", "1 aguardando pagamento") (FLX-11) | `Site/dashboard-empresa.html`, `dashboard-usina.html`, `assets/js/dashboard-*.js`, `style.css` |
| Minhas compras (PF): uma ação principal por linha; "Avaliar" abre a avaliação daquela compra direto (FLX-12) | `compras-pessoa-fisica.js`, `dashboard-pessoa-fisica.js`, `avaliacoes-pessoa-fisica.js` |
| Enviar proposta: frete pode ser ajustado pela usina; erros aparecem ao lado do formulário e o campo com problema recebe foco; pedido fechado mostra aviso fixo e desliga o botão (FLX-18, 31) | `enviar-proposta.html`, `enviar-proposta.js` |
| Convite de funcionário sem estar logado mostra "entre na sua conta" em vez de erro; sem código interno na tela (FLX-19) | `aceitar-convite-funcionario.js` |
| Perfil: o rótulo do tipo de conta deixou de parecer botão; "Segurança" abre direto o formulário (FLX-22) | `perfil-*.html`, `script.js` |
| Cartão "Aguardando pagamento" só conta pedidos com proposta aceita; "Ver pagamento" de pedido pago leva ao comprovante; página de pagamento de pedido já pago ou sem proposta aceita mostra aviso; comprovante com mensagem certa por situação e para falha de rede (FLX-25, 26, 27) | `order-history.js` |
| Nota fiscal da usina mostra "Dado protegido" onde faltam dados do comprador; histórico da usina rotula "Proposta recusada/cancelada" (FLX-28, 29) | `order-history.js`, `payment-service.js` |
| Erros 403/404/500 em inglês viram português simples (FLX-30) | `api.js` |
| Peça sem valor: botão desligado ("Valor sob consulta"); botão enganoso do modal de peça removido (FLX-33, 34). FLX-24 já estava resolvido | `peca-pessoa-fisica.js`, `pecas-comerciais.js`, `script.js` |
| Detalhes do pedido sem número: tela amigável com atalho para a lista; comprovante sem número ou com falha mantém o menu lateral | `order-history.js` |
| Visual: campos com foco sem listras internas (modal de funcionário); avaliações da usina com data em linha separada e nota sem espaço sobrando | `style.css` |
| Não feito: FLX-32 (valida valor no backend/DTO, mexe no servidor). Compra, peça, usina e confirmação já estavam no padrão da home e só receberam os ajustes acima | — |

## Pedido 20 (15/11): texto de "Pessoa Física" saindo da caixinha

| Mudança | Onde |
|---|---|
| Na escolha do tipo de conta (login e cadastro), o texto "Acompanhamento individual" passava da borda do cartão. Diminuí um pouco o espaçamento e a letra e deixei o texto quebrar dentro do cartão. Conferido nos três cartões, lado a lado | `Site/style.css` |

## Pedido 21 (15/11): aviso de servidor lento menos técnico

| Mudança | Onde |
|---|---|
| O aviso "Acordando o servidor, isso pode levar até 1 minuto…" foi trocado por "Carregando, aguarde um instante…". O comportamento é o mesmo (aparece só se a resposta demorar e some sozinho), só o texto ficou profissional | `Site/assets/js/api.js`, `qa/flows/cold-start.mjs` |

## Pedido 22 (15/11): menu lateral padronizado para todas as contas

| Mudança | Onde |
|---|---|
| Antes havia 3 menus escritos à mão (empresa, usina, pessoa física) em 35 páginas, mais cópias dentro de scripts. Agora existe uma tabela única: a ordem das linhas é a ordem do menu para todos, e cada linha diz quais contas veem o link e com qual texto. Para dar ou tirar um link de uma conta, edita-se só uma linha da tabela `MENU` | `Site/assets/js/role-nav.js` (novo) |
| `pf-nav.js` foi substituído por `role-nav.js` em todas as páginas com menu, e a cópia do menu dentro de `order-history.js` foi apagada | `Site/*.html`, `Site/assets/js/order-history.js` |
| Conferido nas 3 contas: cada uma vê só os seus links, o item da página atual fica destacado e os contadores continuam. Bateria 18 de 18 verde | — |

## Pedido 23 (15/11): preparar o domínio usinalink.com.br

| Mudança | Onde |
|---|---|
| O servidor passa a aceitar `https://usinalink.com.br` e `https://www.usinalink.com.br` sem precisar mexer no Render. Subdomínios parecidos e `http://` continuam bloqueados (testado) | `backend/src/main.ts` |
| Não coloquei o domínio no `wrangler.jsonc` de propósito: se o domínio ainda não estiver no seu Cloudflare, a publicação do site falharia. Ligar o domínio ao site é feito no painel do Cloudflare (passo 3 combinado) | — |

## Pedido 24 (15/11): preview do link (não parecer golpe)

| Mudança | Onde |
|---|---|
| Ao colar `usinalink.com.br` no WhatsApp, Instagram, LinkedIn etc., agora aparece um cartão com a logo, o nome, "Marketplace B2B de peças industriais" e a descrição (antes aparecia só o endereço puro) | `Site/index.html` (tags `og:` e `twitter:`) |
| Imagem do cartão 1200×630 com a marca da Usinalink | `Site/assets/img/preview.png` (novo) |
| Observação: WhatsApp e redes guardam o preview por um tempo. Se o link já foi enviado antes, o cartão novo pode demorar a aparecer | — |

## Pedido 25 (15/11): ajustes pedidos pela colega da equipe

| Mudança | Onde |
|---|---|
| Cores das contas: pessoa física agora tem tema verde-azulado (fundo, cartão, botões e links) no login e no cadastro; usina fica laranja; empresa continua azul. No cadastro, o tema muda sozinho ao escolher o tipo de conta | `Site/style.css`, `Site/login-pessoa-fisica.html`, `Site/script.js` |
| "Mostrar senha" da pessoa física: no cadastro os mesmos campos servem para os 3 tipos, e o campo "Senha" da pessoa física virava senha depois que o botão já tinha sido criado, então ficava sem botão. Agora o botão acompanha o campo ao trocar o tipo (e some de campos que deixam de ser senha). Testado nos 3 tipos, ida e volta | `Site/script.js` |
| O aviso "Login realizado com sucesso" (e os outros avisos) ficava por baixo do botão de Acessibilidade. Agora fica acima dele, em tela grande e no celular | `Site/style.css` |
| Prazo de fabricação da proposta: o campo agora é só um número (dias) e a tela escolhe sozinha uma única unidade: 45 → "45 dias", 30 → "1 mês", 90 → "3 meses". Mostra a prévia enquanto digita e salva já formatado. A mesma regra vale nas listas e detalhes de propostas, pedidos, peças e pagamento. Propostas antigas em texto livre continuam como estavam | `Site/assets/js/safe-html.js` (`formatPrazo`), `Site/enviar-proposta.html`, `Site/assets/js/enviar-proposta.js`, `Site/script.js` e outros |
| Acentos nos detalhes da proposta e telas ligadas: "fabricação", "Observações", "Peça", "Não informado", "Urgência", "você", "decisão", "não foi possível" | `Site/script.js`, `Site/assets/js/enviar-proposta.js` |
| Teste novo que confere tudo isso (cores, botão Mostrar, aviso x acessibilidade, prazo e acentos). Bateria completa verde | `qa/flows/ui-p24.mjs`, `qa/run-all.mjs` |

## Pedido 27 (15/11): logo no cadastro de usina

| Mudança | Onde |
|---|---|
| No "Criar conta" de usina, a logo do Usinalink continuava azul enquanto o resto ficava laranja. Agora ela fica laranja ao escolher Usina e volta ao azul ao escolher outro tipo. Aplicado no site principal e na versão de teste | `Site/script.js` |

## Pedido 28 (15/11): ícone do botão de acessibilidade

| Mudança | Onde |
|---|---|
| O botão de Acessibilidade usava o emoji de cadeira de rodas (que muda de aparência em cada aparelho e dava cara de "feito por IA"). Agora é um ícone desenhado em traço, da mesma cor do texto, igual em qualquer aparelho. Aplicado no site principal e na versão de teste | `Site/assets/js/a11y.js`, `Site/assets/css/a11y.css` |

## Pedido 29 (15/11): visual dos botões flutuantes

| Mudança | Onde |
|---|---|
| "Fale conosco" estava num azul claro diferente do resto. Agora usa o mesmo degradê azul-escuro dos botões do site (também no cabeçalho do chat). O botão de Acessibilidade perdeu o contorno branco e ganhou o mesmo degradê. Os dois sobem de leve e clareiam ao passar o mouse. Aplicado no site principal e na versão de teste | `Site/style.css`, `Site/assets/css/a11y.css` |

## Pedido 26 (15/11): animações (agora no site principal, ver Pedido 32)

Criado primeiro numa versão de teste (branch `teste-animacoes`) e aprovado em 16/11.

| Mudança | Onde |
|---|---|
| Chat "Fale conosco": ao perguntar, aparece a bolinha de "digitando…" (3 pontinhos pulando) e só depois a resposta. O tempo depende do tamanho do texto: de cerca de 1 s (resposta curta) até 3,2 s (resposta longa). Enquanto "digita", os atalhos ficam desativados para não embolar as mensagens. O painel abre com leve subida e as mensagens entram suaves | `Site/assets/js/chat-contato.js`, `Site/assets/css/motion.css` |
| Troca do tipo de conta (cadastro): o fundo antigo é "apagado" em círculo a partir do botão clicado (cerca de 0,9 s), enquanto as cores do tema (logo, bordas, botões) mudam suavemente por baixo. O cartão escolhido dá um pulinho, o "visto" gira ao entrar e os campos do formulário entram um após o outro | `Site/assets/js/motion.js` (novo), `Site/assets/css/motion.css` (novo), `Site/script.js` |
| Página inicial: blocos e cartões deslizam suavemente para o lugar ao rolar a página (sem sumir e aparecer, para o conteúdo ficar sempre legível), com pequeno atraso entre os cartões. Botões ganham leve efeito ao clicar | `Site/assets/js/motion.js`, `Site/assets/css/motion.css` |
| Quem usa "reduzir movimento" (no computador ou no botão de Acessibilidade do site) não vê nada disso: o chat responde quase na hora e a troca de cor é instantânea | `Site/assets/js/motion.js`, `Site/assets/css/a11y.css` |
| Para voltar atrás é simples: tirar as linhas de `motion.css` e `motion.js` das páginas. Nada do funcionamento depende delas | `Site/index.html`, `Site/cadastro*.html` |
| Corrigido junto: clicar no cartão do tipo de conta disparava a troca duas vezes (o clique no rótulo gera outro no campo); agora só uma | `Site/script.js` |
| Teste novo: chat digitando (tempo longo x curto, atalhos travados, movimento reduzido), pintura (começa, termina, sem sobras com cliques rápidos), rolagem sem blocos invisíveis | `qa/flows/motion.mjs`, `qa/run-all.mjs` |

## Pedido 32 (16/11): animações no site principal, repetindo ao rolar

| Mudança | Onde |
|---|---|
| As animações do Pedido 26 (chat digitando, troca de conta pintada, entrada ao rolar) foram aprovadas e entraram no site principal | `Site/assets/js/motion.js`, `Site/assets/css/motion.css`, `Site/assets/js/chat-contato.js`, `Site/script.js` |
| Página inicial: os blocos agora animam **toda vez** que aparecem na tela. Ao descer eles sobem para o lugar; ao subir de volta e descer de novo, repetem. Voltam ao estado inicial só depois de sair da tela por completo, então ninguém vê o bloco "pular" | `Site/assets/js/motion.js` |
| Teste da rolagem atualizado: bloco do topo volta ao estado inicial ao sair da tela e reaparece ao voltar | `qa/flows/motion.mjs` |

## Pedido 31 (16/11): verificação em duas etapas por e-mail (2FA)

Depois da senha correta, o servidor manda um **código de 6 dígitos para o e-mail da conta**. Só com o código o login é concluído. Vale para empresa, usina, pessoa física e administrador. **Vem desligado**: nada muda para ninguém até você ligar (passos abaixo).

| Mudança | Onde |
|---|---|
| Código de 6 dígitos gerado de forma segura, válido por 10 minutos, **uso único**, no máximo **5 tentativas** (as tentativas em paralelo também contam), guardado no banco só como resumo (HMAC), nunca o código em si | `backend/src/auth/two-factor.service.ts`, `backend/src/common/entities/core.entities.ts` (tabela `codigo_dois_fatores`, criada sozinha) |
| Novas rotas: `POST /api/auth/2fa/verificar` (confere o código e só então devolve o token) e `POST /api/auth/2fa/reenviar` (intervalo de 60 s e no máximo 3 reenvios por desafio). Um novo login invalida o desafio anterior. Senha errada ou conta da área errada **não** envia e-mail | `backend/src/usuario/*`, `backend/src/auth/*` |
| Falha segura: com o 2FA ligado e e-mail sem funcionar, ninguém entra (erro 503). Nunca deixa passar sem o código | `two-factor.service.ts` |
| Envio de e-mail sem biblioteca nova, pelo **Resend** (plano gratuito: 100 e-mails por dia). Para testes locais existe o modo "arquivo", bloqueado em produção | `backend/src/auth/mailer.service.ts` |
| Site: depois da senha aparece a tela do código (campo só de números, em foco, aceita colar), contagem de 60 s para "Reenviar código" e botão "Voltar". Corrigido junto: um erro 401 nessa tela era tratado como "sessão expirada" | `Site/script.js`, `Site/style.css`, `Site/assets/js/api.js` |
| Testes: 15 situações de segurança no servidor (código errado, reuso, 5 erros, 40 palpites em paralelo, reenvio, desafio inventado, sem e-mail, conta dispensada…) e a tela no navegador; mais testes de unidade | `qa/security/sec-2fa.mjs`, `qa/flows/two-factor-ui.mjs`, `backend/src/auth/two-factor.service.spec.ts` |

### Como ligar (só você pode: precisa de conta e de variáveis no Render)
1. Criar conta grátis em resend.com e **verificar o domínio `usinalink.com.br`** (o Resend mostra registros DNS para colar no Cloudflare: aba DNS). Sem domínio verificado, o e-mail só chega para o dono da conta Resend.
2. No Render, em Environment, criar: `RESEND_API_KEY` (a chave do Resend), `MAIL_FROM` = `Usinalink <nao-responda@usinalink.com.br>`.
3. **Por último**: `TWO_FACTOR_ENABLED` = `true`. Para manter as contas de demonstração entrando direto (apresentação), criar também `TWO_FACTOR_SKIP_EMAILS` = `empresa@demo.com,usina@demo.com,pessoa@demo.com`.
4. Para desligar a qualquer momento: `TWO_FACTOR_ENABLED` = `false`.

## Pedido 33 (16/11): pagamento online com Stripe em modo de teste

Publicado só na branch `teste-stripe`. Sem `STRIPE_SECRET_KEY` no servidor, nada muda: o pagamento simulado continua como hoje.

| Mudança | Onde |
|---|---|
| "Confirmar pagamento" leva à página segura da Stripe (Stripe Checkout); o cartão é digitado lá, não no site. Na volta, o site pede ao servidor para conferir o pagamento e só então o pedido vai para "em produção" | `Site/assets/js/order-history.js`, `Site/assets/js/payment-service.js`, `Site/style.css` |
| O servidor cria a sessão de pagamento com o valor da proposta aceita (nunca o valor vindo do navegador) e, na volta, consulta a Stripe: confere se foi pago, de quem é a sessão, e se o valor bate com o pedido. Repetir a confirmação não cobra nem registra duas vezes | `backend/src/pagamento/stripe.service.ts`, `pagamento.service.ts`, `pagamento.controller.ts`, DTOs |
| Com a Stripe ligada, o pagamento simulado fica bloqueado (senão daria para "pagar" sem pagar). O endereço de retorno só aceita o site oficial e as versões de teste | `pagamento.service.ts` |
| Sem biblioteca nova: só chamadas HTTPS à API da Stripe | — |
| Testes: Stripe falsa local (sem chamadas reais) para servidor e tela | `qa/security/sec-stripe.mjs`, `qa/flows/stripe-ui.mjs`, `qa/run-all.mjs` |

**Para ligar (modo de teste, sem dinheiro real):**
1. Conta em stripe.com, no modo de teste (Test mode).
2. Developers, API keys: copiar a Secret key de teste (`sk_test_...`).
3. Render, Environment: `STRIPE_SECRET_KEY` com essa chave.
4. Pagar com o cartão `4242 4242 4242 4242`, qualquer validade futura e qualquer CVV.

**Para desligar:** apagar `STRIPE_SECRET_KEY` (volta o pagamento simulado).

**Limites desta versão:** o dinheiro não é repassado à usina (isso pede Stripe Connect); Pix e boleto dependem do que a conta Stripe liberar.

## Pedido 34 (16/11): barrinha do menu lateral na cor de cada conta

| Mudança | Onde |
|---|---|
| A barrinha da página atual no menu lateral era sempre laranja. Agora segue o tipo de conta: empresa azul, pessoa física verde-azulado, usina laranja | `Site/style.css` |

## Pedido 35 (16/11): etiqueta feia no topo do perfil

| Mudança | Onde |
|---|---|
| Saiu a etiqueta solta ("Pessoa física", "Empresa", "Usina") no fim do cabeçalho do perfil, que aparecia como um retângulo desalinhado. O tipo da conta continua visível no menu lateral | `Site/perfil-pessoa-fisica.html`, `perfil-empresa.html`, `perfil-usina.html` |

## Pedido 36 (17/11): correções da equipe (Observações.docx)

Publicado no site principal com a aprovação do dono do projeto.

| Observação da equipe | O que foi feito | Onde |
|---|---|---|
| 1. "Pedido sob medida" na pessoa física e "Solicitações" na empresa | Os dois usam agora o mesmo nome, "Pedido sob medida" (menu, títulos das páginas, painel da empresa) | `Site/assets/js/role-nav.js`, `solicitacoes.html`, `nova-solicitacao.html`, `dashboard-empresa.html` e menus fixos das páginas |
| 3 e 4. Aba "Usinas" e outras opções só na pessoa física | A empresa ganhou **Usinas** (conhecer usinas, avaliações e peças de cada uma) e **Favoritos**. A pessoa física ganhou **Propostas recebidas** no menu (antes só se chegava por link) | `role-nav.js` e permissão das páginas de usinas, peça e favoritos |
| 5. Foto do projeto abre página nova | "Visualizar" abre a foto numa janela por cima da página (fecha com ×, Esc ou clique fora). PDF continua abrindo em aba | `Site/assets/js/pedidos-usina.js`, `Site/style.css` |
| 7. Recusar proposta | O botão "Recusar proposta" já existia no cartão (com confirmação), nada a mudar. Ele aparece junto de "Aceitar proposta" | — |
| 6. CEP/região opcional no cadastro, frete incoerente | **CEP, cidade e estado agora são obrigatórios** no cadastro de empresa, usina e pessoa física (validados na tela e no servidor) e salvos como endereço da conta. O frete usa o estado da usina, que agora sempre existe | `Site/script.js`, `cadastro*.html`, `backend/src/usuario/usuario.service.ts` |
| 6. Proposta sem local de entrega | O cartão da proposta recebida mostra "Entrega em" e os detalhes mostram o local de entrega; a usina também vê nos detalhes da proposta enviada | `Site/script.js` |
| 2. Pessoa física sem endereço | Nova aba **Endereço de entrega** no perfil (CEP, rua, número, bairro, cidade, estado, complemento). O local de entrega do pedido sob medida já vem preenchido com esse endereço (dá para trocar) | `Site/perfil-pessoa-fisica.html`, `perfil-pessoa-fisica.js`, `solicitacoes.js`, backend (`PessoaFisica` ganhou colunas de endereço) |
| Teste | Cadastro sem CEP é recusado; endereço salvo para as três contas; menus; foto sem abrir aba; entrega na proposta. Testes de cadastro e "mostrar senha" ajustados aos campos novos | `qa/flows/correcoes.mjs`, `qa/flows/ui-p24.mjs`, `qa/security/_lib.mjs` |

**Atenção:** contas antigas sem CEP continuam entrando normalmente; só o cadastro novo exige. Na pessoa física demo do site no ar o endereço está vazio: preencha pela nova aba do perfil.

## Pedido 37 (17/11): esqueci minha senha, Libras no modo escuro e revisão geral

Publicado no site principal junto com o Pedido 38, com a aprovação do dono do projeto.

| Mudança | Onde |
|---|---|
| **Esqueci minha senha**: link "Esqueci minha senha" nos 4 logins, tela para pedir o link e tela para criar a nova senha. O link vai por e-mail, vale 30 minutos, só funciona uma vez, o pedido novo cancela o anterior, a resposta é igual exista a conta ou não, o código fica só como HMAC no banco, o link usa o "#" do endereço (não vai para servidor nenhum) e há limite de pedidos por minuto. Precisa do `RESEND_API_KEY` no Render (o mesmo da verificação em duas etapas) | `esqueci-senha.html`, `redefinir-senha.html`, `assets/js/senha.js`, `backend/src/auth/redefinicao-senha.service.ts`, `usuario.controller.ts`, `common/origem.ts` (lista de endereços aceitos, agora compartilhada com o pagamento) |
| **Libras no modo escuro**: o widget era invertido duas vezes (cores trocadas). Agora imagens e canvas dentro dele não invertem de novo | `assets/css/a11y.css` |
| **Visual**: gradientes viraram cores chapadas, sombras discretas, cantos em dois tamanhos, tipografia mais leve, "Como funciona" e "Benefícios" sem cartões repetidos, sem roxo | `style.css` |
| **Página inicial**: textos reescritos, preço no exemplo, saíram a faixa de números e os "clientes de exemplo" | `index.html`, `assets/js/motion.js` |
| **Textos de login e cadastro** mais diretos, acentos corrigidos | `login*.html`, `cadastro*.html`, `dashboard-*.html` |
| **Celular**: campos sem zoom no iPhone, alvos de toque de 44px, botão de acessibilidade não cobre "Enviar", menu lateral rola | `style.css` |
| **Revisão de código**: removidos busca de organização desativada, contas guardadas no navegador que nunca eram gravadas e 69 regras de CSS sem uso; perfil de empresa e usina lista os 27 estados; lista de funcionários usa os campos que a API devolve; situações sem cor ganharam cor; `console.log` virou `Logger` | `script.js`, `style.css`, `backend/src/main.ts` |
| Teste | `qa/security/sec-senha.mjs` novo; teste de fundo do login ajustado para cor chapada | `qa/` |

**Não alterado, decisão do dono do projeto:** o frete aparece no total da proposta mas o pagamento cobra só o valor; o convite de funcionário não funciona de ponta a ponta; contas demo são criadas também em produção; compra de peça do catálogo é marcada como paga sem Stripe; cerca de 150 textos ainda sem acento; `pagamentos.html` e `perfil.html` sem link no menu. Quem já está logado continua logado por até 8 horas depois de trocar a senha.

## Pedido 38 (17/11): nomes das páginas padronizados

Publicado no site principal com a aprovação do dono do projeto.

| Antes | Depois |
|---|---|
| `dashboard-pessoa-juridica` (peças comerciais da empresa) | `pecas-comerciais-empresa` |
| `catalogo-pessoa-fisica` | `pecas-comerciais-pessoa-fisica` (a usina já era `pecas-comerciais-usina`) |
| `usinas-pessoa-fisica`, `usina-pessoa-fisica` | `usinas`, `usina` (servem empresa e pessoa física) |
| `favoritos-pessoa-fisica`, `peca-pessoa-fisica`, `compra-pessoa-fisica` | `favoritos`, `peca`, `compra` |
| `solicitacoes`, `nova-solicitacao` | `pedidos-sob-medida`, `novo-pedido-sob-medida` |
| `solicitacoes-bloqueio-usina` | `usinas-bloqueadas` |
| `avaliacoes`, `funcionarios`, `pagamentos` (só da empresa) | `avaliacoes-empresa`, `funcionarios-empresa`, `pagamentos-empresa` |

Os arquivos de script em `Site/assets/js` seguiram os mesmos nomes. Links, menus (`role-nav.js`), avisos do servidor e testes foram atualizados (142 referências). Os endereços antigos continuam funcionando por redirecionamento (`Site/_redirects`). Títulos alinhados ao menu: "Peças comerciais" (empresa) e "Usinas bloqueadas". As rotas internas da API (`/api/solicitacoes`) não mudaram.

## Pedido 39 (17/11): logo nova

Publicado no site principal com a aprovação do dono do projeto.

| Mudança | Onde |
|---|---|
| A logo enviada (`logo.svg`, quatro elos hexagonais) virou a marca do site: aparece no quadrado colorido de cada tipo de conta (azul, laranja, verde-azulado), no cabeçalho, nos logins e no menu lateral. Fica nítida em qualquer tamanho por ser SVG | `Site/assets/img/logo-mark-branco.svg` (branca, para fundo colorido), `logo-mark.svg` (azul `#113272`, fundo transparente, para fundo claro), 50 páginas HTML, `Site/style.css` |
| Ícone da aba do navegador (favicon) com a marca branca no quadrado azul | `Site/assets/img/favicon.svg` |

A imagem de compartilhamento em redes sociais (`preview.png`) ainda tem o desenho antigo e precisa ser refeita à parte.

## Pedido 40 (17/11): logo nova, segunda versão

Publicado direto na main a pedido do dono do projeto.

| Mudança | Onde |
|---|---|
| Trocada a marca pela nova versão (`usinalink-logo.svg`, dois elos hexagonais), que não tem os defeitos da anterior. Mesma estrutura: branca no quadrado colorido, azul para fundo claro, favicon com a marca branca no quadrado azul. As páginas não mudaram, só os três arquivos de imagem | `Site/assets/img/logo-mark-branco.svg`, `logo-mark.svg`, `favicon.svg` |

A imagem de compartilhamento em redes sociais (`Site/assets/img/preview.png`, 1200×630) foi refeita com a logo nova, no mesmo texto de antes e com fundo azul liso.

## Pedido 42 (17/11): Libras com cores certas no modo escuro

| Problema | Correção | Onde |
|---|---|---|
| No modo escuro o painel e o avatar do VLibras ficavam com as cores invertidas (cabelo branco, pele escura). A versão nova do VLibras (7.12) desenha tudo num elemento próprio (`#vlibras-app-root`, com shadow DOM), fora do `[vw]` que a correção anterior tratava | O script de acessibilidade aplica a segunda inversão em cada peça do painel quando o modo escuro está ligado, e tira quando desliga. Conferido no navegador com o Libras aberto | `Site/assets/js/a11y.js` |

## Pedido 41 (17/11): correções da revisão do TCC

Feito na branch `correcoes-revisao` a partir do relatório `docs/REVISAO-TCC.md`. Os códigos (ALT-01, CRI-01…) são os do relatório.

| Item | O que foi feito | Onde |
|---|---|---|
| ALT-01 | Filtro por estado e frete por região voltaram a funcionar (as duas expressões tinham um caractere invisível no lugar de ``) | `Site/assets/js/pedidos-usina.js`, `enviar-proposta.js` |
| CRI-01 | "Propostas recebidas" agora separa as propostas por pedido, mostra a peça e o número do pedido, e só marca "Melhor proposta" dentro do mesmo pedido (e só quando há mais de uma aberta) | `Site/script.js`, `Site/style.css` |
| ALT-02 | Pagamento duplicado barrado no servidor: o pedido é "reservado" por um UPDATE condicional, então só uma chamada simultânea passa | `backend/src/pagamento/pagamento.service.ts` |
| ALT-03 | Servidor recusa (400) quantidade negativa ou decimal, data inválida ou passada, urgência inventada, valor/frete/estoque negativos, prazo gigante, status de funcionário inventado, CPF/CNPJ com todos os dígitos iguais | `backend/src/common/numeros.ts` e os DTOs de solicitação, proposta, peça, funcionário e `usuario.service.ts` |
| ALT-04 | Compra de catálogo exige peça cadastrada; fornecedor e preço vêm do catálogo, nunca do navegador | `solicitacao-comercial.service.ts` |
| ALT-07 | Saiu o que a tela prometia e não existia: "Reenviar convite", avisos por e-mail/resumo semanal/mensagens, e o contato por e-mail `atendimento@usinalink.test` (o chat ficou só com as dúvidas rápidas). A landing não diz mais "solicitações compatíveis" | `Site/script.js`, `Site/assets/js/chat-contato.js`, `Site/confirmacao-pedido.html`, `Site/index.html` |
| ALT-09 | Cancelar um pedido cancela as propostas vivas (inclusive a aceita) e avisa as usinas | `backend/src/pedido/pedido.service.ts` |
| ALT-12 | Dados de demonstração coerentes para bancos novos: acentos, local de entrega, sem avaliação 5★ em pedido não concluído nem pagamento pendente sem pagar, e o "pedido sob medida" demo agora tem pedido ligado (pode receber proposta) | `backend/src/database/seed.service.ts` |
| Teste | Novo teste `qa/security/sec-revisao.mjs` (pagamento simultâneo, cancelamento, valores absurdos, documentos repetidos, compra forjada) | `qa/` |

**Não feito (precisa de decisão ou de acesso fora do código):** trocar a senha das contas demo na produção (CRI-02) e manter o servidor acordado (ALT-08); página de privacidade e consentimento (LGPD); documento do TCC; dados que já existem no banco de produção (o seed não reescreve linhas antigas).

## Pedido 30 (15/11): revisão de design (juntado na main em 17/11; as partes de estilo foram superadas pela revisão do Pedido 37)

Fiz capturas de tela de 14 páginas (página inicial, login, cadastro, painéis da empresa, usina e pessoa física, propostas, catálogo) no computador e no celular, avaliei e corrigi o que destoava.

**Veredito:** a base já é profissional: paleta azul consistente, boa hierarquia de títulos, cartões limpos, menu lateral com ícones, cor própria por tipo de conta, textos claros. O que tirava o ar profissional eram detalhes de acabamento, listados abaixo.

| Problema encontrado | Correção | Onde |
|---|---|---|
| Fundos e degradês com **roxo** (login, cadastro, faixa "Pronto para receber propostas", banner de perfil) que não faz parte da marca | Trocados por tons de azul da marca | `Site/style.css` |
| Tela "Entrar numa conta": cartão estreito, "Acompanha-mento" quebrado no meio da palavra | Cartão mais largo, sem quebrar palavra | `Site/style.css` |
| Títulos grandes quebravam com uma palavra sozinha na linha de baixo | Quebra equilibrada nos títulos | `Site/style.css` |
| **Dois botões "Sair"** na mesma tela (cabeçalho e menu lateral) | Fica só o do menu | `Site/style.css` |
| Cartões de proposta com 3 botões empilhados | "Aceitar proposta" em destaque (largura toda) e "Ver detalhes" + "Recusar" lado a lado | `Site/style.css` |
| Campo de busca cortava o texto ("…ou statu") e o botão "Ver todos" caía de linha | Busca mais larga; no celular ocupa a linha inteira | `Site/style.css` |
| Urgência aparecia como "media" (minúscula e sem acento) | Passa a mostrar "Média", "Alta" etc. | `Site/assets/js/safe-html.js`, `pedidos-usina.js`, `enviar-proposta.js`, `solicitacoes.js` |
| Menu da usina: "Solicitações de peças" e "Histórico relacionado" quebravam em 2 linhas | Nomes mais curtos ("Solicitações", "Histórico") | `Site/assets/js/role-nav.js` |
| Botões flutuantes escondiam o fim das páginas | Espaço extra no fim das páginas; botão do chat menor no celular | `Site/style.css` |
| Rodapé da página inicial com faixa vazia embaixo | Ajustado | `Site/style.css` |
| Celular: selo "Conta Empresa" encavalado no logo do cabeçalho | Escondido em tela pequena | `Site/style.css` |

**Ainda dá para melhorar (não fiz, precisa de decisão ou de conteúdo):** os números da faixa "3 / 4 / 1" na página inicial dizem pouco (trocar por frases de benefício); falta uma imagem ou foto real de peças/usina na página inicial; os textos dos dados de teste (peças com nomes de teste) vão sumir quando houver dados reais.
