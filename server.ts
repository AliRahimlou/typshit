import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { agentRouter } from "./routes/agent.js";
import { healthRouter } from "./routes/health.js";
import { workflowsRouter } from "./routes/workflows.js";
import { zendropRouter } from "./routes/zendrop.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/health", healthRouter);
app.use("/agent", agentRouter);
app.use("/workflows", workflowsRouter);
app.use("/zendrop", zendropRouter);

app.listen(config.port, () => {
  console.log(`typsh.it Shopify agent server listening on :${config.port}`);
});
