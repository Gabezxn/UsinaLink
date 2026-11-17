# Publicar o site no Cloudflare Pages (grátis)

Resultado: o site fica em `https://usinalink.pages.dev`. Custo: R$ 0. Leva uns 10 minutos.

Eu (o agente) não mexo na sua conta do Cloudflare nem no Render: os passos abaixo são seus.

## 1. Criar o projeto no Cloudflare Pages

1. Entre em <https://dash.cloudflare.com> (crie uma conta grátis, se ainda não tiver).
2. Menu **Workers & Pages** → **Create** → aba **Pages** → **Connect to Git**.
3. Autorize o GitHub e escolha o repositório `usinalink`.
4. Preencha:
   - **Project name:** `usinalink` (gera o endereço `usinalink.pages.dev`; se o nome estiver ocupado, use `usinalink-app` e troque o endereço nos passos abaixo).
   - **Production branch:** o branch padrão do repositório (depois do merge, normalmente `main`).
   - **Framework preset:** `None`.
   - **Build command:** deixe vazio.
   - **Build output directory:** `Site`
5. Clique em **Save and Deploy**. Em ~1 minuto o site abre em `https://usinalink.pages.dev`.

O arquivo `Site/_headers` já está no repositório: o Cloudflare aplica sozinho os cabeçalhos de segurança (CSP, X-Frame-Options etc.) e a `Site/404.html` vira a página de "não encontrada".

## 2. Liberar o site na API (Render) — obrigatório

Sem isso o navegador bloqueia as chamadas à API (CORS) e o login não funciona.

1. Abra <https://dashboard.render.com> → o serviço do backend (`usinalink-orbz`) → **Environment**.
2. Edite (ou crie) `ALLOWED_ORIGINS` e adicione o endereço do site, separado por vírgula, sem barra no final:

   ```
   https://usinalink.pages.dev,http://localhost:5500,http://127.0.0.1:5500
   ```

3. Confirme também estas variáveis (valores só seus, nunca no repositório):
   - `JWT_SECRET`: um texto aleatório longo (32+ caracteres). Gere um com `openssl rand -hex 32`. Sem isso o servidor usa um segredo temporário e todos precisam entrar de novo a cada reinício.
   - `SEED_ADMIN_PASSWORD`: **deixe vazio/ausente** (assim nenhuma conta admin demo fica ativa).
4. Clique em **Save, rebuild and deploy** (ou **Manual Deploy**).

## 3. Conferir

- Abra `https://usinalink.pages.dev`, entre com `empresa@demo.com` / `Demo@123`.
- Abra `https://usinalink-orbz.onrender.com/api/health`: deve mostrar `{"ok":true,"db":true}`.
- Se o login falhar com "Não foi possível conectar", confira o `ALLOWED_ORIGINS` (passo 2).

## 4. Manter o servidor acordado

O Render gratuito dorme sem acessos (a primeira chamada demora até 1 minuto) e o Supabase pausa projetos parados. O workflow `.github/workflows/keepalive.yml` chama `/api/health` a cada 10 minutos, mas o GitHub só executa agendamentos do **branch padrão**: depois de fazer o merge do trabalho para ele, confira em **Actions → Keep-alive** se há execuções verdes. Mesmo assim, **abra o site 2 minutos antes de apresentar** para garantir que está acordado.

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Login diz "Não foi possível conectar" | `ALLOWED_ORIGINS` sem o endereço do Pages | Passo 2 |
| Aviso "Acordando o servidor…" por mais de 1 minuto | Render dormindo / reiniciando | Aguarde; abra `/api/health` numa aba |
| Botão de Libras (VLibras) não aparece | Rede bloqueando `vlibras.gov.br` | Confira o console do navegador (F12) por erros de CSP e libere o domínio |
| Todos saem da conta de tempos em tempos | `JWT_SECRET` ausente no Render | Defina o `JWT_SECRET` (passo 2.3) |
