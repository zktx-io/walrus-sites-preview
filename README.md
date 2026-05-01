<p align="center">
	<img src="https://raw.githubusercontent.com/zktx-io/walrus-sites-preview/main/Walrus_Logotype_Black.png" alt="Walrus" width="360" />
</p>

# Walrus Sites Preview

Preview Walrus Sites already deployed on testnet or mainnet through a familiar
**npm → localhost** workflow.

Walrus Sites Preview is a small CLI for opening a current deployment locally
during design review, QA, planning review, or stakeholder feedback. It is meant
to sit alongside existing Walrus portal and deployment workflows, not replace
them.

A developer can share one command, and teammates can review the deployed site on
`localhost` using the same kind of browser workflow they use for regular web
projects.

---

## Demo Video

A short demo showing how to preview a deployed Walrus Site locally:

https://github.com/user-attachments/assets/c28c033a-92c5-4ee9-82e0-1406319842c7

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

You can also add `--open` to open the browser automatically:

```sh
npx @zktx.io/walrus-sites-preview -testnet -id 0xYOUR_SITE_OBJECT_ID --open
```

---

## Why this exists

Walrus portals remain the right place for production access, integration
testing, and portal-specific behavior. This CLI covers a narrower case: quickly
checking an already deployed site during an internal review cycle.

In that situation, teams often need a simple browser URL for the current
deployment while keeping the existing deployment pipeline unchanged. Provide a
site object ID, and this CLI fetches the resources and serves a local preview.

The goal is to make review handoff simpler while preserving the established
Walrus workflow.

---

## What it does

- Loads a Walrus Site using a site object ID
- Fetches resources via Sui RPC and the Walrus aggregator
- Serves the site locally (for example, `http://localhost:3000`)
- Provides a local review path that can sit alongside portal-based workflows
- Supports preview, debugging, QA, and review workflows

This is **not** a production hosting solution and does not replace Walrus portals.

---

## Who this is for

- Developers who want a quick local preview of an already deployed Walrus Site
- Web designers reviewing visual changes from a testnet deployment
- Planners, PMs, and QA reviewers checking an in-progress site before release
- Teams that want a lightweight local review command for deployed Walrus Sites

For many internal review sessions, a reviewer can start with the command and the
site object ID. Wallets and deployment keys are not part of the preview flow.

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

Add an npm script to your project so teammates can run a familiar command:

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

The vendored portal worker code is currently aligned with the upstream
`portal/worker` package version `2.9.0`.

Origin of the bundled `dist` assets (portal build):

- Source repository:
  [https://github.com/MystenLabs/walrus-sites/tree/main/portal](https://github.com/MystenLabs/walrus-sites/tree/main/portal)
- `portal/worker` → `./portal-worker`
- `portal/common` → `./portal-common`
- Included sources:
    - `./portal-worker/src` (service worker TypeScript)
    - `./portal-worker/static` (static assets)

## License

MIT
