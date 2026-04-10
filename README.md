# Singularidade RPG

Remake do site em `Vite + React + TypeScript + Tailwind CSS + Framer Motion + React Hook Form + Zod + Supabase`.

## O que este repositório entrega

- interface nova centrada em mesas para `Fichas`, `Rolagens`, `Ordem`, `Livro` e administração
- autenticação com `email + username + senha`
- base pronta para Supabase Auth, Postgres, Storage e Realtime
- deploy no Cloudflare com worker mínimo
- endpoint local de referências em `/api/references`

## Stack atual

- Frontend: Vite, React, TypeScript e Tailwind CSS
- Animações: Framer Motion
- Formulários: React Hook Form + Zod
- Backend: Supabase
- Deploy: Cloudflare Workers

## Estrutura operacional

- `src/`: app React novo
- `supabase/`: schema, seeds e políticas
- `cloudflare/worker.ts`: serve o SPA e expõe `/api/references`
- `public/assets/`: imagens, PDF e artes do livro

## Desenvolvimento local

1. Instale dependências:

```bash
npm ci
```

2. Rode o frontend:

```bash
npm run dev
```

3. Gere a build de produção:

```bash
npm run build
```

4. Se quiser validar o worker localmente, use:

```bash
npx wrangler dev
```

## Deploy

O build de produção sai em `dist/` e o Cloudflare publica esse diretório diretamente.

```bash
npm run cf:deploy
```

Esse comando executa a build e depois faz o deploy do worker configurado em `wrangler.jsonc`.

## CI

O workflow em `.github/workflows/deploy-cloudflare.yml`:

- instala dependências com `npm ci`
- executa lint e typecheck
- gera a build
- valida o bundle do Worker com dry-run
- publica no Cloudflare somente em push para `main`

## Variáveis de ambiente

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Cloudflare opcional:

- `REFERENCE_SOURCE_URL` para buscar referências externas antes do fallback local

## Observação sobre o legado

A versão antiga fica preservada pelo histórico Git e pela branch anterior ao corte. O produto atual é centrado em mesas, com portal autenticado em `/mesas` e shell contextual em `/mesa/:slug/*`.
