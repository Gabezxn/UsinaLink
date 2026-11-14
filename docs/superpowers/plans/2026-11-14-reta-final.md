# UsinaLink Reta Final Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (modo "Native": o dev implementa sozinho; auditores rodam como subagentes só-leitura nas Tasks 5 e 11). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Entregar o UsinaLink apresentável até 17/11: fluxos das 3 contas fechados, sem falhas graves de segurança ou disponibilidade, acessibilidade WCAG 2.1 AA/eMAG e URL grátis.

**Architecture:** Papéis em `docs/agentes/`, estado em `docs/BACKLOG.md`. Um ambiente de QA local (`qa/`) roda backend + site + banco de teste e produz relatórios curtos (axe, console, E2E). Acessibilidade centralizada em `a11y.css` + `a11y.js` injetados nas páginas. Correções em lotes, com commit e push por lote.

**Tech Stack:** HTML/CSS/JS puros (`Site/`), NestJS + TypeORM (`backend/`), Playwright e Chromium (já instalados, não reinstalar), `axe-core` (único novo devDependency, em `qa/`), Cloudflare Pages (grátis), GitHub Actions (keep-alive).

**Spec:** `docs/superpowers/specs/2026-11-14-reta-final-design.md`

## Global Constraints

- Custo zero: só plano Claude Pro. Nenhum serviço, domínio ou dependência paga.
- Push só em `claude/elegant-shannon-4ar9hg`. Sem PR a menos que o usuário peça.
- Nunca tocar Render, Supabase ou Cloudflare. Esses passos vão para o checklist do usuário (Task 11).
- Sem funcionalidades novas, exceto acessibilidade, resiliência e segurança. Permitido refazer código quando necessário, sem trocar de stack.
- Economia de tokens: auditores usam `model: "sonnet"`, são só-leitura e devolvem no máximo 40 linhas no formato do BACKLOG. Ninguém lê arquivo inteiro sem necessidade (usar `grep`/`Read` com limite). Comandos de QA imprimem só falhas.
- Severidades: **P0** derruba o site ou compromete a segurança. **P1** quebra um fluxo principal ou é barreira de acessibilidade. **P2** é polimento. Só P0 e P1 bloqueiam o "pronto".
- Contas demo (seed): `empresa@demo.com`, `usina@demo.com`, `pessoa@demo.com`, `admin@demo.com`, senha `Demo@123`. Papéis da sessão: `empresa`, `usina`, `pessoa_fisica`.
- A sessão do site fica em `sessionStorage` (`usinalinkSession`). Preferências de acessibilidade ficam em `localStorage` (`usinalinkA11y`).
- Commits terminam com as linhas `Co-Authored-By` e `Claude-Session` do sistema.

## Review Focus

Cada linha abaixo tem um teste dentro da task indicada.
1. Render dormindo: a primeira chamada demora 40 s. A tela deve mostrar "Acordando o servidor…" e depois carregar, não ficar em branco nem dar erro (Task 9).
2. Conta A pedindo dado da conta B por ID (compra, pedido, proposta, notificação) deve receber 403/404 (Task 6).
3. Texto do usuário como `<img src=x onerror=alert(1)>` em nome, descrição ou chat deve aparecer como texto, sem executar. Há 83 usos de `innerHTML` (Task 6).
4. Usuário só de teclado conclui login → compra, com foco preso no modal e devolvido ao fechar (Task 4).
5. Token expirado ou inválido no meio da sessão leva ao login com mensagem, sem laço de redirecionamento (Task 8).

---

## File Structure

- `docs/agentes/{dev-senior,cacador-falhas,revisor-fluxos,auditor-a11y}.md`, `docs/agentes/README.md`: papéis e como retomar.
- `docs/BACKLOG.md`: achados e status. `docs/PRONTO-PARA-APRESENTAR.md`: entrega final.
- `qa/`: `package.json`, `env/up.mjs`, `env/down.mjs`, `env/static.mjs`, `lib/login.mjs`, `checks/axe.mjs`, `checks/console.mjs`, `flows/*.mjs`, `security/*.mjs`, `backlog-lint.mjs`.
- `Site/assets/css/a11y.css`, `Site/assets/js/a11y.js`, `Site/assets/js/safe-html.js`, `scripts/inject-assets.mjs`.
- `Site/_headers`, `Site/404.html`, `.github/workflows/keepalive.yml`.
- `backend/src/health/` (endpoint de saúde) e correções de segurança conforme BACKLOG.

---

### Task 1: Papéis dos agentes e BACKLOG

**Files:**
- Create: `docs/agentes/dev-senior.md`, `docs/agentes/cacador-falhas.md`, `docs/agentes/revisor-fluxos.md`, `docs/agentes/auditor-a11y.md`, `docs/agentes/README.md`, `docs/BACKLOG.md`, `qa/backlog-lint.mjs`

**Interfaces:**
- Produces: formato de achado no BACKLOG, uma linha de tabela: `| ID | Sev | Área | Onde (arquivo:linha) | Problema + como reproduzir | Correção sugerida | Status |`. IDs: `SEC-n`, `FLX-n`, `A11Y-n`, `BUG-n`. Status: `aberto|corrigido|descartado`.
- Produces: `node qa/backlog-lint.mjs` sai com código 1 se houver linha sem os 7 campos ou Sev fora de P0/P1/P2, e imprime a contagem de P0/P1 abertos.

- [x] **Step 1: Write the failing test.** Rodar `node qa/backlog-lint.mjs` com um `docs/BACKLOG.md` de teste contendo a linha malformada `| SEC-1 | P9 | x |`. Esperado: código de saída 1 e a mensagem `linha 1: Sev inválida`.
- [x] **Step 2: Run it to verify it fails** (o script ainda não existe: `Cannot find module`).
- [x] **Step 3: Implement `qa/backlog-lint.mjs`** (Node puro, sem dependências) e escrever os 4 papéis (cada um ≤ 40 linhas: missão, o que olhar, o que NÃO fazer, formato de saída, regra de economia de tokens) e o `README.md` (como retomar após o limite do Pro: ler só `BACKLOG.md` e `git log -5`). Os papéis têm este foco:
  - `cacador-falhas`: segurança e quebras (autorização por conta, XSS, CORS, segredos no repositório e no histórico, upload, rate limit, JWT, validação).
  - `revisor-fluxos`: passos e cliques a mais, mensagens confusas, becos sem saída, por conta.
  - `auditor-a11y`: teclado, zoom 200% e reflow em 320 px, leitor de tela e contraste.
  - `dev-senior`: implementa por prioridade, teste primeiro e commit por lote.
- [x] **Step 4: Run it to verify it passes.** Com um `BACKLOG.md` vazio (só o cabeçalho), `node qa/backlog-lint.mjs` imprime `P0 abertos: 0, P1 abertos: 0` e sai com 0.
- [x] **Step 5: Commit** `docs/agentes docs/BACKLOG.md qa/backlog-lint.mjs`.

### Task 2: Ambiente de QA local

**Files:**
- Create: `qa/package.json`, `qa/env/up.mjs`, `qa/env/down.mjs`, `qa/env/static.mjs`, `qa/lib/login.mjs`, `qa/env/smoke.mjs`
- Modify: `backend/src/database/database.module.ts` (só se o fallback SQLite for necessário)

**Interfaces:**
- Produces: `npm --prefix qa run up` sobe banco de teste + backend (`:3000`, `DB_SYNCHRONIZE=true`, seed demo) + site estático (`:5500`) e imprime `API=http://localhost:3000 SITE=http://localhost:5500`. `npm --prefix qa run down` encerra tudo.
- Produces: `loginAs(page: Page, role: 'empresa'|'usina'|'pessoa_fisica'): Promise<void>` em `qa/lib/login.mjs`, que faz login pela UI com a conta demo e espera o dashboard.
- Produces: `static.mjs` serve `Site/` aplicando as regras de `Site/_headers` quando o arquivo existir (usado na Task 10).

- [ ] **Step 1: Write the failing test `qa/env/smoke.mjs`:** `GET API/` responde 200; `POST /api/auth/login/empresa` com `empresa@demo.com`/`Demo@123` retorna token; `GET SITE/index.html` responde 200.
- [ ] **Step 2: Run it to verify it fails** (`npm --prefix qa run smoke` falha porque nada está no ar).
- [ ] **Step 3: Implement `up.mjs`.** Ordem de decisão do banco: (a) `apt-get install -y postgresql` e `initdb`/`pg_ctl` num diretório do scratchpad, com `DB_TYPE=postgres`, `DB_SSL=false`; (b) se o apt estiver bloqueado, adicionar `DB_TYPE=sqlite` (`better-sqlite3`) em `database.module.ts`, só para teste. Nunca ler `.env` de produção nem usar credenciais reais.
- [ ] **Step 4: Run to verify it passes** (`up`, depois `smoke` retorna `OK`, depois `down`).
- [ ] **Step 5: Commit.**

### Task 3: Verificadores automáticos (axe, console e links)

**Files:**
- Create: `qa/checks/axe.mjs`, `qa/checks/console.mjs`, `qa/baseline.txt`

**Interfaces:**
- Consumes: `loginAs` (Task 2).
- Produces: `node qa/checks/axe.mjs [--role=<papel>]` visita todas as páginas de `Site/*.html`, com login quando a página tem `data-user-role`, e imprime uma linha por violação `serious|critical`: `pagina | regra | seletor`. Sai com 1 se houver alguma. `console.mjs` imprime erros de console, requisições 4xx/5xx e links quebrados (`pagina | tipo | detalhe`).
- Produces: `qa/baseline.txt` guarda o resultado inicial, para medir a evolução.

- [ ] **Step 1: Write the failing test:** rodar `axe.mjs` na `Site/index.html` atual. Esperado: pelo menos 1 violação (o site não tem `alt` nem skip link). Se vier 0, o verificador está errado.
- [ ] **Step 2: Run it to verify it fails** (inexistente).
- [ ] **Step 3: Implement os dois scripts.** Injetar `axe-core` por `page.addScriptTag({ path: require.resolve('axe-core') })` e usar o `playwright` global. Imprimir só falhas.
- [ ] **Step 4: Run to verify it passes:** `baseline.txt` gerado com contagem por regra. Os scripts rodam todas as páginas em menos de 3 min.
- [ ] **Step 5: Commit.**

### Task 4: Base de acessibilidade (a11y.css + a11y.js)

**Files:**
- Create: `Site/assets/css/a11y.css`, `Site/assets/js/a11y.js`, `scripts/inject-assets.mjs`, `qa/flows/a11y-base.mjs`
- Modify: `Site/*.html` (inserção das tags, feita pelo script), `Site/style.css` (só variáveis de cor, se necessário para o modo escuro e o contraste)

**Interfaces:**
- Produces: `a11y.js` expõe `window.UsinaA11y = { get(): Prefs, set(partial: Partial<Prefs>): void, reset(): void }`, com `Prefs = { fontScale: 100|112|125|150, contrast: 'normal'|'high', theme: 'light'|'dark'|'auto', spacing: boolean, dyslexia: boolean, reduceMotion: boolean, highlightLinks: boolean }`, persistido em `localStorage['usinalinkA11y']` com try/catch.
- Produces: botão fixo "Acessibilidade" (`aria-expanded`, painel `role="dialog"`, ESC fecha, foco devolvido), link "Pular para o conteúdo" como primeiro foco apontando para `main` (recebe `id="conteudo"` se faltar), VLibras carregado de `https://vlibras.gov.br/app/vlibras-plugin.js` (o `<div vw>` padrão), respeito a `prefers-reduced-motion` e `prefers-color-scheme`, `:focus-visible` forte, alvos de toque ≥ 44 px.
- Produces: `node scripts/inject-assets.mjs` insere `<link>` e `<script defer>` em cada `Site/*.html`, de forma idempotente (rodar 2 vezes não duplica).

- [ ] **Step 1: Write the failing test `qa/flows/a11y-base.mjs`** (Playwright) com estas asserções em `index.html` e em um dashboard logado:
  - o primeiro `Tab` foca o link `Pular para o conteúdo`;
  - `UsinaA11y.set({ fontScale: 150 })` faz o `font-size` de `<html>` ser 150% e o valor persiste após reload;
  - `contrast: 'high'` altera o fundo do `body` e passa no axe `color-contrast`;
  - com `reduceMotion` ativo, `animation-duration` computada é `0s`;
  - o elemento `[vw]` do VLibras existe;
  - **teclado (Review Focus 4):** abrir o painel com Enter, o foco fica preso no painel, ESC fecha e o foco volta ao botão.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement** os dois arquivos e rodar `inject-assets.mjs`. O CSS usa variáveis (`--a11y-*`) e classes no `<html>` (`a11y-contrast-high`, `a11y-dark`, etc.).
- [ ] **Step 4: Run to verify it passes**, e rodar `qa/checks/axe.mjs` para confirmar que as violações caíram em relação à baseline.
- [ ] **Step 5: Commit.**

### Task 5: Auditoria rodada 1 (3 subagentes só-leitura, em paralelo)

**Files:**
- Modify: `docs/BACKLOG.md`

**Interfaces:**
- Consumes: papéis da Task 1, relatórios de `qa/checks` e ambiente de QA no ar (Task 2).
- Produces: achados no formato da Task 1.

- [ ] **Step 1: Subir o ambiente** (`npm --prefix qa run up`) e rodar `axe.mjs` e `console.mjs`, guardando só o resumo.
- [ ] **Step 2: Disparar 3 subagentes na mesma resposta**, `model: "sonnet"`, cada um com o conteúdo do seu papel e o escopo de arquivos. `cacador-falhas` recebe `backend/src/**` e `Site/assets/js/**`, mais o `docs/relatorio-seguranca.md`; `revisor-fluxos` recebe as 3 jornadas; `auditor-a11y` recebe os resultados do axe e o `a11y.js`. Cada um devolve ≤ 40 linhas de tabela. O `cacador-falhas` também verifica o histórico do git atrás de segredos.
- [ ] **Step 3: Consolidar no `docs/BACKLOG.md`** sem duplicados, com severidade revista pelo dev.
- [ ] **Step 4: Verify:** `node qa/backlog-lint.mjs` sai com 0 e imprime a contagem de P0/P1.
- [ ] **Step 5: Commit.**

### Task 6: Correções P0 (segurança e disponibilidade)

**Files:**
- Modify: arquivos indicados no BACKLOG (`SEC-*` com P0), mais `backend/src/**` e `Site/assets/js/**`
- Create: `qa/security/*.mjs` (um teste por achado), `Site/assets/js/safe-html.js`

**Interfaces:**
- Produces: `escapeHtml(value: unknown): string` em `safe-html.js`, exposto como `window.SafeHtml.escape`. Todo valor vindo do usuário ou da API que vai para `innerHTML` passa por ele.

- [ ] **Step 1: Para cada P0, escrever o teste que falha** em `qa/security/<id>.mjs`. Exemplos obrigatórios, se confirmados no BACKLOG:
  - **(Review Focus 2)** `GET /api/pedidos/:id`, `/propostas/:id` e `/notificacoes` com o token da conta A para um recurso da conta B retornam 403 ou 404;
  - **(Review Focus 3)** cadastrar uma peça ou perfil com nome `<img src=x onerror=window.__xss=1>`, abrir a tela e verificar que `window.__xss` continua indefinido e que o texto aparece literal.
- [ ] **Step 2: Run each to verify it fails.**
- [ ] **Step 3: Implement as correções** na menor mudança possível (guardas de autorização no service, `escapeHtml`, validação de DTO, limites de upload e tipo, rate limit no login com `@nestjs/throttler`, que já é dependência, CORS restrito, segredos movidos para `.env`). Se houver segredo no histórico, registrar no BACKLOG como ação do usuário (rotacionar).
- [ ] **Step 4: Run to verify they pass** e rodar `cd backend && npm test`. Esperado: tudo verde.
- [ ] **Step 5: Commit por achado ou lote** e `git push`.

### Task 7: Correções P1 de fluxo e bugs

**Files:**
- Modify: conforme BACKLOG (`FLX-*`, `BUG-*` com P1)
- Create: `qa/flows/pf.mjs`, `qa/flows/empresa-usina.mjs`

- [ ] **Step 1: Write the failing E2E** (Playwright, usando `loginAs`):
  - **`pf.mjs`:** catálogo → solicitar compra → usina aceita → pagar → usina confirma entrega → PF vê a compra concluída e pode avaliar;
  - **`empresa-usina.mjs`:** nova solicitação → usina envia proposta → empresa aceita → pagamento → usina confirma entrega → histórico.
  Cada fluxo mede e imprime o número de cliques até concluir. A meta de simplicidade é reduzir passos citados no BACKLOG, sem adicionar telas.
- [ ] **Step 2: Run to verify they fail** onde houver bug P1 aberto.
- [ ] **Step 3: Implement** as correções em ordem de prioridade, refazendo trechos de código quando o BACKLOG indicar que o conserto é pior do que a reescrita.
- [ ] **Step 4: Run to verify they pass.** Os dois fluxos terminam com 0 erros de console (`console.mjs`).
- [ ] **Step 5: Commit por lote** e `git push`.

### Task 8: Correções P1 de acessibilidade por página

**Files:**
- Modify: `Site/*.html`, `Site/assets/js/pf-nav.js`, `Site/assets/js/ui-utils.js` e outros apontados pelo axe

- [ ] **Step 1: Write the failing test:** `node qa/checks/axe.mjs` lista as violações restantes (`serious|critical`) e as barreiras manuais P1 do BACKLOG (`A11Y-*`).
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement primeiro nos pontos compartilhados** (menu lateral gerado por JS, modais com foco preso e devolvido, avisos em `aria-live`, erros de formulário ligados por `aria-describedby`, botões de ícone com nome, `alt`, ordem de títulos, `<caption>` em tabelas), depois nos casos isolados.
- [ ] **Step 4: Run to verify it passes:** `axe.mjs` sai com 0 em todas as páginas e os 3 papéis. Teste adicional **(Review Focus 5)**: com o `sessionStorage` com token inválido, abrir um dashboard leva ao login com mensagem visível, sem laço de redirecionamento.
- [ ] **Step 5: Commit por lote** e `git push`.

### Task 9: Resiliência para a apresentação

**Files:**
- Create: `backend/src/health/health.controller.ts`, `backend/src/health/health.module.ts`, `.github/workflows/keepalive.yml`, `Site/404.html`, `qa/flows/cold-start.mjs`
- Modify: `backend/src/app.module.ts`, `Site/assets/js/api.js`

**Interfaces:**
- Produces: `GET /api/health` responde `{ ok: true, db: true }` depois de um `SELECT 1`, ou 503 se o banco cair. Sem autenticação e sem dados sensíveis.
- Produces: `api.js` mostra um aviso `role="status"` "Acordando o servidor, isso pode levar até 1 minuto…" se uma requisição passar de 4 s, e tenta de novo até 3 vezes com espera crescente.

- [ ] **Step 1: Write the failing test `qa/flows/cold-start.mjs` (Review Focus 1):** com `page.route` atrasando a primeira resposta da API em 6 s, o aviso aparece, some quando a resposta chega e o login conclui com sucesso. Mais um teste de `GET /api/health` (200 e `db: true`).
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement.** O workflow chama `GET https://usinalink-orbz.onrender.com/api/health` a cada 10 min (`cron: "*/10 * * * *"`), o que também mantém o Supabase ativo.
- [ ] **Step 4: Run to verify it passes.**
- [ ] **Step 5: Commit** e `git push`. No checklist do usuário: o cron do Actions só roda no branch padrão do repositório, então depende do merge (Task 11).

### Task 10: Cabeçalhos de segurança e configuração do Cloudflare Pages

**Files:**
- Create: `Site/_headers`, `docs/DEPLOY-CLOUDFLARE-PAGES.md`, `qa/flows/headers.mjs`

- [ ] **Step 1: Write the failing test `qa/flows/headers.mjs`:** com `static.mjs` aplicando `_headers`, todas as páginas carregam sem erro de CSP no console, e as respostas trazem `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `X-Frame-Options`/`frame-ancestors`.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement `_headers`.** O CSP deve permitir `self`, a API do Render (`connect-src`), os domínios do VLibras (`vlibras.gov.br` em `script-src`, `style-src`, `img-src`, `connect-src` e `frame-src`) e os estilos inline que o site usar hoje. O `docs/DEPLOY-CLOUDFLARE-PAGES.md` explica em passos curtos: criar o projeto Pages apontando para `Site/` (sem build), nome `usinalink` (gera `usinalink.pages.dev`) e adicionar a URL em `ALLOWED_ORIGINS` no Render.
- [ ] **Step 4: Run to verify it passes** (`headers.mjs` e `axe.mjs` continuam OK).
- [ ] **Step 5: Commit** e `git push`.

### Task 11: Reauditoria e fechamento

**Files:**
- Modify: `docs/BACKLOG.md`
- Create: `docs/PRONTO-PARA-APRESENTAR.md`

- [ ] **Step 1: Rodar tudo:** `backend npm test`, `qa/security/*`, `qa/flows/*`, `axe.mjs`, `console.mjs`, `backlog-lint.mjs`.
- [ ] **Step 2: Disparar 2 subagentes só-leitura** (`cacador-falhas` e `revisor-fluxos`, `model: "sonnet"`), apenas sobre o que mudou desde a Task 5 (`git diff --stat` mais lista de arquivos), cada um com ≤ 25 linhas de saída. Consolidar no BACKLOG e corrigir os P0/P1 novos com teste primeiro.
- [ ] **Step 3: Escrever `PRONTO-PARA-APRESENTAR.md`** com: status ("pronto" só se `backlog-lint` mostrar `P0 abertos: 0, P1 abertos: 0`); contas demo; roteiro sugerido de apresentação por conta; limitações conhecidas (os P2 abertos); **checklist do usuário:** criar o projeto no Cloudflare Pages, adicionar a URL em `ALLOWED_ORIGINS` no Render, fazer o merge para o branch padrão do repositório (para o keep-alive rodar), conferir que o Supabase não pausou, rotacionar segredos se o BACKLOG indicar, e abrir o site 2 min antes de apresentar.
- [ ] **Step 4: Verify:** `node qa/backlog-lint.mjs` mostra 0 P0 e 0 P1 abertos, e todos os scripts acima saem com 0.
- [ ] **Step 5: Commit** e `git push`. Avisar o usuário com a lista curta do que só ele pode fazer.
