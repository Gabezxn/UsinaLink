# UsinaLink: pronto para apresentar (17/11)

## Status

**PRONTO**: `node qa/backlog-lint.mjs` mostra `P0 abertos: 0, P1 abertos: 0`, e a bateria completa (`node qa/run-all.mjs --fresh`) passou inteira (17 verificações).

O que foi verificado automaticamente (banco Postgres local de teste, nunca o de produção):

| Área | Resultado |
|---|---|
| Backend (testes unitários) | 40 testes passando |
| Segurança | autorização por conta em pedido/proposta/pagamento/avaliação, vazamentos, anexos, limite de login, segredo JWT, admin demo, varredura de XSS em todas as telas |
| Fluxos | pessoa física (catálogo → compra → pagamento → entrega → avaliar), empresa ↔ usina (solicitação → proposta → aceite → pagamento → entrega → histórico), compra de peça pela empresa, sessão expirada, servidor dormindo |
| Acessibilidade | axe (WCAG 2.1 AA) com **0** violações sérias/críticas nas páginas públicas e nas 3 áreas; teclado, modais, avisos, formulários, tabelas |
| Segurança do site | cabeçalhos (CSP sem script inline, nosniff, X-Frame-Options, Referrer-Policy) sem erro em nenhuma página |

## Contas de demonstração (senha `Demo@123`)

| Área | E-mail |
|---|---|
| Empresa | `empresa@demo.com` |
| Usina | `usina@demo.com` |
| Pessoa física | `pessoa@demo.com` |

Não existe mais conta de administrador demo (ela era uma falha de segurança: foi desativada). Se precisar do admin, defina `SEED_ADMIN_PASSWORD` no Render com uma senha forte.

## Roteiro sugerido (≈ 8 minutos)

1. **Abertura (1 min):** página inicial. Mostre o botão **Acessibilidade** (canto inferior direito): aumentar a fonte, alto contraste, modo escuro, fonte para dislexia, reduzir animações e o botão **VLibras** (Libras). Mostre o link "Pular para o conteúdo" apertando `Tab` logo ao abrir.
2. **Empresa (3 min):** entre como `empresa@demo.com` → **Solicitações → Nova solicitação** (anexar um PDF) → publicar. Em outra aba entre como usina e **envie uma proposta** (usina → Pedidos disponíveis). Volte à empresa → **Propostas recebidas → Aceitar** → **Pagar pedido** → comprovante → **Histórico** (confirmar entrega).
3. **Usina (2 min):** `usina@demo.com` → Pedidos disponíveis → Enviar proposta → Propostas enviadas (status muda quando a empresa aceita) → Peças comerciais (cadastro de peça com valor) → Solicitações de peças.
4. **Pessoa física (2 min):** `pessoa@demo.com` → Peças comerciais → Ver detalhes e comprar → a usina aceita → **Minhas compras → Pagar** → Confirmar entrega → Avaliar.
5. **Fechamento:** mostre que dá para usar tudo só com o teclado (`Tab`, `Enter`, `Esc` nos modais) e o aviso "Acordando o servidor…" se o servidor estiver dormindo.

## Limitações conhecidas (itens P2 abertos, não bloqueiam)

Todos estão no `docs/BACKLOG.md` com arquivo e linha. Os principais:

- **Fluxo:** depois de aceitar uma proposta são 3 cliques até o pagamento (FLX-6); só dá para recusar proposta dentro de "Ver detalhes" (FLX-7); dashboards de empresa e usina mostram números sem links de pendência (FLX-11); frete da proposta é uma estimativa, não editável (FLX-18); mensagens de erro de permissão aparecem em inglês, como "Forbidden" (FLX-30).
- **Acessibilidade (melhorias):** algumas páginas com títulos repetidos (A11Y-11), botões "Abrir ações" sem contexto (A11Y-12), resultados de busca sem aviso para leitor de tela (A11Y-9).
- **Segurança (endurecimento):** funcionários sem papéis de permissão (SEC-16), tokens de 24 h sem revogação (SEC-15), possíveis duplicações em duplo clique sem transação (SEC-30), senha do admin demo sem exigência de força (SEC-37).
- **Peças:** o modal de detalhes da peça (empresa) tem botão "Solicitar compra" que só fecha o modal; use o botão do cartão (FLX-34).
- **VLibras:** não foi possível testar o widget de Libras aqui (sem internet). Veja o item 7 do checklist.

## Checklist do que SÓ você pode fazer (nessa ordem)

1. **Fazer o merge** da branch `claude/elegant-shannon-4ar9hg` para o branch padrão do repositório (GitHub → *Pull requests* → *New pull request* → base = branch padrão → criar → *Merge*). Eu não abri PR, como combinado. Sem o merge, o keep-alive não roda e o Cloudflare não publica o código novo.
2. **Cloudflare Pages:** siga `docs/DEPLOY-CLOUDFLARE-PAGES.md` (projeto `usinalink`, saída `Site`, sem build). O endereço será `https://usinalink.pages.dev`.
3. **Render (variáveis de ambiente do backend):**
   - `ALLOWED_ORIGINS` = `https://usinalink.pages.dev,http://localhost:5500` (sem isso o login do site novo não funciona).
   - `JWT_SECRET` = texto aleatório de 32+ caracteres (`openssl rand -hex 32`). Sem isso o servidor usa um segredo temporário e todos precisam entrar de novo a cada reinício.
   - Não defina `SEED_ADMIN_PASSWORD` (mantém o admin demo desativado).
   - Depois: **Manual Deploy**. Confirme em `https://usinalink-orbz.onrender.com/api/health` que aparece `{"ok":true,"db":true}`.
4. **Supabase:** abra o painel e confirme que o projeto **não está pausado** (plano grátis pausa depois de ~7 dias sem uso). Se estiver, clique em *Restore*. Confirme que a senha do banco (`DB_PASSWORD` do Render) não é a de nenhum exemplo do repositório.
5. **Segredos:** a varredura do histórico do git não encontrou chave nem senha real (só o segredo de exemplo e a senha de demonstração). Mesmo assim, se algum dia o `JWT_SECRET` ou a senha do banco foi igual ao exemplo do `.env.example`, troque agora (passos 3 e 4).
6. **Banco de produção:** o admin demo antigo (`admin@demo.com`) será desativado automaticamente no primeiro boot. Se quiser remover de vez, apague essa linha na tabela de usuários do Supabase.
7. **VLibras:** abra o site publicado com internet normal e confirme que o botão de Libras aparece (canto direito). Se não aparecer e o console (F12) mostrar erro de "Content Security Policy", abra `Site/_headers` e apague a linha `Content-Security-Policy:` (o resto continua protegendo), faça commit e o Cloudflare republica em 1 minuto.
8. **Keep-alive:** em *GitHub → Actions → Keep-alive*, confirme execuções verdes depois do merge. O agendamento do GitHub pode atrasar; por isso:
9. **2 minutos antes de apresentar:** abra o site, entre com a conta demo e navegue uma tela, para o servidor estar acordado. Opcional e grátis: cadastre `https://usinalink-orbz.onrender.com/api/health` num monitor como o UptimeRobot (a cada 5 minutos).

## Como retomar / reexecutar os testes

```bash
npm --prefix backend ci
npm --prefix qa ci
node qa/env/up.mjs            # sobe Postgres de teste + backend + site (precisa de Postgres 16 instalado)
node qa/run-all.mjs --fresh   # bateria completa, uma linha por verificação
node qa/backlog-lint.mjs      # P0/P1 abertos
```
