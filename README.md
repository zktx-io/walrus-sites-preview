# Walrus Sites Preview (CLI)

Installable CLI to preview Walrus Sites locally:

- **site mode**: fetch resources via Sui RPC + Walrus aggregator for a given site object ID

## Requirements

- Node.js 18+

## Install (as dev dependency)

```sh
npm i -D @zktx.io/walrus-sites-preview
```

## Run (via npm script)

Add this to your project:

```json
{
	"scripts": {
		"preview:testnet": "preview -testnet -id 0xYOUR_SITE_OBJECT_ID -port 3000",
		"preview:mainnet": "preview -mainnet -id 0xYOUR_SITE_OBJECT_ID -port 3000",
		"preview": "preview"
	}
}
```

Then run:

```sh
npm run preview:testnet
```

This starts a local server at `http://localhost:3000`.

You can inspect the effective config at `http://localhost:3000/__config`.

If you prefer a file-based config, create `config.json` next to your `package.json` and pass overrides as needed (the CLI flags win).

To pass arguments dynamically, use `--`:

```sh
npm run preview -- -testnet -id 0xYOUR_SITE_OBJECT_ID -port 3000
```

## Where `dist` comes from (portal build)

This section is for maintainers of this package. Consumers don’t need to build `dist/` manually (it ships in the npm package).

- Vendored from the walrus-sites portal codebase:
    - Source repo: https://github.com/MystenLabs/walrus-sites/tree/main/portal
        - `portal/worker` → `./portal-worker`
        - `portal/common` → `./portal-common`
- Source: `./portal-worker/src` (service worker TS) and `./portal-worker/static` (static assets)
- Shared libs: `./portal-common/lib/src` (shared implementation used by the worker)
- Build configs: `./webpack.config.*.cjs` (kept in this repo, not published)
- Build command:

```sh
npm install
npm run build
```

## Publish

This package is set up to publish with `dist/` included. `npm pack` / `npm publish` runs `prepack`, which rebuilds `dist/` via `npm run build`.

## Maintainers: static mode

If you only want to serve a local static folder as a SPA:

```sh
npx preview --mode static --dist ./dist -port 3000
```

If your `dist` lives somewhere else:

```sh
npx preview --mode static --dist /absolute/path/to/dist
```

## Options

```sh
npx preview -port 8090 --open
```

Override site config without editing `config.json`:

```sh
npx preview --site-object-id 0x... --rpc https://fullnode.mainnet.sui.io --aggregator https://aggregator.walrus-mainnet.walrus.space --site-package 0x...
```
