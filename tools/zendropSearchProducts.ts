import type OpenAI from "openai";

import { zendropSearchProducts } from "../zendrop.js";
import { readRecord, readString } from "./validators.js";

export const ZENDROP_SEARCH_PRODUCTS_TOOL_NAME = "zendrop_search_products";

export const zendropSearchProductsTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: ZENDROP_SEARCH_PRODUCTS_TOOL_NAME,
  description:
    "Search Zendrop catalog first for products that fit the typsh.it brand and launch constraints.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string" },
      market: { type: "string" },
      limit: { type: "number" },
    },
    required: ["query"],
  },
};

export async function handleZendropSearchProducts(input: unknown) {
  const record = readRecord(input, "zendrop_search_products");
  return zendropSearchProducts({
    query: readString(record.query, "query"),
    market: typeof record.market === "string" ? record.market : "US",
    limit: typeof record.limit === "number" ? record.limit : 10,
  });
}