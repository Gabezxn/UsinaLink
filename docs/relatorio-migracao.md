# Relatório: arrumando o banco de dados do UsinaLink

Este relatório explica, em linguagem simples, o que estava errado no projeto UsinaLink e o que foi corrigido. A ideia é que qualquer aluno do 2º ano da ETEC consiga entender o "antes e depois" mesmo sem ter visto o código.

---

## 1. O problema, em uma frase

O projeto **dizia** que usava MySQL (um banco de dados de verdade), mas na prática **salvava tudo em arquivos `.json` soltos numa pasta**. Era como ter uma fachada de banco bem organizado, mas por trás só existia um monte de post-its numa gaveta.

## 2. Por que isso é um problema?

Pensa num banco de dados como um arquivo de escola, com gavetas (tabelas), fichas padronizadas (colunas) e um bibliotecário rígido que não deixa você arquivar nada fora do padrão nem perder uma ficha.

O que o projeto tinha antes era mais parecido com uma pasta de papéis soltos:

| No banco de dados de verdade (MySQL) | No "banco" de arquivos JSON que existia antes |
|---|---|
| Cada tabela tem colunas fixas e tipos definidos (número, texto, data) | Qualquer campo podia ser salvo do jeito que chegasse |
| O próprio banco impede dado duplicado ou solto sem dono (**integridade referencial**) | Nada impedia um pedido apontar para uma empresa que não existe |
| Uma operação com várias etapas ou funciona tudo, ou não funciona nada (**transação**) | Se o servidor caísse no meio de uma operação, ficava dado pela metade |
| Feito pra funcionar com muitos dados ao mesmo tempo | Toda busca lia o arquivo inteiro e procurava item por item na "unha" |
| Vários usuários mexendo ao mesmo tempo, sem se atrapalhar | Escritas concorrentes podiam corromper o arquivo |

Além disso, o `README` do projeto tinha instruções que não batiam com o código: falava de um arquivo (`memoryDatabase.js`) que nem existia mais. Ou seja, a documentação também estava mentindo.

## 3. O que foi feito

### 3.1. Conectar num MySQL de verdade

- Criado um banco `usinalink` no MySQL.
- O NestJS (o "framework" que organiza o backend) agora usa o **TypeORM** — uma biblioteca que funciona como um **tradutor**: você escreve código em TypeScript (`repositorio.save(...)`, `repositorio.find(...)`) e ela traduz isso pra comandos SQL de verdade (`INSERT`, `SELECT`...) por trás dos panos.
- As credenciais de acesso ao banco (endereço, usuário, senha) ficam num arquivo `.env`, que **não é o mesmo código-fonte** — assim, ninguém precisa mexer no código só pra trocar de banco, e a senha não fica exposta no Git.

### 3.2. Apagar o banco falso

- Deletado `json-database.service.ts` (o arquivo que lia/escrevia os `.json`) e a pasta `backend/database/*.json` inteira.
- Cada módulo (empresa, usina, pedido, proposta, avaliação, etc.) foi reescrito para conversar direto com o MySQL através do TypeORM, em vez de ler arquivos.

### 3.3. Adicionar validação de verdade nos formulários

Antes, um DTO (a "ficha" que descreve os campos esperados num formulário, tipo cadastro de empresa) era só um desenho — nada realmente conferia se o e-mail tinha `@`, se a senha tinha tamanho mínimo, ou se a nota de uma avaliação estava entre 1 e 5.

Agora cada DTO usa a biblioteca `class-validator`, que funciona como um **segurança na porta**: antes do dado chegar no código que salva no banco, ele passa por uma checagem. Se algo estiver errado, a API responde com erro `400` explicando o que falta, em vez de aceitar qualquer coisa.

Exemplo testado: mandar cadastro de empresa sem e-mail agora retorna:
```json
{ "message": ["E-mail invalido."], "statusCode": 400 }
```
Antes, isso não existia — o `any` do TypeScript deixava passar qualquer coisa.

### 3.4. Corrigir "mentiras" que o código contava pra si mesmo

Durante a migração apareceram alguns bugs escondidos que só existiam porque nada validava nada:

- **Avaliações**: o formulário do site manda `notaGeral`, `qualidade`, `prazo` e `comunicacao`, mas o código antigo só verificava um campo chamado `nota` — que nunca existia no formulário. Ou seja, **a nota nunca era validada nem salva de verdade**, e o banco de dados só guardava uma nota geral, jogando fora a qualidade/prazo/comunicação que o cliente preenchia. Agora essas 4 notas são salvas em colunas próprias.
- **Resposta da usina numa avaliação**: o código antigo *sobrescrevia* o comentário original do cliente com a resposta da usina, apagando a avaliação. Agora a resposta fica guardada numa coluna separada.
- **Pedido de bloqueio de usina**: o formulário manda `descricao`, `pedidoId` e `analisadoPor`, mas o banco de dados (JSON) nunca tinha campo pra isso — os dados eram recebidos e depois descartados. Agora esses campos existem e são salvos.
- Arquivos `*.provider.ts` (um por módulo) que não eram usados em lugar nenhum do projeto foram removidos.

### 3.5. Testes feitos

Depois da migração, o servidor foi ligado contra o MySQL de verdade e testado ponta a ponta:
cadastro de empresa (com e sem erro), login (senha certa e errada), criação de pedido, criação de proposta (com e sem erro), aceite de proposta, notificações, pagamentos e bloqueio de usina — tudo funcionando e gravando no banco de verdade.

## 4. Como rodar agora

Está tudo detalhado em `backend/README.md`, resumindo:

1. Ter um MySQL rodando (o projeto foi testado com o MySQL/MariaDB que vem no XAMPP).
2. Criar o banco `usinalink`.
3. Copiar `backend/.env.example` para `backend/.env` (já vem com valores padrão do XAMPP).
4. `npm install` e `npm start` dentro de `backend/`.

Na primeira vez que o servidor liga, ele cria as tabelas sozinho e também popula alguns dados de exemplo (login `empresa@demo.com` / `usina@demo.com` / `pessoa@demo.com`, senha `Demo@123`).

## 5. O que ainda não foi mexido (e por quê)

Pra não sair adicionando coisa que ninguém pediu:

- O front-end (pasta `Site/`) não foi alterado. Vale notar que parte dele já foi identificada como usando dados mockados/fixos (tipo `"pedido-1"`) em vez de chamar a API de verdade — isso é um assunto separado do banco de dados.
- Não criamos telas nem regras novas de negócio (ex: catálogo de peças, convite de funcionário por e-mail) que o MER sugeria mas que nunca tiveram tela nem endpoint no projeto. Adicionar isso seria construir funcionalidade nova, não corrigir o banco de dados.