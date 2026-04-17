# Project Nexus

Unindo universos, criando histórias.

Project Nexus é uma plataforma de mesas online em `Vite + React + TypeScript + Tailwind CSS + Supabase + Cloudflare`. A plataforma organiza mesas por sistema, mantendo o hub principal neutro e escalável. Singularidade é o primeiro sistema habilitado, com identidade, livro, fichas, rolagens, ordem e ferramentas próprias.

## O Que Este Repositório Entrega

- Hub autenticado para criar, listar, retomar e entrar em mesas por convite ou código.
- Modelagem de mesa com `systemKey`, preparada para múltiplos sistemas.
- Sistema Singularidade preservado como experiência de mesa: fichas, rolagens, ordem, sessões, livro, membros, snapshots e permissões.
- Autenticação com email, username e senha.
- Runtime local para desenvolvimento sem Supabase configurado.
- Runtime Supabase com Auth, Postgres, Storage, Realtime, RLS e RPCs.
- Worker Cloudflare que serve o SPA e expõe `/api/references` e `/api/health`.

## Stack

- Frontend: Vite, React, TypeScript e Tailwind CSS
- UI e estado: Framer Motion, React Hook Form, Zod, Zustand e TanStack Query
- Backend: Supabase
- Deploy: Cloudflare Workers
- Testes: Vitest, Testing Library e Playwright

## Estrutura

- `src/`: aplicação React
- `src/features/systems/`: registry de sistemas e defaults por sistema
- `src/features/workspace/`: backends local/Supabase e provider principal
- `src/routes/`: rotas da plataforma e das mesas
- `supabase/`: migrations, schema, policies e RPCs
- `cloudflare/worker.ts`: Worker do SPA e APIs auxiliares
- `public/assets/`: assets da plataforma e do sistema Singularidade

## Desenvolvimento Local

```bash
npm ci
npm run dev
```

Build de produção:

```bash
npm run build
```

Validação completa:

```bash
npm run check
npm run test:e2e
npx wrangler deploy --dry-run
```

## Supabase

A migration `20260416183000_project_nexus_system_key.sql` adiciona `tables.system_key` com fallback `singularidade`, preservando mesas antigas e preparando a base para novos sistemas.

Se o Supabase local estiver disponível:

```bash
npm run supabase:reset
npm run supabase:types
```

## Deploy Cloudflare

O Worker mantém o nome de infraestrutura `singularidade-online` por compatibilidade, mas o produto público é Project Nexus. O deploy de produção é feito pelo GitHub Actions em push para `main` usando Wrangler.

Variáveis obrigatórias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Variáveis recomendadas para gate de migrations:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

## Observação Sobre Singularidade

Singularidade não é mais o nome da plataforma. Ele é um sistema dentro do Project Nexus. A paleta e o vocabulário de energia amaldiçoada ficam confinados à experiência interna das mesas desse sistema.
