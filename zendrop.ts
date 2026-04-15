import { config } from "./config.js";
import type { ZendropConnectionStatus, ZendropSearchRequest, ZendropToolRecord } from "./types.js";

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

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `zendrop-${requestCounter}`;
}

function ensureZendropAccessToken(): string {
  if (!config.zendropAccessToken) {
    throw new Error(
      "Zendrop MCP access token is not configured. Set ZENDROP_ACCESS_TOKEN after completing Zendrop OAuth.",
    );
  }

  return config.zendropAccessToken;
}

async function zendropRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  const accessToken = ensureZendropAccessToken();
  const response = await fetch(config.zendropMcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: nextRequestId(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
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
    hasAccessToken: Boolean(config.zendropAccessToken),
    tools: [],
    initializeOk: false,
    listToolsOk: false,
  };

  if (!config.zendropAccessToken) {
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
    return status;
  }

  try {
    status.tools = await listZendropTools();
    status.listToolsOk = true;
    return status;
  } catch (error) {
    status.error = error instanceof Error ? error.message : String(error);
    return status;
  }
}

export async function zendropSearchProducts(input: ZendropSearchRequest) {
  const tools = await listZendropTools();
  const toolName = findToolName(tools, [
    /^zendrop_search_products$/i,
    /search.*products?/i,
    /catalog.*search/i,
    /products?.*search/i,
  ]);

  if (!toolName) {
    throw new Error("No Zendrop search tool was discovered via MCP tools/list");
  }

  return tryCandidates(toolName, [
    { query: input.query, market: input.market ?? "US", limit: input.limit ?? 10 },
    { search: input.query, market: input.market ?? "US", limit: input.limit ?? 10 },
    { keyword: input.query, country: input.market ?? "US", limit: input.limit ?? 10 },
    { query: input.query },
  ]);
}

export async function zendropAddToImportList(args: {
  productId?: string;
  handle?: string;
  title?: string;
}) {
  const tools = await listZendropTools();
  const toolName = findToolName(tools, [
    /^zendrop_add_to_import_list$/i,
    /add.*import.*list/i,
    /import.*list.*add/i,
  ]);

  if (!toolName) {
    throw new Error("No Zendrop import-list tool was discovered via MCP tools/list");
  }

  return tryCandidates(toolName, [
    { productId: args.productId },
    { handle: args.handle },
    { title: args.title },
  ].filter((candidate) => Object.values(candidate).some(Boolean)));
}

export async function zendropPublishToShopify(args: {
  productId?: string;
  importListItemId?: string;
  handle?: string;
}) {
  const tools = await listZendropTools();
  const toolName = findToolName(tools, [
    /^zendrop_publish_to_shopify$/i,
    /publish.*shopify/i,
    /shopify.*publish/i,
  ]);

  if (!toolName) {
    throw new Error("No Zendrop publish-to-Shopify tool was discovered via MCP tools/list");
  }

  return tryCandidates(toolName, [
    { productId: args.productId },
    { importListItemId: args.importListItemId },
    { handle: args.handle },
  ].filter((candidate) => Object.values(candidate).some(Boolean)));
}