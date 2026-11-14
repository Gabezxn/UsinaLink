# BACKLOG — UsinaLink reta final

Retomar: ler só este arquivo e `git log -5`. Plano: `docs/superpowers/plans/2026-11-14-reta-final.md`.
Severidade: P0 derruba/compromete segurança; P1 quebra fluxo ou barreira de acessibilidade; P2 polimento. Só P0/P1 bloqueiam.
Verificar: `node qa/backlog-lint.mjs`.

## Progresso das tasks
Tasks 1-4 concluídas. Próxima: Task 5 (auditoria rodada 1). Baseline axe: 262 nós color-contrast + 1 scrollable-region (qa/baseline.txt). Backend: THROTTLE_LIMIT env (QA usa 100000).

## Achados
| ID | Sev | Área | Onde (arquivo:linha) | Problema + como reproduzir | Correção sugerida | Status |
|----|-----|------|----------------------|----------------------------|-------------------|--------|
