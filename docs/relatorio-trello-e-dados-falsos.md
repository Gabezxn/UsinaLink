# Relatório 3: os 5 bugs do Trello e a caça aos "dados fantasmas"

Este é o terceiro relatório. O primeiro (`relatorio-migracao.md`) trocou o banco de dados falso por um MySQL de verdade. O segundo (`relatorio-seguranca.md`) arrumou falhas de segurança e bugs que sobraram. Este aqui cobre duas rodadas de trabalho mais recentes: os **5 bugs que o mentor listou no Trello**, e depois uma **caça, tela por tela, a "dados fantasmas"** — informação que aparece na tela mas não é real.

---

## Parte 1 — Os 5 bugs do Trello

### 1.1. Histórico de pedidos mostrando "lixo de Git"

Quando duas pessoas mexem no mesmo arquivo e o Git não sabe como juntar as duas versões sozinho, ele escreve marcadores tipo `<<<<<<<`, `=======` e `>>>>>>>` direto no arquivo, esperando alguém escolher manualmente qual parte fica. Isso tinha acontecido no `historico-pedidos.html` e **ninguém tinha terminado de resolver** — os marcadores ficaram salvos junto com o resto do código.

Resultado: a página mostrava pedidos falsos e o menu (nav) quebrado, porque o navegador tentava interpretar aquele texto de conflito como se fosse HTML de verdade.

**Corrigido:** removidos os marcadores, mantida só a versão certa do código.

### 1.2. "Nova solicitação" era só uma fachada

O formulário de pedir uma peça nova (`nova-solicitacao.html`) mostrava "sucesso" ao enviar, mas **não existia nenhuma rota no servidor pra receber esse pedido** — a mensagem de sucesso era mentira. A lista de solicitações também era uma tabela fixa, sempre com os mesmos dados inventados.

**Corrigido:**
- Criada a rota de verdade no backend (`POST /api/solicitacoes`, `GET /api/solicitacoes/meus`).
- Upload do arquivo técnico funcionando (o navegador converte o arquivo pra texto — base64 — e manda pro servidor, limite de 5MB).
- A lista de solicitações agora busca os dados reais em vez de mostrar uma tabela fixa.

### 1.3. "Solicitar compra" (peças comerciais) também não salvava nada

Mesmo problema do item anterior, só que na tela de peças comerciais: clicar em "Solicitar Compra" mostrava sucesso, mas não existia lugar nenhum pra esse dado ir.

**Corrigido:** nova rota no backend (`POST /api/solicitacoes-comerciais`), e uma tabela nova na própria página mostrando o que já foi pedido de verdade.

### 1.4. Perfil da empresa: 5 problemas diferentes na mesma tela

| # | Problema | Correção |
|---|---|---|
| 1 | Editar o perfil não salvava nada — era tudo decoração. Ao sair da página, voltava tudo do jeito que estava antes. | Criadas as rotas `GET`/`PATCH /api/empresas/perfil`, que buscam e salvam razão social, nome fantasia, setor, porte, descrição, contato e endereço de verdade no banco. |
| 2 | O botão "Cancelar edição" mostrava texto quebrado tipo `edi&ccedil;&atilde;o` em vez de "edição". | O código escrevia a letra acentuada errado (usando um código de HTML dentro de um lugar que não entende código de HTML). Trocado pelo jeito certo. |
| 3 | O botão "Cancelar" (do formulário) jogava a pessoa direto pro dashboard, em vez de só fechar a edição. | Agora ele só volta pra visualização, sem sair da página. |
| 4 | Trocar de senha não conferia se "Nova senha" e "Confirmar nova senha" eram iguais antes de mandar pro servidor. | Agora confere no navegador primeiro (sem gastar uma chamada à API à toa) e o servidor também confere a senha atual antes de trocar. |
| 5 | Clicar nas abas (Informações Gerais / Contato / Endereço...) não mudava o formulário de edição — ficava sempre preso na primeira aba, mesmo mostrando outra coisa na visualização. | Agora trocar de aba atualiza os dois lados (visualização e formulário) juntos. |

**Testei** os 5 itens no navegador contra o servidor local: todos confirmados funcionando.

### 1.5. Propostas recebidas (empresa): 4 problemas

| # | Problema | Correção |
|---|---|---|
| 1 | 3 propostas fixas apareciam escritas no HTML antes dos dados reais chegarem ("flash" de dado falso). | Removidas — a página carrega só da API. |
| 2 | O nome da usina aparecia literalmente como `[object Object]` na tela. | O código jogava o objeto inteiro da usina dentro do texto em vez de pegar só o nome. Corrigido para extrair o nome certo. |
| 3 | Aceitar ou recusar uma proposta pelo botão dentro do modal "Ver detalhes" só fechava a janela e mostrava uma mensagem — **não salvava nada de verdade**. | Agora chama a API de verdade (`PATCH /propostas/:id/aceitar` ou `/recusar`) e atualiza a lista. |
| 4 | Os botões "Aceitar"/"Recusar" apareciam mesmo em propostas que já tinham sido aceitas, recusadas ou canceladas. | Agora ficam escondidos quando a proposta já foi decidida. |

Também aproveitei pra corrigir o campo "frete" da proposta, que o formulário já enviava mas o servidor jogava fora sem salvar.

**Testei** no navegador: os 4 itens confirmados, inclusive checando direto na API que aceitar pelo modal realmente grava no banco.

---

## Parte 2 — A caça aos "dados fantasmas"

Depois desses 5 bugs, você reparou em algo diferente: navegando pelas abas do dashboard da empresa, aparecia uma informação "preset" (pré-definida) por um instante, e depois — quando a resposta do servidor chegava — a informação real tomava o lugar. Confirmei que isso realmente acontecia, e depois de arrumar as duas primeiras telas você pediu pra eu verificar **o site inteiro**.

### Explicando esse bug com uma analogia

Pensa numa placa de elevador ainda em obra. A placa já está pendurada mostrando "3º andar", mas o elevador ainda não chegou lá — ele só troca a placa quando realmente chega. Se alguém olhar rápido antes de o elevador chegar, vai achar que já tá no 3º andar, mas não tá. Essas telas do site faziam a mesma coisa: escreviam um "andar" (dado) fixo no HTML *antes* de perguntar pro servidor qual é o andar de verdade — e só trocavam quando a resposta chegava. Em algumas telas, o pior: **o elevador nunca chegava** — a placa fake ficava lá pra sempre, porque a tela nem tentava perguntar pro servidor.

### 2.1. Lado da empresa: dashboard e funcionários

- **`funcionarios.html`** — 4 funcionários inventados (Ana Martins, Rafael Lima...) ficavam visíveis por um instante antes da lista real sobrescrever.
- **`dashboard-empresa.html`** — esse era o pior caso: a tela **não tinha nenhuma ligação com o servidor**. Os 4 cards de resumo (12 solicitações, 37 propostas...) e a tabela de "solicitações recentes" eram permanentemente inventados — nunca atualizavam, nem depois de esperar. Criado `assets/js/dashboard-empresa.js`, que busca os números reais e preenche os cards e a tabela.

**Testei:** dashboard mostrando contagens reais, funcionários mostrando só cadastros de verdade.

### 2.2. O lado da usina inteiro tinha o mesmo problema

Depois de arrumar o lado da empresa, revisei **todas as telas do site**, como você pediu, e o lado da usina estava com o mesmo problema (ou pior) em quase tudo:

| Tela | O que tinha de falso | O que foi feito |
|---|---|---|
| `dashboard-usina.html` | Números fixos ("28 pedidos", "R$ 186k faturamento estimado") e duas tabelas inteiras inventadas, sem nenhuma ligação com o servidor. | Criado `assets/js/dashboard-usina.js`: busca pedidos disponíveis e propostas enviadas de verdade e calcula os números na hora. |
| `funcionarios-usina.html` | 4 funcionários fictícios fixos (Carlos Mendes, Fernanda Rocha...). | Removidos — usa a mesma lista real que já existia pra empresa. |
| `pedidos-disponiveis.html` | 4 cards de pedidos inventados, com links quebrados tipo `enviar-proposta.html?pedidoId=pedido-1` (um texto, não um ID real). | Criado `assets/js/pedidos-usina.js`, que busca os pedidos reais em `/api/pedidos/disponiveis` e monta os links com o ID de verdade. |
| `enviar-proposta.html` | Além dos dados falsos da peça, o botão de enviar **nunca funcionava de verdade**: mandava o campo `idPedido`, mas o servidor esperava `pedidoId` — ou seja, mandar uma proposta pela tela sempre falhava, silenciosamente. Também tinha um ID de pedido "de mentirinha" (`pedido-1`) como reserva, e o valor em dinheiro era mandado formatado (`R$ 18.500,00`), que o servidor rejeita. | Criado `assets/js/enviar-proposta.js`: carrega os dados reais do pedido, manda o campo certo (`pedidoId`), converte o valor pro formato que o servidor aceita, e não usa mais nenhum ID inventado. |
| `perfil-usina.html` | A usina **não tinha nem como salvar o próprio perfil** — não existia rota no servidor pra isso ainda. | Criadas as rotas `GET`/`PATCH /api/usinas/perfil` (iguais às que a empresa já tinha) e `assets/js/perfil-usina.js` pra ligar a tela nelas. |

**Testei tudo isso de ponta a ponta:** criei uma empresa e uma usina de teste, criei um pedido de verdade, entrei como usina, vi o dashboard e a lista de pedidos com números reais, abri os detalhes de um pedido, mandei uma proposta de verdade, conferi ela aparecendo certinha em "Propostas enviadas", e editei/salvei o perfil da usina.

### 2.3. Bugs que só apareceram ao testar de verdade (ninguém tinha visto ainda)

Isso é importante: como **nenhuma dessas telas da usina tinha dado real antes**, ninguém nunca tinha testado o fluxo inteiro de verdade. Ao ligar tudo e testar, apareceram mais 4 bugs escondidos:

1. **"Propostas enviadas" mostrava peça e cliente em branco.** A tabela procurava campos chamados `peca` e `cliente`, mas a resposta da API não tem esses nomes — o nome da peça vem de dentro de `pedido.itens[0].nome`, e o cliente de `pedido.empresaCompradora`. Corrigido o jeito de ler esses dados, tanto no front-end quanto no backend (que também precisava carregar essas informações relacionadas, e não estava).
2. **Salvar só o endereço no perfil dava erro 500** (erro interno do servidor) — tanto no perfil da usina quanto no da empresa. A causa: quando só os campos de endereço eram enviados, sobrava um "pedido de atualização" vazio pros outros dados, e o banco de dados não aceita um update sem nenhum valor. Corrigido pra só tentar atualizar quando tem algo pra atualizar.
3. **Campo vazio no perfil ficava mostrando o texto de exemplo antigo pra sempre** — esse é um caso ainda pior que o "flash": não era temporário, o texto fake **nunca saía da tela**, mesmo com um perfil real carregado, porque o código só trocava o texto de exemplo quando o valor real não era vazio. Corrigido pra sempre mostrar o valor real (mesmo que seja "nada preenchido ainda", em branco).
4. **O prazo de entrega de um pedido nunca era salvo.** O formulário mandava o prazo, mas o "molde" (DTO) que o servidor usa pra aceitar os dados nem tinha esse campo na lista — e o servidor descarta automaticamente qualquer campo que não está nessa lista, por segurança. Resultado: todo pedido sempre mostrava "A combinar", nunca o prazo real. Corrigido.

### 2.4. Outras 3 coisas encontradas no caminho

- **`detalhes-pedido.html` não tinha proteção de login.** Todas as outras páginas da empresa têm uma marcação (`data-user-role="empresa"`) que barra quem não está logado como empresa. Essa página não tinha — dava pra acessar sem estar logado. Adicionado.
- **`pagamentos.html` tinha um número fixo** ("2 pedidos aguardando pagamento") que nunca mudava. Agora conta de verdade quantos pedidos estão esperando pagamento.
- **Apagado `propostas-enviadas.html`**, um arquivo órfão: nenhum link do site inteiro apontava pra ele — era um duplicado morto de `propostas-usina.html`.

### 2.5. O último flash: perfil da empresa

Depois de publicar a versão anterior deste relatório, você reparou que **o perfil da empresa ainda mostrava algo que trocava logo depois** — exatamente o mesmo padrão do início deste relatório, só que numa tela que já parecia "consertada". A causa era em dois lugares diferentes ao mesmo tempo:

1. O card "Informações gerais" tinha um texto **escrito direto no HTML** da página ("Metal Forte Componentes Industriais Ltda.", "Indústria metalmecânica", "Médio porte"...) — visível assim que a página abre, antes de qualquer código rodar.
2. Mesmo depois desse texto do HTML, o JavaScript tinha uma **segunda cópia dos mesmos dados de exemplo**, usada como valor inicial do formulário — ou seja, mesmo trocando o texto do HTML, ainda apareceria um "Metal Forte" de mentirinha por um instante antes da resposta do servidor chegar.

Corrigido nos dois lugares: o HTML agora começa com "Carregando...", e os valores de exemplo do JavaScript agora começam em branco (aparecem como "-") em vez de um nome de empresa inventado. Isso vale tanto pro perfil da empresa quanto pro da usina, porque os dois usam o mesmo mecanismo.

## Parte 3 — Varredura no site inteiro

Depois do relatório acima, você pediu uma checagem completa em **todas** as abas do site pra achar qualquer informação fixa que tivesse sobrado, com uma regra clara: o site só pode mostrar o que existe de verdade no banco de dados.

### 3.1. Mais um "flash" que tinha passado despercebido

- **`propostas-usina.html`** tinha 4 linhas de proposta fixas escritas direto no HTML (Eixo estriado/Metal Forte, Base fundida/Energia Sul...). O código que troca pelos dados reais já existia e funcionava, mas ninguém tinha notado que a tabela começava com esse "flash" — passou despercebido na varredura anterior porque o teste no navegador só olhava o resultado final, depois do JavaScript já ter trocado tudo. Corrigido: a tabela agora começa vazia, com "Carregando...".

### 3.2. Duas coisas que não eram "flash" — eram informação que nunca existiu no banco

Ao continuar a varredura, apareceram duas telas com um problema diferente dos anteriores: não era um dado real que demorava a chegar, era um dado que **nunca teve onde ser guardado**. Te perguntei o que preferia fazer em cada caso, e você pediu pra construir os dois de verdade.

**Catálogo de peças comerciais** (`dashboard-pessoa-juridica.html`): a tela mostrava 4 peças fixas (nome, estoque, preço, fornecedor, tipo "Flange ANSI 150 — Atlas Metais — R$ 380,00") e 4 números de resumo, só que não existia nenhuma tabela no banco pra guardar peças de um catálogo. Foi criado:
- Uma tabela nova (`peca_comercial`) e uma rota completa no servidor pra listar, cadastrar e remover peças, sempre ligadas à usina dona.
- Uma tela nova, `pecas-comerciais-usina.html`, onde a usina cadastra as próprias peças (nome, material, estoque, preço, prazo).
- A tela da empresa (`dashboard-pessoa-juridica.html`) agora busca esse catálogo de verdade e calcula os 4 números a partir dos dados reais.

**Seções do perfil sem nenhum campo no banco**: tanto no perfil da empresa quanto no da usina existiam abas inteiras (Documentos, Notificações, Produção, Certificações, além dos campos WhatsApp/Site) que mostravam texto de exemplo porque essas informações nunca tinham sido salvas em lugar nenhum. Foi criado:
- Colunas novas no banco pra cada um desses campos (incluindo upload de Contrato Social e Alvará, guardados do mesmo jeito que outros arquivos do sistema já funcionam).
- Enquanto mexia nisso, achei um bug antigo e genérico: as caixinhas de marcar (checkbox) do formulário de perfil **sempre apareciam marcadas na tela**, não importa o que estivesse salvo, porque o código tinha um erro que ignorava o valor real. Corrigido — agora reflete e salva o estado de verdade.
- O CNPJ da empresa, que já existia no banco mas nunca aparecia no perfil, agora é mostrado (sem poder ser editado, já que é um dado de identidade fixo por lei).

**Testei tudo isso no navegador:** usina cadastrando uma peça no catálogo, empresa vendo essa peça real e solicitando compra, e o perfil da empresa e da usina salvando e recarregando corretamente Documentos, Notificações, Produção e Certificações — inclusive fechando a página e abrindo de novo pra confirmar que ficou salvo.

---

## O que ainda fica de fora (por escolha, não esquecimento)

Reparei que hoje **nada no site realmente cria um "Pedido"** (que é o que aparece pra usina em "Pedidos disponíveis"). O que existe é "Solicitação" (do lado da empresa), mas ela não vira um Pedido sozinha. Isso significa que a lista de "pedidos disponíveis" só vai ter algo se alguém criar um pedido direto pela API, como eu fiz nos testes.

Não mexi nisso porque é uma decisão de como o negócio deveria funcionar (será que toda Solicitação devia virar um Pedido automaticamente? Alguém precisa aprovar no meio do caminho?), não um bug de "dado falso". Fica registrado como sugestão pro próximo passo.

## Como conferir

```bash
cd backend
npm install
npm test        
npm run build   
npm start       
```

Contas de teste (senha `Demo@123` para todas): `empresa@demo.com`, `usina@demo.com`, `pessoa@demo.com`, `admin@demo.com`.
