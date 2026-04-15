import { Router } from "express";

import { getLaunchCatalog } from "../data/launchCatalog.js";
import { getSourcingPlan } from "../data/sourcingPlan.js";
import { getLaunchStrategy } from "../data/launchStrategy.js";
import { generateLaunchCatalogAssets, runAgentGoal } from "../openai.js";

export const agentRouter = Router();

agentRouter.post("/plan", async (request, response) => {
  try {
    const body = request.body as {
      catalogKey?: unknown;
      publish?: unknown;
    };

    const catalogKey =
      typeof body?.catalogKey === "string" ? body.catalogKey : undefined;
    const publish = body?.publish === true;

    const seed = getLaunchCatalog(catalogKey);
    const assets = await generateLaunchCatalogAssets(seed, { publish });

    response.json({
      catalogKey: seed.key,
      assets,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

agentRouter.post("/execute", async (request, response) => {
  try {
    const body = request.body as {
      goal?: unknown;
      catalogKey?: unknown;
    };

    if (typeof body?.goal !== "string" || body.goal.trim().length === 0) {
      return response.status(400).json({
        error: "Missing goal",
      });
    }

    const catalogKey =
      typeof body.catalogKey === "string" ? body.catalogKey : undefined;
    const context = catalogKey
      ? {
          launchCatalog: getLaunchCatalog(catalogKey),
          launchStrategy: getLaunchStrategy(),
          sourcingPlan: getSourcingPlan(),
        }
      : {
          launchStrategy: getLaunchStrategy(),
          sourcingPlan: getSourcingPlan(),
        };

    const result = await runAgentGoal(body.goal, context);
    response.json(result);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
