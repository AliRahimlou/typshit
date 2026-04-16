import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { config } from "./config.js";
import { enrichPublishedProductByHandle, getProductMediaUrlsByHandle } from "./shopify.js";
import type {
  ZendropConnectionStatus,
  ZendropOauthEvent,
  ZendropProductMediaCache,
  ZendropProductMediaCacheEntry,
  ZendropSearchRequest,
  ZendropToolRecord,
} from "./types.js";

type JsonRpcSuccess<T> = {
  jsonrpc: "2.0";
  id: string;
  result: T;
};

type JsonRpcFailure = {
  jsonrpc: "2.0";
  id: string;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
};

type ToolsListResult = {
  tools?: Array<{
    name: string;
    description?: string;
    inputSchema?: unknown;
  }>;
};

type ZendropAuthorizationMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  code_challenge_methods_supported?: string[];
};

type ZendropClientRegistration = {
  client_id: string;
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
  scope?: string;
};

type ZendropTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
};

type ZendropToolCallEnvelope<T> = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  isError?: boolean;
  structuredContent?: T;
};

type ZendropStoreRecord = {
  id: number;
  name: string;
  url: string;
  platform?: string;
  connection_status?: number;
};

type ZendropStoresPayload = {
  total?: number;
  stores?: ZendropStoreRecord[];
};

type ZendropCatalogProduct = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  price?: string;
  categories?: Array<{
    id: number;
    name: string;
  }>;
  images?: Array<{
    id: number;
    url: string;
  }>;
};

type ZendropCatalogProductsPayload = {
  total?: number;
  products?: ZendropCatalogProduct[];
};

type ZendropMyProductRecord = {
  import_list_id: number;
  product_id: number;
  product_name: string;
  product_image_url?: string;
  import_status?: string;
  store_product_id?: string;
};

type ZendropMyProductsPayload = {
  total?: number;
  items?: ZendropMyProductRecord[];
};

type ZendropUnlinkedStoreProductRecord = {
  store_product_id: string;
  store_product_name: string;
  store_product_image_url?: string | null;
  status?: string;
};

type ZendropUnlinkedStoreProductsPayload = {
  total?: number;
  items?: ZendropUnlinkedStoreProductRecord[];
};

let requestCounter = 0;
const zendropSessionCookies = new Map<string, string>();
const ZENDROP_PROTOCOL_VERSION = "2024-11-05" as const;
const zendropOauthStates = new Map<
  string,
  {
    codeVerifier: string;
    clientId: string;
    redirectUri: string;
  }
>();
let lastZendropOauthEvent: ZendropOauthEvent = {
  stage: "idle",
  at: new Date().toISOString(),
  message: "Zendrop OAuth has not started yet.",
};

const ZENDROP_REQUIRED_SCOPES = [
  "catalog:read",
  "my_products:read",
  "my_products:write",
  "orders:read",
  "orders:write",
  "stores:read",
  "stores:write",
] as const;

const ZENDROP_FALLBACK_AUTHORIZATION_METADATA: ZendropAuthorizationMetadata = {
  issuer: "https://app.zendrop.com",
  authorization_endpoint: config.zendropOauthAuthorizationUrl,
  token_endpoint: config.zendropOauthTokenUrl,
  registration_endpoint: config.zendropOauthRegistrationUrl,
  scopes_supported: [...ZENDROP_REQUIRED_SCOPES],
  code_challenge_methods_supported: ["S256"],
};
const ZENDROP_MEDIA_CACHE_VERSION = 1 as const;
const zendropMediaCachePath = path.join(process.cwd(), ".zendrop-media-cache.json");
let zendropMediaCache: ZendropProductMediaCache | null = null;
let zendropMediaCacheWritePromise = Promise.resolve();

function setZendropOauthEvent(event: Omit<ZendropOauthEvent, "at">) {
  lastZendropOauthEvent = {
    ...event,
    at: new Date().toISOString(),
  };
}

function nextRequestId(): string {
  requestCounter += 1;
  return `zendrop-${requestCounter}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseZendropId(value: string | undefined, fieldName: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer string`);
  }

  return parsed;
}

function normalizeMatchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function queryFromSearchInput(value: string | undefined): string | undefined {
  return value?.replace(/[-_]+/g, " ").trim() || undefined;
}

function normalizeZendropCacheHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizePositiveInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatZendropDescriptionHtml(description: string | undefined): string | undefined {
  const trimmedDescription = normalizeOptionalString(description);

  if (!trimmedDescription) {
    return undefined;
  }

  if (/<[a-z][\s\S]*>/i.test(trimmedDescription)) {
    return trimmedDescription;
  }

  const sections = trimmedDescription
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  if (!sections.length) {
    return `<p>${escapeHtml(trimmedDescription)}</p>`;
  }

  return sections
    .map((section) => {
      const lines = section
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return "";
      }

      const bulletLines = lines.filter((line) => /^[*-]\s+/.test(line) || /^•\s*/.test(line));
      if (bulletLines.length === lines.length) {
        return `<ul>${bulletLines
          .map((line) => `<li>${escapeHtml(line.replace(/^[*-]\s+|^•\s*/, ""))}</li>`)
          .join("")}</ul>`;
      }

      return `<p>${escapeHtml(lines.join(" "))}</p>`;
    })
    .join("");
}

function formatZendropSeoDescription(
  description: string | undefined,
  productName: string,
): string {
  const text = normalizeOptionalString(description) ? stripHtml(description ?? "") : productName;
  return truncateText(text || productName, 155);
}

function getZendropPrimaryCategoryName(
  categories: ZendropCatalogProduct["categories"],
): string | undefined {
  if (!categories?.length) {
    return undefined;
  }

  for (const category of categories) {
    const name = normalizeOptionalString(category.name);
    if (name) {
      return name;
    }
  }

  return undefined;
}

function buildZendropCatalogSyncFields(product: ZendropCatalogProduct) {
  return {
    descriptionHtml: formatZendropDescriptionHtml(product.description),
    seoDescription: formatZendropSeoDescription(product.description, product.name),
    productType: getZendropPrimaryCategoryName(product.categories),
  };
}

function extractStructuredContent<T>(value: unknown): T {
  if (!isRecord(value)) {
    throw new Error("Zendrop MCP tool result was not an object");
  }

  const envelope = value as ZendropToolCallEnvelope<T>;

  if (envelope.structuredContent !== undefined) {
    return envelope.structuredContent;
  }

  const textBlock = envelope.content?.find(
    (entry) => entry.type === "text" && typeof entry.text === "string",
  );
  if (textBlock?.text) {
    return JSON.parse(textBlock.text) as T;
  }

  throw new Error("Zendrop MCP tool result did not include structured content");
}

function findFirstNumericField(value: unknown, fieldNames: string[]): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = findFirstNumericField(entry, fieldNames);
      if (match !== null) {
        return match;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const fieldName of fieldNames) {
    const fieldValue = value[fieldName];
    if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
      return fieldValue;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const match = findFirstNumericField(nestedValue, fieldNames);
    if (match !== null) {
      return match;
    }
  }

  return null;
}

function findFirstStringField(value: unknown, fieldNames: string[]): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = findFirstStringField(entry, fieldNames);
      if (match !== null) {
        return match;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const fieldName of fieldNames) {
    const fieldValue = value[fieldName];
    if (typeof fieldValue === "string" && fieldValue.trim().length > 0) {
      return fieldValue;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const match = findFirstStringField(nestedValue, fieldNames);
    if (match !== null) {
      return match;
    }
  }

  return null;
}

function readZendropAccessToken(): string | undefined {
  return process.env.ZENDROP_ACCESS_TOKEN || config.zendropAccessToken;
}

function readZendropClientId(): string | undefined {
  return process.env.ZENDROP_CLIENT_ID || config.zendropClientId;
}

function readZendropRefreshToken(): string | undefined {
  return process.env.ZENDROP_REFRESH_TOKEN || config.zendropRefreshToken;
}

function ensureZendropAccessToken(): string {
  const accessToken = readZendropAccessToken();

  if (!accessToken) {
    throw new Error(
      "Zendrop MCP access token is not configured. Set ZENDROP_ACCESS_TOKEN after completing Zendrop OAuth.",
    );
  }

  return accessToken;
}

function buildZendropCallbackUrl(): string {
  return `http://127.0.0.1:${config.port}/zendrop/oauth/callback`;
}

function storeZendropCookie(name: string, value: string): boolean {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return false;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    const hadCookie = zendropSessionCookies.delete(normalizedName);
    return hadCookie;
  }

  if (zendropSessionCookies.get(normalizedName) === normalizedValue) {
    return false;
  }

  zendropSessionCookies.set(normalizedName, normalizedValue);
  return true;
}

function parseCookieAssignment(cookieValue: string): { name: string; value: string } | null {
  const assignment = cookieValue.split(";", 1)[0]?.trim();
  if (!assignment) {
    return null;
  }

  const separatorIndex = assignment.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  return {
    name: assignment.slice(0, separatorIndex).trim(),
    value: assignment.slice(separatorIndex + 1).trim(),
  };
}

function appendCookieAssignmentsToMap(cookieMap: Map<string, string>, cookieHeader: string) {
  for (const segment of cookieHeader.split(";")) {
    const assignment = parseCookieAssignment(segment);
    if (!assignment) {
      continue;
    }

    cookieMap.set(assignment.name, assignment.value);
  }
}

function rememberZendropResponseCookies(response: Response): boolean {
  let updated = false;

  for (const setCookieValue of response.headers.getSetCookie()) {
    const assignment = parseCookieAssignment(setCookieValue);
    if (!assignment) {
      continue;
    }

    if (/;\s*max-age=0(?:;|$)|;\s*expires=thu,\s*01\s*jan\s*1970/i.test(setCookieValue)) {
      updated = zendropSessionCookies.delete(assignment.name) || updated;
      continue;
    }

    updated = storeZendropCookie(assignment.name, assignment.value) || updated;
  }

  return updated;
}

function buildZendropCookieHeader(): string | undefined {
  const cookieMap = new Map<string, string>();
  const rawCookie = config.zendropCookie?.trim();

  if (rawCookie) {
    appendCookieAssignmentsToMap(cookieMap, rawCookie);
  }

  const cfClearance = config.zendropCfClearance?.trim();
  if (cfClearance && !cookieMap.has("cf_clearance")) {
    cookieMap.set("cf_clearance", cfClearance);
  }

  for (const [name, value] of zendropSessionCookies.entries()) {
    cookieMap.set(name, value);
  }

  return cookieMap.size
    ? Array.from(cookieMap.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ")
    : undefined;
}

function buildZendropHeaders(options?: {
  accessToken?: string;
  includeJsonContentType?: boolean;
  includeMcpProtocolVersion?: boolean;
  accept?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: options?.accept ?? "application/json, text/plain, */*",
    Origin: "https://app.zendrop.com",
    Referer: "https://app.zendrop.com/",
    "User-Agent": config.zendropUserAgent,
  };

  if (options?.includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.includeMcpProtocolVersion) {
    headers["MCP-Protocol-Version"] = ZENDROP_PROTOCOL_VERSION;
  }

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const cookieHeader = buildZendropCookieHeader();
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return headers;
}

function isZendropCloudflareChallenge(response: Response, text: string): boolean {
  return (
    response.headers.get("cf-mitigated") === "challenge" ||
    (response.status === 403 &&
      /just a moment|enable javascript and cookies to continue|challenge-platform|__cf_chl_/i.test(
        text,
      ))
  );
}

function createZendropCloudflareError(target: string, response: Response): Error {
  const rayId = response.headers.get("cf-ray");
  const sessionHint = buildZendropCookieHeader()
    ? "A Zendrop session cookie is already configured for backend requests, but the upstream challenge still rejected this environment."
    : "If Zendrop now requires a browser-cleared session for this machine, configure ZENDROP_COOKIE or ZENDROP_CF_CLEARANCE in .env and retry from the same account session.";

  return new Error(
    `Zendrop ${target} was blocked by a Cloudflare challenge before the request reached Zendrop. ${sessionHint}${
      rayId ? ` Cloudflare ray: ${rayId}.` : ""
    }`,
  );
}

function createPkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function createPkceChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function createOauthState(): string {
  return randomBytes(24).toString("hex");
}

async function fetchZendropAuthorizationMetadata(): Promise<ZendropAuthorizationMetadata> {
  const response = await fetch("https://app.zendrop.com/.well-known/oauth-authorization-server", {
    headers: buildZendropHeaders({
      accept: "application/json",
      includeMcpProtocolVersion: true,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    if (isZendropCloudflareChallenge(response, text)) {
      return ZENDROP_FALLBACK_AUTHORIZATION_METADATA;
    }

    throw new Error(`Zendrop auth metadata HTTP ${response.status}: ${text}`);
  }

  return JSON.parse(text) as ZendropAuthorizationMetadata;
}

async function persistEnvValues(values: Record<string, string>) {
  const envPath = path.join(process.cwd(), ".env");
  let content = "";

  try {
    content = await readFile(envPath, "utf8");
  } catch {
    content = "";
  }

  for (const [key, value] of Object.entries(values)) {
    const safeValue = value.replace(/\n/g, "");
    const pattern = new RegExp(`^${key}=.*$`, "m");
    const nextLine = `${key}=${safeValue}`;

    if (pattern.test(content)) {
      content = content.replace(pattern, nextLine);
    } else {
      content = `${content.replace(/\s*$/, "")}\n${nextLine}\n`;
    }

    process.env[key] = safeValue;
  }

  await writeFile(envPath, content.trimEnd() + "\n", "utf8");
}

async function registerZendropClient(): Promise<string> {
  const existingClientId = readZendropClientId();
  if (existingClientId) {
    return existingClientId;
  }

  const metadata = await fetchZendropAuthorizationMetadata();
  if (!metadata.registration_endpoint) {
    throw new Error("Zendrop OAuth metadata did not include a registration endpoint");
  }

  const redirectUri = buildZendropCallbackUrl();
  const response = await fetch(metadata.registration_endpoint, {
    method: "POST",
    headers: buildZendropHeaders({
      accept: "application/json",
      includeJsonContentType: true,
    }),
    body: JSON.stringify({
      client_name: "typsh-it-shopify-agent-server",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: ZENDROP_REQUIRED_SCOPES.join(" "),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (isZendropCloudflareChallenge(response, text)) {
      throw createZendropCloudflareError("client registration", response);
    }
    throw new Error(`Zendrop client registration HTTP ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as ZendropClientRegistration;
  if (!payload.client_id) {
    throw new Error("Zendrop client registration did not return client_id");
  }

  await persistEnvValues({
    ZENDROP_CLIENT_ID: payload.client_id,
  });

  return payload.client_id;
}

export async function beginZendropOauthFlow(): Promise<string> {
  try {
    const metadata = await fetchZendropAuthorizationMetadata();
    const clientId = await registerZendropClient();
    const redirectUri = buildZendropCallbackUrl();
    const codeVerifier = createPkceVerifier();
    const codeChallenge = createPkceChallenge(codeVerifier);
    const state = createOauthState();

    zendropOauthStates.set(state, {
      codeVerifier,
      clientId,
      redirectUri,
    });

    const authorizationUrl = new URL(metadata.authorization_endpoint);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("scope", ZENDROP_REQUIRED_SCOPES.join(" "));
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");

    setZendropOauthEvent({
      stage: "started",
      message: "Authorization URL issued. Finish Zendrop approval in the browser.",
    });

    return authorizationUrl.toString();
  } catch (error) {
    setZendropOauthEvent({
      stage: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function completeZendropOauthFlow(input: {
  code: string;
  state: string;
}): Promise<ZendropTokenResponse> {
  const pending = zendropOauthStates.get(input.state);
  if (!pending) {
    const error = new Error("Zendrop OAuth state is missing or expired");
    setZendropOauthEvent({
      stage: "error",
      message: error.message,
    });
    throw error;
  }

  zendropOauthStates.delete(input.state);
  setZendropOauthEvent({
    stage: "callback-received",
    message: "Zendrop redirected back with an authorization code.",
  });

  try {
    const metadata = await fetchZendropAuthorizationMetadata();
    const response = await fetch(metadata.token_endpoint, {
      method: "POST",
      headers: buildZendropHeaders({
        accept: "application/json",
      }),
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: pending.clientId,
        code: input.code,
        redirect_uri: pending.redirectUri,
        code_verifier: pending.codeVerifier,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (isZendropCloudflareChallenge(response, text)) {
        throw createZendropCloudflareError("token exchange", response);
      }
      throw new Error(`Zendrop token exchange HTTP ${response.status}: ${text}`);
    }

    const payload = (await response.json()) as ZendropTokenResponse;
    if (!payload.access_token) {
      throw new Error("Zendrop token exchange did not return access_token");
    }

    await persistEnvValues({
      ZENDROP_ACCESS_TOKEN: payload.access_token,
      ...(payload.refresh_token ? { ZENDROP_REFRESH_TOKEN: payload.refresh_token } : {}),
      ZENDROP_CLIENT_ID: pending.clientId,
    });

    setZendropOauthEvent({
      stage: "token-saved",
      message: payload.refresh_token
        ? "Zendrop access token and refresh token were stored successfully."
        : "Zendrop access token was stored successfully.",
    });

    return payload;
  } catch (error) {
    setZendropOauthEvent({
      stage: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function refreshZendropAccessToken(): Promise<string | null> {
  const refreshToken = readZendropRefreshToken();
  const clientId = readZendropClientId();

  if (!refreshToken || !clientId) {
    return null;
  }

  const metadata = await fetchZendropAuthorizationMetadata();
  const response = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: buildZendropHeaders({
      accept: "application/json",
    }),
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (isZendropCloudflareChallenge(response, text)) {
      throw createZendropCloudflareError("token refresh", response);
    }
    throw new Error(`Zendrop token refresh HTTP ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as ZendropTokenResponse;
  if (!payload.access_token) {
    throw new Error("Zendrop token refresh did not return access_token");
  }

  await persistEnvValues({
    ZENDROP_ACCESS_TOKEN: payload.access_token,
    ...(payload.refresh_token ? { ZENDROP_REFRESH_TOKEN: payload.refresh_token } : {}),
    ZENDROP_CLIENT_ID: clientId,
  });

  setZendropOauthEvent({
    stage: "token-saved",
    message: payload.refresh_token
      ? "Zendrop access token was refreshed and the new refresh token was stored."
      : "Zendrop access token was refreshed successfully.",
  });

  return payload.access_token;
}

async function sendZendropRequest(
  accessToken: string,
  method: string,
  params?: Record<string, unknown>,
): Promise<{ response: Response; cookiesUpdated: boolean }> {
  const response = await fetch(config.zendropMcpUrl, {
    method: "POST",
    headers: buildZendropHeaders({
      accessToken,
      includeJsonContentType: true,
      includeMcpProtocolVersion: true,
      accept: "application/json, text/plain, */*",
    }),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: nextRequestId(),
      method,
      params,
    }),
  });

  return {
    response,
    cookiesUpdated: rememberZendropResponseCookies(response),
  };
}

async function zendropRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  let accessToken = ensureZendropAccessToken();
  let { response, cookiesUpdated } = await sendZendropRequest(accessToken, method, params);

  if (response.status === 401) {
    const refreshedAccessToken = await refreshZendropAccessToken();

    if (refreshedAccessToken) {
      accessToken = refreshedAccessToken;
      ({ response, cookiesUpdated } = await sendZendropRequest(accessToken, method, params));
    }
  }

  let challengeRetryCount = 0;

  while (!response.ok) {
    const text = await response.text();
    if (isZendropCloudflareChallenge(response, text)) {
      if (challengeRetryCount < 2 && (cookiesUpdated || Boolean(buildZendropCookieHeader()))) {
        challengeRetryCount += 1;
        ({ response, cookiesUpdated } = await sendZendropRequest(accessToken, method, params));
        continue;
      }

      throw createZendropCloudflareError("MCP transport", response);
    }
    throw new Error(`Zendrop MCP HTTP ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure;
  if ("error" in payload) {
    throw new Error(`Zendrop MCP ${payload.error.code}: ${payload.error.message}`);
  }

  return payload.result;
}

export async function listZendropTools(): Promise<ZendropToolRecord[]> {
  const result = await zendropRequest<ToolsListResult>("tools/list", {});

  return (result.tools ?? []).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

export async function callZendropTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  return zendropRequest<unknown>("tools/call", {
    name: toolName,
    arguments: args,
  });
}

function findToolName(tools: ZendropToolRecord[], patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = tools.find((tool) => pattern.test(tool.name));
    if (match) {
      return match.name;
    }
  }

  return null;
}

async function getRequiredToolName(patterns: RegExp[], purpose: string): Promise<string> {
  const tools = await listZendropTools();
  const toolName = findToolName(tools, patterns);

  if (!toolName) {
    throw new Error(`No Zendrop tool was discovered for ${purpose}`);
  }

  return toolName;
}

async function getPrimaryZendropStore() {
  const toolName = await getRequiredToolName([/^get_stores$/i], "store discovery");
  const payload = extractStructuredContent<ZendropStoresPayload>(await callZendropTool(toolName, {}));
  const store = payload.stores?.find((entry) => entry.connection_status === 1) ?? payload.stores?.[0];

  if (!store) {
    throw new Error("Zendrop did not return any connected stores");
  }

  return {
    toolName,
    store,
    total: payload.total ?? payload.stores?.length ?? 0,
  };
}

async function searchZendropCatalog(query: string, limit: number) {
  const toolName = await getRequiredToolName([/^get_catalog_products$/i], "catalog search");
  const payload = extractStructuredContent<ZendropCatalogProductsPayload>(
    await callZendropTool(toolName, {
      keyword: query,
      limit,
      page: 1,
    }),
  );

  return {
    toolName,
    total: payload.total ?? payload.products?.length ?? 0,
    products: payload.products ?? [],
  };
}

function selectBestCatalogProduct(products: ZendropCatalogProduct[], query: string) {
  const normalizedQuery = normalizeMatchText(query);

  return (
    products.find((product) => normalizeMatchText(product.name) === normalizedQuery) ??
    products.find((product) => normalizeMatchText(product.name).includes(normalizedQuery)) ??
    products[0]
  );
}

async function listZendropStoreProducts(storeId: number) {
  const toolName = await getRequiredToolName([/^get_my_products$/i], "store product lookup");
  const payload = extractStructuredContent<ZendropMyProductsPayload>(
    await callZendropTool(toolName, {
      store_id: storeId,
      page: 1,
      limit: 60,
    }),
  );

  return {
    toolName,
    total: payload.total ?? payload.items?.length ?? 0,
    items: payload.items ?? [],
  };
}

async function listZendropUnlinkedStoreProducts(storeId: number) {
  const toolName = await getRequiredToolName([/^get_my_products$/i], "unlinked store product lookup");
  const payload = extractStructuredContent<ZendropUnlinkedStoreProductsPayload>(
    await callZendropTool(toolName, {
      store_id: storeId,
      status: "unlinked",
      page: 1,
      limit: 60,
    }),
  );

  return {
    toolName,
    total: payload.total ?? payload.items?.length ?? 0,
    items: payload.items ?? [],
  };
}

function selectMatchingUnlinkedStoreProduct(
  items: ZendropUnlinkedStoreProductRecord[],
  args: {
    storeProductId?: string;
    handle?: string;
    title?: string;
  },
) {
  if (args.storeProductId) {
    return items.find((item) => item.store_product_id === args.storeProductId);
  }

  const query = queryFromSearchInput(args.title ?? args.handle);
  if (!query) {
    return undefined;
  }

  const normalizedQuery = normalizeMatchText(query);

  return (
    items.find((item) => normalizeMatchText(item.store_product_name) === normalizedQuery) ??
    items.find((item) => normalizeMatchText(item.store_product_name).includes(normalizedQuery))
  );
}

function selectMatchingStoreProduct(
  items: ZendropMyProductRecord[],
  args: {
    importListItemId?: string;
    productId?: string;
    handle?: string;
  },
) {
  const importListItemId = parseZendropId(args.importListItemId, "importListItemId");
  if (importListItemId) {
    return items.find((item) => item.import_list_id === importListItemId);
  }

  const productId = parseZendropId(args.productId, "productId");
  if (productId) {
    return items.find((item) => item.product_id === productId);
  }

  const query = queryFromSearchInput(args.handle);
  if (!query) {
    return undefined;
  }

  const normalizedQuery = normalizeMatchText(query);
  return items.find((item) => normalizeMatchText(item.product_name).includes(normalizedQuery));
}

function isZendropCatalogProductRecord(value: unknown): value is ZendropCatalogProduct {
  return isRecord(value) && typeof value.id === "number" && typeof value.name === "string";
}

function normalizeZendropCatalogProduct(value: unknown): ZendropCatalogProduct {
  const payload = extractStructuredContent<
    ZendropCatalogProduct | { data?: ZendropCatalogProduct; product?: ZendropCatalogProduct }
  >(value);

  if (isZendropCatalogProductRecord(payload)) {
    return payload;
  }

  if (isRecord(payload) && isZendropCatalogProductRecord(payload["product"])) {
    return payload["product"];
  }

  if (isRecord(payload) && isZendropCatalogProductRecord(payload["data"])) {
    return payload["data"];
  }

  throw new Error("Zendrop catalog lookup did not return a product record");
}

async function getZendropCatalogProduct(productId: number) {
  const toolName = await getRequiredToolName([/^get_catalog_product$/i], "catalog product lookup");
  const result = await callZendropTool(toolName, {
    product_id: productId,
  });

  return {
    toolName,
    product: normalizeZendropCatalogProduct(result),
  };
}

function collectZendropMediaUrls(
  storeProduct: ZendropMyProductRecord,
  catalogProduct: ZendropCatalogProduct,
  maxImages: number,
): string[] {
  return collectUniqueMediaUrls(
    [
      storeProduct.product_image_url,
      catalogProduct.image,
      ...(catalogProduct.images ?? []).map((image) => image.url),
    ],
    maxImages,
  );
}

function collectUniqueMediaUrls(
  candidates: Array<string | null | undefined>,
  maxImages: number,
): string[] {
  const mediaUrls: string[] = [];
  const uniqueMediaUrls = new Set<string>();

  for (const candidate of candidates) {
    const mediaUrl = candidate?.trim();
    if (!mediaUrl || uniqueMediaUrls.has(mediaUrl)) {
      continue;
    }

    uniqueMediaUrls.add(mediaUrl);
    mediaUrls.push(mediaUrl);

    if (mediaUrls.length >= maxImages) {
      break;
    }
  }

  return mediaUrls;
}

function createEmptyZendropMediaCache(): ZendropProductMediaCache {
  return {
    version: ZENDROP_MEDIA_CACHE_VERSION,
    updatedAt: new Date().toISOString(),
    entries: {},
  };
}

function normalizeZendropMediaCacheEntry(
  cacheKey: string,
  value: unknown,
): ZendropProductMediaCacheEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const handle = normalizeZendropCacheHandle(normalizeOptionalString(value.handle) ?? cacheKey);
  const title = normalizeOptionalString(value.title);
  const storeProductId = normalizeOptionalString(value.storeProductId);
  const productId = normalizePositiveInteger(value.productId);
  const importListItemId = normalizePositiveInteger(value.importListItemId);
  const productName = normalizeOptionalString(value.productName);
  const mediaAlt = normalizeOptionalString(value.mediaAlt);
  const descriptionHtml = normalizeOptionalString(value.descriptionHtml);
  const seoDescription = normalizeOptionalString(value.seoDescription);
  const productType = normalizeOptionalString(value.productType);
  const updatedAt = normalizeOptionalString(value.updatedAt) ?? new Date().toISOString();
  const mediaUrls = collectUniqueMediaUrls(
    Array.isArray(value.mediaUrls)
      ? value.mediaUrls.filter((entry): entry is string => typeof entry === "string")
      : [],
    10,
  );

  return {
    handle,
    ...(title ? { title } : {}),
    ...(storeProductId ? { storeProductId } : {}),
    ...(productId ? { productId } : {}),
    ...(importListItemId ? { importListItemId } : {}),
    ...(productName ? { productName } : {}),
    ...(mediaAlt ? { mediaAlt } : {}),
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(seoDescription ? { seoDescription } : {}),
    ...(productType ? { productType } : {}),
    mediaUrls,
    updatedAt,
  };
}

async function loadZendropMediaCache(): Promise<ZendropProductMediaCache> {
  if (zendropMediaCache) {
    return zendropMediaCache;
  }

  let rawCache = "";

  try {
    rawCache = await readFile(zendropMediaCachePath, "utf8");
  } catch {
    zendropMediaCache = createEmptyZendropMediaCache();
    return zendropMediaCache;
  }

  try {
    const parsed = JSON.parse(rawCache) as unknown;
    const cache = createEmptyZendropMediaCache();

    if (isRecord(parsed)) {
      cache.updatedAt = normalizeOptionalString(parsed.updatedAt) ?? cache.updatedAt;

      if (isRecord(parsed.entries)) {
        for (const [cacheKey, entryValue] of Object.entries(parsed.entries)) {
          const entry = normalizeZendropMediaCacheEntry(cacheKey, entryValue);
          if (entry) {
            cache.entries[entry.handle] = entry;
          }
        }
      }
    }

    zendropMediaCache = cache;
    return cache;
  } catch {
    zendropMediaCache = createEmptyZendropMediaCache();
    return zendropMediaCache;
  }
}

async function persistZendropMediaCache(cache: ZendropProductMediaCache): Promise<void> {
  const serializedCache = JSON.stringify(cache, null, 2) + "\n";

  zendropMediaCacheWritePromise = zendropMediaCacheWritePromise
    .catch(() => undefined)
    .then(() => writeFile(zendropMediaCachePath, serializedCache, "utf8"));

  await zendropMediaCacheWritePromise;
}

async function getZendropMediaCacheEntry(
  handle: string,
): Promise<ZendropProductMediaCacheEntry | null> {
  const cache = await loadZendropMediaCache();
  return cache.entries[normalizeZendropCacheHandle(handle)] ?? null;
}

async function upsertZendropMediaCacheEntry(input: {
  handle: string;
  title?: string;
  storeProductId?: string;
  productId?: number;
  importListItemId?: number;
  productName?: string;
  mediaAlt?: string;
  descriptionHtml?: string;
  seoDescription?: string;
  productType?: string;
  mediaUrls?: string[];
}): Promise<ZendropProductMediaCacheEntry> {
  const cache = await loadZendropMediaCache();
  const handle = normalizeZendropCacheHandle(input.handle);
  const existingEntry = cache.entries[handle];
  const updatedAt = new Date().toISOString();
  const title = normalizeOptionalString(input.title) ?? existingEntry?.title;
  const storeProductId = normalizeOptionalString(input.storeProductId) ?? existingEntry?.storeProductId;
  const productId = input.productId ?? existingEntry?.productId;
  const importListItemId = input.importListItemId ?? existingEntry?.importListItemId;
  const productName = normalizeOptionalString(input.productName) ?? existingEntry?.productName;
  const mediaAlt = normalizeOptionalString(input.mediaAlt) ?? existingEntry?.mediaAlt;
  const descriptionHtml =
    normalizeOptionalString(input.descriptionHtml) ?? existingEntry?.descriptionHtml;
  const seoDescription =
    normalizeOptionalString(input.seoDescription) ?? existingEntry?.seoDescription;
  const productType = normalizeOptionalString(input.productType) ?? existingEntry?.productType;
  const mediaUrls = collectUniqueMediaUrls(
    [...(input.mediaUrls ?? []), ...(existingEntry?.mediaUrls ?? [])],
    10,
  );

  const nextEntry: ZendropProductMediaCacheEntry = {
    handle,
    ...(title ? { title } : {}),
    ...(storeProductId ? { storeProductId } : {}),
    ...(productId ? { productId } : {}),
    ...(importListItemId ? { importListItemId } : {}),
    ...(productName ? { productName } : {}),
    ...(mediaAlt ? { mediaAlt } : {}),
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(seoDescription ? { seoDescription } : {}),
    ...(productType ? { productType } : {}),
    mediaUrls,
    updatedAt,
  };

  cache.entries[handle] = nextEntry;
  cache.updatedAt = updatedAt;
  await persistZendropMediaCache(cache);
  return nextEntry;
}

type ShopifyProductMediaLookup = Awaited<ReturnType<typeof getProductMediaUrlsByHandle>>;

async function syncResolvedProductAssetsToShopify(args: {
  handle: string;
  publish?: boolean;
  mediaUrls: string[];
  mediaAlt?: string;
  descriptionHtml?: string;
  seoDescription?: string;
  productType?: string;
  currentProductMedia?: ShopifyProductMediaLookup;
}) {
  const currentProductMedia =
    args.currentProductMedia ??
    (await getProductMediaUrlsByHandle(args.handle, Math.max(args.mediaUrls.length, 10)));
  const currentMediaUrlSet = new Set(currentProductMedia.mediaUrls);
  const shouldSyncMedia = args.mediaUrls.some((mediaUrl) => !currentMediaUrlSet.has(mediaUrl));

  return enrichPublishedProductByHandle({
    handle: args.handle,
    descriptionHtml: args.descriptionHtml,
    seoDescription: args.seoDescription,
    productType: args.productType,
    mediaUrls: shouldSyncMedia ? args.mediaUrls : undefined,
    mediaAlt: args.mediaAlt,
    publish: args.publish === true,
  });
}

async function tryCandidates(
  toolName: string,
  candidates: Array<Record<string, unknown>>,
): Promise<{ toolName: string; args: Record<string, unknown>; result: unknown }> {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const result = await callZendropTool(toolName, candidate);
      return {
        toolName,
        args: candidate,
        result,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function getZendropConnectionStatus(): Promise<ZendropConnectionStatus> {
  const status: ZendropConnectionStatus = {
    configured: Boolean(config.zendropMcpUrl),
    url: config.zendropMcpUrl,
    hasAccessToken: Boolean(readZendropAccessToken()),
    hasClientId: Boolean(readZendropClientId()),
    tools: [],
    initializeOk: false,
    listToolsOk: false,
    challengeDetected: false,
    oauth: lastZendropOauthEvent,
  };

  if (!readZendropAccessToken()) {
    status.error = "Missing ZENDROP_ACCESS_TOKEN";
    return status;
  }

  try {
    await zendropRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "typsh-it-shopify-agent-server",
        version: "0.1.0",
      },
    });
    status.initializeOk = true;
  } catch (error) {
    status.error = error instanceof Error ? error.message : String(error);
    status.challengeDetected = status.error.includes("Cloudflare challenge");
    return status;
  }

  try {
    status.tools = await listZendropTools();
    status.listToolsOk = true;
    return status;
  } catch (error) {
    status.error = error instanceof Error ? error.message : String(error);
    status.challengeDetected = status.error.includes("Cloudflare challenge");
    return status;
  }
}

export async function zendropSearchProducts(input: ZendropSearchRequest) {
  const query = queryFromSearchInput(input.query);
  if (!query) {
    throw new Error("Zendrop search requires a non-empty query");
  }

  const result = await searchZendropCatalog(query, input.limit ?? 10);
  return {
    toolName: result.toolName,
    args: {
      keyword: query,
      limit: input.limit ?? 10,
      page: 1,
    },
    total: result.total,
    products: result.products,
  };
}

export async function zendropAddToImportList(args: {
  productId?: string;
  handle?: string;
  title?: string;
}) {
  const store = await getPrimaryZendropStore();
  const toolName = await getRequiredToolName([/^add_my_product$/i], "import-list add");

  let productId = parseZendropId(args.productId, "productId");
  let matchedProduct: ZendropCatalogProduct | undefined;

  if (!productId) {
    const query = queryFromSearchInput(args.title ?? args.handle);
    if (!query) {
      throw new Error("Provide productId, handle, or title to add a Zendrop product to the import list");
    }

    const searchResult = await searchZendropCatalog(query, 10);
    matchedProduct = selectBestCatalogProduct(searchResult.products, query);
    if (!matchedProduct) {
      throw new Error(`No Zendrop catalog product matched \"${query}\"`);
    }

    productId = matchedProduct.id;
  }

  const result = extractStructuredContent<Record<string, unknown>>(
    await callZendropTool(toolName, {
      product_id: productId,
      store_id: store.store.id,
    }),
  );

  return {
    toolName,
    store: store.store,
    productId,
    matchedProduct,
    importListItemId: findFirstNumericField(result, ["import_list_id", "importListId", "id"]),
    result,
  };
}

export async function zendropPublishToShopify(args: {
  productId?: string;
  importListItemId?: string;
  handle?: string;
}) {
  const store = await getPrimaryZendropStore();
  const toolName = await getRequiredToolName([/^import_my_product$/i], "Shopify publish");

  let matchedItem = selectMatchingStoreProduct((await listZendropStoreProducts(store.store.id)).items, args);
  let importListItemId = parseZendropId(args.importListItemId, "importListItemId");

  if (!importListItemId) {
    importListItemId = matchedItem?.import_list_id;
  }

  let addedToImportList: Awaited<ReturnType<typeof zendropAddToImportList>> | undefined;
  if (!importListItemId) {
    addedToImportList = await zendropAddToImportList({
      productId: args.productId,
      handle: args.handle,
      title: args.handle,
    });
    importListItemId = addedToImportList.importListItemId ?? undefined;
  }

  if (!importListItemId) {
    throw new Error("Could not resolve a Zendrop import_list_id for Shopify publish");
  }

  const result = extractStructuredContent<Record<string, unknown>>(
    await callZendropTool(toolName, {
      import_list_id: importListItemId,
    }),
  );

  if (!matchedItem) {
    matchedItem = selectMatchingStoreProduct((await listZendropStoreProducts(store.store.id)).items, {
      importListItemId: String(importListItemId),
    });
  }

  return {
    toolName,
    store: store.store,
    importListItemId,
    matchedItem,
    addedToImportList,
    operationId: findFirstNumericField(result, ["operation_id", "operationId", "id"]),
    result,
  };
}

export async function zendropLinkExistingProduct(args: {
  storeProductId?: string;
  productId?: string;
  handle?: string;
  title?: string;
  confirmationToken?: string;
  storeVariantId?: string;
  catalogVariantId?: string;
}) {
  const store = await getPrimaryZendropStore();
  const toolName = await getRequiredToolName([/^link_my_product$/i], "existing Shopify product linking");

  const unlinkedProducts = await listZendropUnlinkedStoreProducts(store.store.id);
  const matchedStoreProduct = selectMatchingUnlinkedStoreProduct(unlinkedProducts.items, {
    storeProductId: args.storeProductId,
    handle: args.handle,
    title: args.title,
  });

  const storeProductId = args.storeProductId ?? matchedStoreProduct?.store_product_id;
  if (!storeProductId) {
    throw new Error("Could not resolve an unlinked Shopify store_product_id for Zendrop linking");
  }

  let productId = parseZendropId(args.productId, "productId");
  let matchedCatalogProduct: ZendropCatalogProduct | undefined;

  if (!productId) {
    const query = queryFromSearchInput(args.title ?? args.handle ?? matchedStoreProduct?.store_product_name);
    if (!query) {
      throw new Error("Provide productId, handle, or title to resolve a Zendrop catalog match");
    }

    const searchResult = await searchZendropCatalog(query, 10);
    matchedCatalogProduct = selectBestCatalogProduct(searchResult.products, query);
    if (!matchedCatalogProduct) {
      throw new Error(`No Zendrop catalog product matched \"${query}\"`);
    }

    productId = matchedCatalogProduct.id;
  }

  const toolArgs: Record<string, unknown> = {
    store_id: store.store.id,
    store_product_id: storeProductId,
    product_id: productId,
  };

  if (args.confirmationToken) {
    toolArgs.confirmation_token = args.confirmationToken;
  }

  const storeVariantId = args.storeVariantId;
  const catalogVariantId = parseZendropId(args.catalogVariantId, "catalogVariantId");
  if (storeVariantId && catalogVariantId) {
    toolArgs.variant_mappings = [
      {
        store_variant_id: storeVariantId,
        catalog_variant_id: catalogVariantId,
      },
    ];
  }

  const initialResult = extractStructuredContent<Record<string, unknown>>(
    await callZendropTool(toolName, toolArgs),
  );
  const resolvedConfirmationToken =
    args.confirmationToken ??
    findFirstStringField(initialResult, ["confirmation_token", "confirmationToken"]);

  let result = initialResult;
  let previewResult: Record<string, unknown> | null = null;

  if (!args.confirmationToken && resolvedConfirmationToken) {
    previewResult = initialResult;
    result = extractStructuredContent<Record<string, unknown>>(
      await callZendropTool(toolName, {
        ...toolArgs,
        confirmation_token: resolvedConfirmationToken,
      }),
    );
  }

  if (args.handle) {
    await upsertZendropMediaCacheEntry({
      handle: args.handle,
      title: args.title ?? matchedStoreProduct?.store_product_name,
      storeProductId,
      productId,
      productName: matchedCatalogProduct?.name ?? matchedStoreProduct?.store_product_name,
      mediaAlt: matchedCatalogProduct?.name ?? matchedStoreProduct?.store_product_name,
      mediaUrls: collectUniqueMediaUrls(
        [
          matchedStoreProduct?.store_product_image_url ?? undefined,
          matchedCatalogProduct?.image,
          ...(matchedCatalogProduct?.images ?? []).map((image) => image.url),
        ],
        10,
      ),
    });
  }

  return {
    toolName,
    store: store.store,
    storeProduct: matchedStoreProduct,
    productId,
    matchedCatalogProduct,
    confirmationToken: resolvedConfirmationToken ?? null,
    previewResult,
    confirmed: true,
    result,
  };
}

export async function zendropSyncLinkedProductAssets(args: {
  handle: string;
  title?: string;
  importListItemId?: string;
  productId?: string;
  publish?: boolean;
  maxImages?: number;
}) {
  const maxImages = Math.max(1, Math.min(args.maxImages ?? 6, 10));
  const cachedEntry = await getZendropMediaCacheEntry(args.handle);
  const cachedMediaUrls = collectUniqueMediaUrls(cachedEntry?.mediaUrls ?? [], maxImages);
  const cachedDescriptionHtml = cachedEntry?.descriptionHtml;
  const cachedSeoDescription = cachedEntry?.seoDescription;
  const cachedProductType = cachedEntry?.productType;
  const hasCachedCatalogContent = Boolean(cachedDescriptionHtml);

  if (cachedMediaUrls.length && hasCachedCatalogContent) {
    const enrichment = await syncResolvedProductAssetsToShopify({
      handle: args.handle,
      publish: args.publish,
      mediaUrls: cachedMediaUrls,
      mediaAlt: cachedEntry?.mediaAlt ?? cachedEntry?.productName ?? cachedEntry?.title ?? args.title,
      descriptionHtml: cachedDescriptionHtml,
      seoDescription: cachedSeoDescription,
      productType: cachedProductType,
    });

    return {
      handle: args.handle,
      store: null,
      importListItemId: cachedEntry?.importListItemId ?? null,
      productId: cachedEntry?.productId ?? null,
      productName: cachedEntry?.productName ?? cachedEntry?.title ?? args.title ?? args.handle,
      importStatus: "cached",
      catalogToolName: "local_cache",
      mediaUrls: cachedMediaUrls,
      mediaCount: cachedMediaUrls.length,
      descriptionSource: "local_cache",
      hasSupplierDescription: true,
      cacheHit: true,
      cacheBackfilledFromShopify: false,
      enrichment,
    };
  }

  const currentProductMedia = await getProductMediaUrlsByHandle(args.handle, maxImages);

  if (currentProductMedia.mediaUrls.length && hasCachedCatalogContent) {
    const backfilledEntry = await upsertZendropMediaCacheEntry({
      handle: args.handle,
      title: args.title ?? currentProductMedia.product?.title,
      mediaAlt: currentProductMedia.mediaAlt,
      descriptionHtml: cachedDescriptionHtml,
      seoDescription: cachedSeoDescription,
      productType: cachedProductType,
      mediaUrls: currentProductMedia.mediaUrls,
    });
    const enrichment = await syncResolvedProductAssetsToShopify({
      handle: args.handle,
      publish: args.publish,
      mediaUrls: currentProductMedia.mediaUrls,
      mediaAlt: currentProductMedia.mediaAlt,
      descriptionHtml: backfilledEntry.descriptionHtml,
      seoDescription: backfilledEntry.seoDescription,
      productType: backfilledEntry.productType,
      currentProductMedia,
    });

    return {
      handle: args.handle,
      store: null,
      importListItemId: backfilledEntry.importListItemId ?? null,
      productId: backfilledEntry.productId ?? null,
      productName:
        backfilledEntry.productName ??
        backfilledEntry.title ??
        currentProductMedia.product?.title ??
        args.title ??
        args.handle,
      importStatus: "shopify_media_present",
      catalogToolName: "shopify_product_media",
      mediaUrls: currentProductMedia.mediaUrls,
      mediaCount: currentProductMedia.mediaUrls.length,
      descriptionSource: "local_cache",
      hasSupplierDescription: true,
      cacheHit: true,
      cacheBackfilledFromShopify: true,
      enrichment,
    };
  }

  const store = await getPrimaryZendropStore();
  const storeProducts = await listZendropStoreProducts(store.store.id);
  let matchedItem = selectMatchingStoreProduct(storeProducts.items, {
    importListItemId:
      args.importListItemId ??
      (cachedEntry?.importListItemId ? String(cachedEntry.importListItemId) : undefined),
    productId:
      args.productId ?? (cachedEntry?.productId ? String(cachedEntry.productId) : undefined),
    handle: args.handle,
  });

  if (!matchedItem) {
    const query = queryFromSearchInput(args.title ?? args.handle);
    if (query) {
      const searchResult = await searchZendropCatalog(query, 10);
      const matchedCatalogProduct = selectBestCatalogProduct(searchResult.products, query);

      if (matchedCatalogProduct) {
        matchedItem = selectMatchingStoreProduct(storeProducts.items, {
          productId: String(matchedCatalogProduct.id),
        });
      }
    }
  }

  if (!matchedItem) {
    throw new Error(`Could not resolve a Zendrop-linked store product for handle: ${args.handle}`);
  }

  const catalogLookup = await getZendropCatalogProduct(matchedItem.product_id);
  const mediaUrls = collectUniqueMediaUrls(
    [
      ...cachedMediaUrls,
      ...currentProductMedia.mediaUrls,
      ...collectZendropMediaUrls(matchedItem, catalogLookup.product, maxImages),
    ],
    maxImages,
  );
  const catalogSyncFields = buildZendropCatalogSyncFields(catalogLookup.product);

  if (!mediaUrls.length && !catalogSyncFields.descriptionHtml) {
    throw new Error(`Zendrop did not return any media URLs for handle: ${args.handle}`);
  }

  const cacheEntry = await upsertZendropMediaCacheEntry({
    handle: args.handle,
    title: args.title,
    storeProductId: matchedItem.store_product_id,
    productId: matchedItem.product_id,
    importListItemId: matchedItem.import_list_id,
    productName: catalogLookup.product.name || matchedItem.product_name,
    mediaAlt: catalogLookup.product.name || matchedItem.product_name,
    descriptionHtml: catalogSyncFields.descriptionHtml,
    seoDescription: catalogSyncFields.seoDescription,
    productType: catalogSyncFields.productType,
    mediaUrls,
  });
  const enrichment = await syncResolvedProductAssetsToShopify({
    handle: args.handle,
    publish: args.publish,
    mediaUrls,
    mediaAlt: cacheEntry.mediaAlt ?? catalogLookup.product.name ?? matchedItem.product_name,
    descriptionHtml: cacheEntry.descriptionHtml,
    seoDescription: cacheEntry.seoDescription,
    productType: cacheEntry.productType,
    currentProductMedia,
  });

  return {
    handle: args.handle,
    store: store.store,
    importListItemId: matchedItem.import_list_id,
    productId: matchedItem.product_id,
    productName: matchedItem.product_name,
    importStatus: matchedItem.import_status ?? null,
    catalogToolName: catalogLookup.toolName,
    mediaUrls,
    mediaCount: mediaUrls.length,
    descriptionSource: catalogLookup.toolName,
    hasSupplierDescription: Boolean(cacheEntry.descriptionHtml),
    cacheHit: false,
    cacheBackfilledFromShopify: false,
    enrichment,
  };
}