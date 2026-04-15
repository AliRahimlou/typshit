# Zendrop Access And Refresh Token Runbook

## Summary

We did not get the Zendrop credentials from a static API key page. We obtained them through Zendrop's OAuth authorization code flow with PKCE.

This repo already implements that flow. The backend starts the browser authorization step, receives the OAuth callback locally, exchanges the returned authorization code for tokens, and then writes the results into `.env`.

The three Zendrop environment values involved are:

- `ZENDROP_CLIENT_ID`
- `ZENDROP_ACCESS_TOKEN`
- `ZENDROP_REFRESH_TOKEN`

The current code writes those values into `.env` after a successful OAuth exchange.

## Files That Handle It

- `routes/zendrop.ts`: exposes the local OAuth start and callback routes.
- `zendrop.ts`: generates PKCE values, optionally registers a client, exchanges the code for tokens, and persists the env vars.
- `.env`: stores the resulting `ZENDROP_CLIENT_ID`, `ZENDROP_ACCESS_TOKEN`, and `ZENDROP_REFRESH_TOKEN`.

## How We Got The Tokens

### 1. Start the local backend

Run the app locally so the OAuth routes are available:

```bash
npm run dev
```

The callback URL used by the code is:

```text
http://127.0.0.1:8080/zendrop/oauth/callback
```

### 2. Open the local OAuth start route

In a browser, visit:

```text
http://127.0.0.1:8080/zendrop/oauth/start
```

That route does not directly authenticate with Zendrop itself. It calls the repo's OAuth helper logic, which does the following:

1. Fetches Zendrop OAuth metadata from:

```text
https://app.zendrop.com/.well-known/oauth-authorization-server
```

2. Checks whether `ZENDROP_CLIENT_ID` already exists.

3. If `ZENDROP_CLIENT_ID` is missing, dynamically registers a public client against Zendrop's registration endpoint.

4. Generates:

- a PKCE code verifier
- a PKCE code challenge
- a random OAuth state value

5. Stores the verifier, client id, and redirect URI in server memory until the callback returns.

6. Redirects the browser to Zendrop's authorization endpoint.

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

## How The Tokens Were Persisted

After a successful token exchange, the backend writes the following values into `.env`:

- `ZENDROP_CLIENT_ID`
- `ZENDROP_ACCESS_TOKEN`
- `ZENDROP_REFRESH_TOKEN`

It also updates `process.env` in memory so the running server can use the new values immediately.

That is why the Zendrop section of `.env` now contains populated values instead of blanks.

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

## Important Notes

- `ZENDROP_ACCESS_TOKEN` is what the backend uses to call the Zendrop MCP endpoint with `Authorization: Bearer ...`.
- `ZENDROP_REFRESH_TOKEN` is persisted for reuse, but the current code does not yet implement an automatic refresh flow.
- If `ZENDROP_CLIENT_ID` is already present, the backend reuses it and skips client registration on later runs.
- The token values should stay in `.env` and should not be copied into docs, source files, or commits.

## Short Version

If someone asks how we got the Zendrop access and refresh tokens, the answer is:

1. We started the local backend.
2. We opened `/zendrop/oauth/start` in a browser.
3. The backend used OAuth authorization code flow with PKCE.
4. Zendrop redirected back to our local callback.
5. The backend exchanged the authorization code for `access_token` and `refresh_token`.
6. The backend wrote those values into `.env` as `ZENDROP_ACCESS_TOKEN` and `ZENDROP_REFRESH_TOKEN`.