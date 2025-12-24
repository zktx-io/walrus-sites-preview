# Walrus Sites Preview

Preview Walrus Sites already deployed on testnet or mainnet locally using a familiar
npm → localhost workflow — without setting up a portal.

This tool is for developers who want to quickly preview or debug a deployed Walrus Site in a simple, local-style environment.

---

## Why this exists

Previewing a Walrus Site on testnet usually requires setting up a portal, which can be difficult for beginners and unnecessary for quick debugging.

This CLI removes that friction.
Give it a site object ID, and it serves the site locally.

---

## What it does

- Loads a Walrus Site using a site object ID
- Fetches resources via Sui RPC + Walrus aggregator
- Serves the site locally (e.g. `http://localhost:3000`)
- Focused purely on developer preview and debugging

This is not a production hosting solution and does not replace portals.

---

## Requirements

- Node.js 18+

---

## Install

```sh
npm i -D @zktx.io/walrus-sites-preview
```

---

## Quick Start

Add an npm script to your project:

```json
{
	"scripts": {
		"preview:testnet": "preview -testnet -id 0xYOUR_SITE_OBJECT_ID -port 3000",
		"preview:mainnet": "preview -mainnet -id 0xYOUR_SITE_OBJECT_ID -port 3000"
	}
}
```

Run:

```sh
npm run preview:testnet
```

Then open:

`http://localhost:3000`

You can inspect the resolved configuration at:

`http://localhost:3000/__config`

---

## Configuration

You can optionally create a `config.json` next to your `package.json`.

CLI flags always override file-based config.

If you use `-testnet` or `-mainnet`, the required RPC and aggregator URLs are filled automatically.

`config.json` supports:

- `siteObjectId` (required)
- `rpcUrlList` (required unless using `-testnet` / `-mainnet`)
- `aggregatorUrl` (required unless using `-testnet` / `-mainnet`)
- `sitePackage` (required unless using `-testnet` / `-mainnet`)
- `network` (optional, informational)
- `host`, `port` (via CLI flags)

Example:

```json
{
	"network": "testnet",
	"rpcUrlList": ["https://fullnode.testnet.sui.io"],
	"aggregatorUrl": "https://aggregator.walrus-testnet.walrus.space",
	"sitePackage": "0x...",
	"siteObjectId": "0x..."
}
```

To pass arguments dynamically:

```sh
npm i -D @zktx.io/walrus-sites-preview
```

Add a pass-through script:

```json
{
	"scripts": {
		"preview": "preview"
	}
}
```

Then run:

```sh
npm run preview -- -testnet -id 0xYOUR_SITE_OBJECT_ID -port 3000
```

---

## Source attribution

This package vendors and adapts parts of the Walrus Sites portal source code.

Where `dist` comes from (portal build):

- Source repo: https://github.com/MystenLabs/walrus-sites/tree/main/portal
- `portal/worker` → `./portal-worker`
- `portal/common` → `./portal-common`
- Source: `./portal-worker/src` (service worker TypeScript) and `./portal-worker/static` (static assets)
