import serverless from "serverless-http";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!process.env.NETLIFY) {
  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

export const handler = serverless(app, {
  basePath: '/.netlify/functions/index',
});
