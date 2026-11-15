# UsinaLink: reta final até a apresentação de 17/11 (design curto)

Aprovado pelo usuário em 2026-11-14. Tamanho: projeto. Versão curta, porque a conversa já cobriu cada ponto.

## Intenção e porquê
Apresentar o UsinaLink dia 17/11. O site precisa estar pronto antes, para o usuário planejar a apresentação. "Pronto" significa um site apresentável, sem falhas que derrubem o site ou comprometam a segurança dos usuários, com alto nível de acessibilidade. Custo total permitido: só o plano Claude Pro. Qualquer serviço pago está fora.

## Metas
1. Fluxo ponta a ponta das 3 contas (usina, empresa, pessoa física) funcionando, com bugs corrigidos.
2. Nenhum achado de segurança grave em aberto.
3. Acessibilidade WCAG 2.1 AA / eMAG: barra de ferramentas (fonte, contraste, modo escuro, espaçamento, fonte para dislexia, reduzir animações), VLibras, link de pular conteúdo, foco visível, teclado, leitor de tela, alt/aria, axe sem erro sério.
4. URL grátis e apresentável, preferencialmente `usinalink.pages.dev` (Cloudflare Pages).
5. Site utilizável na hora de apresentar, sem cold start do Render à vista.

## Não-metas
- Funcionalidades novas, exceto acessibilidade. Os "próximos passos" do relatório 5 ficam fora e viram roteiro de apresentação.
- Domínio próprio pago.
- Migrar de stack (continua HTML/CSS/JS puro mais NestJS).

## Anti-metas (falha mesmo que "funcione")
- Estourar o limite de tokens do Pro antes do dia 17.
- Deixar o site pior do que está ou quebrar fluxos que já funcionam.
- Alterar Render, Supabase ou Cloudflare sem o usuário.

## Restrições
- Push só na branch `claude/elegant-shannon-4ar9hg`. Sem PR, a menos que o usuário peça.
- Sem MySQL e sem Docker no ambiente: teste de ponta a ponta com Postgres local (driver `pg` já existe) ou equivalente de teste. Nunca tocar o banco de produção.
- Permissão explícita do usuário para refazer código quando necessário.

## Abordagens consideradas
- **A. Um agente com vários "chapéus":** barato por rodada, mas sem visão independente e com contexto inchado.
- **B. Subagentes para tudo:** o mais caro, porque cada um relê o projeto do zero.
- **C. Híbrido (escolhida):** papéis em `docs/agentes/`. Auditores só-leitura, em modelo mais barato, gravam achados curtos em `docs/BACKLOG.md`. Um dev sênior implementa em lotes, com commit por lote. Acessibilidade centralizada em `a11y.css` e `a11y.js` compartilhados. Testes automáticos (Playwright e axe) devolvem só as falhas. O estado vive em arquivos, então o limite do Pro não perde nada.

## Decisões do design
- **Papéis:** dev sênior (implementa), caçador de falhas/segurança (só-leitura), revisor de fluxos simples (só-leitura), auditor de acessibilidade (só-leitura, mais o teste axe).
- **Rodadas:** 1) base de acessibilidade e infraestrutura de teste; 2) auditoria paralela; 3) correção por prioridade (P0, P1, P2); 4) reteste e fechamento. Cada rodada termina com commit e push.
- **Prioridade:** P0 derruba o site ou compromete a segurança, P1 quebra um fluxo principal ou uma barreira de acessibilidade, P2 é polimento. Só P0 e P1 bloqueiam o "pronto".
- **Parada:** o agente só para para pedir o que depende das contas do usuário (Cloudflare, Render, Supabase, ping de keep-alive).

## Entregáveis
`docs/agentes/*.md`, `docs/BACKLOG.md`, `Site/assets/css/a11y.css`, `Site/assets/js/a11y.js`, testes E2E e de acessibilidade, configuração de deploy do Cloudflare Pages, e `docs/PRONTO-PARA-APRESENTAR.md` com checklist do usuário, contas demo e roteiro sugerido.

## Fica com o construtor
Escolha do Postgres local ou SQLite para teste, estrutura interna dos arquivos de a11y, ordem dentro de cada prioridade e o texto dos papéis, desde que respeitem metas, restrições e a economia de tokens.
