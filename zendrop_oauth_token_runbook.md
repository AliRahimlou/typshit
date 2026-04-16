# Zendrop Access And Refresh Token Runbook

## Summary

We did not get the Zendrop credentials from a static API key page. We obtained them through Zendrop's OAuth authorization code flow with PKCE.

This repo already implements that flow. The backend starts the browser authorization step, receives the OAuth callback locally, exchanges the returned authorization code for tokens, and then writes the results into `.env`.

The repo now also supports:

- automatic access-token refresh through `ZENDROP_REFRESH_TOKEN`
- fallback OAuth endpoint configuration if Zendrop metadata discovery is challenged
- optional reuse of a browser-cleared Zendrop session when Cloudflare blocks plain server-to-server MCP requests
- persistent local caching of resolved Zendrop media and supplier descriptions in `.zendrop-media-cache.json`

The three Zendrop environment values involved are:

- `ZENDROP_CLIENT_ID`
- `ZENDROP_ACCESS_TOKEN`
- `ZENDROP_REFRESH_TOKEN`

The current code writes those values into `.env` after a successful OAuth exchange.

There are also optional Zendrop environment values that can help when Zendrop changes transport requirements:

- `ZENDROP_OAUTH_AUTHORIZATION_URL`
- `ZENDROP_OAUTH_TOKEN_URL`
- `ZENDROP_OAUTH_REGISTRATION_URL`
- `ZENDROP_COOKIE`
- `ZENDROP_CF_CLEARANCE`
- `ZENDROP_USER_AGENT`

## Files That Handle It

- `routes/zendrop.ts`: exposes the local OAuth start and callback routes.
- `zendrop.ts`: generates PKCE values, optionally registers a client, exchanges the code for tokens, refreshes tokens, applies MCP headers, and persists the env vars.
- `config.ts`: reads Zendrop OAuth fallback URLs and optional session-related env vars.
- `.env`: stores the resulting `ZENDROP_CLIENT_ID`, `ZENDROP_ACCESS_TOKEN`, and `ZENDROP_REFRESH_TOKEN`.
- `.zendrop-media-cache.json`: local cache of resolved product/image mappings plus supplier description fields reused when Zendrop is temporarily unavailable.

## Exact OAuth And Verification Step

Use this exact sequence when Zendrop MCP needs a fresh OAuth login or when the stored refresh token has been revoked.

### 1. Start the local MCP client backend

```bash
npm run server:start
```

If you want watch mode instead:

```bash
npm run dev
```

### 2. Initiate the OAuth authorization flow from the MCP client

Open this local route in a browser:

```text
http://127.0.0.1:8080/zendrop/oauth/start
```

That route starts the Zendrop OAuth authorization code flow with PKCE from the MCP client itself. Do not wait for a manual API key unless Zendrop support explicitly provides one.

### 3. Complete Zendrop sign-in and approval

In the browser:

1. Sign in to Zendrop.
2. Approve the requested scopes.
3. Let Zendrop redirect back to the local callback route.

After the callback succeeds, the backend stores the returned credentials in `.env`:

- `ZENDROP_CLIENT_ID`
- `ZENDROP_ACCESS_TOKEN`
- `ZENDROP_REFRESH_TOKEN`

It also updates `process.env` in the running server so the token is usable immediately.

### 4. Verify that OAuth completed cleanly

Run:

```bash
curl -fsS http://127.0.0.1:8080/workflows/zendrop-status
```

Healthy output should show all of these as true:

- `hasAccessToken`
- `initializeOk`
- `listToolsOk`

If the status still shows a revoked or invalid refresh token, run `/zendrop/oauth/start` again and complete approval again. That refreshes the stored token set in `.env`.

### 5. Verify the connection with “Show my imported products”

Use this safe local MCP check:

```bash
./node_modules/.bin/tsx <<'TS'
import { callZendropTool, listZendropTools } from "./zendrop.ts";

function extract(payload: unknown): any {
	if (payload && typeof payload === "object" && "structuredContent" in payload) {
		const envelope = payload as { structuredContent?: unknown };
		if (envelope.structuredContent !== undefined) {
			return envelope.structuredContent;
		}
	}

	if (payload && typeof payload === "object" && "content" in payload) {
		const envelope = payload as { content?: Array<{ type?: string; text?: string }> };
		const text = envelope.content?.find(
			(entry) => entry.type === "text" && typeof entry.text === "string",
		)?.text;

		if (text) {
			return JSON.parse(text);
		}
	}

	return payload;
}

const tools = await listZendropTools();
const getStoresTool = tools.find((tool) => /^get_stores$/i.test(tool.name));
const getMyProductsTool = tools.find((tool) => /^get_my_products$/i.test(tool.name));

if (getStoresTool == null || getMyProductsTool == null) {
	throw new Error("Required Zendrop MCP tools were not discovered");
}

const storePayload = extract(await callZendropTool(getStoresTool.name, {})) as {
	stores?: Array<{
		id: number;
		name: string;
		url: string;
		connection_status?: number;
	}>;
};

const store =
	storePayload.stores?.find((entry) => entry.connection_status === 1) ??
	storePayload.stores?.[0];

if (store == null) {
	throw new Error("Zendrop did not return a connected store");
}

const productsPayload = extract(
	await callZendropTool(getMyProductsTool.name, {
		store_id: store.id,
		page: 1,
		limit: 10,
	}),
) as {
	items?: Array<{
		import_list_id: number;
		product_id: number;
		product_name: string;
		import_status?: string;
		store_product_id?: string;
	}>;
};

console.log(
	JSON.stringify(
		{
			store: {
				id: store.id,
				name: store.name,
				url: store.url,
			},
			importedProducts: productsPayload.items ?? [],
		},
		null,
		2,
	),
);
TS
```

That is the direct MCP equivalent of asking: “Show my imported products.”

## How We Got The Tokens

### 1. Start the local backend

Run the app locally so the OAuth routes are available:

```bash
npm run dev
```

If you want a non-watch process instead, run:

```bash
npm run server:start
```

The callback URL used by the code is based on `PORT`. By default it is:

```text
http://127.0.0.1:8080/zendrop/oauth/callback
```

### 2. Open the local OAuth start route

In a browser, visit:

```text
http://127.0.0.1:8080/zendrop/oauth/start
```

If the backend is running on another port, replace `8080` with that port.

That route does not directly authenticate with Zendrop itself. It calls the repo's OAuth helper logic, which does the following:

1. Fetches Zendrop OAuth metadata from:

```text
https://app.zendrop.com/.well-known/oauth-authorization-server
```

2. Checks whether `ZENDROP_CLIENT_ID` already exists.

3. If the metadata route is challenged, falls back to the configured OAuth endpoints already baked into repo config.

4. If `ZENDROP_CLIENT_ID` is missing, dynamically registers a public client against Zendrop's registration endpoint.

5. Generates:

- a PKCE code verifier
- a PKCE code challenge
- a random OAuth state value

6. Stores the verifier, client id, and redirect URI in server memory until the callback returns.

7. Redirects the browser to Zendrop's authorization endpoint.

## Scopes Requested

The code requests these Zendrop scopes:

- `catalog:read`
- `my_products:read`
- `my_products:write`
- `orders:read`
- `orders:write`
- `stores:read`
- `stores:write`

## What Happens In Zendrop

After the redirect, we completed Zendrop sign-in and approved the requested access.

Zendrop then redirected the browser back to the local callback route with:

- `code`
- `state`

The callback route is:

```text
http://127.0.0.1:8080/zendrop/oauth/callback
```

Again, if the backend is running on another port, the callback route uses that port instead.

## How The Backend Exchanges The Code For Tokens

When Zendrop calls the callback route, the backend:

1. Validates that both `code` and `state` are present.
2. Looks up the saved PKCE verifier and client context by `state`.
3. Sends a token request to Zendrop's token endpoint with:

- `grant_type=authorization_code`
- `client_id`
- `code`
- `redirect_uri`
- `code_verifier`

4. Receives a token payload from Zendrop.
5. Reads `access_token` from that payload.
6. Stores `refresh_token` too if Zendrop returned one.

The backend now sends the same Zendrop request profile used by the current MCP client code, including the MCP protocol version and browser-like request headers.

## How The Tokens Were Persisted

After a successful token exchange, the backend writes the following values into `.env`:

- `ZENDROP_CLIENT_ID`
- `ZENDROP_ACCESS_TOKEN`
- `ZENDROP_REFRESH_TOKEN`

It also updates `process.env` in memory so the running server can use the new values immediately.

That is why the Zendrop section of `.env` now contains populated values instead of blanks.

## How Refresh Works Now

The backend now uses `ZENDROP_REFRESH_TOKEN` automatically.

If a Zendrop MCP request returns `401`, the backend:

1. sends a refresh-token request to Zendrop
2. writes the new `ZENDROP_ACCESS_TOKEN` into `.env`
3. also writes a new `ZENDROP_REFRESH_TOKEN` if Zendrop returns one
4. retries the original MCP request with the refreshed token

This means the refresh token is no longer just stored for later manual use. It is part of the live request path.

## How We Verified It Worked

We verified the connection through the status endpoints:

```bash
curl http://127.0.0.1:8080/workflows/zendrop-status
```

or:

```bash
curl http://127.0.0.1:8080/zendrop/status
```

Successful verification means:

- the access token is present
- the backend can initialize against Zendrop MCP
- the backend can list discovered Zendrop MCP tools

If Zendrop is blocking the transport before MCP initializes, the status payload now reports that explicitly with `challengeDetected: true` and an error message that says the request was blocked by a Cloudflare challenge.

## Current Verified State

As of April 15, 2026, the repo-side OAuth and refresh logic is implemented and the local backend on the standard ports is running the updated code.

The current live blocker from this environment is upstream: Zendrop is returning a Cloudflare challenge before the MCP request reaches Zendrop.

That means:

- the repo is no longer failing because of missing refresh support
- the repo is no longer failing because of missing MCP protocol headers
- the repo can now report the real blocker clearly through `/workflows/zendrop-status`

## When Zendrop Requires A Browser Session

If Zendrop only allows requests after a browser-cleared session, the backend can now reuse that session through optional env vars.

Use one of these in `.env`:

- `ZENDROP_COOKIE=<full Cookie header for app.zendrop.com>`
- `ZENDROP_CF_CLEARANCE=<cf_clearance value>`

Optionally also set:

- `ZENDROP_USER_AGENT=<the browser user agent from the session that solved the challenge>`

If those values are present, the backend includes them in Zendrop requests and can retry the same MCP workflow without further code changes.

## Local Media Cache Behavior

The image sync workflow now checks a local cache before making any Zendrop call.

When `/workflows/zendrop-sync-linked-product-assets` succeeds for a handle, the backend stores the resolved Zendrop product IDs, import-list IDs, media alt text, and media URLs in `.zendrop-media-cache.json`.

On later reruns, the workflow reuses that cache first. If the product already has media in Shopify but the local cache is empty, the workflow can backfill the cache from Shopify's current product media without waiting for Zendrop again.

This does not solve first-time resolution for products that have never been synced successfully, but it does make already-resolved products durable across future Zendrop transport outages.

## Important Notes

- `ZENDROP_ACCESS_TOKEN` is what the backend uses to call the Zendrop MCP endpoint with `Authorization: Bearer ...`.
- `ZENDROP_REFRESH_TOKEN` is now used automatically for refresh and retry when Zendrop returns `401`.
- If `ZENDROP_CLIENT_ID` is already present, the backend reuses it and skips client registration on later runs.
- The token values should stay in `.env` and should not be copied into docs, source files, or commits.
- If `/workflows/zendrop-status` returns `challengeDetected: true`, the remaining work is session or network access, not more token-exchange code.

## Short Version

If someone asks how we got the Zendrop access and refresh tokens, the answer is:

1. We started the local backend.
2. We opened `/zendrop/oauth/start` in a browser.
3. The backend used OAuth authorization code flow with PKCE.
4. Zendrop redirected back to our local callback.
5. The backend exchanged the authorization code for `access_token` and `refresh_token`.
6. The backend wrote those values into `.env` as `ZENDROP_ACCESS_TOKEN` and `ZENDROP_REFRESH_TOKEN`.
7. On later Zendrop `401` responses, the backend can now refresh and persist new token values automatically.