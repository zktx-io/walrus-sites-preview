# Walrus Sites Preview

Preview Walrus Sites already deployed on testnet or mainnet locally using a familiar
**npm → localhost** workflow — without setting up a portal.

This tool is for developers who want to quickly preview or debug a deployed Walrus Site in a simple, local-style environment.

---

## Demo Video

A short demo showing how to preview a deployed Walrus Site locally:

> 📺 **Demo video:** _Coming soon_

---

## Quickstart (one-liner)

Preview a deployed Walrus Site in a single command:

```sh
npx @zktx.io/walrus-sites-preview -testnet -id 0xYOUR_SITE_OBJECT_ID
```

Then open:

```text
http://localhost:3000
```

---

## Why this exists

Previewing a Walrus Site on testnet typically requires setting up a portal, which can be inconvenient for beginners and unnecessary for quick debugging.

This CLI removes that friction.
Provide a site object ID, and the site is served locally for immediate inspection.

---

## What it does

- Loads a Walrus Site using a site object ID
- Fetches resources via Sui RPC and the Walrus aggregator
- Serves the site locally (for example, `http://localhost:3000`)
- Focuses purely on developer preview and debugging

This is **not** a production hosting solution and does not replace Walrus portals.

---

## Requirements

- Node.js 18 or later

---

## Install

```sh
npm i -D @zktx.io/walrus-sites-preview
```

> Note: This package is published as a scoped npm package:
> `@zktx.io/walrus-sites-preview`

---

## Quick Start (npm scripts)

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

```text
http://localhost:3000
```

You can inspect the resolved configuration at:

```text
http://localhost:3000/__config
```

---

## How to get a Site Object ID

`walrus-sites-preview` requires a **Walrus Site Object ID**.

When a site is deployed to Walrus Sites — whether via the official site-builder CLI or a CI workflow — the **Site Object ID is printed in the deployment output**.

Look for a line similar to:

```text
Site object ID: 0x...
```

or:

```text
"site_obj_id": "0x..."
```

Copy this value and pass it to the preview command.

For detailed deployment guides, see:

- Publishing a Walrus Site (official docs):
  [https://docs.wal.app/docs/sites/getting-started/publishing-your-first-site](https://docs.wal.app/docs/sites/getting-started/publishing-your-first-site)
- Deploying via GitHub Actions (walrus-sites-provenance):
  [https://github.com/marketplace/actions/walrus-sites-provenance](https://github.com/marketplace/actions/walrus-sites-provenance)

> This tool does not deploy or update sites.
> It only previews already deployed Walrus Sites.

---

## Configuration

You may optionally create a `config.json` next to your `package.json`.

CLI flags always override file-based configuration.

When using `-testnet` or `-mainnet`, the following values are filled automatically:

- `rpcUrlList`
- `aggregatorUrl`
- `sitePackage`

### Supported fields

- `siteObjectId` (required)
- `rpcUrlList` (required unless using `-testnet` / `-mainnet`)
- `aggregatorUrl` (required unless using `-testnet` / `-mainnet`)
- `sitePackage` (required unless using `-testnet` / `-mainnet`)
- `network` (optional, informational)
- `host`, `port` (via CLI flags)

### Example

```json
{
	"network": "testnet",
	"rpcUrlList": ["https://fullnode.testnet.sui.io"],
	"aggregatorUrl": "https://aggregator.walrus-testnet.walrus.space",
	"sitePackage": "0x...",
	"siteObjectId": "0x..."
}
```

---

## Passing arguments dynamically

Install the package:

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

Origin of the bundled `dist` assets (portal build):

- Source repository:
  [https://github.com/MystenLabs/walrus-sites/tree/main/portal](https://github.com/MystenLabs/walrus-sites/tree/main/portal)
- `portal/worker` → `./portal-worker`
- `portal/common` → `./portal-common`
- Included sources:
    - `./portal-worker/src` (service worker TypeScript)
    - `./portal-worker/static` (static assets)
