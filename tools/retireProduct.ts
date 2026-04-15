import type OpenAI from "openai";

import { retireProductByHandle } from "../shopify.js";
import { readRecord, readString } from "./validators.js";

export const RETIRE_PRODUCT_TOOL_NAME = "retire_product";

export const retireProductTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: RETIRE_PRODUCT_TOOL_NAME,
  description:
    "Retire a Shopify product from the storefront by setting it to draft using its handle.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      handle: { type: "string" },
    },
    required: ["handle"],
  },
};

export async function handleRetireProduct(input: unknown) {
  const record = readRecord(input, "retire_product");
  return retireProductByHandle(readString(record.handle, "handle"));
}