import dotenv from "dotenv";

dotenv.config();

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

const parsedPort = Number(process.env.PORT ?? "8080");

if (Number.isNaN(parsedPort)) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

export const config = {
  port: parsedPort,
  shopifyStoreDomain: readRequiredEnv("SHOPIFY_STORE_DOMAIN"),
  shopifyAdminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  shopifyClientId: process.env.SHOPIFY_CLIENT_ID,
  shopifyClientSecret: process.env.SHOPIFY_CLIENT_SECRET,
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION ?? "2026-04",
  openaiApiKey: readRequiredEnv("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.4",
  zendropMcpUrl: process.env.ZENDROP_MCP_URL ?? "https://app.zendrop.com/mcp/v1",
  zendropOauthAuthorizationUrl:
    process.env.ZENDROP_OAUTH_AUTHORIZATION_URL ??
    "https://app.zendrop.com/mcp/oauth/authorize",
  zendropOauthTokenUrl:
    process.env.ZENDROP_OAUTH_TOKEN_URL ?? "https://app.zendrop.com/mcp/oauth/token",
  zendropOauthRegistrationUrl:
    process.env.ZENDROP_OAUTH_REGISTRATION_URL ??
    "https://app.zendrop.com/mcp/oauth/register",
  zendropAccessToken: process.env.ZENDROP_ACCESS_TOKEN,
  zendropClientId: process.env.ZENDROP_CLIENT_ID,
  zendropRefreshToken: process.env.ZENDROP_REFRESH_TOKEN,
  zendropCookie: process.env.ZENDROP_COOKIE,
  zendropCfClearance: process.env.ZENDROP_CF_CLEARANCE,
  zendropUserAgent:
    process.env.ZENDROP_USER_AGENT ??
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
} as const;

if (
  !config.shopifyAdminAccessToken &&
  !(config.shopifyClientId && config.shopifyClientSecret)
) {
  throw new Error(
    "Missing Shopify auth env vars: set SHOPIFY_ADMIN_ACCESS_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET",
  );
}
