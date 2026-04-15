import { Router } from "express";

import { beginZendropOauthFlow, completeZendropOauthFlow, getZendropConnectionStatus } from "../zendrop.js";

export const zendropRouter = Router();

zendropRouter.get("/status", async (_request, response) => {
  try {
    response.json({
      zendrop: await getZendropConnectionStatus(),
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

zendropRouter.get("/oauth/start", async (_request, response) => {
  try {
    const authorizationUrl = await beginZendropOauthFlow();
    response.redirect(302, authorizationUrl);
  } catch (error) {
    response.status(500).send(
      `<pre>${error instanceof Error ? error.message : String(error)}</pre>`,
    );
  }
});

zendropRouter.get("/oauth/callback", async (request, response) => {
  const code = typeof request.query.code === "string" ? request.query.code : undefined;
  const state = typeof request.query.state === "string" ? request.query.state : undefined;
  const error = typeof request.query.error === "string" ? request.query.error : undefined;

  if (error) {
    return response.status(400).send(`<pre>Zendrop OAuth error: ${error}</pre>`);
  }

  if (!code || !state) {
    return response.status(400).send("<pre>Missing code or state in Zendrop OAuth callback.</pre>");
  }

  try {
    const token = await completeZendropOauthFlow({ code, state });
    response.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px;">
          <h1>Zendrop Connected</h1>
          <p>Zendrop OAuth completed successfully.</p>
          <p>Access token stored in the local backend environment.</p>
          <p>Token type: ${token.token_type ?? "bearer"}</p>
          <p>You can close this tab and verify the connection with <code>/workflows/zendrop-status</code>.</p>
        </body>
      </html>
    `);
  } catch (callbackError) {
    response.status(500).send(
      `<pre>${callbackError instanceof Error ? callbackError.message : String(callbackError)}</pre>`,
    );
  }
});