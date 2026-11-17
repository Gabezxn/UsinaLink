# Relatório 4: campos obrigatórios, perfil da usina, e o pedido que nunca terminava

Este é o quarto relatório. Os três anteriores trocaram o banco de dados falso por um de verdade (`relatorio-migracao.md`), arrumaram falhas de segurança (`relatorio-seguranca.md`) e cataram "dados fantasmas" tela por tela (`relatorio-trello-e-dados-falsos.md`). Este aqui parte de dois pedidos pontuais na tela de "Nova solicitação" e acaba puxando um fio que estava solto desde o relatório 3: pedidos que nunca chegavam ao fim, e um pedaço inteiro do menu da usina que caía direto no login.

**Importante:** tudo neste relatório está commitado só no **fork** (`Gabezxn/UsinaLink`, branch `main`), ainda não no repositório principal (`sxrtori/UsinaLink`, branch `em-desenvolvimento`). Isso foi um pedido explícito pra essa rodada de trabalho — os commits estão prontos localmente, faltando só o `git push` pro principal quando você validar.

---

## 1. Nova solicitação (empresa): campos obrigatórios e upload

Você pediu duas coisas: que todos os campos fossem obrigatórios pra enviar o pedido, e que o upload de arquivo funcionasse.

- **Campos obrigatórios:** material, quantidade, prazo, urgência, local de entrega, descrição e o arquivo técnico agora são exigidos — tanto na validação do formulário (front-end) quanto no DTO da API (back-end). Testado com curl: faltando qualquer campo, a API responde `400` com a mensagem certa pra cada um.
- **Upload de arquivo:** na verdade já funcionava (o arquivo vira base64 e é salvo no banco) — o problema era que não tinha **nenhuma confirmação visual**. Parecia que não tinha acontecido nada. Corrigido: a área de upload agora fica com borda verde e mostra "Selecionado: nome-do-arquivo.pdf" assim que você escolhe o arquivo.

## 2. Perfil: um bug de CSS que afetava empresa e usina

Você reportou que a tela de perfil mostrava as informações **e** o formulário editável ao mesmo tempo, um embaixo do outro.

Causa raiz: no `style.css`, a classe `.is-hidden` (que devia esconder o formulário) e a classe `.form-grid` (que define o layout em grade) tinham a mesma "força" (especificidade), e `.form-grid` vinha depois no arquivo — então ela sempre vencia, e o formulário **nunca ficava escondido de verdade**, em nenhuma das duas telas de perfil. Corrigido adicionando `!important` na classe `.is-hidden`, que é a forma correta de uma classe utilitária de "esconder" sempre prevalecer, não importa a ordem de outras regras no CSS.

De quebra, notei que o **perfil da usina nunca teve o modo "só visualização"** implementado (só o da empresa tinha) — corrigido também, replicando a mesma estrutura: mostra os dados, e só ao clicar em "Editar perfil" aparecem os campos editáveis, voltando pra visualização automaticamente depois de salvar.

## 3. O fio solto do relatório 3: Solicitação nunca virava Pedido

O relatório 3 tinha deixado registrado, na seção "o que ainda fica de fora":

> "hoje **nada no site realmente cria um Pedido** [...] Isso significa que a lista de pedidos disponíveis só vai ter algo se alguém criar um pedido direto pela API."

Ou seja: uma empresa cria uma "Solicitação" pedindo uma peça, mas isso nunca virava um "Pedido" — e é só o Pedido que aparece pra usina em "Pedidos disponíveis". Na prática, nenhuma solicitação criada pela tela normal jamais recebia uma proposta.

**Corrigido:** criar uma Solicitação agora também cria um Pedido de verdade (reaproveitando a rotina que já existia e já era usada pra isso), com o mesmo item, urgência, prazo (convertido de data pra "dias restantes") e o arquivo técnico anexado. Os dois registros ficam ligados um ao outro no banco, nos dois sentidos.

Como consequência natural, o **status da Solicitação também passou a acompanhar o Pedido de verdade**, em vez de ficar travado em "aberta" pra sempre:

| Situação | Status da Solicitação |
|---|---|
| Acabou de ser criada | `aberta` |
| Uma usina mandou proposta | `em_analise` |
| A empresa aceitou uma proposta | `concluida` |
| O pedido foi cancelado | `cancelada` |

**Testei ponta a ponta via API:** empresa cria solicitação → pedido aparece em "Pedidos disponíveis" pra usina → usina manda proposta → status da solicitação vira `em_analise` → empresa aceita → status vira `concluida`.

## 4. O outro fio solto: pedido que nunca "terminava"

O relatório 2 também tinha deixado registrado:

> "Nenhum pedido no sistema nunca chega ao status 'concluído' de verdade (não existe uma tela de 'confirmar entrega')."

Isso tinha um efeito colateral que ninguém tinha ligado os pontos ainda: a tela de **avaliações** já esperava pedidos com status `concluido`/`concluida` pra deixar a empresa avaliar a usina — só que, como nenhum pedido chegava nesse status, **a lista de "pedidos pra avaliar" sempre vinha vazia**, silenciosamente.

**Corrigido:** nova rota (`PATCH /api/pedidos/:id/confirmar-entrega`) e um botão "Confirmar entrega" na tela de detalhes do pedido, visível só quando o pedido já foi pago (`em_producao`) e só pra empresa dona dele. Ao confirmar, o pedido vira `concluido`. A "linha do tempo" de acompanhamento do pedido, que antes era só decorativa (olhava apenas se tinha sido pago, nunca alcançava o fim de verdade), agora reflete o status real.

**Testei via API:** usina tentando confirmar entrega recebe `403` (não é dela); empresa confirma com sucesso; tentar confirmar de novo é bloqueado; o pedido passa a aparecer como `concluido` na listagem — exatamente o que a tela de avaliações precisa pra funcionar.

De quebra, os **filtros de status** em "Histórico de pedidos" também estavam quebrados: os botões comparavam contra textos como `"Em producao"` (com espaço e maiúscula), mas a API devolve `"em_producao"` — nunca batiam, então clicar nesses filtros não filtrava nada. Corrigido, e removido o filtro "Enviado", que não corresponde a nenhum status que o sistema realmente usa.

## 5. "Histórico relacionado" da usina: um link do próprio menu que caía no login

Ao mexer no item anterior, reparei que o menu lateral da usina tem um link, "Histórico relacionado", apontando pra essa mesma tela de histórico — só que clicar nele redirecionava direto pro login. Investigando, o problema tinha duas camadas:

1. A tela era travada só pra sessão empresa (o "segurança" da página, `auth-guard.js`, só aceitava um único papel por página).
2. Mesmo destravando, os dados vinham de uma rota exclusiva da empresa (`/pedidos/meus`) — a usina não tem pedidos próprios, ela manda propostas pra pedidos de empresas.

**Corrigido:**
- `auth-guard.js` agora aceita mais de um papel por página.
- As telas de histórico e detalhes do pedido aceitam empresa **e** usina.
- Pro lado da usina, o histórico agora vem de "propostas enviadas" (que já existe e já é usado no dashboard dela), buscando o pedido completo de cada proposta.
- Botões que só fazem sentido pra empresa (Pagar pedido, Confirmar entrega, Ver comprovante) ficam escondidos quando quem está vendo é a usina — pra ela, a tela vira só consulta.

**Testei:** simulei a mesma sequência de chamadas que a tela faz, usando a conta de demonstração da usina — as 6 propostas de teste resolveram o pedido completo corretamente, cada uma com o status real (em negociação, proposta aceita, em produção, concluído).

## O que ainda fica de fora (por escolha, não esquecimento)

- **"Ver comprovante"** continua fechado só pra empresa (a tela de comprovante de pagamento, `confirmacao-pedido.html`, não foi aberta pra usina). Dava pra abrir também, mas preferi manter o escopo менor já que não foi pedido.
- Este relatório inteiro está **só no fork**, aguardando você revisar antes de mandar pro repositório principal (`em-desenvolvimento`).

## Como conferir

```bash
cd backend
npm install
npm test
npm run build
npm start
```

Contas de teste (senha `Demo@123` para todas): `empresa@demo.com`, `usina@demo.com`, `pessoa@demo.com`, `admin@demo.com`.
