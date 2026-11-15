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
