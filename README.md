# typsh-it-shopify-agent-server

The repo now includes Shopify CLI as a dev dependency for theme automation. Backend work still runs on Node 18+, but the theme automation scripts auto-switch to Node 20 through `nvm` because current Shopify CLI releases require Node 20+.

GraphQL-first TypeScript backend for a Shopify launch agent. V1 is focused on catalog creation, collections, store pages, SEO/AEO copy, optional metaobject upserts, and Online Store publishing. Theme file edits are intentionally out of scope for now.

## Requirements

- Node 18 or newer
- Shopify app credentials, either:
  - a store Admin API access token, or
  - a Dev Dashboard app Client ID and Client Secret for the client-credentials grant
- An OpenAI API key for agent responses and local asset/image generation tasks

This workspace currently defaults to Node 14, so use Node 18 before installing or running:

```bash
source ~/.nvm/nvm.sh
nvm use 18
```

## Install

```bash
npm install
cp .env.example .env
npm run check
```

## Environment

```env
PORT=8080
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# Option A: store custom app token
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx

# Option B: Dev Dashboard app client-credentials grant
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=

SHOPIFY_API_VERSION=2026-04
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-5.4
ZENDROP_MCP_URL=https://app.zendrop.com/mcp/v1
ZENDROP_OAUTH_AUTHORIZATION_URL=https://app.zendrop.com/mcp/oauth/authorize
ZENDROP_OAUTH_TOKEN_URL=https://app.zendrop.com/mcp/oauth/token
ZENDROP_OAUTH_REGISTRATION_URL=https://app.zendrop.com/mcp/oauth/register
ZENDROP_CLIENT_ID=
ZENDROP_ACCESS_TOKEN=
ZENDROP_REFRESH_TOKEN=
ZENDROP_CF_CLEARANCE=
ZENDROP_COOKIE=
ZENDROP_USER_AGENT=

AGENT_BASE_URL=http://127.0.0.1:8080
SHOPIFY_THEME_STORE=your-store.myshopify.com
SHOPIFY_THEME_ID=
SHOPIFY_THEME_PATH=theme
SHOPIFY_THEME_ALLOW_LIVE=0
SHOPIFY_THEME_PUBLISH_ON_PUSH=0
SHOPIFY_THEME_DEV_HOST=127.0.0.1
SHOPIFY_THEME_DEV_PORT=9292
SHOPIFY_THEME_DEV_OPEN=0
SHOPIFY_THEME_STORE_PASSWORD=
SHOPIFY_CLI_THEME_TOKEN=
SHOPIFY_DEPLOY_ON_GIT_PUSH=0
SHOPIFY_GIT_PUSH_REMOTE=origin
SHOPIFY_GIT_PUSH_BRANCH=main
STORE_SYNC_ZENDROP_ASSETS=0
```

For Dev Dashboard apps, this server can exchange `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` for a short-lived access token automatically. You won't see a permanent Admin token in the UI for that app model.

`OPENAI_API_KEY` is required beyond text generation: the repo uses it for structured launch content, agent workflows, and any local regeneration of marketing assets like homepage hero images.

For Zendrop MCP, this backend now supports a local OAuth bootstrap flow. Open `/zendrop/oauth/start`, complete Zendrop sign-in/approval, and the backend will dynamically register a public client, exchange the code with PKCE, and persist `ZENDROP_CLIENT_ID`, `ZENDROP_ACCESS_TOKEN`, and `ZENDROP_REFRESH_TOKEN` into `.env`.

If Zendrop starts returning a Cloudflare challenge to server-to-server MCP requests, the backend now falls back to the known OAuth endpoints, sends the MCP protocol header on Zendrop requests, and reports the challenge explicitly through `/workflows/zendrop-status`. If your Zendrop account only works after a browser-cleared session, you can also provide `ZENDROP_COOKIE` or `ZENDROP_CF_CLEARANCE` with an optional `ZENDROP_USER_AGENT` in `.env` so the backend reuses that merchant session when calling Zendrop.

Successful Zendrop media resolutions are now persisted locally in `.zendrop-media-cache.json`. The same cache also stores supplier description fields once a live catalog lookup succeeds, and `/workflows/zendrop-sync-linked-product-assets` now reuses both the cached media and the cached supplier copy before falling back to live Zendrop calls.

## Run

For the full local dev stack, including the agent API and the live storefront preview on a local port, run:

```bash
npm start
```

This starts:

- the agent API on `http://127.0.0.1:8080` by default
- the storefront live preview on `http://127.0.0.1:9292` by default

The storefront preview hot reloads theme edits through Shopify CLI, while the API server keeps the workflow and agent routes available locally.

If either default port is already busy, the scripts automatically move to the next free local port and print the actual URLs they chose.

If you only want the local API server, run:

```bash
npm run dev
```

`npm run site:dev` remains available and is the same full-stack startup as `npm start`.

## Automated Store Workflow

Once `.env` is configured, the intended edit-and-push loop is:

1. Make catalog, copy, route, or theme changes in this repo.
2. Run `npm run store:deploy`.
3. The repo will sync Shopify data first, then push the local `theme/` kit to the configured Shopify theme.

Available commands:

- `npm run theme:auth`: one-time Shopify CLI login for the configured store using the repo-local CLI.
- `npm run theme:list`: lists available Shopify themes so you can copy the correct `SHOPIFY_THEME_ID` into `.env`.
- `npm run store:sync-data`: starts the local agent server if needed, creates any missing theme metaobject definitions, syncs launch storefront content, and prints launch readiness.
- `npm run theme:push`: pushes the local `theme/` directory to `SHOPIFY_THEME_ID` with `--nodelete` so it can be used as a partial theme kit.
- `npm run theme:preview`: runs `shopify theme dev` against the local `theme/` directory and serves a live preview on `http://127.0.0.1:9292` by default.
- `npm start`: runs the local API server and the Shopify storefront preview together.
- `npm run site:dev`: same as `npm start`.
- `npm run store:deploy`: runs the data sync and then the theme push in one command.

Notes:

- Run `npm run theme:auth` once before the first push on a new machine.
- Run `npm run theme:list` after authentication, then paste the desired theme ID into `SHOPIFY_THEME_ID`.
- `SHOPIFY_THEME_ID` is required so pushes stay non-interactive and deterministic.
- `SHOPIFY_THEME_ALLOW_LIVE=1` adds `--allow-live` to the push command when you intentionally want to target the live theme.
- `SHOPIFY_THEME_PUBLISH_ON_PUSH=1` adds `--publish` if you want the CLI to publish the pushed theme version.
- `SHOPIFY_THEME_DEV_HOST` and `SHOPIFY_THEME_DEV_PORT` control the local preview address used by `npm run theme:preview`.
- `SHOPIFY_THEME_DEV_OPEN=1` auto-opens the preview in your browser when the preview command starts.
- `SHOPIFY_THEME_STORE_PASSWORD` is optional and only needed if the storefront is password protected.
- `SHOPIFY_CLI_THEME_TOKEN` is optional for local use, and also works for non-interactive local automation. Use a Theme Access password or an Admin API token.
- `PORT`, `SHOPIFY_THEME_DEV_HOST`, and `SHOPIFY_THEME_DEV_PORT` define the preferred local URLs used by `npm start` and `npm run site:dev`.
- `STORE_SYNC_ZENDROP_ASSETS=1` adds a Zendrop asset refresh during `store:sync-data`.
- Theme commands use the repo-local Shopify CLI binary first, then fall back to a global `shopify` binary if you already have one installed.
- `.zendrop-media-cache.json` is a local durability cache for resolved Zendrop product media plus cached supplier description fields and is intentionally gitignored.

## Local Git Push Deploys

If you want a normal `git push` from your machine to also kick off a Shopify deploy, the repo now supports a tracked git hook setup.

Setup:

1. Run `npm run hooks:install`
2. In your local `.env`, set `SHOPIFY_DEPLOY_ON_GIT_PUSH=1`
3. Keep or adjust `SHOPIFY_GIT_PUSH_REMOTE=origin` and `SHOPIFY_GIT_PUSH_BRANCH=main`
4. Push normally with `git push origin main`

Behavior:

- Git has no client-side `post-push` hook, so this uses `pre-push` to start a detached background deploy while the Git push continues.
- The Shopify deploy runs from your machine, not from GitHub Actions.
- Only pushes targeting `SHOPIFY_GIT_PUSH_REMOTE` and `SHOPIFY_GIT_PUSH_BRANCH` trigger a deploy.
- Only one Shopify deploy runs at a time. If another push happens while one deploy is already running, the duplicate request is skipped.
- Deploy output is written to `.git/shopify-deploy.log`.
- A Shopify deploy failure is logged locally, but it does not roll back or block the Git push.

- `SHOPIFY_THEME_ALLOW_LIVE=1` is recommended if `SHOPIFY_THEME_ID` points at the live theme.

## Repo Layout

- `server.ts`: Express entrypoint
- `shopify.ts`: Shopify GraphQL client and mutations
- `openai.ts`: Responses API orchestration and structured output generation
- `tools/*.ts`: Function tool definitions plus handlers
- `routes/*.ts`: Health, agent, and workflow endpoints
- `data/launchCatalog.ts`: Seeded `typsh.it` launch catalog data
- `data/launchStrategy.ts`: Launch strategy and operating decisions for the agent
- `launch_strategy_2026.md`: Human-readable launch brief for agents and collaborators

## Route Docs

### `GET /health`

Returns server status plus the configured Shopify API version and OpenAI model.

### `POST /agent/plan`

Generates structured launch assets for a seeded catalog without writing to Shopify.

Request:

```json
{
  "catalogKey": "typsh-it-launch",
  "publish": false
}
```

### `POST /agent/execute`

Runs the freeform tool-calling agent. If `catalogKey` is supplied, the seeded launch catalog is added to the model context.

Request:

```json
{
  "goal": "Create the FAQ and shipping pages for the launch store",
  "catalogKey": "typsh-it-launch"
}
```

### `GET /workflows/catalogs`

Lists available seeded catalogs.

### `GET /workflows/launch-strategy`

Returns the encoded typsh.it launch strategy and operating decisions for agents or admin tooling.

### `GET /workflows/theme-handoff`

Returns the structured homepage, navigation, logo, bundle, and section handoff data for theme implementation.

### `GET /workflows/app-stack-plan`

Returns the recommended launch app stack, install order, and retention flow plan.

### `GET /workflows/theme-metaobject-definitions`

Returns the recommended Shopify metaobject definition specs for merchant-editable homepage, bundle, and trust-strip data.

### `POST /workflows/create-theme-metaobject-definitions`

Creates any missing Shopify metaobject definitions required by the optional theme-homepage data model.

### `GET /workflows/sourcing-plan`

Returns the supplier-platform sourcing manifest, target margins, search terms, and manual connection requirements for the five-product launch catalog.

### `GET /workflows/zendrop-status`

Checks whether Zendrop MCP is configured and lists the discovered MCP tools when the Zendrop access token is valid. The response also includes the last OAuth stage seen by the backend so you can tell whether the flow only started, reached the callback, stored a token, or failed.

### `GET /zendrop/oauth/start`

Starts the Zendrop OAuth authorization code flow with PKCE using local callback handling on `http://127.0.0.1:8080/zendrop/oauth/callback`.

### `GET /workflows/launch-readiness`

Runs a live launch audit against Shopify for launch products, collections, pages, and retired legacy products, plus manual launch blockers that still need merchant-side setup.

### `POST /workflows/bootstrap-store`

Runs the full bootstrap flow: products, collections, pages, and optional metaobjects. This is effectively the all-in workflow entrypoint.

Request:

```json
{
  "catalogKey": "typsh-it-launch",
  "publish": false
}
```

### `POST /workflows/create-launch-catalog`

Creates the first end-to-end launch catalog from the seeded `typsh.it` data. This is the main workflow requested in the scaffold notes.

Request:

```json
{
  "catalogKey": "typsh-it-launch",
  "publish": false
}
```

### `POST /workflows/sync-launch-storefront`

Reruns the launch catalog workflow as an upsert pass for an existing store. Use this after products already exist in Shopify and you want to refresh product copy, collection content, page content, and collection membership without relying on theme edits.

Request:

```json
{
  "catalogKey": "typsh-it-launch",
  "publish": true
}
```

### `POST /workflows/create-policy-pages`

Creates only the policy/info pages from the selected catalog seed.

Request:

```json
{
  "catalogKey": "typsh-it-launch"
}
```

### `POST /workflows/create-collections`

Creates collections from the selected catalog seed. Pass `productIdByHandle` if the products already exist and you want the collections linked on creation.

Request:

```json
{
  "catalogKey": "typsh-it-launch",
  "publish": false,
  "productIdByHandle": {
    "typsh-one-mechanical-keyboard": "gid://shopify/Product/123"
  }
}
```

### `POST /workflows/retire-products`

Retires legacy products by setting them to draft. If no handles are provided, it retires the known legacy typsh.it T-shirt products.

Request:

```json
{
  "handles": ["unisex-t-shirt", "unisex-t-shirt-1"]
}
```

### `POST /workflows/zendrop-search-products`

Searches Zendrop catalog through MCP using a source-first workflow.

Request:

```json
{
  "query": "wireless charging station",
  "market": "US",
  "limit": 10
}
```

### `POST /workflows/zendrop-add-to-import-list`

Adds a Zendrop product to the import list before Shopify publish.

### `POST /workflows/zendrop-link-existing-product`

Previews or confirms a Zendrop link for an existing Shopify product already in the store. Use this for typsh.it launch products that Zendrop reports as `unlinked` so fulfillment is connected without creating duplicate listings.

### `POST /workflows/zendrop-publish-to-shopify`

Publishes a Zendrop-linked product to Shopify so fulfillment stays connected.

### `POST /workflows/zendrop-sync-linked-product-assets`

Fetches the linked Zendrop catalog images for one or more existing Shopify products and attaches them through Shopify `productSet` so the storefront stops rendering placeholder cards.

Request:

```json
{
  "catalogKey": "typsh-it-launch",
  "publish": true,
  "maxImages": 6
}
```

## First Launch Command

Preview the seeded `typsh.it` launch assets:

```bash
curl -X POST http://localhost:8080/agent/plan \
  -H "Content-Type: application/json" \
  -d '{"catalogKey":"typsh-it-launch","publish":false}'
```

Create the launch catalog in Shopify:

```bash
curl -X POST http://localhost:8080/workflows/create-launch-catalog \
  -H "Content-Type: application/json" \
  -d '{"catalogKey":"typsh-it-launch","publish":false}'
```

Use the tool-calling agent with catalog context:

```bash
curl -X POST http://localhost:8080/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"goal":"Create the typsh.it launch catalog in draft mode","catalogKey":"typsh-it-launch"}'
```

The agent can also retire legacy products via the `retire_product` tool when given a goal like retiring old handles from the storefront.

The agent also supports `zendrop_search_products`, `zendrop_add_to_import_list`, `zendrop_publish_to_shopify`, and `shopify_enrich_published_product` for a Zendrop-first sourcing flow.

## Notes

- Products use `productCreate` plus a follow-up variant pricing mutation so the default variant gets a real price.
- Collections are still unpublished by default on Shopify, so publishing remains explicit.
- Pages are created published.
- Metaobject upserts work when the store already has matching metaobject definitions; optional metaobjects can be skipped without failing the whole workflow.
- Edit `data/launchCatalog.ts` before a real launch if the seed products, policies, or collection membership need to change.
