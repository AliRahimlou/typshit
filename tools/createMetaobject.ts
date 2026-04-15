import type OpenAI from "openai";

import { upsertMetaobject } from "../shopify.js";
import { readMetaobject } from "./validators.js";

export const CREATE_METAOBJECT_TOOL_NAME = "create_metaobject";

export const createMetaobjectTool: OpenAI.Responses.FunctionTool = {
  type: "function",
  name: CREATE_METAOBJECT_TOOL_NAME,
  description: "Upsert a Shopify metaobject for reusable structured content blocks.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      type: { type: "string" },
      handle: { type: "string" },
      fields: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: { type: "string" },
            value: { type: "string" },
          },
          required: ["key", "value"],
        },
      },
    },
    required: ["type", "handle", "fields"],
  },
};

export async function handleCreateMetaobject(input: unknown) {
  return upsertMetaobject(readMetaobject(input));
}
