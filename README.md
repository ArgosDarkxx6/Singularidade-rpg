# Singularidade RPG

Remake do site em `Vite + React + TypeScript + Tailwind CSS + Framer Motion + React Hook Form + Zod + Supabase`.

## O que este repositorio entrega

- interface nova para `Fichas`, `Rolagens`, `Ordem`, `Livro` e `Mesa`
- autenticacao com `email + username + senha`
- base pronta para Supabase Auth, Postgres, Storage e Realtime
- deploy no Cloudflare com worker minimo
- endpoint local de referencias em `/api/references`

## Stack atual

- Frontend: Vite, React, TypeScript e Tailwind CSS
- Animacoes: Framer Motion
- Formularios: React Hook Form + Zod
- Backend: Supabase
- Deploy: Cloudflare Workers

## Estrutura operacional

- `src/`: app React novo
- `supabase/`: schema, seeds e politicas
- `cloudflare/worker.ts`: serve o SPA e expoe `/api/references`
- `public/assets/`: imagens, PDF e artes do livro

## Desenvolvimento local

1. Instale dependencias:

```bash
npm ci
```

2. Rode o frontend:

```bash
npm run dev
```

3. Gere a build de producao:

```bash
npm run build
```

4. Se quiser validar o worker localmente, use:

```bash
npx wrangler dev
```

## Deploy

O build de producao sai em `dist/` e o Cloudflare publica esse diretorio diretamente.

```bash
npm run cf:deploy
```

Esse comando executa a build e depois faz o deploy do worker configurado em `wrangler.jsonc`.

## CI

O workflow em `.github/workflows/deploy-cloudflare.yml`:

- instala dependencias com `npm ci`
- executa lint e typecheck
- gera a build
- valida o bundle do Worker com dry-run
- publica no Cloudflare somente em push para `main`

## Variaveis de ambiente

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Cloudflare opcional:

- `REFERENCE_SOURCE_URL` para buscar referencias externas antes do fallback local

## Observacao sobre o legado

A versao antiga fica preservada pelo historico Git e pela branch anterior ao corte. O workspace atual foi limpo para deixar apenas a arquitetura nova como fonte canônica.
