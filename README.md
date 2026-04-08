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

## Estrutura publicada

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

## Deploy

Pré-requisito: `wrangler` autenticado.

```bash
python scripts/build_release.py
npx wrangler deploy
```

## Build do bundle web

O artefato publicado em Cloudflare sai de `dist/cloudflare-public` e precisa conter:

- wrappers `styles.css` e `styles.mobile.css`
- pasta `styles/` completa
- `src/`
- `assets/`

```bash
python scripts/build_release.py
```

## Publicação direta

```bash
npx wrangler deploy
```

## Funcionalidades centrais

- Fichas com recursos, técnicas, passivas, votos e inventário
- Rolagens guiadas e customizadas com TN e log
- Ordem de combate com turno e round
- Livro de regras com busca, navegação e PDF
- Mesa online com:
  - links por papel
  - códigos numéricos de 6 dígitos
  - presença em tempo real
  - snapshots e restore
  - upload de avatar

## Observações

- Esta base não preserva compatibilidade com versões antigas do projeto.
- `dist/`, `tests/` e artefatos locais não fazem parte do repositório final publicado.
