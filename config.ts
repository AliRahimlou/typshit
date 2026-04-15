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
  zendropAccessToken: process.env.ZENDROP_ACCESS_TOKEN,
} as const;

if (
  !config.shopifyAdminAccessToken &&
  !(config.shopifyClientId && config.shopifyClientSecret)
) {
  throw new Error(
    "Missing Shopify auth env vars: set SHOPIFY_ADMIN_ACCESS_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET",
  );
}
