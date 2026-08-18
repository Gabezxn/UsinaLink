# Backend UsinaLink NestJS

Backend em NestJS para validar cadastros, login por tipo, busca de empresas/usinas, propostas e funcionarios. A persistencia usa **MySQL de verdade** via TypeORM — nao ha mais banco em arquivos JSON.

## Como rodar

1. Tenha um servidor MySQL rodando (local, XAMPP, Docker, etc.) e crie o banco:

   ```sql
   CREATE DATABASE usinalink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Copie `.env.example` para `.env` e ajuste as credenciais do seu MySQL:

   ```bash
   cd backend
   cp .env.example .env
   ```

3. Instale as dependencias e suba o servidor:

   ```bash
   npm install
   npm start
   ```

Servidor padrao: `http://localhost:3000`

Na primeira vez que o servidor sobe, o TypeORM cria as tabelas automaticamente (`DB_SYNCHRONIZE=true` no `.env`) e um seed popula dados de demonstracao (empresa, usina, pessoa fisica, admin, pedidos, proposta, avaliacao) com a senha `Demo@123`. Esse seed so roda se a tabela de usuarios estiver vazia.

Contas de demonstracao: `empresa@demo.com`, `usina@demo.com`, `pessoa@demo.com`, `admin@demo.com` — todas com a senha `Demo@123`.

## Comandos

```bash
npm start      # roda NestJS via ts-node
npm run build  # compila para dist/
npm run start:prod
npm test       # roda a suite de testes automatizados (jest)
```

## Rotas principais

- `GET /` rota de teste da API.
- `POST /api/auth/login/empresa` login por e-mail, senha e tipo.
- `POST /api/cadastro/empresa` cadastra empresa.
- `POST /api/cadastro/pessoa-fisica` cadastra pessoa fisica.
- `POST /api/cadastro/usina` cadastra usina.
- `GET /api/empresas/buscar?nome=Metal` busca empresa por nome.
- `GET /api/empresas/buscar?cnpj=11222333000181` busca empresa por CNPJ.
- `GET /api/usinas/buscar?nome=Atlas` busca usina por nome.
- `GET /api/propostas` lista propostas.
- `PUT /api/propostas/:id` edita proposta.
- `PUT /api/propostas/:id/cancelar` cancela proposta.
- `GET /api/funcionarios?contexto=empresa` lista funcionarios.
- `POST /api/funcionarios` cria funcionario.
- `PUT /api/funcionarios/:id` edita funcionario.
- `POST /api/funcionarios/:id/reenviar-convite` simula reenvio.

## Exemplo de cadastro de empresa

```json
{
  "nome": "Metal Forte Ltda",
  "cnpj": "11.222.333/0001-81",
  "email": "compras@metalforte.com",
  "responsavel": "Ana Martins",
  "cargo": "Gerente de compras",
  "senha": "123456"
}
```

## Validacoes atuais

Os DTOs de entrada usam `class-validator` e um `ValidationPipe` global (`main.ts`) rejeita corpo de requisicao invalido antes de chegar nos services:

- E-mail obrigatorio e com formato valido.
- Senha obrigatoria com no minimo 6 caracteres.
- CPF obrigatorio e unico para pessoa fisica (checado no banco).
- CNPJ obrigatorio e unico para empresa e usina (checado no banco).
- Notas de avaliacao entre 1 e 5.

## Banco de dados

Os dados ficam em tabelas MySQL reais (ver `src/common/entities/core.entities.ts` para o schema via TypeORM). Ao reiniciar o servidor, os dados **permanecem** no banco — nada e apagado. Em desenvolvimento o schema e sincronizado automaticamente (`DB_SYNCHRONIZE=true`); em producao, prefira migrations do TypeORM e desligue essa flag.

## Seguranca

- Todas as rotas que alteram dados exigem login (`JwtAuthGuard`), exceto login/cadastro e as buscas publicas de empresa/usina.
- As rotas `/api/solicitacoes-bloqueio-usina/admin/*` exigem, alem de login, uma conta com `tipoUsuario: 'admin'` (`AdminGuard`).
- Funcionarios so podem ser vistos/editados por quem esta logado na mesma empresa/usina (nunca de outra empresa).
- O login tem limite de tentativas (5 por minuto por rota) para dificultar forca bruta.
- O token de acesso usa `@nestjs/jwt` (biblioteca oficial), nao mais uma implementacao manual de HMAC.
