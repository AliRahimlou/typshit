import type OpenAI from "openai";

import { zendropAddToImportList } from "../zendrop.js";
import { readOptionalString, readRecord } from "./validators.js";

export const ZENDROP_ADD_TO_IMPORT_LIST_TOOL_NAME = "zendrop_add_to_import_list";

export const zendropAddToImportListTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: ZENDROP_ADD_TO_IMPORT_LIST_TOOL_NAME,
  description: "Add a Zendrop product to the import list before publishing it to Shopify.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      productId: { type: "string" },
      handle: { type: "string" },
      title: { type: "string" },
    },
  },
};

export async function handleZendropAddToImportList(input: unknown) {
  const record = readRecord(input, "zendrop_add_to_import_list");
  return zendropAddToImportList({
    productId: readOptionalString(record.productId, "productId"),
    handle: readOptionalString(record.handle, "handle"),
    title: readOptionalString(record.title, "title"),
  });
}