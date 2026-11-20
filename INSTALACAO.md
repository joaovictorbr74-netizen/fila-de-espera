# Instalação — Fila de Espera

Passo a passo para colocar o sistema no ar num restaurante novo.

## 1. Banco de dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com).
2. Crie a tabela `queue_clients` (colunas: `id`, `name`, `phone`, `party_size`,
   `arrival_time`, `notes`, `status`, `created_at`, `seated_time`, `archived_at`).
3. Rode o SQL de `supabase/migrations/20261120_feedback_desistencias_seguranca.sql`
   em **SQL Editor**. Ele cria as colunas de feedback e desistência e deixa a
   tabela acessível **só para usuários logados**.
4. Ative o realtime da tabela em **Database › Publications › supabase_realtime**.

## 2. Usuário da recepção

1. **Authentication › Users › Add user › Create new user**
2. Preencha e-mail e senha e marque **Auto Confirm User**.
3. **Authentication › Sign In / Providers**: desligue **Allow new users to sign up**.
   Sem isso, qualquer pessoa conseguiria criar uma conta e acessar a fila.

Crie um usuário por pessoa ou um só para a recepção, como preferir.

## 3. Configuração do app

1. Copie `.env.example` para `.env` e preencha com a URL e a chave publishable
   (**Project Settings › API**).
2. Em `src/lib/config.ts`:
   - `RESTAURANT_NAME`: nome que aparece nas mensagens do WhatsApp
   - `REVIEW_URL`: link de avaliação (Google ou TripAdvisor) enviado no feedback

## 4. Publicar (Vercel)

1. Importe o repositório na Vercel.
2. Em **Settings › Environment Variables**, cadastre `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Faça o deploy.

## Rodando no computador

```
npm install
npm run dev
```

Abre em http://localhost:8080
