import { Router } from "express";

import { config } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    ok: true,
    store: config.shopifyStoreDomain,
    apiVersion: config.shopifyApiVersion,
    model: config.openaiModel,
  });
});
