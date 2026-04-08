# Singularidade RPG

Aplicação web-first para condução de mesa, fichas, rolagens, ordem, livro de regras e sessão online de `Singularidade`.

## Produção

- App: [singularidade-online.salesweslley360.workers.dev](https://singularidade-online.salesweslley360.workers.dev)
- Rotas:
  - `/fichas`
  - `/rolagens`
  - `/ordem`
  - `/livro`
  - `/mesa`
  - `/mesa/:slug`

## Stack

- Frontend: HTML, CSS e JavaScript puro
- Runtime: Cloudflare Workers
- Banco: D1
- Tempo real: Durable Object `TableRoom`
- Uploads: R2 `singularidade-avatars`

## Estrutura de runtime

- `index.html`
- `book.html`
- `app.js`
- `styles.css`
- `styles.mobile.css`
- `styles/`
- `src/`
- `assets/`
- `cloudflare/`
- `scripts/`
- `wrangler.jsonc`

## Build do bundle

O artefato publicado no Worker sai de `dist/cloudflare-public`.

```bash
python scripts/build_release.py
```

O bundle precisa conter:

- wrappers `styles.css` e `styles.mobile.css`
- pasta `styles/` completa
- `src/`
- `assets/`

## Deploy oficial

O fluxo oficial é:

1. atualizar o código
2. enviar para `main`
3. GitHub Actions publicar no Cloudflare

Segredos esperados no repositório:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` (recomendado)

## Deploy local de contingência

Se for necessário publicar manualmente:

```bash
python scripts/build_release.py
npx wrangler deploy
```

## Funcionalidades centrais

- fichas com recursos, técnicas, passivas, votos e inventário
- rolagens guiadas e customizadas com TN e log
- ordem de combate com turno e round
- livro de regras com busca, navegação e PDF
- mesa online com links, códigos de 6 dígitos, presença em tempo real, snapshots, restore e upload de avatar

## Observações

- esta base não preserva compatibilidade com versões antigas do projeto
- `dist/`, `tests/` e artefatos locais não fazem parte do repositório publicado
