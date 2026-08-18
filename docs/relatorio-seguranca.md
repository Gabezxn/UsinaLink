# Relatório 2: consertando os problemas que não eram do banco de dados

Este é o segundo relatório. O primeiro (`relatorio-migracao.md`) falou sobre trocar o banco de dados falso (JSON) por um MySQL de verdade. Este aqui explica os outros problemas que apareceram numa segunda revisão — a maioria de **segurança** — e o que foi feito para corrigir cada um.

---

## 1. Portas destrancadas: rotas sem exigir login

Pensa assim: toda rota da API deveria funcionar como uma porta de prédio. Quem não tem crachá (token de login) não devia nem conseguir abrir a porta. Só que várias portas do UsinaLink estavam **sem fechadura nenhuma**:

| Rota | O que dava pra fazer sem login | Agora |
|---|---|---|
| `POST/PUT/DELETE /api/funcionarios` | Criar, editar ou demitir funcionário de **qualquer** empresa | Exige login (`JwtAuthGuard`) |
| `POST /api/avaliacoes` e `/resposta` | Postar avaliação falsa pra qualquer pedido, ou responder como se fosse a usina | Exige login |
| `/api/solicitacoes-bloqueio-usina/admin/*` | Aprovar ou rejeitar um pedido de bloqueio de usina | Exige login **+** ser admin de verdade |
| `GET /api/usuarios` e `/api/usuarios/:id` | Listar nome/e-mail/status de qualquer usuário | Exige login |

Testei isso na prática depois de arrumar: bati nessas rotas sem token e todas responderam **401 Unauthorized**. Antes, respondiam normalmente.

## 2. Não existia usuário "admin" — mas tinha rota de admin

As rotas de aprovar/rejeitar bloqueio de usina existiam, mas o sistema nunca teve o conceito de "esse usuário é um administrador". Ou seja: a porta de admin não tinha nem fechadura, nem chave.

Criei:
- Um novo tipo de conta (`tipoUsuario: 'admin'`).
- Uma rota de login pra essa conta (`POST /api/auth/login/admin`).
- Um "segurança" (`AdminGuard`) que barra qualquer pessoa que não seja admin, mesmo estando logada.
- Uma conta de demonstração: `admin@demo.com` / `Demo@123`.

Testado: uma empresa comum logada tentando a rota de admin recebe **403 Forbidden** (login válido, mas sem permissão). Só o admin de verdade recebe **200 OK**.

## 3. Funcionário via a lista errada (vazamento de dados entre empresas)

Achamos um bug real: quando o front-end pedia a lista de funcionários passando `contexto=empresa` (ou nada), o servidor **devolvia os funcionários de todas as empresas do sistema**, não só os da empresa que pediu. Era tipo pedir "meus funcionários" numa recepção e o atendente te entregar a lista de funcionários de todas as empresas do prédio.

Agora o servidor descobre sozinho, pelo token de quem está logado, qual é a empresa (ou usina) da pessoa, e só mostra os funcionários dela. Testei criando funcionário na "Empresa 1" e depois logando como "Empresa 2": a segunda não vê o funcionário da primeira, e se tentar acessar o registro pelo ID direto, recebe **403 Forbidden**.

O mesmo tipo de checagem foi adicionado em avaliações (só quem é dono do pedido pode avaliar; só a usina avaliada pode responder) e em solicitações de bloqueio de usina (o ID da empresa vem do token, não mais de um campo que o próprio navegador podia inventar).

## 4. O botão de pagamento tava quebrado de verdade

Ao investigar por que o pagamento nunca ficava salvo, achamos a causa raiz: o código de "salvar pagamento" (`payment-service.js`) usava duas variáveis (`paymentsKey` e `writeJson`) que **nunca foram definidas em lugar nenhum do arquivo**. Ou seja, clicar em "pagar pedido" não salvava nada localmente nem no servidor — só quebrava (erro no console do navegador).

Agora existe:
- Uma rota de verdade no servidor: `POST /api/pagamentos`, que confere se o pedido é seu, se existe uma proposta aceita, salva o pagamento no MySQL e atualiza o status do pedido pra "em produção".
- O front-end (`payment-service.js`) chama essa rota de verdade em vez de tentar (e falhar) escrever local.

Testei o fluxo inteiro: criar pedido → usina manda proposta → empresa aceita → empresa paga → status do pedido muda pra "em_producao" no banco. Tentar pagar de novo o mesmo pedido é bloqueado (**400**, "Pedido ja foi pago").

## 5. Front-end e back-end usando nomes diferentes pra mesma coisa

Esse já tínhamos citado, mas veio à tona outro detalhe ao investigar: depois do login, o site guardava o token e o nome do usuário, mas **nunca guardava o ID da empresa/usina** em nenhum lugar que as outras telas pudessem ler. Ou seja, as telas de avaliação e bloqueio de usina sempre caíam num "empresa-1" / "usina-1" de mentirinha que nunca existia de verdade no banco.

Corrigido:
- O login agora também guarda `empresaId`/`usinaId` reais (vindos da resposta do servidor).
- As telas de avaliação, pagamento e bloqueio de usina foram ajustadas pra usar os nomes de campo que a API realmente devolve (ex: a API manda `idPedido`, não `pedidoId` — antes a tela procurava o campo errado e nunca achava nada).
- O resumo de avaliações da usina (nota média, quantidade) também devolvia nomes de campo diferentes do que a tela esperava — corrigido dos dois lados.

## 6. Chave da porta feita em casa (JWT)

Trocamos a implementação manual de token (feita na mão com `crypto.createHmac`) pela biblioteca oficial `@nestjs/jwt`, usada por milhares de projetos e testada exaustivamente. Funcionalmente o token continua igual (mesmo formato, mesma validade de 24h) — só que agora quem cuida da parte criptográfica é uma peça de software madura, não um código improvisado.

## 7. Sem limite de tentativas de login

Antes, nada impedia um script de tentar mil senhas por minuto na mesma conta. Agora existe um limite: no máximo 5 tentativas de login por minuto por rota. Testado: a 4ª/5ª tentativa seguida de senha errada já recebe **429 Too Many Requests** em vez de continuar tentando.

## 8. Zero testes automatizados → agora existem 25

Antes não tinha nenhum arquivo de teste no projeto — ou seja, pra saber se uma mudança quebrou algo, só rodando na mão. Agora existem testes automatizados (`npm test`, usando Jest) para as partes mais sensíveis:

- Hash e conferência de senha.
- Assinatura e verificação de token.
- Os dois "seguranças" (`JwtAuthGuard` e `AdminGuard`).
- Validação de nota de avaliação (1 a 5) e a regra de "só quem é dono do pedido avalia".
- A regra de "funcionário só aparece pra empresa/usina dona dele".

Todos os 25 testes passam.

## 9. Código difícil de ler

O arquivo `core.entities.ts`, que descreve as tabelas do banco, tinha cada tabela inteira escrita numa única linha gigante. Reformatei para o formato normal (uma coluna por linha), sem mudar nome de coluna nem comportamento nenhum — só facilita revisar o código depois.

## O que ainda fica de fora (por escolha, não esquecimento)

- Não criamos um fluxo de "esqueci minha senha" nem confirmação de e-mail — ninguém pediu essas funcionalidades, seria inventar recurso novo.
- Não construímos um painel de administração com tela própria — só a permissão no backend. A tela fica pra quem for construir o painel.
- Nenhum pedido no sistema nunca chega ao status "concluído" de verdade (não existe uma tela de "confirmar entrega"). Isso é uma funcionalidade que falta no fluxo de negócio, não um bug de segurança — vale considerar como próximo passo.

## Como conferir

```bash
cd backend
npm install
npm test        
npm run build   
npm start       
```

Contas de teste (senha `Demo@123` para todas): `empresa@demo.com`, `usina@demo.com`, `pessoa@demo.com`, `admin@demo.com`.
