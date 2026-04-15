# typsh-it-shopify-agent-server

GraphQL-first TypeScript backend for a Shopify launch agent. V1 is focused on catalog creation, collections, store pages, SEO/AEO copy, optional metaobject upserts, and Online Store publishing. Theme file edits are intentionally out of scope for now.

## Requirements

- Node 18 or newer
- Shopify app credentials, either:
  - a store Admin API access token, or
  - a Dev Dashboard app Client ID and Client Secret for the client-credentials grant
- An OpenAI API key

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
ZENDROP_ACCESS_TOKEN=
```

For Dev Dashboard apps, this server can exchange `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` for a short-lived access token automatically. You won't see a permanent Admin token in the UI for that app model.

For Zendrop MCP, complete OAuth in your MCP-capable agent client and set the resulting bearer token as `ZENDROP_ACCESS_TOKEN`. This backend uses the official Zendrop MCP URL and can then search products, add import candidates, and publish products to Shopify before enriching them.

## Run

```bash
npm run dev
```

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

### `GET /workflows/sourcing-plan`

Returns the supplier-platform sourcing manifest, target margins, search terms, and manual connection requirements for the five-product launch catalog.

### `GET /workflows/zendrop-status`

Checks whether Zendrop MCP is configured and lists the discovered MCP tools when the Zendrop access token is valid.

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

### `POST /workflows/zendrop-publish-to-shopify`

Publishes a Zendrop-linked product to Shopify so fulfillment stays connected.

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
