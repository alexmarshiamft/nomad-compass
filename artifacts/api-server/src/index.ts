import serverless from "serverless-http";
import app from "./app";
import { logger } from "./lib/logger";

if (process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT || 3000);

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
