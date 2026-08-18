# Checklist: colocar o UsinaLink online (Cloudflare Pages + Supabase + Railway)

Este documento é um passo a passo pra você seguir sozinho. Eu já deixei o código pronto pra isso (banco trocável entre MySQL/Postgres, CORS e URL da API configuráveis) — o que falta agora é criar as contas nos serviços e conectar tudo, porque isso só quem tem acesso ao seu e-mail/senha consegue fazer.

Ordem recomendada: **Supabase → GitHub → Railway → Cloudflare Pages**. Cada serviço depende de informação do anterior.

> Usamos Cloudflare Pages em vez de Vercel porque a Vercel pode pedir cartão de crédito dependendo da conta/região. Cloudflare Pages tem plano gratuito sem pedir cartão e funciona de um jeito bem parecido (conecta no GitHub, escolhe a pasta, publica).

---

## 1. Supabase (banco de dados)

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (escolha uma senha forte pro banco — anote ela).
2. Espere o projeto terminar de provisionar (leva ~2 minutos).
3. Vá em **Project Settings → Database**. Copie:
   - **Host** (algo como `db.xxxxxxxxxxxx.supabase.co`)
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: a que você definiu
   - **Database name**: `postgres`
4. Guarde esses 5 valores — vai usar no passo do Railway.

## 2. GitHub (pra Railway e Cloudflare conseguirem "puxar" o código)

1. Crie uma conta em [github.com](https://github.com) se ainda não tiver.
2. Crie um repositório novo (pode ser privado), sem adicionar README/gitignore (o projeto já tem).
3. No seu PC, dentro da pasta do projeto (`UsinaLink-main-corrigido`), rode:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```
   (o projeto já está com `git init` e os commits feitos — só falta esses três comandos)

## 3. Railway (hospedar o backend NestJS)

Por que Railway e não Cloudflare pro backend? O backend é um servidor que fica ligado o tempo todo; hospedagem de site estático (Cloudflare Pages, Vercel, Netlify) é feita pra arquivos fixos, não pra rodar um servidor Node com banco de dados. Railway roda o servidor do jeito que ele já é.

1. Crie uma conta em [railway.app](https://railway.app) (dá pra entrar direto com GitHub).
2. **New Project → Deploy from GitHub repo**, escolha o repositório que você criou.
3. Railway cria um "serviço" a partir do repo inteiro — você precisa apontar ele pra pasta certa. Clique no serviço criado → aba **Settings**:
   - **Root Directory**: `backend`
   - Em **Build**, defina **Custom Build Command**: `npm install && npm run build`
   - Em **Deploy**, defina **Custom Start Command**: `npm run start:prod`
4. Ainda em Settings, na seção **Networking**, clique em **Generate Domain** pra ganhar uma URL pública (o Railway não cria uma sozinho). Vai aparecer algo como `https://usinalink-backend-production.up.railway.app`. Guarde essa URL.
5. Vá na aba **Variables** e adicione (usando os dados do Supabase que você guardou):
   ```
   DB_TYPE=postgres
   DB_HOST=db.xxxxxxxxxxxx.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=a-senha-que-voce-definiu-no-supabase
   DB_NAME=postgres
   DB_SSL=true
   DB_SYNCHRONIZE=true
   JWT_SECRET=invente-uma-frase-aleatoria-bem-grande-aqui
   PORT=3000
   ALLOWED_ORIGINS=http://localhost:5500
   ```
   (o `ALLOWED_ORIGINS` você completa com o domínio da Cloudflare no passo 4 — pode deixar assim por enquanto). Salvar as variáveis já dispara um novo deploy sozinho.
6. Teste: abra a URL gerada no passo 4 no navegador — deve aparecer o JSON `{"message":"API UsinaLink NestJS online",...}`.

> Nota: o plano gratuito do Railway funciona por crédito mensal (não é "ilimitado pra sempre" como era antes), e pode pedir pra confirmar um cartão pra liberar o crédito de teste — não tem cobrança se você ficar dentro do limite gratuito. Se preferir evitar isso, o Render (render.com) é uma alternativa sem pedir cartão, só que o servidor "dorme" depois de um tempo sem uso.

## 4. Cloudflare Pages (hospedar o site)

1. Crie uma conta em [dash.cloudflare.com](https://dash.cloudflare.com) (gratuito, não pede cartão).
2. No menu lateral, vá em **Workers & Pages → Create → Pages → Connect to Git**.
3. Autorize o Cloudflare a acessar sua conta do GitHub e escolha o repositório.
4. Em **Set up builds and deployments**:
   - **Framework preset**: `None`
   - **Build command**: deixe em branco (é HTML puro, não precisa de build)
   - **Build output directory**: `Site`
   - Se aparecer um campo **Root directory** separado, deixe como `/` (a pasta é definida no "Build output directory" mesmo).
5. Clique em **Save and Deploy**. No final, a Cloudflare te dá uma URL tipo `https://usinalink-main.pages.dev`. Guarde essa URL.

## 5. Ligar as pontas

Agora que você tem as duas URLs (backend no Railway, site na Cloudflare), faltam 2 ajustes de configuração:

**a) No Railway**, edite a variável `ALLOWED_ORIGINS` (aba Variables) pra incluir o domínio da Cloudflare:
```
ALLOWED_ORIGINS=https://usinalink-main.pages.dev
```
Salvar já reinicia o servidor sozinho.

**b) No código**, edite `Site/assets/js/api.js` e troque a linha:
```js
const PROD_API_BASE_URL = 'https://SEU-BACKEND.onrender.com/api';
```
pela URL real do seu backend no Railway (a que você gerou no passo 3.4, terminando em `/api`). Depois:
```bash
git add Site/assets/js/api.js
git commit -m "Aponta o site para o backend publicado"
git push
```
A Cloudflare Pages detecta o push e publica a nova versão sozinha, em menos de 1 minuto.

## 6. Conferir se está tudo funcionando

Abra a URL da Cloudflare, tente logar com `empresa@demo.com` / `Demo@123` (a conta de demonstração é criada automaticamente na primeira vez que o backend liga). Se logar e cair no dashboard, está tudo certo.

Pra conferir o banco visualmente: no site do Supabase, vá em **Table Editor** — é o equivalente ao phpMyAdmin que você já usou local.

---

## Se algo der errado

- **Erro de CORS no console do navegador**: o domínio da Cloudflare não está (ainda) na `ALLOWED_ORIGINS` do Railway, ou você esqueceu de salvar.
- **"Nao foi possivel conectar ao servidor"**: a `PROD_API_BASE_URL` em `api.js` está com a URL errada, ou o deploy do Railway ainda não terminou — confira a aba **Deployments** no Railway.
- **Erro de conexão com banco no log do Railway**: confira se `DB_SSL=true` está definido — o Supabase exige conexão criptografada.
- **Railway pedindo cartão e você não quer cadastrar**: use o Render como alternativa (mesmos passos, só muda a interface — eu descrevo essa opção se você preferir trocar).
- **Netlify como alternativa à Cloudflare**: se preferir, netlify.com também tem plano gratuito sem cartão e funciona do mesmo jeito (conectar repo, apontar "Base directory" pra `Site`, deploy).
