# Passagem de trabalho: UsinaLink (conversa na nuvem → conversa no PC)

Leia este arquivo inteiro, depois `docs/MUDANCAS.md`, `docs/BACKLOG.md` e `docs/PRONTO-PARA-APRESENTAR.md`, e rode `git log -8`.

## Como falar com o usuário (importante)
- Português simples, **curto**, sem jargão de programador. Passo a passo numerado quando ele precisar fazer algo.
- No **fim de cada pedido**, atualize `docs/MUDANCAS.md` (o que mudou + onde). É o único arquivo de mudanças.
- Sempre que eu enviar código e o Cloudflare gerar endereço novo, **avise o endereço na hora**. O aviso do Cloudflare aparece num comentário do PR no GitHub.
- Antes de ações que publicam ou mudam as contas dele (merge, deploy, variáveis do Render), **confirme**. Ele já autorizou os merges dos PRs 1 e 2; o PR 3 ainda não.
- O usuário usa **Windows** e o navegador **Brave**, que está com uma **live aberta (Kick)**: não feche nem mexa nessa aba/janela. Ele não quer usar OneDrive; o projeto está em `C:\Projetos\Usinalink`.
- Custo permitido: só o plano Claude Pro. Nada pago.

## O projeto
- **UsinaLink:** marketplace B2B de peças industriais. Site em HTML/CSS/JS puro (pasta `Site/`), API NestJS (pasta `backend/`), banco Postgres no **Supabase**, API publicada no **Render** (`https://usinalink-orbz.onrender.com`), site no **Cloudflare** (projeto "Workers Builds" chamado `usinalink`).
- **Prazo:** apresentação do site em **17/11/2026**. Ele precisa de um site apresentável, seguro e acessível, antes disso.
- GitHub: `Gabezxn/UsinaLink`, branch padrão `main`.
- Contas demo (senha `Demo@123`): `empresa@demo.com`, `usina@demo.com`, `pessoa@demo.com`. Não existe admin demo (foi desativado por segurança).

## O que já foi feito (resumo; detalhes em `docs/MUDANCAS.md`)
- 11 tasks do plano `docs/superpowers/plans/2026-11-14-reta-final.md` concluídas. `docs/BACKLOG.md`: **0 P0 e 0 P1 abertos**; só P2.
- Segurança, fluxos das 3 contas, acessibilidade (axe 0 violações sérias), resiliência (`/api/health`, aviso "Acordando o servidor…"), cabeçalhos de segurança (`Site/_headers`).
- Testes automáticos em `qa/` (rodam só em Linux com Postgres; `node qa/run-all.mjs --fresh`). Não rodam no Windows do usuário; se precisar rodar testes, use a conversa na nuvem ou WSL.
- **PR 1 e PR 2: já em `main`.** Cloudflare passou a construir depois do `wrangler.jsonc` (PR 2).
- **PR 3 (aberto, ainda não em `main`):** o botão de Acessibilidade ficava em cima do "Fale conosco" na página inicial; agora vai para o canto esquerdo (`Site/assets/css/a11y.css`).
- A branch de trabalho é `claude/elegant-shannon-4ar9hg`. Ela está **à frente do `main`** (tem o PR 3 e este arquivo). Para ver tudo: `git fetch` e `git checkout claude/elegant-shannon-4ar9hg`.

## Endereços
- Site fixo (só atualiza quando algo entra no `main`): `https://usinalink.tibiel2010.workers.dev` (esse endereço eu **deduzi** do nome do projeto; confirme se abre o site).
- Versão em teste (branch, sempre a mais recente): `https://claude-elegant-shannon-4ar9hg-usinalink.tibiel2010.workers.dev`.
- Cada commit também gera um endereço próprio (ex.: `https://4442849a-usinalink.tibiel2010.workers.dev`); esses mudam a cada envio.
- API: `https://usinalink-orbz.onrender.com` (saúde: `/api/health`, deve mostrar `{"ok":true,"db":true}`).

## Onde parou (o que falta)
1. **Login como empresa falhou no endereço de teste.** Causa mais provável: o servidor só aceita chamadas dos endereços listados em `ALLOWED_ORIGINS` no Render, e os endereços de teste não estão lá. Falta **confirmar** isso (F12 → Console ao tentar entrar mostra um erro de CORS) e testar o login no endereço fixo.
2. **Render (feito pelo usuário, confirmar):** variáveis `ALLOWED_ORIGINS` (endereço fixo do site, sem barra no final, separados por vírgula) e `JWT_SECRET` (texto aleatório 32+ caracteres). **Não** definir `SEED_ADMIN_PASSWORD`. Depois do deploy, conferir `/api/health`.
3. **Sugestão que ele ainda não aprovou:** mudar `backend/src/main.ts` para aceitar automaticamente origens `https://*-usinalink.tibiel2010.workers.dev` (CORS por padrão), para não precisar editar o Render a cada versão de teste. Exige merge no `main` + deploy no Render.
4. **Pedir o merge do PR 3** (botão de acessibilidade) e, depois, confirmar que aparece o botão de **Libras** (VLibras) no canto direito. Não foi possível testar o VLibras na nuvem (sem internet). Se o console mostrar erro de "Content Security Policy", ajustar/apagar a linha `Content-Security-Policy` de `Site/_headers`.
5. **Supabase:** confirmar que o projeto **não está pausado**.
6. Conferir se `empresa@demo.com` entra na produção. A conta foi criada antes das minhas mudanças e a senha no banco de produção pode não ser `Demo@123`. Se não for, ajustar com o usuário.
7. **Cloudflare:** a build usa `wrangler.jsonc` (publica `Site/`). O usuário já viu a build passar.
8. Antes de 17/11: abrir o site 2 minutos antes de apresentar para o Render acordar. Ping automático em `.github/workflows/keepalive.yml` (só roda no `main`, a cada 10 min, best-effort).
9. Itens P2 do `docs/BACKLOG.md` (melhorias) só se sobrar tempo.

## Cuidados
- Nunca coloque segredos (senhas, `JWT_SECRET`, chaves) em arquivos do projeto ou em mensagens do GitHub.
- O `docs/PRONTO-PARA-APRESENTAR.md` tem o roteiro da apresentação e o checklist completo.
